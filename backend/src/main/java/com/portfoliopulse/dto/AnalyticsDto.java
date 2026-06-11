package com.portfoliopulse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDto {
    private BigDecimal totalInvestment;
    private BigDecimal currentPortfolioValue;
    private BigDecimal totalProfitLoss;
    private BigDecimal profitLossPercent;
    private HoldingDto topPerformer;
    private HoldingDto worstPerformer;
    private List<AllocationDto> assetAllocation;
    private List<AllocationDto> sectorAllocation;
    private List<PortfolioSnapshotDto> portfolioGrowth;
    private BigDecimal bestDayGain;
    private BigDecimal worstDayLoss;
}
