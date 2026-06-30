package com.portfoliopulse.config;

import com.portfoliopulse.entity.Holding;
import com.portfoliopulse.repository.HoldingRepository;
import com.portfoliopulse.service.YahooFinanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Order(2)
@Slf4j
@RequiredArgsConstructor
public class SectorBackfillRunner implements ApplicationRunner {

    private final HoldingRepository holdingRepository;
    private final YahooFinanceService yahooFinanceService;

    /** Delay between Yahoo Finance API calls to avoid rate-limiting (ms). */
    private static final long API_DELAY_MS = 500;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Holding> nullSectorHoldings = holdingRepository.findAllWithNullSector();

        if (nullSectorHoldings.isEmpty()) {
            log.info("Sector backfill: all holdings have sector data — nothing to do.");
            return;
        }

        log.info("Sector backfill: found {} holding(s) with null sector. " +
                "Attempting to resolve via Yahoo Finance...", nullSectorHoldings.size());

        int updated = 0;
        int failed = 0;

        for (Holding holding : nullSectorHoldings) {
            try {
                String sector = yahooFinanceService.getSector(holding.getSymbol());
                if (sector != null && !sector.isBlank()) {
                    holding.setSector(sector);
                    holdingRepository.save(holding);
                    log.info("Sector backfill: {} → {}", holding.getSymbol(), sector);
                    updated++;
                } else {
                    log.warn("Sector backfill: no sector returned for {} — leaving as null", holding.getSymbol());
                    failed++;
                }

                // Throttle to avoid hitting Yahoo Finance rate limits
                if (nullSectorHoldings.size() > 1) {
                    Thread.sleep(API_DELAY_MS);
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                log.warn("Sector backfill interrupted — completed {}/{} holdings", updated, nullSectorHoldings.size());
                break;
            } catch (Exception e) {
                log.warn("Sector backfill failed for {}: {}", holding.getSymbol(), e.getMessage());
                failed++;
            }
        }

        log.info("Sector backfill complete: {} updated, {} could not be resolved.", updated, failed);
    }
}
