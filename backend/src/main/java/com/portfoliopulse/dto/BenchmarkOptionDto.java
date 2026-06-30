package com.portfoliopulse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BenchmarkOptionDto {
    private String key;    // SP500 / NASDAQ / NIFTY50
    private String name;   // "S&P 500"
    private String symbol; // SPY / QQQ / ^NSEI
}
