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
public class SectorExposureDto {
    private String sector;
    private BigDecimal value;
    private BigDecimal percentage;
    private boolean warning;   // true when >= 40 %
    private String color;
}
