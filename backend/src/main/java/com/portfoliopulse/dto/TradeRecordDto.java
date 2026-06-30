package com.portfoliopulse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TradeRecordDto {
    private String symbol;
    private String companyName;
    private LocalDate date;
    private BigDecimal quantity;
    private BigDecimal sellPrice;
    private BigDecimal avgBuyPrice;
    private BigDecimal realizedPnl;
    private BigDecimal realizedPnlPercent;
    private String outcome; // WIN / LOSS / BREAKEVEN
}
