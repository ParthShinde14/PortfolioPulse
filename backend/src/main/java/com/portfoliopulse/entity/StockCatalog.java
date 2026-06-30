package com.portfoliopulse.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "stock_catalog", indexes = {
        @Index(name = "idx_catalog_symbol", columnList = "symbol"),
        @Index(name = "idx_catalog_company_name", columnList = "company_name")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockCatalog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String symbol;

    @Column(name = "company_name", nullable = false, length = 255)
    private String companyName;

    @Column(length = 100)
    private String sector;

    @Column(length = 150)
    private String industry;

    @Column(length = 50)
    private String exchange;

    @Column(name = "market_cap", precision = 24, scale = 2)
    private BigDecimal marketCap;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
