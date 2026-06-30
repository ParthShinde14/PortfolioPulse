package com.portfoliopulse.repository;

import com.portfoliopulse.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserIdAndSymbolOrderByTransactionDateDesc(Long userId, String symbol);

    List<Transaction> findByUserIdOrderByTransactionDateDesc(Long userId);

    List<Transaction> findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
            Long userId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "ORDER BY t.transactionDate DESC, t.createdAt DESC")
    List<Transaction> findAllSortedByDate(@Param("userId") Long userId);

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId AND t.transactionType = 'BUY' " +
           "ORDER BY t.symbol ASC, t.transactionDate ASC")
    List<Transaction> findAllBuysOrderedBySymbolAndDate(@Param("userId") Long userId);

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId AND t.transactionType = 'SELL' " +
           "ORDER BY t.transactionDate ASC")
    List<Transaction> findAllSellsOrderedByDate(@Param("userId") Long userId);

    /**
     * All SELL transactions from the start of the current financial year.
     * Used by TaxHarvestingService to calculate realized gains this FY.
     */
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId " +
           "AND t.transactionType = 'SELL' " +
           "AND t.transactionDate >= :fyStart " +
           "ORDER BY t.transactionDate ASC")
    List<Transaction> findSellsFromFYStart(
            @Param("userId") Long userId,
            @Param("fyStart") LocalDate fyStart);
}
