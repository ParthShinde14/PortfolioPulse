package com.portfoliopulse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockSelectionDto {
    private String symbol;
    private String companyName;
    private String sector;
    private String industry;
    private String exchange;
    private BigDecimal marketCap;

    // Live quote (null if Yahoo Finance lookup fails)
    private BigDecimal currentPrice;
    private BigDecimal change;
    private BigDecimal changePercent;
    private String currency;
}
