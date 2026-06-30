package com.portfoliopulse.repository;

import com.portfoliopulse.entity.TaxSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaxSettingsRepository extends JpaRepository<TaxSettings, Long> {
}
