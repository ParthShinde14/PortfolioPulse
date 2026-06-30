import axios, { AxiosError } from 'axios';
import type {
  Dashboard, Analytics, Holding, Transaction,
  StockInfo, TransactionRequest, ApiError,
  RiskMetrics, StockSuggestion,
  AuthResponse, RegisterRequest, LoginRequest, User,
  StockCatalogItem, StockSelection,
  WatchlistItem, WatchlistRequest,
  Benchmark, BenchmarkKey,
  TradeAnalytics,
  MarketStatus,
  TaxHarvesting,
  TaxSettings,
} from '../types';

export const TOKEN_STORAGE_KEY = 'portfoliopulse_token';

export const getStoredToken = () => sessionStorage.getItem(TOKEN_STORAGE_KEY);
export const setStoredToken = (token: string) => sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
export const clearStoredToken = () => sessionStorage.removeItem(TOKEN_STORAGE_KEY);

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: error normalisation + auto-logout on 401 ──────────
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      clearStoredToken();
     
      window.dispatchEvent(new CustomEvent('portfoliopulse:unauthorized'));
    }

    const msg =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(msg));
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const register = (data: RegisterRequest) =>
  api.post<AuthResponse>('/auth/register', data).then((r) => r.data);

export const login = (data: LoginRequest) =>
  api.post<AuthResponse>('/auth/login', data).then((r) => r.data);

export const getCurrentUser = () =>
  api.get<User>('/auth/me').then((r) => r.data);

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboard = () =>
  api.get<Dashboard>('/dashboard').then((r) => r.data);

// ─── Holdings ─────────────────────────────────────────────────────────────────
export const getHoldings = (search?: string) =>
  api.get<Holding[]>('/holdings', { params: search ? { search } : {} }).then((r) => r.data);

export const buyStock = (data: TransactionRequest) =>
  api.post<Holding>('/holdings/buy', data).then((r) => r.data);

export const sellStock = (data: TransactionRequest) =>
  api.post<Holding>('/holdings/sell', data).then((r) => r.data);

// ─── Transactions ─────────────────────────────────────────────────────────────
export const getTransactions = (symbol?: string) =>
  api.get<Transaction[]>('/transactions', { params: symbol ? { symbol } : {} }).then((r) => r.data);

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getAnalytics = () =>
  api.get<Analytics>('/analytics').then((r) => r.data);

// ─── Stock lookup ─────────────────────────────────────────────────────────────
export const getStockInfo = (symbol: string) =>
  api.get<StockInfo>(`/stocks/${symbol}`).then((r) => r.data);

// ─── Portfolio Health & Risk Center ──────────────────────────────────────────
export const getRiskMetrics = () =>
  api.get<RiskMetrics>('/analytics/risk').then((r) => r.data);

// ─── Smart stock search (legacy autocomplete catalog) ────────────────────────
export const searchStocks = (query: string, limit = 8) =>
  api.get<StockSuggestion[]>('/stocks/search', { params: { q: query, limit } }).then((r) => r.data);

// ─── Stock Catalog (200+ S&P 500 / Nasdaq 100 / Nifty 50) ─────────────────────
export const getStockCatalog = () =>
  api.get<StockCatalogItem[]>('/stocks/catalog').then((r) => r.data);

export const searchCatalog = (query: string, limit = 10) =>
  api.get<StockCatalogItem[]>('/stocks/catalog/search', { params: { q: query, limit } }).then((r) => r.data);

export const getStockSelection = (symbol: string) =>
  api.get<StockSelection>(`/stocks/catalog/${symbol}`).then((r) => r.data);

// ─── Watchlist ─────────────────────────────────────────────────────────────────
export const getWatchlist = () =>
  api.get<WatchlistItem[]>('/watchlist').then((r) => r.data);

export const addToWatchlist = (data: WatchlistRequest) =>
  api.post<WatchlistItem>('/watchlist', data).then((r) => r.data);

export const removeFromWatchlist = (id: number) =>
  api.delete<void>(`/watchlist/${id}`).then((r) => r.data);

// ─── Benchmark Comparison ───────────────────────────────────────────────────────
export const getBenchmark = (benchmark: BenchmarkKey = 'SP500') =>
  api.get<Benchmark>('/analytics/benchmark', { params: { benchmark } }).then((r) => r.data);

// ─── Market hours ─────────────────────────────────────────────────────────────
export const getMarketStatus = (symbol: string) =>
  api.get<MarketStatus>('/market/status', { params: { symbol } }).then((r) => r.data);

// ─── Trade Performance Analytics ────────────────────────────────────────────────
export const getTradeAnalytics = () =>
  api.get<TradeAnalytics>('/analytics/trades').then((r) => r.data);

// ─── Tax Loss Harvesting ─────────────────────────────────────────────────────
export const getTaxOpportunities = () =>
  api.get<TaxHarvesting>('/tax/opportunities').then((r) => r.data);

export const getTaxSettings = () =>
  api.get<TaxSettings>('/tax/settings').then((r) => r.data);

export const saveTaxSettings = (data: TaxSettings) =>
  api.post<TaxSettings>('/tax/settings', data).then((r) => r.data);

export default api;
