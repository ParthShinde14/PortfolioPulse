import axios, { AxiosError } from 'axios';
import type {
  Dashboard, Analytics, Holding, Transaction,
  StockInfo, TransactionRequest, ApiError,
  RiskMetrics, StockSuggestion
} from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Response interceptor for error normalisation ────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiError>) => {
    const msg =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(msg));
  }
);

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

// ─── Smart stock search (autocomplete) ───────────────────────────────────────
export const searchStocks = (query: string, limit = 8) =>
  api.get<StockSuggestion[]>('/stocks/search', { params: { q: query, limit } }).then((r) => r.data);

export default api;
