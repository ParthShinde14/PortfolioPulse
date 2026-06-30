package com.portfoliopulse.service;

import com.portfoliopulse.dto.TradeAnalyticsDto;
import com.portfoliopulse.dto.TradeRecordDto;
import com.portfoliopulse.dto.TradeStatDto;
import com.portfoliopulse.entity.Transaction;
import com.portfoliopulse.repository.TransactionRepository;
import com.portfoliopulse.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Computes realized trade performance from the transaction history.
 * <p>
 * <b>Simplified methodology</b> (consistent with the "simplified" Sharpe
 * ratio / volatility elsewhere): the cost basis for every SELL is the
 * weighted-average price across ALL of that symbol's BUY transactions to
 * date — not a true FIFO/LIFO lot-matching engine. A "trade" = one SELL
 * transaction.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TradeAnalyticsService {

    private final TransactionRepository transactionRepository;

    public TradeAnalyticsDto getTradeAnalytics() {
        Long userId = SecurityUtils.getCurrentUserId();

        Map<String, AvgCost> avgCostBySymbol = buildAverageCostBasis(userId);
        List<Transaction> sells = transactionRepository.findAllSellsOrderedByDate(userId);

        if (sells.isEmpty()) {
            return emptyAnalytics();
        }

        List<TradeRecordDto> trades = new ArrayList<>();
        for (Transaction sell : sells) {
            AvgCost cost = avgCostBySymbol.get(sell.getSymbol());
            BigDecimal avgBuyPrice = cost != null ? cost.avgPrice : sell.getPrice(); // fallback: no buys on record

            BigDecimal pnl = sell.getPrice().subtract(avgBuyPrice)
                    .multiply(sell.getQuantity())
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal pnlPercent = avgBuyPrice.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : sell.getPrice().subtract(avgBuyPrice)
                            .divide(avgBuyPrice, 6, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .setScale(2, RoundingMode.HALF_UP);

            String outcome = pnl.compareTo(BigDecimal.ZERO) > 0 ? "WIN"
                    : pnl.compareTo(BigDecimal.ZERO) < 0 ? "LOSS" : "BREAKEVEN";

            trades.add(TradeRecordDto.builder()
                    .symbol(sell.getSymbol())
                    .companyName(sell.getCompanyName())
                    .date(sell.getTransactionDate())
                    .quantity(sell.getQuantity())
                    .sellPrice(sell.getPrice())
                    .avgBuyPrice(avgBuyPrice.setScale(4, RoundingMode.HALF_UP))
                    .realizedPnl(pnl)
                    .realizedPnlPercent(pnlPercent)
                    .outcome(outcome)
                    .build());
        }

        int totalTrades = trades.size();
        List<TradeRecordDto> winners = trades.stream()
                .filter(t -> t.getRealizedPnl().compareTo(BigDecimal.ZERO) > 0)
                .collect(Collectors.toList());
        List<TradeRecordDto> losers = trades.stream()
                .filter(t -> t.getRealizedPnl().compareTo(BigDecimal.ZERO) < 0)
                .collect(Collectors.toList());

        int winningTrades = winners.size();
        int losingTrades = losers.size();

        BigDecimal winRate = totalTrades == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(winningTrades)
                        .divide(BigDecimal.valueOf(totalTrades), 6, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);

        BigDecimal sumGains = winners.stream().map(TradeRecordDto::getRealizedPnl)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal sumLosses = losers.stream().map(TradeRecordDto::getRealizedPnl)
                .reduce(BigDecimal.ZERO, BigDecimal::add); // negative

        BigDecimal averageGain = winners.isEmpty()
                ? BigDecimal.ZERO
                : sumGains.divide(BigDecimal.valueOf(winners.size()), 2, RoundingMode.HALF_UP);

        BigDecimal averageLoss = losers.isEmpty()
                ? BigDecimal.ZERO
                : sumLosses.divide(BigDecimal.valueOf(losers.size()), 2, RoundingMode.HALF_UP);

        BigDecimal profitFactor = null; // null => "unbounded" (no losses) — frontend shows ∞
        if (sumLosses.compareTo(BigDecimal.ZERO) != 0) {
            profitFactor = sumGains.divide(sumLosses.abs(), 2, RoundingMode.HALF_UP);
        } else if (sumGains.compareTo(BigDecimal.ZERO) == 0) {
            profitFactor = BigDecimal.ZERO; // no gains and no losses
        }

        TradeRecordDto bestTrade = trades.stream()
                .max(Comparator.comparing(TradeRecordDto::getRealizedPnl))
                .orElse(null);
        TradeRecordDto worstTrade = trades.stream()
                .min(Comparator.comparing(TradeRecordDto::getRealizedPnl))
                .orElse(null);

        List<TradeStatDto> topProfitable = aggregateBySymbol(trades, true);
        List<TradeStatDto> topLosing = aggregateBySymbol(trades, false);

        // Most recent first for the breakdown table
        List<TradeRecordDto> tradesDesc = trades.stream()
                .sorted(Comparator.comparing(TradeRecordDto::getDate).reversed())
                .collect(Collectors.toList());

        return TradeAnalyticsDto.builder()
                .totalTrades(totalTrades)
                .winningTrades(winningTrades)
                .losingTrades(losingTrades)
                .winRate(winRate)
                .averageGain(averageGain)
                .averageLoss(averageLoss)
                .bestTrade(bestTrade)
                .worstTrade(worstTrade)
                .profitFactor(profitFactor)
                .topProfitableStocks(topProfitable)
                .topLosingStocks(topLosing)
                .trades(tradesDesc)
                .build();
    }

    /** Weighted-average buy price per symbol, computed across all BUY transactions. */
    private Map<String, AvgCost> buildAverageCostBasis(Long userId) {
        Map<String, AvgCost> result = new HashMap<>();
        for (Transaction buy : transactionRepository.findAllBuysOrderedBySymbolAndDate(userId)) {
            AvgCost existing = result.getOrDefault(buy.getSymbol(), new AvgCost(BigDecimal.ZERO, BigDecimal.ZERO));
            BigDecimal newQty = existing.totalQty.add(buy.getQuantity());
            BigDecimal newCostSum = existing.avgPrice.multiply(existing.totalQty)
                    .add(buy.getPrice().multiply(buy.getQuantity()));
            BigDecimal newAvg = newQty.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : newCostSum.divide(newQty, 6, RoundingMode.HALF_UP);
            result.put(buy.getSymbol(), new AvgCost(newAvg, newQty));
        }
        return result;
    }

    private List<TradeStatDto> aggregateBySymbol(List<TradeRecordDto> trades, boolean profitable) {
        Map<String, List<TradeRecordDto>> bySymbol = trades.stream()
                .collect(Collectors.groupingBy(TradeRecordDto::getSymbol));

        return bySymbol.entrySet().stream()
                .map(e -> {
                    BigDecimal total = e.getValue().stream()
                            .map(TradeRecordDto::getRealizedPnl)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return TradeStatDto.builder()
                            .symbol(e.getKey())
                            .companyName(e.getValue().get(0).getCompanyName())
                            .totalRealizedPnl(total)
                            .tradeCount(e.getValue().size())
                            .build();
                })
                .filter(s -> profitable
                        ? s.getTotalRealizedPnl().compareTo(BigDecimal.ZERO) > 0
                        : s.getTotalRealizedPnl().compareTo(BigDecimal.ZERO) < 0)
                .sorted(profitable
                        ? Comparator.comparing(TradeStatDto::getTotalRealizedPnl).reversed()
                        : Comparator.comparing(TradeStatDto::getTotalRealizedPnl))
                .limit(5)
                .collect(Collectors.toList());
    }

    private TradeAnalyticsDto emptyAnalytics() {
        return TradeAnalyticsDto.builder()
                .totalTrades(0)
                .winningTrades(0)
                .losingTrades(0)
                .winRate(BigDecimal.ZERO)
                .averageGain(BigDecimal.ZERO)
                .averageLoss(BigDecimal.ZERO)
                .bestTrade(null)
                .worstTrade(null)
                .profitFactor(null)
                .topProfitableStocks(Collections.emptyList())
                .topLosingStocks(Collections.emptyList())
                .trades(Collections.emptyList())
                .build();
    }

    private record AvgCost(BigDecimal avgPrice, BigDecimal totalQty) {}
}
