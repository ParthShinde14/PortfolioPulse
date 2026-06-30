package com.portfoliopulse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistDto {
    private Long id;
    private String symbol;
    private String companyName;
    private String sector;

    // Live quote (best-effort; null if Yahoo Finance lookup fails)
    private BigDecimal currentPrice;
    private BigDecimal change;
    private BigDecimal changePercent;

    private LocalDateTime addedAt;
}
