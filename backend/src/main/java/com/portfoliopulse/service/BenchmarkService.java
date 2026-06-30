package com.portfoliopulse.service;

import com.portfoliopulse.dto.*;
import com.portfoliopulse.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Compares the user's portfolio performance against a market index
 * (S&P 500, NASDAQ, or NIFTY 50).
 * <p>
 * <b>Simplified methodology</b> (documented, consistent with the other
 * "simplified" risk metrics in {@link PortfolioRiskService}):
 * <ul>
 *   <li>{@code portfolioReturn} = all-time return % (current value vs. cost
 *       basis across all holdings), the same figure shown on the Dashboard.</li>
 *   <li>{@code benchmarkReturn} = the index's % change from the date of the
 *       user's earliest portfolio snapshot to the most recent close.</li>
 *   <li>{@code trackingDifference} = |portfolioReturn − benchmarkReturn|.</li>
 * </ul>
 * This intentionally does not attempt true time-weighted return alignment —
 * it gives a directionally useful "are we beating the market since we
 * started tracking?" comparison without requiring a full performance
 * attribution engine.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BenchmarkService {

    private final HoldingService holdingService;
    private final AnalyticsService analyticsService;
    private final YahooFinanceService yahooFinanceService;

    private static final Map<String, BenchmarkOptionDto> BENCHMARKS = Map.of(
            "SP500", BenchmarkOptionDto.builder().key("SP500").name("S&P 500").symbol("SPY").build(),
            "NASDAQ", BenchmarkOptionDto.builder().key("NASDAQ").name("NASDAQ").symbol("QQQ").build(),
            "NIFTY50", BenchmarkOptionDto.builder().key("NIFTY50").name("NIFTY 50").symbol("^NSEI").build()
    );

    public BenchmarkDto getBenchmarkComparison(String benchmarkKey) {
        Long userId = SecurityUtils.getCurrentUserId();
        BenchmarkOptionDto benchmark = resolveBenchmark(benchmarkKey);

        List<HoldingDto> holdings = holdingService.getAllHoldings();
        AnalyticsService.PortfolioMetrics metrics = analyticsService.calculateMetrics(holdings);
        BigDecimal portfolioReturn = metrics.profitLossPercent();

        List<PortfolioSnapshotDto> snapshots = analyticsService.getPortfolioGrowth(userId);

        if (snapshots.isEmpty()) {
            return BenchmarkDto.builder()
                    .benchmarkName(benchmark.getName())
                    .benchmarkSymbol(benchmark.getSymbol())
                    .portfolioReturn(portfolioReturn)
                    .benchmarkReturn(BigDecimal.ZERO)
                    .outperformance(portfolioReturn)
                    .trackingDifference(portfolioReturn.abs())
                    .growthSeries(Collections.emptyList())
                    .availableBenchmarks(new ArrayList<>(BENCHMARKS.values()))
                    .build();
        }

        LocalDate firstDate = snapshots.get(0).getSnapshotDate();
        long daysSpan = ChronoUnit.DAYS.between(firstDate, LocalDate.now()) + 5; // small buffer
        String range = resolveRange(daysSpan);

        List<HistoricalPriceDto> history = yahooFinanceService.getHistoricalPrices(benchmark.getSymbol(), range);

        BigDecimal benchmarkReturn = BigDecimal.ZERO;
        List<BenchmarkPointDto> growthSeries = new ArrayList<>();

        if (!history.isEmpty()) {
            List<HistoricalPriceDto> sortedHistory = history.stream()
                    .sorted(Comparator.comparing(HistoricalPriceDto::getDate))
                    .collect(Collectors.toList());

            BigDecimal firstClose = findPriceOnOrBefore(sortedHistory, firstDate);
            BigDecimal lastClose = sortedHistory.get(sortedHistory.size() - 1).getClose();

            if (firstClose != null && firstClose.compareTo(BigDecimal.ZERO) != 0) {
                benchmarkReturn = lastClose.subtract(firstClose)
                        .divide(firstClose, 6, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);
            }

            BigDecimal firstPortfolioValue = snapshots.get(0).getPortfolioValue();

            for (PortfolioSnapshotDto snapshot : snapshots) {
                BigDecimal portfolioIndexed = firstPortfolioValue.compareTo(BigDecimal.ZERO) == 0
                        ? BigDecimal.valueOf(100)
                        : snapshot.getPortfolioValue()
                                .divide(firstPortfolioValue, 6, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100));

                BigDecimal priceOnDate = findPriceOnOrBefore(sortedHistory, snapshot.getSnapshotDate());
                BigDecimal benchmarkIndexed = (priceOnDate == null || firstClose == null
                        || firstClose.compareTo(BigDecimal.ZERO) == 0)
                        ? BigDecimal.valueOf(100)
                        : priceOnDate.divide(firstClose, 6, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100));

                growthSeries.add(BenchmarkPointDto.builder()
                        .date(snapshot.getSnapshotDate())
                        .portfolioIndexed(portfolioIndexed.setScale(2, RoundingMode.HALF_UP))
                        .benchmarkIndexed(benchmarkIndexed.setScale(2, RoundingMode.HALF_UP))
                        .build());
            }
        } else {
            log.warn("No historical data available for benchmark {}", benchmark.getSymbol());
        }

        BigDecimal outperformance = portfolioReturn.subtract(benchmarkReturn).setScale(2, RoundingMode.HALF_UP);

        return BenchmarkDto.builder()
                .benchmarkName(benchmark.getName())
                .benchmarkSymbol(benchmark.getSymbol())
                .portfolioReturn(portfolioReturn)
                .benchmarkReturn(benchmarkReturn)
                .outperformance(outperformance)
                .trackingDifference(outperformance.abs())
                .growthSeries(growthSeries)
                .availableBenchmarks(new ArrayList<>(BENCHMARKS.values()))
                .build();
    }

    private BenchmarkOptionDto resolveBenchmark(String key) {
        if (key == null) return BENCHMARKS.get("SP500");
        return BENCHMARKS.getOrDefault(key.trim().toUpperCase(), BENCHMARKS.get("SP500"));
    }

    private String resolveRange(long daysSpan) {
        if (daysSpan <= 31) return "1mo";
        if (daysSpan <= 93) return "3mo";
        if (daysSpan <= 186) return "6mo";
        if (daysSpan <= 366) return "1y";
        return "2y";
    }

    /** Finds the last historical price with a date <= target, falling back to the earliest entry. */
    private BigDecimal findPriceOnOrBefore(List<HistoricalPriceDto> sortedHistory, LocalDate target) {
        BigDecimal result = null;
        for (HistoricalPriceDto point : sortedHistory) {
            if (point.getDate().isAfter(target)) break;
            result = point.getClose();
        }
        if (result == null && !sortedHistory.isEmpty()) {
            result = sortedHistory.get(0).getClose();
        }
        return result;
    }
}
