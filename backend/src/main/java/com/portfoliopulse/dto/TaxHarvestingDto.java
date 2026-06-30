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
public class TaxHarvestingDto {

    // ── Summary ───────────────────────────────────────────────────────────
    /** Total gains realized this financial year from profitable SELL transactions. */
    private BigDecimal totalRealizedGains;
    /** Absolute total of all unrealized losses across identified opportunities. */
    private BigDecimal totalHarvestableLoss;
    /** min(totalHarvestableLoss, totalRealizedGains) — the actual offset achievable. */
    private BigDecimal totalGainsOffset;
    /** Total estimated tax saving = totalGainsOffset × (taxRate / 100). */
    private BigDecimal totalEstimatedTaxSaving;
    /** User's configured tax rate. */
    private BigDecimal taxRate;
    /** Human-readable FY label, e.g. "FY 2025-26 (Apr 2025 – Mar 2026)". */
    private String financialYear;
    /** ISO date of FY start, e.g. "2025-04-01". */
    private String fyStartDate;

    // ── Opportunities ─────────────────────────────────────────────────────
    /** Top 5 opportunities ranked by estimated tax saving descending. */
    private List<HarvestingOpportunityDto> opportunities;

    // ── State flags ───────────────────────────────────────────────────────
    /** True when the user has no realized gains to offset this FY. */
    private boolean noGainsToOffset;
    /** True when all holdings are profitable (no losses to harvest). */
    private boolean noLossesToHarvest;
}
