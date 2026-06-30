package com.portfoliopulse.config;

import com.portfoliopulse.entity.StockCatalog;
import com.portfoliopulse.repository.StockCatalogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
@Order(1)
@Slf4j
@RequiredArgsConstructor
public class StockCatalogSeeder implements ApplicationRunner {

    private static final String SEED_RESOURCE = "seed/stock-catalog-seed.txt";

    private final StockCatalogRepository stockCatalogRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        long existing = stockCatalogRepository.count();
        if (existing > 0) {
            log.info("Stock catalog already populated ({} symbols) — skipping seed.", existing);
            return;
        }

        log.info("Stock catalog is empty. Seeding from {}...", SEED_RESOURCE);
        List<StockCatalog> entries = loadSeedEntries();

        if (entries.isEmpty()) {
            log.warn("No stock catalog entries found in {} — catalog remains empty. " +
                    "Stock search, Buy/Sell, and Watchlist selectors will not return results " +
                    "until this resource is populated.", SEED_RESOURCE);
            return;
        }

        stockCatalogRepository.saveAll(entries);
        log.info("Seeded stock_catalog with {} symbols.", entries.size());
    }

    private List<StockCatalog> loadSeedEntries() {
        List<StockCatalog> entries = new ArrayList<>();
        ClassPathResource resource = new ClassPathResource(SEED_RESOURCE);

        if (!resource.exists()) {
            log.warn("Seed resource {} not found on classpath.", SEED_RESOURCE);
            return entries;
        }

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            int lineNo = 0;
            while ((line = reader.readLine()) != null) {
                lineNo++;
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#"))
                    continue;

                // Format: SYMBOL|Company Name|Sector|Industry|Exchange|MarketCap
                String[] parts = trimmed.split("\\|");
                if (parts.length != 6) {
                    log.warn("Skipping malformed seed line {} (expected 6 fields, got {}): {}",
                            lineNo, parts.length, trimmed);
                    continue;
                }

                try {
                    entries.add(StockCatalog.builder()
                            .symbol(parts[0].trim())
                            .companyName(parts[1].trim())
                            .sector(parts[2].trim())
                            .industry(parts[3].trim())
                            .exchange(parts[4].trim())
                            .marketCap(new BigDecimal(parts[5].trim()))
                            .isActive(true)
                            .build());
                } catch (NumberFormatException e) {
                    log.warn("Skipping seed line {} — invalid market cap '{}': {}", lineNo, parts[5], trimmed);
                }
            }
        } catch (IOException e) {
            log.error("Failed to read stock catalog seed resource {}: {}", SEED_RESOURCE, e.getMessage());
        }

        return entries;
    }
}
