package com.portfoliopulse.exception;

/**
 * Thrown when a LIVE transaction is attempted outside the exchange's
 * official trading hours. MANUAL (historical) transactions bypass this check.
 */
public class MarketClosedException extends RuntimeException {
    public MarketClosedException(String message) {
        super(message);
    }
}
