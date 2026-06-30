package com.portfoliopulse.repository;

import com.portfoliopulse.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HoldingRepository extends JpaRepository<Holding, Long> {

    List<Holding> findByUserId(Long userId);

    Optional<Holding> findByUserIdAndSymbol(Long userId, String symbol);

    boolean existsByUserIdAndSymbol(Long userId, String symbol);

    @Query("SELECT h FROM Holding h WHERE h.userId = :userId " +
           "AND (LOWER(h.symbol) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "  OR LOWER(h.companyName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Holding> searchByUserId(@Param("userId") Long userId, @Param("query") String query);

    @Query("SELECT DISTINCT h.sector FROM Holding h WHERE h.userId = :userId AND h.sector IS NOT NULL")
    List<String> findDistinctSectorsByUserId(@Param("userId") Long userId);

    /** Used by the sector backfill job to find all holdings that have no sector data. */
    @Query("SELECT h FROM Holding h WHERE h.sector IS NULL OR h.sector = ''")
    List<Holding> findAllWithNullSector();
}
