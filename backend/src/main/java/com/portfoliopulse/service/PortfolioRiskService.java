package com.portfoliopulse.service;

import com.portfoliopulse.dto.*;
import com.portfoliopulse.entity.PortfolioSnapshot;
import com.portfoliopulse.repository.PortfolioSnapshotRepository;
import com.portfoliopulse.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PortfolioRiskService {

        private final HoldingService holdingService;
        private final PortfolioSnapshotRepository snapshotRepository;

        private static final String[] SECTOR_COLORS = {
                        "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
                        "#06B6D4", "#F97316", "#EC4899", "#14B8A6", "#84CC16"
        };

        // ── Risk-free rate for Sharpe (annualised, ~5% US T-Bill 2024) ─────────
        private static final double RISK_FREE_RATE = 0.05;

        public RiskMetricsDto calculateRiskMetrics() {
                List<HoldingDto> holdings = holdingService.getAllHoldings();

                if (holdings.isEmpty()) {
                        return buildEmptyMetrics();
                }

                BigDecimal totalValue = holdings.stream()
                                .map(HoldingDto::getCurrentValue)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                // ── weights (0..1) ───────────────────────────────────────────────────
                List<BigDecimal> weights = holdings.stream()
                                .map(h -> totalValue.compareTo(BigDecimal.ZERO) == 0
                                                ? BigDecimal.ZERO
                                                : h.getCurrentValue().divide(totalValue, 6, RoundingMode.HALF_UP))
                                .collect(Collectors.toList());

                // 1. Diversification ──────────────────────────────────────────────────
                BigDecimal hhi = calculateHHI(weights);
                BigDecimal diversificationScore = hhiToScore(hhi);
                String diversificationRating = getDiversificationRating(diversificationScore);

                // 2. Largest position ─────────────────────────────────────────────────
                HoldingDto largest = holdings.stream()
                                .max(Comparator.comparing(HoldingDto::getCurrentValue))
                                .orElse(holdings.get(0));
                BigDecimal largestPct = totalValue.compareTo(BigDecimal.ZERO) == 0
                                ? BigDecimal.ZERO
                                : largest.getCurrentValue()
                                                .divide(totalValue, 4, RoundingMode.HALF_UP)
                                                .multiply(BigDecimal.valueOf(100))
                                                .setScale(2, RoundingMode.HALF_UP);
                String largestRisk = getLargestPositionRisk(largestPct);

                // 3. Sector exposure ──────────────────────────────────────────────────
                List<SectorExposureDto> sectorExposures = calculateSectorExposures(holdings, totalValue);
                SectorExposureDto dominant = sectorExposures.isEmpty() ? null : sectorExposures.get(0);
                boolean sectorWarning = sectorExposures.stream().anyMatch(SectorExposureDto::isWarning);

                // 4. Volatility ───────────────────────────────────────────────────────
                BigDecimal volatility = calculateVolatility();
                String volatilityRating = getVolatilityRating(volatility);

                // 5. Sharpe ratio ─────────────────────────────────────────────────────
                BigDecimal sharpe = calculateSharpeRatio(holdings, volatility);
                String sharpeRating = getSharpeRating(sharpe);

                // 6. Health score ─────────────────────────────────────────────────────
                BigDecimal healthScore = calculateHealthScore(
                                diversificationScore, volatility, sharpe, largestPct, dominant);
                String healthRating = getHealthRating(healthScore);
                String healthExplanation = buildHealthExplanation(healthScore, diversificationRating,
                                volatilityRating, sharpeRating, largestPct);

                // 7. Insights ─────────────────────────────────────────────────────────
                List<InsightDto> insights = generateInsights(holdings, weights, totalValue,
                                largestPct, largest, sectorExposures, diversificationScore,
                                sharpe, volatility, healthScore);

                return RiskMetricsDto.builder()
                                .diversificationScore(diversificationScore)
                                .diversificationRating(diversificationRating)
                                .largestPositionSymbol(largest.getSymbol())
                                .largestPositionPercent(largestPct)
                                .largestPositionRisk(largestRisk)
                                .dominantSector(dominant != null ? dominant.getSector() : "N/A")
                                .dominantSectorPercent(dominant != null ? dominant.getPercentage() : BigDecimal.ZERO)
                                .sectorConcentrationWarning(sectorWarning)
                                .sectorExposures(sectorExposures)
                                .volatilityPercent(volatility)
                                .volatilityRating(volatilityRating)
                                .sharpeRatio(sharpe)
                                .sharpeRating(sharpeRating)
                                .healthScore(healthScore)
                                .healthRating(healthRating)
                                .healthExplanation(healthExplanation)
                                .insights(insights)
                                .build();
        }

        // ── HHI: sum of squared weights → 0 (perfect diversification) to 1 (100 % in
        // one stock) ──
        private BigDecimal calculateHHI(List<BigDecimal> weights) {
                return weights.stream()
                                .map(w -> w.pow(2))
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                                .setScale(6, RoundingMode.HALF_UP);
        }

        // ── Convert HHI → 0-100 score (higher = more diversified) ────────────
        private BigDecimal hhiToScore(BigDecimal hhi) {
                // HHI=1 → score=0, HHI→0 → score=100
                double score = (1.0 - hhi.doubleValue()) * 100.0;
                return BigDecimal.valueOf(Math.max(0, Math.min(100, score))).setScale(1, RoundingMode.HALF_UP);
        }

        private String getDiversificationRating(BigDecimal score) {
                double s = score.doubleValue();
                if (s >= 80)
                        return "Excellent";
                if (s >= 60)
                        return "Good";
                if (s >= 40)
                        return "Moderate";
                return "Poor";
        }

        private String getLargestPositionRisk(BigDecimal pct) {
                double p = pct.doubleValue();
                if (p >= 50)
                        return "Very High";
                if (p >= 30)
                        return "High";
                if (p >= 20)
                        return "Medium";
                return "Low";
        }

        private List<SectorExposureDto> calculateSectorExposures(List<HoldingDto> holdings, BigDecimal totalValue) {
                Map<String, BigDecimal> sectorMap = new LinkedHashMap<>();
                for (HoldingDto h : holdings) {
                        String sector = h.getSector() != null ? h.getSector() : "Unknown";
                        sectorMap.merge(sector, h.getCurrentValue(), BigDecimal::add);
                }

                List<Map.Entry<String, BigDecimal>> sorted = sectorMap.entrySet().stream()
                                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                                .collect(Collectors.toList());

                List<SectorExposureDto> result = new ArrayList<>();
                for (int i = 0; i < sorted.size(); i++) {
                        Map.Entry<String, BigDecimal> e = sorted.get(i);
                        BigDecimal pct = totalValue.compareTo(BigDecimal.ZERO) == 0
                                        ? BigDecimal.ZERO
                                        : e.getValue().divide(totalValue, 4, RoundingMode.HALF_UP)
                                                        .multiply(BigDecimal.valueOf(100))
                                                        .setScale(2, RoundingMode.HALF_UP);
                        result.add(SectorExposureDto.builder()
                                        .sector(e.getKey())
                                        .value(e.getValue().setScale(2, RoundingMode.HALF_UP))
                                        .percentage(pct)
                                        .warning(pct.doubleValue() >= 40.0)
                                        .color(SECTOR_COLORS[i % SECTOR_COLORS.length])
                                        .build());
                }
                return result;
        }

        // ── Volatility from daily portfolio value returns (std-dev of returns ×
        // sqrt(252)) ──
        private BigDecimal calculateVolatility() {
                List<PortfolioSnapshot> snapshots = snapshotRepository
                                .findByUserIdOrderBySnapshotDateAsc(SecurityUtils.getCurrentUserId());
                if (snapshots.size() < 3) {
                        return BigDecimal.valueOf(15.0); // default medium
                }

                List<Double> returns = new ArrayList<>();
                for (int i = 1; i < snapshots.size(); i++) {
                        double prev = snapshots.get(i - 1).getPortfolioValue().doubleValue();
                        double curr = snapshots.get(i).getPortfolioValue().doubleValue();
                        if (prev > 0)
                                returns.add((curr - prev) / prev);
                }

                if (returns.size() < 2)
                        return BigDecimal.valueOf(15.0);

                double mean = returns.stream().mapToDouble(Double::doubleValue).average().orElse(0);
                double variance = returns.stream()
                                .mapToDouble(r -> Math.pow(r - mean, 2))
                                .average().orElse(0);
                double dailyStdDev = Math.sqrt(variance);
                double annualisedVol = dailyStdDev * Math.sqrt(252) * 100; // as %

                return BigDecimal.valueOf(annualisedVol).setScale(2, RoundingMode.HALF_UP);
        }

        private String getVolatilityRating(BigDecimal vol) {
                double v = vol.doubleValue();
                if (v < 10)
                        return "Low";
                if (v < 20)
                        return "Medium";
                return "High";
        }

        // ── Simplified Sharpe: (portfolio return - risk-free) / volatility ─────
        private BigDecimal calculateSharpeRatio(List<HoldingDto> holdings, BigDecimal volatility) {
                if (volatility.compareTo(BigDecimal.ZERO) == 0)
                        return BigDecimal.ZERO;

                double totalInvested = holdings.stream().mapToDouble(h -> h.getInvestedValue().doubleValue()).sum();
                double totalCurrent = holdings.stream().mapToDouble(h -> h.getCurrentValue().doubleValue()).sum();

                if (totalInvested == 0)
                        return BigDecimal.ZERO;

                double portfolioReturn = (totalCurrent - totalInvested) / totalInvested;
                double sharpe = (portfolioReturn - RISK_FREE_RATE) / (volatility.doubleValue() / 100.0);

                return BigDecimal.valueOf(sharpe).setScale(2, RoundingMode.HALF_UP);
        }

        private String getSharpeRating(BigDecimal sharpe) {
                double s = sharpe.doubleValue();
                if (s >= 2.0)
                        return "Excellent";
                if (s >= 1.0)
                        return "Good";
                if (s >= 0.0)
                        return "Average";
                return "Poor";
        }

        // ── Composite health score ────────────────────────────────────────────
        private BigDecimal calculateHealthScore(BigDecimal diversificationScore,
                        BigDecimal volatility,
                        BigDecimal sharpe,
                        BigDecimal largestPct,
                        SectorExposureDto dominant) {
                // Weights: diversification 30%, volatility 25%, sharpe 25%, position risk 10%,
                // sector 10%
                double divScore = diversificationScore.doubleValue(); // already 0-100
                double volScore = Math.max(0, 100 - (volatility.doubleValue() - 5) * 3); // low vol = high score
                double sharpeScore = Math.min(100, Math.max(0, (sharpe.doubleValue() + 1) * 33.3));
                double posScore = Math.max(0, 100 - largestPct.doubleValue() * 1.5);
                double sectScore = dominant != null ? Math.max(0, 100 - dominant.getPercentage().doubleValue() * 1.2)
                                : 50;

                double composite = divScore * 0.30
                                + volScore * 0.25
                                + sharpeScore * 0.25
                                + posScore * 0.10
                                + sectScore * 0.10;

                return BigDecimal.valueOf(Math.max(0, Math.min(100, composite))).setScale(1, RoundingMode.HALF_UP);
        }

        private String getHealthRating(BigDecimal score) {
                double s = score.doubleValue();
                if (s >= 75)
                        return "Excellent";
                if (s >= 55)
                        return "Good";
                if (s >= 35)
                        return "Fair";
                return "Poor";
        }

        private String buildHealthExplanation(BigDecimal score, String divRating,
                        String volRating, String sharpeRating,
                        BigDecimal largestPct) {
                return String.format(
                                "Diversification is %s, volatility is %s, and Sharpe ratio is %s. " +
                                                "Largest position holds %.1f%% of portfolio value.",
                                divRating.toLowerCase(), volRating.toLowerCase(),
                                sharpeRating.toLowerCase(), largestPct.doubleValue());
        }

        // ── Rule-based insights engine ────────────────────────────────────────
        private List<InsightDto> generateInsights(List<HoldingDto> holdings,
                        List<BigDecimal> weights,
                        BigDecimal totalValue,
                        BigDecimal largestPct,
                        HoldingDto largestHolding,
                        List<SectorExposureDto> sectorExposures,
                        BigDecimal diversificationScore,
                        BigDecimal sharpe,
                        BigDecimal volatility,
                        BigDecimal healthScore) {
                List<InsightDto> insights = new ArrayList<>();

                // 1. Concentration risk on largest holding
                double lpct = largestPct.doubleValue();
                if (lpct >= 40) {
                        insights.add(InsightDto.builder()
                                        .type("WARNING")
                                        .category("Concentration")
                                        .title("High Concentration Risk")
                                        .message(String.format(
                                                        "%s represents %.1f%% of portfolio value and creates significant concentration risk. Consider rebalancing.",
                                                        largestHolding.getSymbol(), lpct))
                                        .build());
                } else if (lpct >= 25) {
                        insights.add(InsightDto.builder()
                                        .type("INFO")
                                        .category("Concentration")
                                        .title("Moderate Position Concentration")
                                        .message(String.format(
                                                        "%s holds %.1f%% of your portfolio. Monitor this position closely.",
                                                        largestHolding.getSymbol(), lpct))
                                        .build());
                }

                // 2. Sector concentration warnings
                for (SectorExposureDto sec : sectorExposures) {
                        if (sec.getPercentage().doubleValue() >= 50) {
                                insights.add(InsightDto.builder()
                                                .type("WARNING")
                                                .category("Sector")
                                                .title("Extreme Sector Concentration")
                                                .message(String.format(
                                                                "%s sector accounts for %.1f%% of your allocation. High sector risk — consider adding stocks from other sectors.",
                                                                sec.getSector(), sec.getPercentage().doubleValue()))
                                                .build());
                                break;
                        } else if (sec.getPercentage().doubleValue() >= 40) {
                                insights.add(InsightDto.builder()
                                                .type("WARNING")
                                                .category("Sector")
                                                .title("Sector Overweight")
                                                .message(String.format(
                                                                "%s sector accounts for %.1f%% of your allocation. Diversifying across more sectors can reduce risk.",
                                                                sec.getSector(), sec.getPercentage().doubleValue()))
                                                .build());
                                break;
                        }
                }

                // 3. Diversification score insight
                double ds = diversificationScore.doubleValue();
                if (ds >= 75) {
                        insights.add(InsightDto.builder()
                                        .type("SUCCESS")
                                        .category("Diversification")
                                        .title("Well Diversified Portfolio")
                                        .message(String.format(
                                                        "Your diversification score of %.0f/100 is excellent. Your portfolio is spread well across multiple holdings.",
                                                        ds))
                                        .build());
                } else if (ds < 40) {
                        insights.add(InsightDto.builder()
                                        .type("WARNING")
                                        .category("Diversification")
                                        .title("Low Diversification")
                                        .message(String.format(
                                                        "Diversification score is %.0f/100 (Poor). Adding more uncorrelated stocks or ETFs would reduce overall portfolio risk.",
                                                        ds))
                                        .build());
                } else {
                        insights.add(InsightDto.builder()
                                        .type("INFO")
                                        .category("Diversification")
                                        .title("Moderate Diversification")
                                        .message(String.format(
                                                        "Diversification score is %.0f/100. Consider adding holdings from underrepresented sectors to improve balance.",
                                                        ds))
                                        .build());
                }

                // 4. Top performer insight
                HoldingDto topPerformer = holdings.stream()
                                .max(Comparator.comparing(HoldingDto::getProfitLossPercent))
                                .orElse(null);
                if (topPerformer != null && topPerformer.getProfitLossPercent().doubleValue() > 10) {
                        insights.add(InsightDto.builder()
                                        .type("SUCCESS")
                                        .category("Performance")
                                        .title("Strong Performer")
                                        .message(String.format(
                                                        "%s (%s) is your best performer with a %.1f%% return. Consider if profit-taking aligns with your strategy.",
                                                        topPerformer.getSymbol(), topPerformer.getCompanyName(),
                                                        topPerformer.getProfitLossPercent().doubleValue()))
                                        .build());
                }

                // 5. Worst performer insight
                HoldingDto worstPerformer = holdings.stream()
                                .min(Comparator.comparing(HoldingDto::getProfitLossPercent))
                                .orElse(null);
                if (worstPerformer != null && worstPerformer.getProfitLossPercent().doubleValue() < -15) {
                        insights.add(InsightDto.builder()
                                        .type("WARNING")
                                        .category("Performance")
                                        .title("Underperforming Holding")
                                        .message(String.format(
                                                        "%s is down %.1f%%: Review the fundamental case for holding this position.",
                                                        worstPerformer.getSymbol(),
                                                        Math.abs(worstPerformer.getProfitLossPercent().doubleValue())))
                                        .build());
                }

                // 6. Volatility insight
                double vol = volatility.doubleValue();
                if (vol > 25) {
                        insights.add(InsightDto.builder()
                                        .type("WARNING")
                                        .category("Risk")
                                        .title("High Portfolio Volatility")
                                        .message(String.format(
                                                        "Annualised portfolio volatility is %.1f%%. High volatility suggests significant price swings. Adding defensive or low-correlation assets may help.",
                                                        vol))
                                        .build());
                } else if (vol < 10) {
                        insights.add(InsightDto.builder()
                                        .type("SUCCESS")
                                        .category("Risk")
                                        .title("Low Volatility Portfolio")
                                        .message(String.format(
                                                        "Portfolio volatility of %.1f%% is low. Your portfolio is relatively stable.",
                                                        vol))
                                        .build());
                }

                // 7. Sharpe ratio insight
                double sh = sharpe.doubleValue();
                if (sh >= 1.5) {
                        insights.add(InsightDto.builder()
                                        .type("SUCCESS")
                                        .category("Risk")
                                        .title("Strong Risk-Adjusted Returns")
                                        .message(String.format(
                                                        "Sharpe ratio of %.2f indicates excellent risk-adjusted returns. You are being well compensated for the risk taken.",
                                                        sh))
                                        .build());
                } else if (sh < 0) {
                        insights.add(InsightDto.builder()
                                        .type("WARNING")
                                        .category("Risk")
                                        .title("Poor Risk-Adjusted Performance")
                                        .message(String.format(
                                                        "Sharpe ratio of %.2f is negative, meaning your portfolio is underperforming a risk-free investment. Review your strategy.",
                                                        sh))
                                        .build());
                }

                // 8. Number of holdings insight
                if (holdings.size() < 5) {
                        insights.add(InsightDto.builder()
                                        .type("TIP")
                                        .category("Diversification")
                                        .title("Consider Adding More Holdings")
                                        .message(String.format(
                                                        "You hold %d stock%s. Portfolios with 10-20 well-chosen holdings typically achieve better risk-adjusted diversification.",
                                                        holdings.size(), holdings.size() == 1 ? "" : "s"))
                                        .build());
                }

                // 9. Health score summary
                double hs = healthScore.doubleValue();
                if (hs >= 75) {
                        insights.add(InsightDto.builder()
                                        .type("SUCCESS")
                                        .category("Health")
                                        .title("Portfolio in Excellent Health")
                                        .message(String.format(
                                                        "Overall portfolio health score is %.0f/100. Keep maintaining this diversified, risk-managed approach.",
                                                        hs))
                                        .build());
                } else if (hs < 40) {
                        insights.add(InsightDto.builder()
                                        .type("WARNING")
                                        .category("Health")
                                        .title("Portfolio Needs Attention")
                                        .message(String.format(
                                                        "Health score of %.0f/100 indicates room for improvement. Focus on diversification, reducing concentration, and balancing sector exposure.",
                                                        hs))
                                        .build());
                }

                // 10. ETF suggestion if portfolio is small
                if (holdings.size() <= 3) {
                        insights.add(InsightDto.builder()
                                        .type("TIP")
                                        .category("Diversification")
                                        .title("Consider Broad Market ETFs")
                                        .message("With a small number of holdings, consider adding broad ETFs like SPY, QQQ, or VTI to instantly diversify across hundreds of companies.")
                                        .build());
                }

                return insights.stream().limit(10).collect(Collectors.toList());
        }

        private RiskMetricsDto buildEmptyMetrics() {
                return RiskMetricsDto.builder()
                                .diversificationScore(BigDecimal.ZERO)
                                .diversificationRating("N/A")
                                .largestPositionSymbol("N/A")
                                .largestPositionPercent(BigDecimal.ZERO)
                                .largestPositionRisk("N/A")
                                .dominantSector("N/A")
                                .dominantSectorPercent(BigDecimal.ZERO)
                                .sectorConcentrationWarning(false)
                                .sectorExposures(Collections.emptyList())
                                .volatilityPercent(BigDecimal.ZERO)
                                .volatilityRating("N/A")
                                .sharpeRatio(BigDecimal.ZERO)
                                .sharpeRating("N/A")
                                .healthScore(BigDecimal.ZERO)
                                .healthRating("N/A")
                                .healthExplanation("Add stocks to your portfolio to see health metrics.")
                                .insights(Collections.emptyList())
                                .build();
        }
}
