package com.portfoliopulse.service;

import com.portfoliopulse.dto.StockCatalogDto;
import com.portfoliopulse.dto.StockInfoDto;
import com.portfoliopulse.dto.StockSelectionDto;
import com.portfoliopulse.entity.StockCatalog;
import com.portfoliopulse.exception.ResourceNotFoundException;
import com.portfoliopulse.repository.StockCatalogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockCatalogService {

    private final StockCatalogRepository catalogRepository;
    private final YahooFinanceService yahooFinanceService;

    /** Full catalog (active entries only), used for browsing / "supported stocks" lists. */
    public List<StockCatalogDto> getAllActive() {
        return catalogRepository.findByIsActiveTrue().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Searchable autocomplete: symbol-prefix matches ranked first, then
     * company-name substring matches. Powers the frontend's stock selector.
     */
    public List<StockCatalogDto> search(String query, int limit) {
        if (query == null || query.isBlank()) return List.of();
        String trimmed = query.trim();
        return catalogRepository.search(trimmed, PageRequest.of(0, Math.max(1, Math.min(limit, 50))))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Looks up a single catalog entry by symbol AND enriches it with a live
     * quote from Yahoo Finance (current price, day change) — used when the
     * user selects a stock so the Buy/Sell form can auto-populate price.
     */
    public StockSelectionDto getSelection(String symbol) {
        StockCatalog entry = catalogRepository.findBySymbolIgnoreCase(symbol)
                .orElseThrow(() -> new ResourceNotFoundException("Symbol not found in catalog: " + symbol));

        StockSelectionDto.StockSelectionDtoBuilder builder = StockSelectionDto.builder()
                .symbol(entry.getSymbol())
                .companyName(entry.getCompanyName())
                .sector(entry.getSector())
                .industry(entry.getIndustry())
                .exchange(entry.getExchange())
                .marketCap(entry.getMarketCap());

        try {
            StockInfoDto quote = yahooFinanceService.getStockInfo(entry.getSymbol());
            builder.currentPrice(quote.getCurrentPrice())
                    .change(quote.getChange())
                    .changePercent(quote.getChangePercent())
                    .currency(quote.getCurrency());
        } catch (Exception e) {
            log.warn("Could not fetch live quote for catalog symbol {}: {}", entry.getSymbol(), e.getMessage());
        }

        return builder.build();
    }

    public long countActive() {
        return catalogRepository.countByIsActiveTrue();
    }

    private StockCatalogDto toDto(StockCatalog entry) {
        return StockCatalogDto.builder()
                .symbol(entry.getSymbol())
                .companyName(entry.getCompanyName())
                .sector(entry.getSector())
                .industry(entry.getIndustry())
                .exchange(entry.getExchange())
                .marketCap(entry.getMarketCap())
                .build();
    }
}
