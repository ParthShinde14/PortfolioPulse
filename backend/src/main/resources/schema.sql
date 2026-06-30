-- PortfolioPulse Database Schema
CREATE DATABASE IF NOT EXISTS portfoliopulse;
USE portfoliopulse;

-- ============================================================================
-- Users: JWT-authenticated accounts. All portfolio data below is scoped
-- to a user_id so each user only sees their own holdings/transactions/etc.
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
);

-- Holdings table: current stock positions (per user)
CREATE TABLE IF NOT EXISTS holdings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
    average_buy_price DECIMAL(15,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_holdings_user_symbol (user_id, symbol),
    INDEX idx_holdings_user (user_id),
    INDEX idx_holdings_symbol (symbol),
    CONSTRAINT fk_holdings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions table: all buy/sell history (per user)
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    company_name VARCHAR(255),
    transaction_type ENUM('BUY', 'SELL') NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    price DECIMAL(15,4) NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transactions_user (user_id),
    INDEX idx_symbol (symbol),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_transaction_type (transaction_type),
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Portfolio snapshots: daily portfolio value history (per user)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    portfolio_value DECIMAL(20,4) NOT NULL,
    total_investment DECIMAL(20,4) NOT NULL,
    profit_loss DECIMAL(20,4) NOT NULL,
    profit_percentage DECIMAL(10,4),
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_snapshot_user_date (user_id, snapshot_date),
    INDEX idx_snapshots_user (user_id),
    INDEX idx_snapshot_date (snapshot_date),
    CONSTRAINT fk_snapshots_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- Stock Catalog: global, shared across all users. Powers the searchable
-- stock selector (autocomplete by symbol or company name). Seed with
-- seed-stock-catalog.sql (S&P 500 / Nasdaq 100 / Nifty 50 leaders).
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_catalog (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(150),
    exchange VARCHAR(50),
    market_cap DECIMAL(24,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_catalog_symbol (symbol),
    INDEX idx_catalog_company_name (company_name)
);

-- ============================================================================
-- Watchlist: stocks a user wants to track without owning (per user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS watchlist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    company_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_watchlist_user_symbol (user_id, symbol),
    INDEX idx_watchlist_user (user_id),
    CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
