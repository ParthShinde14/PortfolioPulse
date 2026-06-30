package com.portfoliopulse.service;

import com.portfoliopulse.exception.MarketClosedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Validates whether a LIVE trade can be executed against the exchange's
 * official trading hours.
 *
 * <h3>Supported exchanges</h3>
 * <table>
 *   <tr><th>Exchange</th><th>Hours (local)</th><th>Timezone</th><th>Symbol pattern</th></tr>
 *   <tr><td>NSE / BSE (India)</td><td>09:15 – 15:30</td><td>Asia/Kolkata (IST, UTC+5:30)</td><td>ends with {@code .NS} or {@code .BO}</td></tr>
 *   <tr><td>NASDAQ / NYSE (US)</td><td>09:30 – 16:00</td><td>America/New_York (ET, UTC-5/-4)</td><td>everything else</td></tr>
 * </table>
 *
 * <h3>What is NOT enforced</h3>
 * <ul>
 *   <li>Public holidays — Yahoo Finance data naturally shows no price movement
 *       on holidays, which acts as a soft guard. Adding a holiday calendar for
 *       every exchange would require a dedicated data source (NSE, NYSE) or a
 *       3rd-party API.</li>
 *   <li>Pre-market / after-hours sessions (04:00–09:30 / 16:00–20:00 ET on
 *       US markets) — these are intentionally excluded; only regular trading
 *       hours are enforced.</li>
 * </ul>
 *
 * <h3>MANUAL transactions</h3>
 * All validation in this service is bypassed for MANUAL (historical) entries —
 * the caller ({@link HoldingService}) is responsible for checking the mode
 * before calling {@link #assertMarketOpen(String)}.
 */
@Service
@Slf4j
public class MarketHoursService {

    // ── NSE / BSE ──────────────────────────────────────────────────────────────
    private static final ZoneId   IST          = ZoneId.of("Asia/Kolkata");
    private static final LocalTime NSE_OPEN     = LocalTime.of(9,  15);
    private static final LocalTime NSE_CLOSE    = LocalTime.of(15, 30);

    // ── NASDAQ / NYSE ──────────────────────────────────────────────────────────
    private static final ZoneId   US_ET         = ZoneId.of("America/New_York");
    private static final LocalTime US_OPEN      = LocalTime.of(9,  30);
    private static final LocalTime US_CLOSE     = LocalTime.of(16,  0);

    /**
     * Resolves the exchange for the given symbol and throws
     * {@link MarketClosedException} if the market is currently closed.
     *
     * @param symbol ticker symbol, e.g. "AAPL", "RELIANCE.NS", "TCS.BO"
     * @throws MarketClosedException if the market is closed right now
     */
    public void assertMarketOpen(String symbol) {
        Exchange exchange = resolveExchange(symbol);
        switch (exchange) {
            case NSE_BSE -> assertOpen(symbol, IST, NSE_OPEN, NSE_CLOSE, "NSE/BSE", "09:15–15:30 IST");
            case US      -> assertOpen(symbol, US_ET, US_OPEN, US_CLOSE, "NASDAQ/NYSE", "09:30–16:00 ET");
        }
    }

    /**
     * Returns a human-readable description of the market hours for the given symbol.
     * Used by the frontend to display trading hours in the UI.
     */
    public MarketStatus getMarketStatus(String symbol) {
        Exchange exchange = resolveExchange(symbol);
        return switch (exchange) {
            case NSE_BSE -> buildStatus(symbol, IST, NSE_OPEN, NSE_CLOSE, "NSE/BSE", "09:15–15:30 IST", "Asia/Kolkata");
            case US      -> buildStatus(symbol, US_ET, US_OPEN, US_CLOSE, "NASDAQ/NYSE", "09:30–16:00 ET", "America/New_York");
        };
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void assertOpen(String symbol, ZoneId zone, LocalTime open, LocalTime close,
                             String exchangeName, String hoursLabel) {
        ZonedDateTime now = ZonedDateTime.now(zone);
        DayOfWeek day = now.getDayOfWeek();
        LocalTime time = now.toLocalTime();

        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            throw new MarketClosedException(
                    String.format("%s is closed on weekends. %s trades between %s on weekdays (Mon–Fri). "
                            + "Use \"Log Past Trade\" to record a historical transaction.",
                            exchangeName, exchangeName, hoursLabel));
        }

        if (time.isBefore(open)) {
            throw new MarketClosedException(
                    String.format("%s has not opened yet. Trading opens at %s. "
                            + "Current time: %02d:%02d %s. "
                            + "Use \"Log Past Trade\" to record a historical transaction.",
                            exchangeName, hoursLabel, now.getHour(), now.getMinute(),
                            zone.getId().contains("Kolkata") ? "IST" : "ET"));
        }

        if (!time.isBefore(close)) {
            throw new MarketClosedException(
                    String.format("%s is closed. Trading hours are %s. "
                            + "Current time: %02d:%02d %s. "
                            + "Use \"Log Past Trade\" to record a historical transaction.",
                            exchangeName, hoursLabel, now.getHour(), now.getMinute(),
                            zone.getId().contains("Kolkata") ? "IST" : "ET"));
        }

        log.debug("Market open check passed for {} ({}): current time {}:{} {}",
                symbol, exchangeName, now.getHour(), now.getMinute(),
                zone.getId().contains("Kolkata") ? "IST" : "ET");
    }

    private MarketStatus buildStatus(String symbol, ZoneId zone, LocalTime open, LocalTime close,
                                      String exchangeName, String hoursLabel, String timezone) {
        ZonedDateTime now = ZonedDateTime.now(zone);
        DayOfWeek day = now.getDayOfWeek();
        LocalTime time = now.toLocalTime();

        boolean isWeekend = day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
        boolean isOpen = !isWeekend && !time.isBefore(open) && time.isBefore(close);

        String currentTime = String.format("%02d:%02d", now.getHour(), now.getMinute());
        String tzLabel = timezone.contains("Kolkata") ? "IST" : "ET";

        return MarketStatus.builder()
                .exchange(exchangeName)
                .open(isOpen)
                .hoursLabel(hoursLabel)
                .timezone(tzLabel)
                .currentLocalTime(currentTime + " " + tzLabel)
                .symbol(symbol)
                .build();
    }

    private Exchange resolveExchange(String symbol) {
        String upper = symbol.toUpperCase().trim();
        if (upper.endsWith(".NS") || upper.endsWith(".BO")) {
            return Exchange.NSE_BSE;
        }
        return Exchange.US;
    }

    private enum Exchange {
        NSE_BSE, US
    }

    /**
     * Snapshot of the current market open/closed state for a given symbol.
     * Returned by {@code GET /api/market/status?symbol=} for the frontend
     * to display live market status in the Buy modal.
     */
    @lombok.Builder
    @lombok.Data
    public static class MarketStatus {
        private String symbol;
        private String exchange;
        private boolean open;
        private String hoursLabel;
        private String timezone;
        private String currentLocalTime;
    }
}
