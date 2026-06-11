package com.portfoliopulse.repository;

import com.portfoliopulse.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findBySymbolOrderByTransactionDateDesc(String symbol);

    List<Transaction> findAllByOrderByTransactionDateDesc();

    List<Transaction> findByTransactionDateBetweenOrderByTransactionDateDesc(
            LocalDate startDate, LocalDate endDate);

    @Query("SELECT t FROM Transaction t ORDER BY t.transactionDate DESC, t.createdAt DESC")
    List<Transaction> findAllSortedByDate();
}
