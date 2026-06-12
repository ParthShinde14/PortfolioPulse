package com.portfoliopulse.controller;

import com.portfoliopulse.dto.StockSuggestionDto;
import com.portfoliopulse.service.StockSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockSearchController {

    private final StockSearchService stockSearchService;

    /**
     * Smart search for the Buy/Sell modal autocomplete.
     * Matches by symbol prefix or company name substring.
     * Example: GET /api/stocks/search?q=micr -> MSFT - Microsoft Corporation
     */
    @GetMapping("/search")
    public ResponseEntity<List<StockSuggestionDto>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(stockSearchService.search(q, limit));
    }

    /** Returns the full list of supported symbols (stocks, ETFs, Indian stocks). */
    @GetMapping("/supported")
    public ResponseEntity<List<StockSuggestionDto>> getSupportedStocks() {
        return ResponseEntity.ok(stockSearchService.getAllSupportedStocks());
    }
}
