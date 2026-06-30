// ─── Domain types ────────────────────────────────────────────────────────────

export interface StockInfo {
  symbol: string;
  companyName: string;
  sector: string | null;
  industry: string | null;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  marketCap: number | null;
  peRatio: number | null;
  volume: number | null;
  currency: string | null;
  exchange: string | null;
}

export interface Holding {
  id: number;
  symbol: string;
  companyName: string;
  sector: string | null;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  updatedAt: string;
}

export type TransactionType = 'BUY' | 'SELL';

export interface Transaction {
  id: number;
  symbol: string;
  companyName: string | null;
  transactionType: TransactionType;
  quantity: number;
  price: number;
  totalValue: number;
  transactionDate: string;
  notes: string | null;
  createdAt: string;
}

export interface AllocationItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PortfolioSnapshot {
  id: number;
  portfolioValue: number;
  totalInvestment: number;
  profitLoss: number;
  profitPercentage: number;
  snapshotDate: string;
}

export interface Dashboard {
  totalInvestment: number;
  currentPortfolioValue: number;
  totalProfitLoss: number;
  profitLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  totalStocks: number;
  topHoldings: Holding[];
  portfolioGrowth: PortfolioSnapshot[];
  assetAllocation: AllocationItem[];
  sectorAllocation: AllocationItem[];
}

export interface Analytics {
  totalInvestment: number;
  currentPortfolioValue: number;
  totalProfitLoss: number;
  profitLossPercent: number;
  topPerformer: Holding | null;
  worstPerformer: Holding | null;
  assetAllocation: AllocationItem[];
  sectorAllocation: AllocationItem[];
  portfolioGrowth: PortfolioSnapshot[];
  bestDayGain: number | null;
  worstDayLoss: number | null;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}

// ─── Request types ────────────────────────────────────────────────────────────

export type TransactionMode = 'LIVE' | 'MANUAL';

export interface TransactionRequest {
  symbol: string;
  quantity: number;
  price: number;
  transactionDate: string;
  notes?: string;
  transactionMode: TransactionMode;
}

// ─── Market hours ─────────────────────────────────────────────────────────────

export interface MarketStatus {
  symbol: string;
  exchange: string;
  open: boolean;
  hoursLabel: string;
  timezone: string;
  currentLocalTime: string;
}

// ─── Portfolio Health & Risk Center ──────────────────────────────────────────

export type InsightType = 'WARNING' | 'INFO' | 'SUCCESS' | 'TIP';

export interface Insight {
  type: InsightType;
  category: string;
  title: string;
  message: string;
}

export interface SectorExposure {
  sector: string;
  value: number;
  percentage: number;
  warning: boolean;
  color: string;
}

export interface RiskMetrics {
  diversificationScore: number;
  diversificationRating: string;

  largestPositionSymbol: string;
  largestPositionPercent: number;
  largestPositionRisk: string;

  dominantSector: string;
  dominantSectorPercent: number;
  sectorConcentrationWarning: boolean;
  sectorExposures: SectorExposure[];

  volatilityPercent: number;
  volatilityRating: string;

  sharpeRatio: number;
  sharpeRating: string;

  healthScore: number;
  healthRating: string;
  healthExplanation: string;

  insights: Insight[];
}

// ─── Smart stock search ──────────────────────────────────────────────────────

export interface StockSuggestion {
  symbol: string;
  companyName: string;
  sector: string | null;
  exchange: string | null;
  type: string; // Stock / ETF
}

// ─── Authentication ───────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── Stock Catalog ────────────────────────────────────────────────────────────

export interface StockCatalogItem {
  symbol: string;
  companyName: string;
  sector: string | null;
  industry: string | null;
  exchange: string | null;
  marketCap: number | null;
}

export interface StockSelection {
  symbol: string;
  companyName: string;
  sector: string | null;
  industry: string | null;
  exchange: string | null;
  marketCap: number | null;
  currentPrice: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
}

// ─── Watchlist ─────────────────────────────────────────────────────────────────

export interface WatchlistItem {
  id: number;
  symbol: string;
  companyName: string;
  sector: string | null;
  currentPrice: number | null;
  change: number | null;
  changePercent: number | null;
  addedAt: string;
}

export interface WatchlistRequest {
  symbol: string;
  companyName?: string;
}

// ─── Benchmark Comparison ───────────────────────────────────────────────────────

export type BenchmarkKey = 'SP500' | 'NASDAQ' | 'NIFTY50';

export interface BenchmarkOption {
  key: string;
  name: string;
  symbol: string;
}

export interface BenchmarkPoint {
  date: string;
  portfolioIndexed: number;
  benchmarkIndexed: number;
}

export interface Benchmark {
  benchmarkName: string;
  benchmarkSymbol: string;
  portfolioReturn: number;
  benchmarkReturn: number;
  outperformance: number;
  trackingDifference: number;
  growthSeries: BenchmarkPoint[];
  availableBenchmarks: BenchmarkOption[];
}

// ─── Trade Performance Analytics ────────────────────────────────────────────────

export type TradeOutcome = 'WIN' | 'LOSS' | 'BREAKEVEN';

export interface TradeRecord {
  symbol: string;
  companyName: string | null;
  date: string;
  quantity: number;
  sellPrice: number;
  avgBuyPrice: number;
  realizedPnl: number;
  realizedPnlPercent: number;
  outcome: TradeOutcome;
}

export interface TradeStat {
  symbol: string;
  companyName: string | null;
  totalRealizedPnl: number;
  tradeCount: number;
}

export interface TradeAnalytics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageGain: number;
  averageLoss: number;
  bestTrade: TradeRecord | null;
  worstTrade: TradeRecord | null;
  profitFactor: number | null;
  topProfitableStocks: TradeStat[];
  topLosingStocks: TradeStat[];
  trades: TradeRecord[];
}

// ─── Tax Loss Harvesting ─────────────────────────────────────────────────────

export interface TaxSettings {
  taxRate: number;       // e.g. 15 = 15%
  fyStartMonth: string;  // 'APR' | 'JAN'
}

export type SubstituteQuality = 'EXCELLENT' | 'GOOD' | 'FAIR';

export interface HarvestingOpportunity {
  // Stock to sell
  sellSymbol: string;
  sellCompanyName: string;
  sellSector: string;
  sellAvgBuyPrice: number;
  sellCurrentPrice: number;
  sellQuantity: number;
  unrealizedLoss: number;   // positive magnitude, e.g. 18000

  // Replacement stock to buy
  substituteSymbol: string | null;
  substituteCompanyName: string | null;
  substituteSector: string;
  substituteMarketCap: number | null;
  marketCapDiffPercent: number;

  // Tax impact
  gainsOffset: number;
  estimatedTaxSaving: number;
  taxRateUsed: number;
  substituteQuality: SubstituteQuality;
}

export interface TaxHarvesting {
  totalRealizedGains: number;
  totalHarvestableLoss: number;
  totalGainsOffset: number;
  totalEstimatedTaxSaving: number;
  taxRate: number;
  financialYear: string;
  fyStartDate: string;
  opportunities: HarvestingOpportunity[];
  noGainsToOffset: boolean;
  noLossesToHarvest: boolean;
}
