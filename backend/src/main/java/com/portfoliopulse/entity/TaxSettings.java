package com.portfoliopulse.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "tax_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxSettings {

    @Id
    @Column(name = "user_id")
    private Long userId;

    /**
     * Capital gains tax rate as a percentage (e.g. 15.00 = 15%).
     * India defaults: 15% STCG equity, 10% LTCG equity.
     */
    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = new BigDecimal("15.00");

    /**
     * Three-letter month abbreviation for the financial year start.
     * "APR" → India (April 1 – March 31).
     * "JAN" → US/international (January 1 – December 31).
     */
    @Column(name = "fy_start_month", nullable = false, length = 3)
    @Builder.Default
    private String fyStartMonth = "APR";
}
