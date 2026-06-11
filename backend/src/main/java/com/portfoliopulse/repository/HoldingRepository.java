package com.portfoliopulse.repository;

import com.portfoliopulse.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HoldingRepository extends JpaRepository<Holding, Long> {

    Optional<Holding> findBySymbol(String symbol);

    boolean existsBySymbol(String symbol);

    List<Holding> findBySymbolContainingIgnoreCaseOrCompanyNameContainingIgnoreCase(
            String symbol, String companyName);

    @Query("SELECT DISTINCT h.sector FROM Holding h WHERE h.sector IS NOT NULL")
    List<String> findDistinctSectors();
}
