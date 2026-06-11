package com.portfoliopulse.controller;

import com.portfoliopulse.dto.HoldingDto;
import com.portfoliopulse.dto.TransactionRequestDto;
import com.portfoliopulse.service.HoldingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/holdings")
@RequiredArgsConstructor
public class HoldingController {

    private final HoldingService holdingService;

    @GetMapping
    public ResponseEntity<List<HoldingDto>> getAllHoldings(
            @RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(holdingService.searchHoldings(search));
        }
        return ResponseEntity.ok(holdingService.getAllHoldings());
    }

    @PostMapping("/buy")
    public ResponseEntity<HoldingDto> buyStock(@Valid @RequestBody TransactionRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(holdingService.buyStock(request));
    }

    @PostMapping("/sell")
    public ResponseEntity<HoldingDto> sellStock(@Valid @RequestBody TransactionRequestDto request) {
        return ResponseEntity.ok(holdingService.sellStock(request));
    }
}
