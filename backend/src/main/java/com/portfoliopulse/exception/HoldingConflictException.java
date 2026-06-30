package com.portfoliopulse.exception;

public class HoldingConflictException extends RuntimeException {

    public HoldingConflictException(String message) {
        super(message);
    }

    public HoldingConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}