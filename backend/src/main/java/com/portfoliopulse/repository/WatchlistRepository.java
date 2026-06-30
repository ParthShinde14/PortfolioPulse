package com.portfoliopulse.repository;

import com.portfoliopulse.entity.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {

    List<Watchlist> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByUserIdAndSymbol(Long userId, String symbol);

    Optional<Watchlist> findByIdAndUserId(Long id, Long userId);
}
