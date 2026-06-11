package com.portfoliopulse.service;

import com.portfoliopulse.dto.*;
import com.portfoliopulse.entity.Holding;
import com.portfoliopulse.entity.Transaction;
import com.portfoliopulse.exception.InsufficientHoldingsException;
import com.portfoliopulse.exception.ResourceNotFoundException;
import com.portfoliopulse.repository.HoldingRepository;
import com.portfoliopulse.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class HoldingService {

    private final HoldingRepository holdingRepository;
    private final TransactionRepository transactionRepository;
    private final YahooFinanceService yahooFinanceService;

    @Transactional(readOnly = true)
    public List<HoldingDto> getAllHoldings() {
        return holdingRepository.findAll().stream()
                .map(this::enrichWithCurrentPrice)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HoldingDto> searchHoldings(String query) {
        return holdingRepository
                .findBySymbolContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(query, query)
                .stream()
                .map(this::enrichWithCurrentPrice)
                .collect(Collectors.toList());
    }

    public HoldingDto buyStock(TransactionRequestDto request) {
        String symbol = request.getSymbol().toUpperCase().trim();

        // Validate stock exists via Yahoo Finance
        StockInfoDto stockInfo = yahooFinanceService.getStockInfo(symbol);

        // Record transaction
        Transaction transaction = Transaction.builder()
                .symbol(symbol)
                .companyName(stockInfo.getCompanyName())
                .transactionType(Transaction.TransactionType.BUY)
                .quantity(request.getQuantity())
                .price(request.getPrice())
                .transactionDate(request.getTransactionDate())
                .notes(request.getNotes())
                .build();
        transactionRepository.save(transaction);

        // Update or create holding
        Holding holding = holdingRepository.findBySymbol(symbol).orElse(
                Holding.builder()
                        .symbol(symbol)
                        .companyName(stockInfo.getCompanyName())
                        .sector(stockInfo.getSector())
                        .quantity(BigDecimal.ZERO)
                        .averageBuyPrice(BigDecimal.ZERO)
                        .build()
        );

        // Calculate new average buy price: (existing qty * avg price + new qty * new price) / total qty
        BigDecimal existingValue = holding.getQuantity().multiply(holding.getAverageBuyPrice());
        BigDecimal newValue = request.getQuantity().multiply(request.getPrice());
        BigDecimal totalQuantity = holding.getQuantity().add(request.getQuantity());
        BigDecimal newAveragePrice = existingValue.add(newValue)
                .divide(totalQuantity, 4, RoundingMode.HALF_UP);

        holding.setQuantity(totalQuantity);
        holding.setAverageBuyPrice(newAveragePrice);
        if (holding.getSector() == null && stockInfo.getSector() != null) {
            holding.setSector(stockInfo.getSector());
        }

        Holding saved = holdingRepository.save(holding);
        log.info("Bought {} shares of {} at {}", request.getQuantity(), symbol, request.getPrice());
        return enrichWithCurrentPrice(saved);
    }

    public HoldingDto sellStock(TransactionRequestDto request) {
        String symbol = request.getSymbol().toUpperCase().trim();

        Holding holding = holdingRepository.findBySymbol(symbol)
                .orElseThrow(() -> new ResourceNotFoundException("No holding found for symbol: " + symbol));

        if (holding.getQuantity().compareTo(request.getQuantity()) < 0) {
            throw new InsufficientHoldingsException(
                    String.format("Insufficient holdings. You have %.4f shares of %s, trying to sell %.4f",
                            holding.getQuantity(), symbol, request.getQuantity())
            );
        }

        // Record transaction
        StockInfoDto stockInfo = yahooFinanceService.getStockInfo(symbol);
        Transaction transaction = Transaction.builder()
                .symbol(symbol)
                .companyName(holding.getCompanyName())
                .transactionType(Transaction.TransactionType.SELL)
                .quantity(request.getQuantity())
                .price(request.getPrice())
                .transactionDate(request.getTransactionDate())
                .notes(request.getNotes())
                .build();
        transactionRepository.save(transaction);

        BigDecimal remainingQuantity = holding.getQuantity().subtract(request.getQuantity());

        if (remainingQuantity.compareTo(BigDecimal.ZERO) == 0) {
            holdingRepository.delete(holding);
            log.info("Sold all {} shares of {} - holding removed", request.getQuantity(), symbol);
            return HoldingDto.builder()
                    .symbol(symbol)
                    .companyName(holding.getCompanyName())
                    .quantity(BigDecimal.ZERO)
                    .build();
        }

        holding.setQuantity(remainingQuantity);
        Holding saved = holdingRepository.save(holding);
        log.info("Sold {} shares of {} at {}", request.getQuantity(), symbol, request.getPrice());
        return enrichWithCurrentPrice(saved);
    }

    private HoldingDto enrichWithCurrentPrice(Holding holding) {
        BigDecimal currentPrice;
        BigDecimal dayChange = BigDecimal.ZERO;
        BigDecimal dayChangePercent = BigDecimal.ZERO;

        try {
            StockInfoDto stockInfo = yahooFinanceService.getStockInfo(holding.getSymbol());
            currentPrice = stockInfo.getCurrentPrice() != null ? stockInfo.getCurrentPrice() : holding.getAverageBuyPrice();
            dayChange = stockInfo.getChange() != null ? stockInfo.getChange() : BigDecimal.ZERO;
            dayChangePercent = stockInfo.getChangePercent() != null ? stockInfo.getChangePercent() : BigDecimal.ZERO;
        } catch (Exception e) {
            log.warn("Could not fetch current price for {}: {}", holding.getSymbol(), e.getMessage());
            currentPrice = holding.getAverageBuyPrice();
        }

        BigDecimal investedValue = holding.getQuantity().multiply(holding.getAverageBuyPrice())
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal currentValue = holding.getQuantity().multiply(currentPrice)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal profitLoss = currentValue.subtract(investedValue).setScale(2, RoundingMode.HALF_UP);
        BigDecimal profitLossPercent = BigDecimal.ZERO;

        if (investedValue.compareTo(BigDecimal.ZERO) != 0) {
            profitLossPercent = profitLoss.divide(investedValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        }

        return HoldingDto.builder()
                .id(holding.getId())
                .symbol(holding.getSymbol())
                .companyName(holding.getCompanyName())
                .sector(holding.getSector())
                .quantity(holding.getQuantity())
                .averageBuyPrice(holding.getAverageBuyPrice().setScale(4, RoundingMode.HALF_UP))
                .currentPrice(currentPrice.setScale(4, RoundingMode.HALF_UP))
                .investedValue(investedValue)
                .currentValue(currentValue)
                .profitLoss(profitLoss)
                .profitLossPercent(profitLossPercent)
                .dayChange(dayChange.multiply(holding.getQuantity()).setScale(2, RoundingMode.HALF_UP))
                .dayChangePercent(dayChangePercent)
                .updatedAt(holding.getUpdatedAt())
                .build();
    }
}
