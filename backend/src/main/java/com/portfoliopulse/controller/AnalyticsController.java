package com.portfoliopulse.controller;

import com.portfoliopulse.dto.AnalyticsDto;
import com.portfoliopulse.dto.BenchmarkDto;
import com.portfoliopulse.dto.RiskMetricsDto;
import com.portfoliopulse.dto.StockInfoDto;
import com.portfoliopulse.dto.TradeAnalyticsDto;
import com.portfoliopulse.service.AnalyticsService;
import com.portfoliopulse.service.BenchmarkService;
import com.portfoliopulse.service.PortfolioRiskService;
import com.portfoliopulse.service.TradeAnalyticsService;
import com.portfoliopulse.service.YahooFinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final YahooFinanceService yahooFinanceService;
    private final PortfolioRiskService portfolioRiskService;
    private final BenchmarkService benchmarkService;
    private final TradeAnalyticsService tradeAnalyticsService;

    @GetMapping("/api/analytics")
    public ResponseEntity<AnalyticsDto> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getAnalytics());
    }

    @GetMapping("/api/analytics/risk")
    public ResponseEntity<RiskMetricsDto> getRiskMetrics() {
        return ResponseEntity.ok(portfolioRiskService.calculateRiskMetrics());
    }

    /**
     * Compares portfolio performance vs. a market index.
     * @param benchmark one of SP500 (default), NASDAQ, NIFTY50
     */
    @GetMapping("/api/analytics/benchmark")
    public ResponseEntity<BenchmarkDto> getBenchmark(
            @RequestParam(required = false, defaultValue = "SP500") String benchmark) {
        return ResponseEntity.ok(benchmarkService.getBenchmarkComparison(benchmark));
    }

    @GetMapping("/api/analytics/trades")
    public ResponseEntity<TradeAnalyticsDto> getTradeAnalytics() {
        return ResponseEntity.ok(tradeAnalyticsService.getTradeAnalytics());
    }

    @GetMapping("/api/stocks/{symbol}")
    public ResponseEntity<StockInfoDto> getStockInfo(@PathVariable String symbol) {
        return ResponseEntity.ok(yahooFinanceService.getStockInfo(symbol.toUpperCase()));
    }
}
