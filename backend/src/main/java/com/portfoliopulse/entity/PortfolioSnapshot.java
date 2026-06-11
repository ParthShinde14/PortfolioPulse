package com.portfoliopulse.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "portfolio_snapshots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "portfolio_value", nullable = false, precision = 20, scale = 4)
    private BigDecimal portfolioValue;

    @Column(name = "total_investment", nullable = false, precision = 20, scale = 4)
    private BigDecimal totalInvestment;

    @Column(name = "profit_loss", nullable = false, precision = 20, scale = 4)
    private BigDecimal profitLoss;

    @Column(name = "profit_percentage", precision = 10, scale = 4)
    private BigDecimal profitPercentage;

    @Column(name = "snapshot_date", nullable = false, unique = true)
    private LocalDate snapshotDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
