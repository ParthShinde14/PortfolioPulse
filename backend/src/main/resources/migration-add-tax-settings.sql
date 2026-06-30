-- ============================================================================
-- Tax Loss Harvesting: user tax settings
-- Run this once against your existing database (IF NOT EXISTS is safe).
-- ============================================================================
CREATE TABLE IF NOT EXISTS tax_settings (
    user_id        BIGINT        NOT NULL PRIMARY KEY,
    tax_rate       DECIMAL(5,2)  NOT NULL DEFAULT 15.00,
    fy_start_month VARCHAR(3)    NOT NULL DEFAULT 'APR',
    CONSTRAINT fk_tax_settings_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
