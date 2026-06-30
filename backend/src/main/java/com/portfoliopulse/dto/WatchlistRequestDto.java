package com.portfoliopulse.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistRequestDto {

    @NotBlank(message = "Stock symbol is required")
    @Size(max = 20, message = "Symbol must not exceed 20 characters")
    private String symbol;

    /** Optional — if omitted, resolved from the stock catalog or Yahoo Finance. */
    private String companyName;
}
