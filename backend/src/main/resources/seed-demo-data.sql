-- ============================================================================
-- PortfolioPulse — Demo / Seed Data
-- ============================================================================
-- OPTIONAL. This script is NOT executed automatically by Spring Boot.
-- Run it manually if you want a realistic, fully-populated portfolio for
-- demos, screenshots, or testing the Portfolio Health & Risk Center.
--
-- Contents:
--   • 15 holdings across 4 sectors (Technology, Communication Services,
--     Consumer Cyclical, Diversified ETFs)
--   • 54 transactions spanning ~7 months (buys, sells, DCA, re-entries)
--   • 45 days of portfolio_snapshots for the Growth chart, volatility,
--     and Sharpe ratio calculations
--
-- Sector mix (by invested value):
--   Technology              53.9%  ← intentionally close to/over the 40%
--                                     concentration threshold so the
--                                     "Sector Overweight" / "Extreme Sector
--                                     Concentration" insights are visible.
--   Diversified (ETFs)       21.4%
--   Communication Services   16.1%
--   Consumer Cyclical         8.6%
--
-- Largest single position: SPY at ~12.8% (Low/Medium risk) — demonstrates
-- a portfolio that is reasonably diversified at the position level but
-- has a sector concentration warning, so both "good" and "warning"
-- insights render in the AI Insights panel.
--
-- HOW TO RUN:
--   mysql -u root -p portfoliopulse < seed-demo-data.sql
--
-- NOTE: Run this on a FRESH database (after schema.sql). If holdings,
-- transactions, or portfolio_snapshots already contain data, either
-- truncate those tables first or this script may fail on the UNIQUE
-- constraints (holdings.symbol, portfolio_snapshots.snapshot_date):
--
--   SET FOREIGN_KEY_CHECKS = 0;
--   TRUNCATE TABLE holdings;
--   TRUNCATE TABLE transactions;
--   TRUNCATE TABLE portfolio_snapshots;
--   SET FOREIGN_KEY_CHECKS = 1;
--
-- Live current prices, day-change %, and sector data continue to be
-- fetched from Yahoo Finance at runtime as usual — this seed only
-- pre-populates average buy prices, quantities, and historical snapshots.
-- ============================================================================

-- ============================================================
-- HOLDINGS (15 positions across 4 sectors)
-- ============================================================
INSERT INTO holdings (symbol, company_name, sector, quantity, average_buy_price) VALUES
('AAPL', 'Apple Inc.', 'Technology', 30.0000, 175.0000),
('MSFT', 'Microsoft Corporation', 'Technology', 18.0000, 330.0000),
('NVDA', 'NVIDIA Corporation', 'Technology', 12.0000, 450.0000),
('AMD', 'Advanced Micro Devices, Inc.', 'Technology', 25.0000, 110.0000),
('INTC', 'Intel Corporation', 'Technology', 40.0000, 35.0000),
('CRM', 'Salesforce, Inc.', 'Technology', 10.0000, 250.0000),
('ADBE', 'Adobe Inc.', 'Technology', 6.0000, 520.0000),
('UBER', 'Uber Technologies, Inc.', 'Technology', 35.0000, 60.0000),
('GOOGL', 'Alphabet Inc.', 'Communication Services', 20.0000, 130.0000),
('META', 'Meta Platforms, Inc.', 'Communication Services', 10.0000, 300.0000),
('NFLX', 'Netflix, Inc.', 'Communication Services', 6.0000, 480.0000),
('AMZN', 'Amazon.com, Inc.', 'Consumer Cyclical', 20.0000, 140.0000),
('TSLA', 'Tesla, Inc.', 'Consumer Cyclical', 8.0000, 220.0000),
('SPY', 'SPDR S&P 500 ETF Trust', 'Diversified', 15.0000, 450.0000),
('QQQ', 'Invesco QQQ Trust', 'Diversified', 12.0000, 380.0000);

-- ============================================================
-- TRANSACTIONS (50+ records spanning ~7 months)
-- ============================================================
INSERT INTO transactions (symbol, company_name, transaction_type, quantity, price, transaction_date, notes) VALUES
-- Generated 54 transactions
('INTC', 'Intel Corporation', 'BUY', 9.0000, 30.9300, '2025-11-23', 'Initial position build'),
('NVDA', 'NVIDIA Corporation', 'BUY', 4.0000, 467.7100, '2025-11-26', 'Initial position build'),
('AMD', 'Advanced Micro Devices, Inc.', 'BUY', 9.0000, 101.7500, '2025-12-01', 'Initial position build'),
('GOOGL', 'Alphabet Inc.', 'BUY', 6.0000, 118.2100, '2025-12-03', 'Initial position build'),
('UBER', 'Uber Technologies, Inc.', 'BUY', 9.0000, 60.8700, '2025-12-05', 'Initial position build'),
('CRM', 'Salesforce, Inc.', 'BUY', 3.0000, 264.6800, '2025-12-10', 'Initial position build'),
('NVDA', 'NVIDIA Corporation', 'BUY', 8.0000, 433.4700, '2025-12-13', 'Initial position build'),
('UBER', 'Uber Technologies, Inc.', 'BUY', 7.0000, 53.7700, '2025-12-14', 'Initial position build'),
('NFLX', 'Netflix, Inc.', 'BUY', 2.0000, 442.3300, '2025-12-15', 'Initial position build'),
('GOOGL', 'Alphabet Inc.', 'BUY', 4.0000, 121.8800, '2025-12-16', 'Initial position build'),
('ADBE', 'Adobe Inc.', 'BUY', 2.0000, 559.1100, '2025-12-17', 'Initial position build'),
('AMZN', 'Amazon.com, Inc.', 'BUY', 8.0000, 127.2900, '2025-12-30', 'Initial position build'),
('GOOGL', 'Alphabet Inc.', 'BUY', 10.0000, 137.4700, '2026-01-06', 'Initial position build'),
('SPY', 'SPDR S&P 500 ETF Trust', 'BUY', 5.0000, 487.0800, '2026-01-07', 'Initial position build'),
('INTC', 'Intel Corporation', 'BUY', 13.0000, 38.4700, '2026-01-11', 'Initial position build'),
('SPY', 'SPDR S&P 500 ETF Trust', 'BUY', 3.0000, 383.8900, '2026-01-13', 'Initial position build'),
('SPY', 'SPDR S&P 500 ETF Trust', 'BUY', 2.0000, 470.0700, '2026-01-29', 'Initial position build'),
('INTC', 'Intel Corporation', 'BUY', 6.0000, 30.4900, '2026-01-31', 'Initial position build'),
('NFLX', 'Netflix, Inc.', 'BUY', 1.0000, 439.9600, '2026-01-31', 'Initial position build'),
('ADBE', 'Adobe Inc.', 'BUY', 4.0000, 464.8400, '2026-02-01', 'Initial position build'),
('QQQ', 'Invesco QQQ Trust', 'BUY', 5.0000, 369.5500, '2026-02-06', 'Initial position build'),
('AMD', 'Advanced Micro Devices, Inc.', 'BUY', 6.0000, 99.8900, '2026-02-09', 'Initial position build'),
('AMZN', 'Amazon.com, Inc.', 'BUY', 4.0000, 156.7100, '2026-02-15', 'Initial position build'),
('AMZN', 'Amazon.com, Inc.', 'BUY', 8.0000, 138.2600, '2026-02-25', 'Initial position build'),
('AMD', 'Advanced Micro Devices, Inc.', 'BUY', 2.0000, 116.1800, '2026-03-02', 'Initial position build'),
('META', 'Meta Platforms, Inc.', 'BUY', 3.0000, 287.4900, '2026-03-09', 'Initial position build'),
('AMD', 'Advanced Micro Devices, Inc.', 'SELL', 5.0000, 130.0000, '2026-03-09', 'Partial profit booking'),
('QQQ', 'Invesco QQQ Trust', 'BUY', 2.0000, 420.8600, '2026-03-14', 'Initial position build'),
('AAPL', 'Apple Inc.', 'BUY', 6.0000, 159.3000, '2026-03-19', 'Initial position build'),
('TSLA', 'Tesla, Inc.', 'SELL', 2.0000, 255.0000, '2026-03-24', 'Trimmed position'),
('SPY', 'SPDR S&P 500 ETF Trust', 'BUY', 5.0000, 465.3300, '2026-03-25', 'Initial position build'),
('AAPL', 'Apple Inc.', 'BUY', 24.0000, 183.5500, '2026-03-27', 'Initial position build'),
('CRM', 'Salesforce, Inc.', 'BUY', 3.0000, 279.0000, '2026-03-31', 'Initial position build'),
('UBER', 'Uber Technologies, Inc.', 'SELL', 8.0000, 72.0000, '2026-04-03', 'Partial profit booking'),
('AMD', 'Advanced Micro Devices, Inc.', 'BUY', 5.0000, 118.0000, '2026-04-13', 'Re-entry on dip'),
('AMD', 'Advanced Micro Devices, Inc.', 'BUY', 8.0000, 96.5400, '2026-04-18', 'Initial position build'),
('QQQ', 'Invesco QQQ Trust', 'BUY', 5.0000, 412.8600, '2026-04-18', 'Initial position build'),
('TSLA', 'Tesla, Inc.', 'BUY', 3.0000, 224.2700, '2026-04-19', 'Initial position build'),
('NFLX', 'Netflix, Inc.', 'BUY', 3.0000, 480.7500, '2026-04-22', 'Initial position build'),
('NVDA', 'NVIDIA Corporation', 'SELL', 2.0000, 480.0000, '2026-04-23', 'Rebalancing'),
('TSLA', 'Tesla, Inc.', 'BUY', 5.0000, 234.0500, '2026-04-30', 'Initial position build'),
('TSLA', 'Tesla, Inc.', 'BUY', 2.0000, 205.0000, '2026-05-03', 'Bought the dip'),
('UBER', 'Uber Technologies, Inc.', 'BUY', 19.0000, 62.8100, '2026-05-10', 'Initial position build'),
('UBER', 'Uber Technologies, Inc.', 'BUY', 8.0000, 58.0000, '2026-05-13', 'Re-entry'),
('INTC', 'Intel Corporation', 'BUY', 12.0000, 32.5200, '2026-05-17', 'Initial position build'),
('CRM', 'Salesforce, Inc.', 'BUY', 4.0000, 270.2300, '2026-05-17', 'Initial position build'),
('MSFT', 'Microsoft Corporation', 'BUY', 6.0000, 288.8500, '2026-05-20', 'Initial position build'),
('META', 'Meta Platforms, Inc.', 'BUY', 7.0000, 260.3600, '2026-05-20', 'Initial position build'),
('MSFT', 'Microsoft Corporation', 'BUY', 12.0000, 301.2300, '2026-05-21', 'Initial position build'),
('NVDA', 'NVIDIA Corporation', 'BUY', 2.0000, 455.0000, '2026-05-23', 'Rebalancing top-up'),
('AAPL', 'Apple Inc.', 'BUY', 3.0000, 185.0000, '2026-05-31', 'Monthly DCA'),
('QQQ', 'Invesco QQQ Trust', 'BUY', 3.0000, 395.0000, '2026-06-02', 'Monthly DCA'),
('MSFT', 'Microsoft Corporation', 'BUY', 2.0000, 340.0000, '2026-06-04', 'Monthly DCA'),
('SPY', 'SPDR S&P 500 ETF Trust', 'BUY', 2.0000, 470.0000, '2026-06-07', 'Monthly DCA');

-- ============================================================
-- PORTFOLIO SNAPSHOTS (45 days of growth history)
-- ============================================================
INSERT INTO portfolio_snapshots (portfolio_value, total_investment, profit_loss, profit_percentage, snapshot_date) VALUES
(47822.1731, 42248.0000, 5574.1731, 13.1939, '2026-04-29'),
(48340.3043, 42488.0455, 5852.2589, 13.7739, '2026-04-30'),
(48129.2880, 42728.0909, 5401.1970, 12.6409, '2026-05-01'),
(49302.6721, 42968.1364, 6334.5357, 14.7424, '2026-05-02'),
(49459.7732, 43208.1818, 6251.5914, 14.4685, '2026-05-03'),
(48913.7184, 43448.2273, 5465.4911, 12.5793, '2026-05-04'),
(49576.3354, 43688.2727, 5888.0626, 13.4774, '2026-05-05'),
(49747.3887, 43928.3182, 5819.0705, 13.2467, '2026-05-06'),
(49345.8186, 44168.3636, 5177.4550, 11.7221, '2026-05-07'),
(50376.3963, 44408.4091, 5967.9872, 13.4389, '2026-05-08'),
(50286.0631, 44648.4545, 5637.6086, 12.6267, '2026-05-09'),
(50821.9995, 44888.5000, 5933.4995, 13.2183, '2026-05-10'),
(50694.8944, 45128.5455, 5566.3490, 12.3344, '2026-05-11'),
(50178.9499, 45368.5909, 4810.3590, 10.6028, '2026-05-12'),
(50832.0273, 45608.6364, 5223.3910, 11.4526, '2026-05-13'),
(50620.1329, 45848.6818, 4771.4511, 10.4070, '2026-05-14'),
(52090.5715, 46088.7273, 6001.8442, 13.0224, '2026-05-15'),
(52233.1371, 46328.7727, 5904.3644, 12.7445, '2026-05-16'),
(52379.7787, 46568.8182, 5810.9605, 12.4782, '2026-05-17'),
(51855.4286, 46808.8636, 5046.5649, 10.7812, '2026-05-18'),
(51712.5310, 47048.9091, 4663.6219, 9.9123, '2026-05-19'),
(53082.1385, 47288.9545, 5793.1839, 12.2506, '2026-05-20'),
(53392.6905, 47529.0000, 5863.6905, 12.3371, '2026-05-21'),
(52375.6697, 47769.0455, 4606.6242, 9.6435, '2026-05-22'),
(53157.6169, 48009.0909, 5148.5260, 10.7241, '2026-05-23'),
(52768.0160, 48249.1364, 4518.8797, 9.3657, '2026-05-24'),
(53974.9787, 48489.1818, 5485.7969, 11.3134, '2026-05-25'),
(54194.4017, 48729.2273, 5465.1744, 11.2154, '2026-05-26'),
(53477.9356, 48969.2727, 4508.6629, 9.2071, '2026-05-27'),
(54193.3386, 49209.3182, 4984.0204, 10.1282, '2026-05-28'),
(54512.9261, 49449.3636, 5063.5624, 10.2399, '2026-05-29'),
(54304.0328, 49689.4091, 4614.6237, 9.2869, '2026-05-30'),
(55411.3747, 49929.4545, 5481.9202, 10.9793, '2026-05-31'),
(54956.7790, 50169.5000, 4787.2790, 9.5422, '2026-06-01'),
(54851.7260, 50409.5455, 4442.1806, 8.8122, '2026-06-02'),
(55550.3929, 50649.5909, 4900.8020, 9.6759, '2026-06-03'),
(56047.2472, 50889.6364, 5157.6108, 10.1349, '2026-06-04'),
(55461.8381, 51129.6818, 4332.1563, 8.4729, '2026-06-05'),
(55837.7880, 51369.7273, 4468.0608, 8.6978, '2026-06-06'),
(57085.0142, 51609.7727, 5475.2414, 10.6089, '2026-06-07'),
(56771.8508, 51849.8182, 4922.0326, 9.4929, '2026-06-08'),
(56659.0235, 52089.8636, 4569.1598, 8.7717, '2026-06-09'),
(56991.0803, 52329.9091, 4661.1712, 8.9073, '2026-06-10'),
(56590.2601, 52569.9545, 4020.3056, 7.6475, '2026-06-11'),
(56958.8861, 52810.0000, 4148.8861, 7.8563, '2026-06-12');
