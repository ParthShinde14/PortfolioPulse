package com.portfoliopulse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A single point on the "Portfolio Growth vs Benchmark Growth" chart.
 * Both values are normalised to a base of 100 at the first snapshot date,
 * so portfolio value and index level can be compared on the same scale
 * regardless of absolute magnitude.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BenchmarkPointDto {
    private LocalDate date;
    private BigDecimal portfolioIndexed;
    private BigDecimal benchmarkIndexed;
}
