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
public class DashboardDto {
    private BigDecimal totalInvestment;
    private BigDecimal currentPortfolioValue;
    private BigDecimal totalProfitLoss;
    private BigDecimal profitLossPercent;
    private BigDecimal dayChange;
    private BigDecimal dayChangePercent;
    private int totalStocks;
    private List<HoldingDto> topHoldings;
    private List<PortfolioSnapshotDto> portfolioGrowth;
    private List<AllocationDto> assetAllocation;
    private List<AllocationDto> sectorAllocation;
}
