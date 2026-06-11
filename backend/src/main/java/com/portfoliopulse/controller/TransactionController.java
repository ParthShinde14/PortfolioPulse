package com.portfoliopulse.controller;

import com.portfoliopulse.dto.TransactionDto;
import com.portfoliopulse.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<TransactionDto>> getAllTransactions(
            @RequestParam(required = false) String symbol) {
        if (symbol != null && !symbol.isBlank()) {
            return ResponseEntity.ok(transactionService.getTransactionsBySymbol(symbol));
        }
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }
}
