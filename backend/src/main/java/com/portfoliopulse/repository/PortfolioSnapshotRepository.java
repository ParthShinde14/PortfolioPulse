package com.portfoliopulse.repository;

import com.portfoliopulse.entity.PortfolioSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioSnapshotRepository extends JpaRepository<PortfolioSnapshot, Long> {

    Optional<PortfolioSnapshot> findBySnapshotDate(LocalDate snapshotDate);

    List<PortfolioSnapshot> findBySnapshotDateBetweenOrderBySnapshotDateAsc(
            LocalDate startDate, LocalDate endDate);

    List<PortfolioSnapshot> findTop30ByOrderBySnapshotDateDesc();

    List<PortfolioSnapshot> findAllByOrderBySnapshotDateAsc();
}
