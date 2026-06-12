package com.portfoliopulse.service;

import com.portfoliopulse.dto.StockSuggestionDto;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Static catalog of well-known symbols used for autocomplete / smart search
 * in the Buy/Sell modal. This does NOT replace live Yahoo Finance data —
 * prices, sectors and company names for these symbols are still fetched
 * live via {@link YahooFinanceService}. This catalog only powers the
 * "search by company name or symbol" dropdown so users can quickly find
 * tickers without knowing the exact symbol.
 */
@Service
public class StockSearchService {

    private static final List<StockSuggestionDto> CATALOG = Arrays.asList(
            // ── US Mega-cap Tech ──────────────────────────────────────────
            entry("AAPL",  "Apple Inc.",                 "Technology",            "NASDAQ", "Stock"),
            entry("MSFT",  "Microsoft Corporation",       "Technology",            "NASDAQ", "Stock"),
            entry("NVDA",  "NVIDIA Corporation",          "Technology",            "NASDAQ", "Stock"),
            entry("GOOGL", "Alphabet Inc.",               "Communication Services","NASDAQ", "Stock"),
            entry("META",  "Meta Platforms, Inc.",        "Communication Services","NASDAQ", "Stock"),
            entry("AMZN",  "Amazon.com, Inc.",            "Consumer Cyclical",     "NASDAQ", "Stock"),
            entry("TSLA",  "Tesla, Inc.",                 "Consumer Cyclical",     "NASDAQ", "Stock"),
            entry("NFLX",  "Netflix, Inc.",               "Communication Services","NASDAQ", "Stock"),
            entry("AMD",   "Advanced Micro Devices, Inc.","Technology",            "NASDAQ", "Stock"),
            entry("INTC",  "Intel Corporation",           "Technology",            "NASDAQ", "Stock"),
            entry("PLTR",  "Palantir Technologies Inc.",  "Technology",            "NYSE",   "Stock"),
            entry("CRM",   "Salesforce, Inc.",            "Technology",            "NYSE",   "Stock"),
            entry("ADBE",  "Adobe Inc.",                  "Technology",            "NASDAQ", "Stock"),
            entry("UBER",  "Uber Technologies, Inc.",     "Technology",            "NYSE",   "Stock"),
            entry("SHOP",  "Shopify Inc.",                "Technology",            "NYSE",   "Stock"),

            // ── ETFs ──────────────────────────────────────────────────────
            entry("SPY",   "SPDR S&P 500 ETF Trust",      "Diversified",           "NYSEARCA", "ETF"),
            entry("QQQ",   "Invesco QQQ Trust",           "Diversified",           "NASDAQ",   "ETF"),
            entry("VOO",   "Vanguard S&P 500 ETF",        "Diversified",           "NYSEARCA", "ETF"),
            entry("VTI",   "Vanguard Total Stock Market ETF", "Diversified",       "NYSEARCA", "ETF"),

            // ── Indian Stocks (NSE) ───────────────────────────────────────
            entry("RELIANCE.NS",   "Reliance Industries Limited", "Energy",              "NSE", "Stock"),
            entry("TCS.NS",        "Tata Consultancy Services Limited", "Technology",    "NSE", "Stock"),
            entry("INFY.NS",       "Infosys Limited",              "Technology",         "NSE", "Stock"),
            entry("HDFCBANK.NS",   "HDFC Bank Limited",            "Financial Services", "NSE", "Stock"),
            entry("ICICIBANK.NS",  "ICICI Bank Limited",           "Financial Services", "NSE", "Stock"),
            entry("SBIN.NS",       "State Bank of India",          "Financial Services", "NSE", "Stock"),
            entry("LT.NS",         "Larsen & Toubro Limited",      "Industrials",        "NSE", "Stock"),
            entry("BHARTIARTL.NS", "Bharti Airtel Limited",         "Communication Services", "NSE", "Stock"),
            entry("ITC.NS",        "ITC Limited",                  "Consumer Defensive", "NSE", "Stock")
    );

    private static StockSuggestionDto entry(String symbol, String name, String sector, String exchange, String type) {
        return StockSuggestionDto.builder()
                .symbol(symbol)
                .companyName(name)
                .sector(sector)
                .exchange(exchange)
                .type(type)
                .build();
    }

    /**
     * Search the catalog by symbol prefix or company-name substring (case-insensitive).
     * Returns up to {@code limit} matches, symbol-prefix matches ranked first.
     */
    public List<StockSuggestionDto> search(String query, int limit) {
        if (query == null || query.isBlank()) return Collections.emptyList();
        String q = query.trim().toLowerCase();

        List<StockSuggestionDto> symbolMatches = CATALOG.stream()
                .filter(s -> s.getSymbol().toLowerCase().startsWith(q))
                .collect(Collectors.toList());

        List<StockSuggestionDto> nameMatches = CATALOG.stream()
                .filter(s -> !symbolMatches.contains(s))
                .filter(s -> s.getCompanyName().toLowerCase().contains(q)
                          || s.getSymbol().toLowerCase().contains(q))
                .collect(Collectors.toList());

        return Stream.concat(symbolMatches.stream(), nameMatches.stream())
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<StockSuggestionDto> getAllSupportedStocks() {
        return CATALOG;
    }
}
