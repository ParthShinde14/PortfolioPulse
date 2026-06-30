package com.portfoliopulse.service;

import com.portfoliopulse.dto.StockInfoDto;
import com.portfoliopulse.dto.WatchlistDto;
import com.portfoliopulse.dto.WatchlistRequestDto;
import com.portfoliopulse.entity.Watchlist;
import com.portfoliopulse.exception.DuplicateEntryException;
import com.portfoliopulse.exception.ResourceNotFoundException;
import com.portfoliopulse.repository.WatchlistRepository;
import com.portfoliopulse.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final YahooFinanceService yahooFinanceService;

    @Transactional(readOnly = true)
    public List<WatchlistDto> getWatchlist() {
        Long userId = SecurityUtils.getCurrentUserId();
        return watchlistRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::enrichWithQuote)
                .collect(Collectors.toList());
    }

    public WatchlistDto addToWatchlist(WatchlistRequestDto request) {
        Long userId = SecurityUtils.getCurrentUserId();
        String symbol = request.getSymbol().toUpperCase().trim();

        if (watchlistRepository.existsByUserIdAndSymbol(userId, symbol)) {
            throw new DuplicateEntryException(symbol + " is already in your watchlist.");
        }

        // Resolve company name via Yahoo Finance if not supplied
        String companyName = request.getCompanyName();
        if (companyName == null || companyName.isBlank()) {
            try {
                companyName = yahooFinanceService.getStockInfo(symbol).getCompanyName();
            } catch (Exception e) {
                log.warn("Could not resolve company name for {}: {}", symbol, e.getMessage());
                companyName = symbol;
            }
        }

        Watchlist entry = Watchlist.builder()
                .userId(userId)
                .symbol(symbol)
                .companyName(companyName)
                .build();

        Watchlist saved = watchlistRepository.save(entry);
        log.info("User {} added {} to watchlist", userId, symbol);
        return enrichWithQuote(saved);
    }

    public void removeFromWatchlist(Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        Watchlist entry = watchlistRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Watchlist entry not found"));
        watchlistRepository.delete(entry);
        log.info("User {} removed {} from watchlist", userId, entry.getSymbol());
    }

    private WatchlistDto enrichWithQuote(Watchlist entry) {
        WatchlistDto.WatchlistDtoBuilder builder = WatchlistDto.builder()
                .id(entry.getId())
                .symbol(entry.getSymbol())
                .companyName(entry.getCompanyName())
                .addedAt(entry.getCreatedAt());

        try {
            StockInfoDto quote = yahooFinanceService.getStockInfo(entry.getSymbol());
            builder.sector(quote.getSector())
                    .currentPrice(quote.getCurrentPrice())
                    .change(quote.getChange())
                    .changePercent(quote.getChangePercent());
        } catch (Exception e) {
            log.warn("Could not fetch live quote for watchlist symbol {}: {}", entry.getSymbol(), e.getMessage());
        }

        return builder.build();
    }
}
