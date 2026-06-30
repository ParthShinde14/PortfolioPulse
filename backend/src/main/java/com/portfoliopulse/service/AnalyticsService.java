package com.portfoliopulse.service;

import com.portfoliopulse.dto.*;
import com.portfoliopulse.entity.PortfolioSnapshot;
import com.portfoliopulse.entity.User;
import com.portfoliopulse.repository.PortfolioSnapshotRepository;
import com.portfoliopulse.repository.UserRepository;
import com.portfoliopulse.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class AnalyticsService {

    private final HoldingService holdingService;
    private final PortfolioSnapshotRepository snapshotRepository;
    private final UserRepository userRepository;

    private static final String[] CHART_COLORS = {
            "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
            "#06B6D4", "#F97316", "#EC4899", "#14B8A6", "#84CC16"
    };

    public DashboardDto getDashboard() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<HoldingDto> holdings = holdingService.getAllHoldings();
        PortfolioMetrics metrics = calculateMetrics(holdings);

        // Take snapshot for today
        takeSnapshotIfNeeded(userId, metrics);

        List<PortfolioSnapshotDto> growth = getPortfolioGrowth(userId);

        return DashboardDto.builder()
                .totalInvestment(metrics.totalInvestment)
                .currentPortfolioValue(metrics.currentValue)
                .totalProfitLoss(metrics.profitLoss)
                .profitLossPercent(metrics.profitLossPercent)
                .dayChange(metrics.dayChange)
                .dayChangePercent(metrics.dayChangePercent)
                .totalStocks(holdings.size())
                .topHoldings(holdings.stream()
                        .sorted(Comparator.comparing(HoldingDto::getCurrentValue).reversed())
                        .limit(5)
                        .collect(Collectors.toList()))
                .portfolioGrowth(growth)
                .assetAllocation(calculateAssetAllocation(holdings, metrics.currentValue))
                .sectorAllocation(calculateSectorAllocation(holdings, metrics.currentValue))
                .build();
    }

    public AnalyticsDto getAnalytics() {
        List<HoldingDto> holdings = holdingService.getAllHoldings();
        PortfolioMetrics metrics = calculateMetrics(holdings);

        HoldingDto topPerformer = holdings.stream()
                .max(Comparator.comparing(HoldingDto::getProfitLossPercent))
                .orElse(null);

        HoldingDto worstPerformer = holdings.stream()
                .min(Comparator.comparing(HoldingDto::getProfitLossPercent))
                .orElse(null);

        return AnalyticsDto.builder()
                .totalInvestment(metrics.totalInvestment)
                .currentPortfolioValue(metrics.currentValue)
                .totalProfitLoss(metrics.profitLoss)
                .profitLossPercent(metrics.profitLossPercent)
                .topPerformer(topPerformer)
                .worstPerformer(worstPerformer)
                .assetAllocation(calculateAssetAllocation(holdings, metrics.currentValue))
                .sectorAllocation(calculateSectorAllocation(holdings, metrics.currentValue))
                .portfolioGrowth(getPortfolioGrowth(SecurityUtils.getCurrentUserId()))
                .build();
    }

    /** Package-private so {@link BenchmarkService} and {@link PortfolioRiskService} can reuse the same calculation. */
    PortfolioMetrics calculateMetrics(List<HoldingDto> holdings) {
        BigDecimal totalInvestment = holdings.stream()
                .map(HoldingDto::getInvestedValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal currentValue = holdings.stream()
                .map(HoldingDto::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal profitLoss = currentValue.subtract(totalInvestment).setScale(2, RoundingMode.HALF_UP);

        BigDecimal profitLossPercent = BigDecimal.ZERO;
        if (totalInvestment.compareTo(BigDecimal.ZERO) != 0) {
            profitLossPercent = profitLoss.divide(totalInvestment, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal dayChange = holdings.stream()
                .map(HoldingDto::getDayChange)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal dayChangePercent = BigDecimal.ZERO;
        if (currentValue.compareTo(BigDecimal.ZERO) != 0) {
            dayChangePercent = dayChange.divide(currentValue.subtract(dayChange), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        }

        return new PortfolioMetrics(totalInvestment.setScale(2, RoundingMode.HALF_UP),
                currentValue.setScale(2, RoundingMode.HALF_UP),
                profitLoss, profitLossPercent, dayChange, dayChangePercent);
    }

    private List<AllocationDto> calculateAssetAllocation(List<HoldingDto> holdings, BigDecimal totalValue) {
        if (totalValue.compareTo(BigDecimal.ZERO) == 0) return Collections.emptyList();

        return holdings.stream()
                .sorted(Comparator.comparing(HoldingDto::getCurrentValue).reversed())
                .map((holding) -> {
                    int idx = holdings.indexOf(holding) % CHART_COLORS.length;
                    BigDecimal percentage = holding.getCurrentValue()
                            .divide(totalValue, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .setScale(2, RoundingMode.HALF_UP);
                    return AllocationDto.builder()
                            .name(holding.getSymbol())
                            .value(holding.getCurrentValue())
                            .percentage(percentage)
                            .color(CHART_COLORS[idx])
                            .build();
                })
                .collect(Collectors.toList());
    }

    private List<AllocationDto> calculateSectorAllocation(List<HoldingDto> holdings, BigDecimal totalValue) {
        if (totalValue.compareTo(BigDecimal.ZERO) == 0) return Collections.emptyList();

        Map<String, BigDecimal> sectorValues = new LinkedHashMap<>();
        for (HoldingDto h : holdings) {
            String sector = h.getSector() != null ? h.getSector() : "Unknown";
            sectorValues.merge(sector, h.getCurrentValue(), BigDecimal::add);
        }

        List<Map.Entry<String, BigDecimal>> sorted = sectorValues.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .collect(Collectors.toList());

        List<AllocationDto> result = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            Map.Entry<String, BigDecimal> entry = sorted.get(i);
            BigDecimal percentage = entry.getValue()
                    .divide(totalValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
            result.add(AllocationDto.builder()
                    .name(entry.getKey())
                    .value(entry.getValue().setScale(2, RoundingMode.HALF_UP))
                    .percentage(percentage)
                    .color(CHART_COLORS[i % CHART_COLORS.length])
                    .build());
        }
        return result;
    }

    /** Package-private so {@link BenchmarkService} can reuse the same growth series. */
    List<PortfolioSnapshotDto> getPortfolioGrowth(Long userId) {
        return snapshotRepository.findByUserIdOrderBySnapshotDateAsc(userId).stream()
                .map(s -> PortfolioSnapshotDto.builder()
                        .id(s.getId())
                        .portfolioValue(s.getPortfolioValue())
                        .totalInvestment(s.getTotalInvestment())
                        .profitLoss(s.getProfitLoss())
                        .profitPercentage(s.getProfitPercentage())
                        .snapshotDate(s.getSnapshotDate())
                        .build())
                .collect(Collectors.toList());
    }

    private void takeSnapshotIfNeeded(Long userId, PortfolioMetrics metrics) {
        LocalDate today = LocalDate.now();
        if (snapshotRepository.findByUserIdAndSnapshotDate(userId, today).isPresent()) return;

        PortfolioSnapshot snapshot = PortfolioSnapshot.builder()
                .userId(userId)
                .portfolioValue(metrics.currentValue)
                .totalInvestment(metrics.totalInvestment)
                .profitLoss(metrics.profitLoss)
                .profitPercentage(metrics.profitLossPercent)
                .snapshotDate(today)
                .build();
        snapshotRepository.save(snapshot);
    }

    // Scheduled daily snapshot at market close (4 PM EST) — runs for every registered user
    @Scheduled(cron = "0 0 21 * * MON-FRI")
    public void scheduledSnapshot() {
        for (User user : userRepository.findAll()) {
            try {
                List<HoldingDto> holdings = holdingService.getAllHoldingsForUser(user.getId());
                if (holdings.isEmpty()) continue;
                PortfolioMetrics metrics = calculateMetrics(holdings);

                LocalDate today = LocalDate.now();
                PortfolioSnapshot snapshot = snapshotRepository.findByUserIdAndSnapshotDate(user.getId(), today)
                        .orElse(PortfolioSnapshot.builder().userId(user.getId()).snapshotDate(today).build());

                snapshot.setPortfolioValue(metrics.currentValue);
                snapshot.setTotalInvestment(metrics.totalInvestment);
                snapshot.setProfitLoss(metrics.profitLoss);
                snapshot.setProfitPercentage(metrics.profitLossPercent);
                snapshotRepository.save(snapshot);
                log.info("Daily portfolio snapshot saved for user {} on {}", user.getId(), today);
            } catch (Exception e) {
                log.error("Failed to save scheduled snapshot for user {}: {}", user.getId(), e.getMessage());
            }
        }
    }

    record PortfolioMetrics(
            BigDecimal totalInvestment,
            BigDecimal currentValue,
            BigDecimal profitLoss,
            BigDecimal profitLossPercent,
            BigDecimal dayChange,
            BigDecimal dayChangePercent
    ) {}
}
