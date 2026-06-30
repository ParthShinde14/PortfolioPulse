package com.portfoliopulse.controller;

import com.portfoliopulse.dto.TaxHarvestingDto;
import com.portfoliopulse.dto.TaxSettingsDto;
import com.portfoliopulse.service.TaxHarvestingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tax")
@RequiredArgsConstructor
public class TaxHarvestingController {

    private final TaxHarvestingService taxHarvestingService;

    /**
     * Returns the full tax loss harvesting analysis for the authenticated user:
     * realized gains this FY, harvestable losses, and ranked opportunities.
     * GET /api/tax/opportunities
     */
    @GetMapping("/opportunities")
    public ResponseEntity<TaxHarvestingDto> getOpportunities() {
        return ResponseEntity.ok(taxHarvestingService.analyze());
    }

    /** GET /api/tax/settings — returns user's tax rate and FY preference */
    @GetMapping("/settings")
    public ResponseEntity<TaxSettingsDto> getSettings() {
        return ResponseEntity.ok(taxHarvestingService.getSettings());
    }

    /** POST /api/tax/settings — saves user's tax rate and FY preference */
    @PostMapping("/settings")
    public ResponseEntity<TaxSettingsDto> saveSettings(@RequestBody TaxSettingsDto dto) {
        return ResponseEntity.ok(taxHarvestingService.saveSettings(dto));
    }
}
