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
public class RiskMetricsDto {

    // ── Diversification (HHI) ─────────────────────────────────────────────
    private BigDecimal diversificationScore;   // 0–100
    private String diversificationRating;      // Excellent / Good / Moderate / Poor

    // ── Largest Position ──────────────────────────────────────────────────
    private String largestPositionSymbol;
    private BigDecimal largestPositionPercent;
    private String largestPositionRisk;        // Low / Medium / High / Very High

    // ── Sector Exposure ───────────────────────────────────────────────────
    private String dominantSector;
    private BigDecimal dominantSectorPercent;
    private boolean sectorConcentrationWarning;
    private List<SectorExposureDto> sectorExposures;

    // ── Volatility ────────────────────────────────────────────────────────
    private BigDecimal volatilityPercent;
    private String volatilityRating;           // Low / Medium / High

    // ── Sharpe Ratio ──────────────────────────────────────────────────────
    private BigDecimal sharpeRatio;
    private String sharpeRating;               // Excellent / Good / Average / Poor

    // ── Overall Health Score ──────────────────────────────────────────────
    private BigDecimal healthScore;            // 0–100
    private String healthRating;              // Excellent / Good / Fair / Poor
    private String healthExplanation;

    // ── AI Insights ───────────────────────────────────────────────────────
    private List<InsightDto> insights;
}
