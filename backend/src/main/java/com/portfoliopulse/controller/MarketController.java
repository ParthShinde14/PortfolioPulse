package com.portfoliopulse.controller;

import com.portfoliopulse.service.MarketHoursService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Provides real-time market open/closed status for a given symbol.
 * Used by the frontend TradeModal to display a live market-hours badge
 * and show the correct trading hours to the user before they submit.
 *
 * <p>This endpoint is public (no JWT required) since market hours are
 * not user-specific data — they're global reference information.</p>
 */
@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketController {

    private final MarketHoursService marketHoursService;

    /**
     * Returns real-time open/closed status and trading hours for a symbol.
     * Example: {@code GET /api/market/status?symbol=RELIANCE.NS}
     */
    @GetMapping("/status")
    public ResponseEntity<MarketHoursService.MarketStatus> getMarketStatus(
            @RequestParam String symbol) {
        return ResponseEntity.ok(marketHoursService.getMarketStatus(symbol.toUpperCase().trim()));
    }
}
