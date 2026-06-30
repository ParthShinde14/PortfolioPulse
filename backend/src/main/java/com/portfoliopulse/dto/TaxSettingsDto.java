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
public class TaxSettingsDto {
    /**
     * Capital gains tax rate as a percentage.
     * India: 10% (LTCG), 15% (STCG equity), 30% (debt/other).
     * US: 0% / 15% / 20% (LTCG) or ordinary rate (STCG).
     */
    private BigDecimal taxRate;

    /**
     * Financial year start month.
     * "APR" for India (April 1 – March 31).
     * "JAN" for US/international (January 1 – December 31).
     */
    private String fyStartMonth;
}
