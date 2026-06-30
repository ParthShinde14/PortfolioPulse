package com.portfoliopulse.service;

import com.portfoliopulse.dto.*;
import com.portfoliopulse.dto.TransactionRequestDto.TransactionMode;
import com.portfoliopulse.entity.Holding;
import com.portfoliopulse.entity.Transaction;
import com.portfoliopulse.exception.HoldingConflictException;
import com.portfoliopulse.exception.InsufficientHoldingsException;
import com.portfoliopulse.exception.ResourceNotFoundException;
import com.portfoliopulse.repository.HoldingRepository;
import com.portfoliopulse.repository.TransactionRepository;
import com.portfoliopulse.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
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
    private final MarketHoursService marketHoursService;

    @Transactional(readOnly = true)
    public List<HoldingDto> getAllHoldings() {
        Long userId = SecurityUtils.getCurrentUserId();
        return holdingRepository.findByUserId(userId).stream()
                .map(this::enrichWithCurrentPrice)
                .collect(Collectors.toList());
    }

    /**
     * Used by scheduled jobs (e.g. {@code AnalyticsService.scheduledSnapshot})
     * that run outside an authenticated request context and therefore cannot
     * use {@link SecurityUtils#getCurrentUserId()}.
     */
    @Transactional(readOnly = true)
    public List<HoldingDto> getAllHoldingsForUser(Long userId) {
        return holdingRepository.findByUserId(userId).stream()
                .map(this::enrichWithCurrentPrice)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HoldingDto> searchHoldings(String query) {
        Long userId = SecurityUtils.getCurrentUserId();
        return holdingRepository.searchByUserId(userId, query).stream()
                .map(this::enrichWithCurrentPrice)
                .collect(Collectors.toList());
    }

    public HoldingDto buyStock(TransactionRequestDto request) {
        Long userId = SecurityUtils.getCurrentUserId();
        String symbol = request.getSymbol().toUpperCase().trim();

        // Enforce market hours for LIVE transactions only.
        // MANUAL (historical/backdated) entries bypass this check.
        if (request.getTransactionMode() == TransactionMode.LIVE) {
            marketHoursService.assertMarketOpen(symbol);
        }

        // Validate stock exists via Yahoo Finance
        StockInfoDto stockInfo = yahooFinanceService.getStockInfo(symbol);

        // Record transaction
        Transaction transaction = Transaction.builder()
                .userId(userId)
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
        Holding holding = holdingRepository.findByUserIdAndSymbol(userId, symbol).orElse(
                Holding.builder()
                        .userId(userId)
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
        // Always (re)set sector from Yahoo Finance — ensures existing holdings
        // with null sector (from before the fetchSectorInfo bug was fixed)
        // get backfilled on the next buy of that symbol.
        if (stockInfo.getSector() != null && !stockInfo.getSector().isBlank()) {
            holding.setSector(stockInfo.getSector());
        }

        Holding saved;
        try {
            saved = holdingRepository.save(holding);
        } catch (DataIntegrityViolationException e) {
            // Most likely cause: a stale single-column UNIQUE constraint on
            // holdings(symbol) left over from a pre-multi-tenancy schema
            // version (Hibernate's ddl-auto=update never drops old
            // constraints). See migration-fix-holdings-unique-constraint.sql.
            log.error("Holding save failed for user {} symbol {} due to a database constraint violation. " +
                    "This usually indicates a stale unique index on holdings(symbol) — " +
                    "run migration-fix-holdings-unique-constraint.sql.", userId, symbol, e);
            throw new HoldingConflictException(
                    "Could not save holding for " + symbol + " due to a database constraint conflict. " +
                    "This is a known schema issue — please contact support or see " +
                    "migration-fix-holdings-unique-constraint.sql.", e);
        }

        log.info("User {} bought {} shares of {} at {}", userId, request.getQuantity(), symbol, request.getPrice());
        return enrichWithCurrentPrice(saved);
    }

    public HoldingDto sellStock(TransactionRequestDto request) {
        Long userId = SecurityUtils.getCurrentUserId();
        String symbol = request.getSymbol().toUpperCase().trim();

        // Enforce market hours for LIVE transactions only.
        if (request.getTransactionMode() == TransactionMode.LIVE) {
            marketHoursService.assertMarketOpen(symbol);
        }

        Holding holding = holdingRepository.findByUserIdAndSymbol(userId, symbol)
                .orElseThrow(() -> new ResourceNotFoundException("No holding found for symbol: " + symbol));

        if (holding.getQuantity().compareTo(request.getQuantity()) < 0) {
            throw new InsufficientHoldingsException(
                    String.format("Insufficient holdings. You have %.4f shares of %s, trying to sell %.4f",
                            holding.getQuantity(), symbol, request.getQuantity())
            );
        }

        // Record transaction
        Transaction transaction = Transaction.builder()
                .userId(userId)
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
            log.info("User {} sold all {} shares of {} - holding removed", userId, request.getQuantity(), symbol);
            return HoldingDto.builder()
                    .symbol(symbol)
                    .companyName(holding.getCompanyName())
                    .quantity(BigDecimal.ZERO)
                    .build();
        }

        holding.setQuantity(remainingQuantity);
        Holding saved = holdingRepository.save(holding);
        log.info("User {} sold {} shares of {} at {}", userId, request.getQuantity(), symbol, request.getPrice());
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
