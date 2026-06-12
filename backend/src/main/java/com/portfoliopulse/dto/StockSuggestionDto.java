package com.portfoliopulse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockSuggestionDto {
    private String symbol;
    private String companyName;
    private String sector;
    private String exchange;
    private String type;   // Stock / ETF / Index
}
