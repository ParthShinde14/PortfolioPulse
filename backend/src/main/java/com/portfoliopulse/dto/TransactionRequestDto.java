package com.portfoliopulse.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRequestDto {

    @NotBlank(message = "Stock symbol is required")
    @Size(max = 20, message = "Symbol must not exceed 20 characters")
    private String symbol;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.0001", message = "Quantity must be greater than 0")
    private BigDecimal quantity;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    @NotNull(message = "Transaction date is required")
    private LocalDate transactionDate;

    private String notes;

    /**
     * Controls whether market-hours validation is applied.
     * <ul>
     *   <li>{@code LIVE} — the user is buying/selling RIGHT NOW at the current
     *       market price. Market-hours validation is enforced: the request is
     *       rejected if the exchange is currently closed.</li>
     *   <li>{@code MANUAL} — the user is logging a historical or after-hours
     *       trade (custom date + custom price). No market-hours check is applied;
     *       this is just record-keeping.</li>
     * </ul>
     * Defaults to {@code LIVE} when not supplied, preserving backward
     * compatibility for any existing clients that don't send this field.
     */
    private TransactionMode transactionMode = TransactionMode.LIVE;

    public enum TransactionMode {
        LIVE, MANUAL
    }
}
