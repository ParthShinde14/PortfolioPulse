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
public class TradeStatDto {
    private String symbol;
    private String companyName;
    private BigDecimal totalRealizedPnl;
    private int tradeCount;
}
