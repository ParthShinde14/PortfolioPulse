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
public class BenchmarkDto {
    private String benchmarkName;
    private String benchmarkSymbol;

    /** Portfolio's overall return % (current value vs. cost basis, all-time). */
    private BigDecimal portfolioReturn;

    /** Benchmark index return % over the same window as the portfolio's snapshot history. */
    private BigDecimal benchmarkReturn;

    /** portfolioReturn - benchmarkReturn. Positive = portfolio outperformed. */
    private BigDecimal outperformance;

    /** Simplified tracking difference: |portfolioReturn - benchmarkReturn|. */
    private BigDecimal trackingDifference;

    /** Normalised (base=100) growth series for charting portfolio vs benchmark over time. */
    private List<BenchmarkPointDto> growthSeries;

    /** Available benchmark choices for the frontend selector. */
    private List<BenchmarkOptionDto> availableBenchmarks;
}
