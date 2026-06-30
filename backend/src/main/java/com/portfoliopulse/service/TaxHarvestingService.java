package com.portfoliopulse.service;

import com.portfoliopulse.dto.*;
import com.portfoliopulse.entity.StockCatalog;
import com.portfoliopulse.entity.TaxSettings;
import com.portfoliopulse.entity.Transaction;
import com.portfoliopulse.repository.StockCatalogRepository;
import com.portfoliopulse.repository.TaxSettingsRepository;
import com.portfoliopulse.repository.TransactionRepository;
import com.portfoliopulse.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Tax Loss Harvesting analysis engine.
 *
 * <h3>Algorithm — pure math, no AI, no hardcoding:</h3>
 * <ol>
 *   <li>Determine current FY start from user's TaxSettings
 *       (APR → April 1; JAN → January 1).</li>
 *   <li>Sum all realized gains from SELL transactions since FY start,
 *       using weighted-average cost basis per symbol.</li>
 *   <li>For each currently held position where currentPrice &lt; avgBuyPrice,
 *       compute the unrealized loss. Skip if loss &lt; ₹500 (too small to
 *       be worth transaction costs).</li>
 *   <li>For each losing position, find the best substitute stock from
 *       stock_catalog: same sector, closest market cap, not already owned.</li>
 *   <li>Calculate estimatedTaxSaving = loss × taxRate / 100, capped at
 *       remaining realized gains.</li>
 *   <li>Rank by tax saving descending. Return top 5.</li>
 * </ol>
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaxHarvestingService {

    private final HoldingService         holdingService;
    private final TransactionRepository  transactionRepository;
    private final StockCatalogRepository catalogRepository;
    private final TaxSettingsRepository  taxSettingsRepository;

    /** Minimum loss worth harvesting after typical brokerage/STT costs. */
    private static final BigDecimal MIN_HARVESTABLE_LOSS = new BigDecimal("500");

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    public TaxHarvestingDto analyze() {
        Long userId       = SecurityUtils.getCurrentUserId();
        TaxSettings settings = getOrDefaultSettings(userId);

        LocalDate fyStart = getFyStartDate(settings.getFyStartMonth());
        String fyLabel    = buildFyLabel(settings.getFyStartMonth(), fyStart);

        // ── Step 1: realized gains this FY ───────────────────────────────
        Map<String, BigDecimal> avgCostBasis = buildAvgCostBasis(userId);
        List<Transaction> fySells = transactionRepository.findSellsFromFYStart(userId, fyStart);

        BigDecimal totalRealizedGains = fySells.stream()
                .map(sell -> {
                    BigDecimal avgBuy = avgCostBasis.getOrDefault(sell.getSymbol(), sell.getPrice());
                    return sell.getPrice()
                            .subtract(avgBuy)
                            .multiply(sell.getQuantity())
                            .setScale(2, RoundingMode.HALF_UP);
                })
                .filter(pnl -> pnl.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ── Step 2: current holdings with unrealized losses ───────────────
        List<HoldingDto> holdings = holdingService.getAllHoldings();
        Set<String> ownedSymbols  = holdings.stream()
                .map(HoldingDto::getSymbol)
                .collect(Collectors.toSet());

        List<HoldingDto> losingHoldings = holdings.stream()
                .filter(h -> h.getProfitLoss() != null
                        && h.getProfitLoss().compareTo(BigDecimal.ZERO) < 0
                        && h.getProfitLoss().abs().compareTo(MIN_HARVESTABLE_LOSS) >= 0)
                .sorted(Comparator.comparing(HoldingDto::getProfitLoss)) // biggest loss first
                .collect(Collectors.toList());

        // ── Early exit: nothing to offset or no losses ────────────────────
        if (totalRealizedGains.compareTo(BigDecimal.ZERO) <= 0) {
            return buildEmpty(settings.getTaxRate(), fyLabel, fyStart.toString(),
                    false, true, losingHoldings.isEmpty());
        }
        if (losingHoldings.isEmpty()) {
            return buildEmpty(settings.getTaxRate(), fyLabel, fyStart.toString(),
                    false, false, true);
        }

        // ── Step 3: build and rank opportunities ──────────────────────────
        BigDecimal taxRate        = settings.getTaxRate();
        BigDecimal remainingGains = totalRealizedGains;
        BigDecimal totalLoss      = BigDecimal.ZERO;
        BigDecimal totalOffset    = BigDecimal.ZERO;
        BigDecimal totalTaxSaving = BigDecimal.ZERO;

        List<HarvestingOpportunityDto> opportunities = new ArrayList<>();

        for (HoldingDto losing : losingHoldings) {
            if (remainingGains.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal loss   = losing.getProfitLoss().abs();
            BigDecimal offset = loss.min(remainingGains);
            BigDecimal taxSave = offset
                    .multiply(taxRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            remainingGains = remainingGains.subtract(offset);
            totalLoss      = totalLoss.add(loss);
            totalOffset    = totalOffset.add(offset);
            totalTaxSaving = totalTaxSaving.add(taxSave);

            opportunities.add(buildOpportunity(
                    losing, loss, offset, taxSave, taxRate,
                    new ArrayList<>(ownedSymbols)));
        }

        // Rank by tax saving desc, cap at 5
        opportunities.sort(Comparator
                .comparing(HarvestingOpportunityDto::getEstimatedTaxSaving).reversed());
        if (opportunities.size() > 5) {
            opportunities = opportunities.subList(0, 5);
        }

        return TaxHarvestingDto.builder()
                .totalRealizedGains(totalRealizedGains.setScale(2, RoundingMode.HALF_UP))
                .totalHarvestableLoss(totalLoss.setScale(2, RoundingMode.HALF_UP))
                .totalGainsOffset(totalOffset.setScale(2, RoundingMode.HALF_UP))
                .totalEstimatedTaxSaving(totalTaxSaving.setScale(2, RoundingMode.HALF_UP))
                .taxRate(taxRate)
                .financialYear(fyLabel)
                .fyStartDate(fyStart.toString())
                .opportunities(opportunities)
                .noGainsToOffset(false)
                .noLossesToHarvest(false)
                .build();
    }

    public TaxSettingsDto getSettings() {
        Long userId  = SecurityUtils.getCurrentUserId();
        TaxSettings s = getOrDefaultSettings(userId);
        return TaxSettingsDto.builder()
                .taxRate(s.getTaxRate())
                .fyStartMonth(s.getFyStartMonth())
                .build();
    }

    @Transactional
    public TaxSettingsDto saveSettings(TaxSettingsDto dto) {
        Long userId  = SecurityUtils.getCurrentUserId();
        TaxSettings s = taxSettingsRepository.findById(userId)
                .orElse(TaxSettings.builder().userId(userId).build());
        if (dto.getTaxRate()     != null) s.setTaxRate(dto.getTaxRate());
        if (dto.getFyStartMonth() != null) s.setFyStartMonth(dto.getFyStartMonth().toUpperCase());
        taxSettingsRepository.save(s);
        return TaxSettingsDto.builder()
                .taxRate(s.getTaxRate())
                .fyStartMonth(s.getFyStartMonth())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private HarvestingOpportunityDto buildOpportunity(
            HoldingDto losing,
            BigDecimal loss,
            BigDecimal offset,
            BigDecimal taxSave,
            BigDecimal taxRate,
            List<String> ownedSymbols) {

        String sector = losing.getSector() != null ? losing.getSector() : "Unknown";

        BigDecimal lossMarketCap = catalogRepository
                .findBySymbolIgnoreCase(losing.getSymbol())
                .map(StockCatalog::getMarketCap)
                .orElse(BigDecimal.valueOf(50_000));

        // Find best substitute: same sector, closest market cap, not owned
        List<StockCatalog> substitutes = catalogRepository.findSubstitutes(
                sector,
                losing.getSymbol(),
                ownedSymbols,
                lossMarketCap,
                PageRequest.of(0, 3));

        // Fallback: any unowned catalog stock when no sector match
        if (substitutes.isEmpty()) {
            substitutes = catalogRepository.findByIsActiveTrue().stream()
                    .filter(s -> !ownedSymbols.contains(s.getSymbol()))
                    .filter(s -> !s.getSymbol().equals(losing.getSymbol()))
                    .limit(1)
                    .collect(Collectors.toList());
        }

        String     subSymbol   = null;
        String     subCompany  = null;
        String     subSector   = sector;
        BigDecimal subMktCap   = null;
        BigDecimal mktCapDiff  = BigDecimal.ZERO;
        String     quality     = "FAIR";

        if (!substitutes.isEmpty()) {
            StockCatalog best = substitutes.get(0);
            subSymbol  = best.getSymbol();
            subCompany = best.getCompanyName();
            subSector  = best.getSector() != null ? best.getSector() : sector;
            subMktCap  = best.getMarketCap();

            if (lossMarketCap.compareTo(BigDecimal.ZERO) > 0 && subMktCap != null) {
                mktCapDiff = subMktCap.subtract(lossMarketCap).abs()
                        .divide(lossMarketCap, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(1, RoundingMode.HALF_UP);

                if      (mktCapDiff.compareTo(BigDecimal.valueOf(10)) < 0) quality = "EXCELLENT";
                else if (mktCapDiff.compareTo(BigDecimal.valueOf(30)) < 0) quality = "GOOD";
                else                                                        quality = "FAIR";
            }
        }

        return HarvestingOpportunityDto.builder()
                .sellSymbol(losing.getSymbol())
                .sellCompanyName(losing.getCompanyName())
                .sellSector(sector)
                .sellAvgBuyPrice(losing.getAverageBuyPrice())
                .sellCurrentPrice(losing.getCurrentPrice())
                .sellQuantity(losing.getQuantity())
                .unrealizedLoss(loss)
                .substituteSymbol(subSymbol)
                .substituteCompanyName(subCompany)
                .substituteSector(subSector)
                .substituteMarketCap(subMktCap)
                .marketCapDiffPercent(mktCapDiff)
                .gainsOffset(offset)
                .estimatedTaxSaving(taxSave)
                .taxRateUsed(taxRate)
                .substituteQuality(quality)
                .build();
    }

    /** Weighted-average buy price per symbol across all BUY transactions. */
    private Map<String, BigDecimal> buildAvgCostBasis(Long userId) {
        Map<String, BigDecimal[]> accum = new HashMap<>();
        for (Transaction buy : transactionRepository.findAllBuysOrderedBySymbolAndDate(userId)) {
            BigDecimal[] cur = accum.getOrDefault(
                    buy.getSymbol(), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            cur[0] = cur[0].add(buy.getPrice().multiply(buy.getQuantity()));
            cur[1] = cur[1].add(buy.getQuantity());
            accum.put(buy.getSymbol(), cur);
        }
        Map<String, BigDecimal> result = new HashMap<>();
        accum.forEach((sym, arr) -> {
            if (arr[1].compareTo(BigDecimal.ZERO) != 0)
                result.put(sym, arr[0].divide(arr[1], 6, RoundingMode.HALF_UP));
        });
        return result;
    }

    private TaxSettings getOrDefaultSettings(Long userId) {
        return taxSettingsRepository.findById(userId)
                .orElse(TaxSettings.builder()
                        .userId(userId)
                        .taxRate(new BigDecimal("15.00"))
                        .fyStartMonth("APR")
                        .build());
    }

    private LocalDate getFyStartDate(String fyStartMonth) {
        LocalDate today = LocalDate.now();
        if ("APR".equalsIgnoreCase(fyStartMonth)) {
            LocalDate candidate = LocalDate.of(today.getYear(), Month.APRIL, 1);
            return today.isBefore(candidate) ? candidate.minusYears(1) : candidate;
        }
        return LocalDate.of(today.getYear(), Month.JANUARY, 1);
    }

    private String buildFyLabel(String fyStartMonth, LocalDate fyStart) {
        if ("APR".equalsIgnoreCase(fyStartMonth)) {
            int y = fyStart.getYear();
            return String.format("FY %d-%d (Apr %d – Mar %d)", y, y + 1, y, y + 1);
        }
        int y = fyStart.getYear();
        return String.format("FY %d (Jan %d – Dec %d)", y, y, y);
    }

    private TaxHarvestingDto buildEmpty(BigDecimal taxRate, String fyLabel,
                                         String fyStartDate,
                                         boolean noGainsFlag, boolean noGains,
                                         boolean noLosses) {
        return TaxHarvestingDto.builder()
                .totalRealizedGains(BigDecimal.ZERO)
                .totalHarvestableLoss(BigDecimal.ZERO)
                .totalGainsOffset(BigDecimal.ZERO)
                .totalEstimatedTaxSaving(BigDecimal.ZERO)
                .taxRate(taxRate)
                .financialYear(fyLabel)
                .fyStartDate(fyStartDate)
                .opportunities(Collections.emptyList())
                .noGainsToOffset(noGains)
                .noLossesToHarvest(noLosses)
                .build();
    }
}
