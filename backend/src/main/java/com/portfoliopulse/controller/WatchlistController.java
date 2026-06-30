package com.portfoliopulse.controller;

import com.portfoliopulse.dto.WatchlistDto;
import com.portfoliopulse.dto.WatchlistRequestDto;
import com.portfoliopulse.service.WatchlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    @GetMapping
    public ResponseEntity<List<WatchlistDto>> getWatchlist() {
        return ResponseEntity.ok(watchlistService.getWatchlist());
    }

    @PostMapping
    public ResponseEntity<WatchlistDto> addToWatchlist(@Valid @RequestBody WatchlistRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(watchlistService.addToWatchlist(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable Long id) {
        watchlistService.removeFromWatchlist(id);
        return ResponseEntity.noContent().build();
    }
}
