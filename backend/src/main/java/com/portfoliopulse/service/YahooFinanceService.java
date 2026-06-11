package com.portfoliopulse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfoliopulse.dto.StockInfoDto;
import com.portfoliopulse.exception.StockNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class YahooFinanceService {

    private final ObjectMapper objectMapper;
    private static final String YAHOO_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/";
    private static final String YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=";

    // In-memory cache to reduce API calls (5-minute TTL)
    private final Map<String, CachedStock> stockCache = new HashMap<>();
    private static final long CACHE_TTL_MS = 5 * 60 * 1000;

    public StockInfoDto getStockInfo(String symbol) {
        String upperSymbol = symbol.toUpperCase().trim();

        // Check cache first
        CachedStock cached = stockCache.get(upperSymbol);
        if (cached != null && !cached.isExpired()) {
            log.debug("Cache hit for symbol: {}", upperSymbol);
            return cached.data;
        }

        log.info("Fetching stock data for: {}", upperSymbol);
        StockInfoDto stockInfo = fetchFromYahoo(upperSymbol);
        stockCache.put(upperSymbol, new CachedStock(stockInfo));
        return stockInfo;
    }

    private StockInfoDto fetchFromYahoo(String symbol) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Accept", "application/json");
            headers.set("Accept-Language", "en-US,en;q=0.9");

            String url = YAHOO_BASE_URL + symbol + "?interval=1d&range=1d";
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new StockNotFoundException("Could not fetch data for symbol: " + symbol);
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode result = root.path("chart").path("result");

            if (result.isNull() || !result.isArray() || result.isEmpty()) {
                throw new StockNotFoundException("No data found for symbol: " + symbol);
            }

            JsonNode chartResult = result.get(0);
            JsonNode meta = chartResult.path("meta");

            BigDecimal currentPrice = getDecimalValue(meta, "regularMarketPrice");
            BigDecimal previousClose = getDecimalValue(meta, "previousClose");
            BigDecimal change = BigDecimal.ZERO;
            BigDecimal changePercent = BigDecimal.ZERO;

            if (currentPrice != null && previousClose != null && previousClose.compareTo(BigDecimal.ZERO) != 0) {
                change = currentPrice.subtract(previousClose).setScale(4, RoundingMode.HALF_UP);
                changePercent = change.divide(previousClose, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
            }

            String companyName = getTextValue(meta, "longName");
            if (companyName == null || companyName.isBlank()) {
                companyName = getTextValue(meta, "shortName");
            }
            if (companyName == null || companyName.isBlank()) {
                companyName = symbol;
            }

            // Fetch additional details (sector, industry)
            SectorInfo sectorInfo = fetchSectorInfo(symbol, headers);

            return StockInfoDto.builder()
                    .symbol(symbol)
                    .companyName(companyName)
                    .sector(sectorInfo.sector)
                    .industry(sectorInfo.industry)
                    .currentPrice(currentPrice)
                    .previousClose(previousClose)
                    .change(change)
                    .changePercent(changePercent)
                    .volume(getLongValue(meta, "regularMarketVolume"))
                    .currency(getTextValue(meta, "currency"))
                    .exchange(getTextValue(meta, "exchangeName"))
                    .build();

        } catch (StockNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching stock data for {}: {}", symbol, e.getMessage());
            throw new StockNotFoundException("Failed to fetch data for symbol: " + symbol + ". " + e.getMessage());
        }
    }

    private SectorInfo fetchSectorInfo(String symbol, HttpHeaders headers) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = YAHOO_QUOTE_URL + symbol + "&fields=sector,industry,longName";
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (response.getBody() == null) return new SectorInfo(null, null);

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode quoteResult = root.path("quoteResponse").path("result");

            if (quoteResult.isArray() && !quoteResult.isEmpty()) {
                JsonNode quote = quoteResult.get(0);
                return new SectorInfo(
                        getTextValue(quote, "sector"),
                        getTextValue(quote, "industry")
                );
            }
        } catch (Exception e) {
            log.warn("Could not fetch sector info for {}: {}", symbol, e.getMessage());
        }
        return new SectorInfo(null, null);
    }

    public BigDecimal getCurrentPrice(String symbol) {
        return getStockInfo(symbol).getCurrentPrice();
    }

    public void invalidateCache(String symbol) {
        stockCache.remove(symbol.toUpperCase());
    }

    private BigDecimal getDecimalValue(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isNumber()) {
            return BigDecimal.valueOf(value.doubleValue()).setScale(4, RoundingMode.HALF_UP);
        }
        return null;
    }

    private String getTextValue(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isTextual() ? value.textValue() : null;
    }

    private Long getLongValue(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isNumber() ? value.longValue() : null;
    }

    // Cache entry class
    private static class CachedStock {
        final StockInfoDto data;
        final long timestamp;

        CachedStock(StockInfoDto data) {
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_TTL_MS;
        }
    }

    // Sector info helper
    private record SectorInfo(String sector, String industry) {}
}
