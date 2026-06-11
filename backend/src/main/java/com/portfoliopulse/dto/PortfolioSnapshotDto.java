package com.portfoliopulse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioSnapshotDto {
    private Long id;
    private BigDecimal portfolioValue;
    private BigDecimal totalInvestment;
    private BigDecimal profitLoss;
    private BigDecimal profitPercentage;
    private LocalDate snapshotDate;
}
