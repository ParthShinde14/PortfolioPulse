package com.portfoliopulse.service;

import com.portfoliopulse.dto.TransactionDto;
import com.portfoliopulse.entity.Transaction;
import com.portfoliopulse.repository.TransactionRepository;
import com.portfoliopulse.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public List<TransactionDto> getAllTransactions() {
        Long userId = SecurityUtils.getCurrentUserId();
        return transactionRepository.findAllSortedByDate(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<TransactionDto> getTransactionsBySymbol(String symbol) {
        Long userId = SecurityUtils.getCurrentUserId();
        return transactionRepository.findByUserIdAndSymbolOrderByTransactionDateDesc(userId, symbol.toUpperCase()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private TransactionDto toDto(Transaction transaction) {
        BigDecimal totalValue = transaction.getQuantity()
                .multiply(transaction.getPrice())
                .setScale(2, RoundingMode.HALF_UP);

        return TransactionDto.builder()
                .id(transaction.getId())
                .symbol(transaction.getSymbol())
                .companyName(transaction.getCompanyName())
                .transactionType(transaction.getTransactionType())
                .quantity(transaction.getQuantity())
                .price(transaction.getPrice())
                .totalValue(totalValue)
                .transactionDate(transaction.getTransactionDate())
                .notes(transaction.getNotes())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
