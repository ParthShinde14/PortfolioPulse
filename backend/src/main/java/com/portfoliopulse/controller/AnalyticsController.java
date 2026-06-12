package com.portfoliopulse.controller;

import com.portfoliopulse.dto.AnalyticsDto;
import com.portfoliopulse.dto.RiskMetricsDto;
import com.portfoliopulse.dto.StockInfoDto;
import com.portfoliopulse.service.AnalyticsService;
import com.portfoliopulse.service.PortfolioRiskService;
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

    @GetMapping("/api/analytics")
    public ResponseEntity<AnalyticsDto> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getAnalytics());
    }

    @GetMapping("/api/analytics/risk")
    public ResponseEntity<RiskMetricsDto> getRiskMetrics() {
        return ResponseEntity.ok(portfolioRiskService.calculateRiskMetrics());
    }

    @GetMapping("/api/stocks/{symbol}")
    public ResponseEntity<StockInfoDto> getStockInfo(@PathVariable String symbol) {
        return ResponseEntity.ok(yahooFinanceService.getStockInfo(symbol.toUpperCase()));
    }
}
