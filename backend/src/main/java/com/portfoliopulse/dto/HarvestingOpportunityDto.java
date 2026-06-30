package com.portfoliopulse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * One tax loss harvesting opportunity:
 * sell a losing holding, replace with a sector-equivalent substitute,
 * and capture the resulting tax saving on realized gains.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestingOpportunityDto {

    // ── The stock to SELL ─────────────────────────────────────────────────
    private String sellSymbol;
    private String sellCompanyName;
    private String sellSector;
    private BigDecimal sellAvgBuyPrice;
    private BigDecimal sellCurrentPrice;
    private BigDecimal sellQuantity;
    /** Absolute value of the unrealized loss (positive number, e.g. 18000). */
    private BigDecimal unrealizedLoss;

    // ── The replacement stock to BUY ──────────────────────────────────────
    private String substituteSymbol;
    private String substituteCompanyName;
    private String substituteSector;
    private BigDecimal substituteMarketCap;
    /** % difference in market cap between the sell stock and the substitute. */
    private BigDecimal marketCapDiffPercent;

    // ── Tax impact ────────────────────────────────────────────────────────
    /** How much of the remaining realized gains this harvest offsets. */
    private BigDecimal gainsOffset;
    /** Estimated tax saved = gainsOffset × (taxRate / 100). */
    private BigDecimal estimatedTaxSaving;
    /** User's tax rate used for this calculation (e.g. 15.00). */
    private BigDecimal taxRateUsed;

    /**
     * Quality rating of the substitute match:
     * EXCELLENT (< 10% market-cap diff),
     * GOOD (10–30%), FAIR (> 30%).
     */
    private String substituteQuality;
}
