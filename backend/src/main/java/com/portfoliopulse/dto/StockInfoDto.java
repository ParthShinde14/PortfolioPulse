package com.portfoliopulse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockInfoDto {
    private String symbol;
    private String companyName;
    private String sector;
    private String industry;
    private BigDecimal currentPrice;
    private BigDecimal previousClose;
    private BigDecimal change;
    private BigDecimal changePercent;
    private BigDecimal marketCap;
    private BigDecimal peRatio;
    private Long volume;
    private String currency;
    private String exchange;
}
