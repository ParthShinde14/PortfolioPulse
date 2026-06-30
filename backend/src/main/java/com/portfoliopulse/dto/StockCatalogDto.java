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
public class StockCatalogDto {
    private String symbol;
    private String companyName;
    private String sector;
    private String industry;
    private String exchange;
    private BigDecimal marketCap;
}
