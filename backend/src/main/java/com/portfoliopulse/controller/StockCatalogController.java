package com.portfoliopulse.controller;

import com.portfoliopulse.dto.StockCatalogDto;
import com.portfoliopulse.dto.StockSelectionDto;
import com.portfoliopulse.service.StockCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks/catalog")
@RequiredArgsConstructor
public class StockCatalogController {

    private final StockCatalogService stockCatalogService;

    /** Full list of active catalog entries (S&P 500 / Nasdaq 100 / Nifty 50 leaders, etc.). */
    @GetMapping
    public ResponseEntity<List<StockCatalogDto>> getCatalog() {
        return ResponseEntity.ok(stockCatalogService.getAllActive());
    }

    /**
     * Searchable autocomplete for the stock selector.
     * Example: GET /api/stocks/catalog/search?q=micr -> MSFT - Microsoft Corporation
     */
    @GetMapping("/search")
    public ResponseEntity<List<StockCatalogDto>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(stockCatalogService.search(q, limit));
    }

    /**
     * Returns catalog metadata + a live quote for the given symbol — used when
     * a stock is selected to auto-populate symbol, company name, sector, and price.
     */
    @GetMapping("/{symbol}")
    public ResponseEntity<StockSelectionDto> getSelection(@PathVariable String symbol) {
        return ResponseEntity.ok(stockCatalogService.getSelection(symbol));
    }
}
