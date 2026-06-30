package com.portfoliopulse.repository;

import com.portfoliopulse.entity.StockCatalog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockCatalogRepository extends JpaRepository<StockCatalog, Long> {

    Optional<StockCatalog> findBySymbolIgnoreCase(String symbol);

    List<StockCatalog> findByIsActiveTrue();

    @Query("SELECT s FROM StockCatalog s WHERE s.isActive = true AND (" +
           "  LOWER(s.symbol) LIKE LOWER(CONCAT(:query, '%')) " +
           "  OR LOWER(s.companyName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "  OR LOWER(s.symbol) LIKE LOWER(CONCAT('%', :query, '%')) " +
           ") ORDER BY " +
           "  CASE WHEN LOWER(s.symbol) LIKE LOWER(CONCAT(:query, '%')) THEN 0 ELSE 1 END, " +
           "  s.symbol ASC")
    List<StockCatalog> search(@Param("query") String query, Pageable pageable);

    long countByIsActiveTrue();

    /**
     * Finds substitute stocks for tax loss harvesting:
     * same sector, closest market cap to the stock being sold,
     * not already owned by the user, not the same symbol.
     * Results ordered by market cap proximity ascending.
     */
    @Query("SELECT s FROM StockCatalog s WHERE s.isActive = true " +
           "AND s.sector = :sector " +
           "AND s.symbol <> :excludeSymbol " +
           "AND s.symbol NOT IN :ownedSymbols " +
           "AND s.marketCap IS NOT NULL " +
           "ORDER BY ABS(s.marketCap - :marketCap) ASC")
    List<StockCatalog> findSubstitutes(
            @Param("sector") String sector,
            @Param("excludeSymbol") String excludeSymbol,
            @Param("ownedSymbols") List<String> ownedSymbols,
            @Param("marketCap") BigDecimal marketCap,
            Pageable pageable);
}
