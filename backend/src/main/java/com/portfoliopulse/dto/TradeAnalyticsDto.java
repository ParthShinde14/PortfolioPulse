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
public class TradeAnalyticsDto {
    private int totalTrades;
    private int winningTrades;
    private int losingTrades;
    private BigDecimal winRate;          // 0-100

    private BigDecimal averageGain;      // average P&L of winning trades
    private BigDecimal averageLoss;      // average P&L of losing trades (negative)

    private TradeRecordDto bestTrade;
    private TradeRecordDto worstTrade;

    /** sum(gains) / |sum(losses)|. Null when there are no losing trades (i.e. unbounded). */
    private BigDecimal profitFactor;

    private List<TradeStatDto> topProfitableStocks;
    private List<TradeStatDto> topLosingStocks;

    /** Full realized-trade history, most recent first. */
    private List<TradeRecordDto> trades;
}
