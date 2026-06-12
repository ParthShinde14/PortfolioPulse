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

export interface TransactionRequest {
  symbol: string;
  quantity: number;
  price: number;
  transactionDate: string;
  notes?: string;
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
