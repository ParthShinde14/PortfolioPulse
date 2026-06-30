package com.portfoliopulse.repository;

import com.portfoliopulse.entity.PortfolioSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioSnapshotRepository extends JpaRepository<PortfolioSnapshot, Long> {

    Optional<PortfolioSnapshot> findByUserIdAndSnapshotDate(Long userId, LocalDate snapshotDate);

    List<PortfolioSnapshot> findByUserIdAndSnapshotDateBetweenOrderBySnapshotDateAsc(
            Long userId, LocalDate startDate, LocalDate endDate);

    List<PortfolioSnapshot> findTop30ByUserIdOrderBySnapshotDateDesc(Long userId);

    List<PortfolioSnapshot> findByUserIdOrderBySnapshotDateAsc(Long userId);

    List<PortfolioSnapshot> findByUserId(Long userId);
}
