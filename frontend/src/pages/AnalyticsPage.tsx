import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, AlertTriangle, TrendingUp, TrendingDown, BarChart3,
  PieChart as PieIcon, Activity, Gauge, ArrowRight, Minus
} from 'lucide-react';
import {
  getAnalytics, getHoldings, getRiskMetrics,
  getTradeAnalytics, getTaxOpportunities, getTaxSettings, saveTaxSettings
} from '../api/client';
import type {
  Analytics, Holding, RiskMetrics, TradeAnalytics,
  TaxHarvesting, TaxSettings
} from '../types';
import Header from '../components/layout/Header';
import { CardSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import GrowthChart from '../components/charts/GrowthChart';
import AllocationChart from '../components/charts/AllocationChart';
import PerformanceChart from '../components/charts/PerformanceChart';
import EmptyState from '../components/ui/EmptyState';
import TradeAnalyticsSection from '../components/ui/TradeAnalyticsSection';
import TaxHarvestingSection from '../components/ui/TaxHarvestingSection';
import TradeModal from '../components/ui/TradeModal';
import { fmt, profitClass } from '../utils/format';

// ─── Risk metric card (reused from previous phase) ────────────────────────────
function RiskMetricCard({
  icon: Icon, iconColor, label, value, sub, rating, ratingColor
}: {
  icon: typeof Award; iconColor: string; label: string;
  value: string; sub: string; rating: string; ratingColor: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ratingColor}`}>
          {rating}
        </span>
      </div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 tracking-tight">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

// ─── Performer card ────────────────────────────────────────────────────────────
function PerformerCard({
  holding, type
}: {
  holding: Holding | null;
  type: 'top' | 'worst';
}) {
  if (!holding) {
    return (
      <div className="stat-card flex items-center justify-center min-h-[100px]">
        <p className="text-sm text-slate-400">No data</p>
      </div>
    );
  }
  const isPositive = holding.profitLossPercent >= 0;
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {type === 'top' ? '🏆 Top Performer' : '📉 Worst Performer'}
        </p>
        {isPositive
          ? <TrendingUp size={16} className="text-emerald-600" />
          : <TrendingDown size={16} className="text-red-600" />}
      </div>
      <p className="font-mono font-bold text-slate-800 text-lg">{holding.symbol}</p>
      <p className="text-xs text-slate-400 truncate">{holding.companyName}</p>
      <p className={`text-xl font-bold mt-2 ${profitClass(holding.profitLossPercent)}`}>
        {fmt.percent(holding.profitLossPercent)}
      </p>
      <p className="text-xs text-slate-400">{fmt.currency(holding.profitLoss)} total</p>
    </div>
  );
}

const RATING_COLOR: Record<string, string> = {
  Excellent:   'text-emerald-600 bg-emerald-50',
  Good:        'text-blue-600 bg-blue-50',
  Moderate:    'text-amber-600 bg-amber-50',
  Average:     'text-amber-600 bg-amber-50',
  Fair:        'text-amber-600 bg-amber-50',
  Poor:        'text-red-600 bg-red-50',
  Low:         'text-emerald-600 bg-emerald-50',
  Medium:      'text-amber-600 bg-amber-50',
  High:        'text-red-600 bg-red-50',
  'Very High': 'text-red-700 bg-red-100',
  'N/A':       'text-slate-400 bg-surface-100',
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  // Core analytics
  const [data, setData]         = useState<Analytics | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [risk, setRisk]         = useState<RiskMetrics | null>(null);
  const [trades, setTrades]     = useState<TradeAnalytics | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Tax harvesting
  const [taxData, setTaxData]         = useState<TaxHarvesting | null>(null);
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null);
  const [taxLoading, setTaxLoading]   = useState(true);

  // Trade modal (for quick Sell/Buy from tax cards)
  const [tradeModal, setTradeModal] = useState<{
    mode: 'buy' | 'sell'; symbol: string;
  } | null>(null);

  // ── Loaders ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [a, h, r, t] = await Promise.all([
        getAnalytics(), getHoldings(), getRiskMetrics(), getTradeAnalytics(),
      ]);
      setData(a);
      setHoldings(h);
      setRisk(r);
      setTrades(t);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTax = useCallback(async () => {
    setTaxLoading(true);
    try {
      const [td, ts] = await Promise.all([
        getTaxOpportunities(),
        getTaxSettings(),
      ]);
      setTaxData(td);
      setTaxSettings(ts);
    } catch {
      // non-critical — silently fail
    } finally {
      setTaxLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadTax();
  }, [load, loadTax]);

  // ── Tax settings save ──────────────────────────────────────────────────────
  const handleSaveTaxSettings = useCallback(async (settings: TaxSettings) => {
    const saved = await saveTaxSettings(settings);
    setTaxSettings(saved);
    // Re-run the analysis with the new settings
    const updated = await getTaxOpportunities();
    setTaxData(updated);
  }, []);

  // ── Trade modal handlers (from tax harvesting cards) ──────────────────────
  const handleSell = useCallback((symbol: string) => {
    setTradeModal({ mode: 'sell', symbol });
  }, []);

  const handleBuy = useCallback((symbol: string) => {
    setTradeModal({ mode: 'buy', symbol });
  }, []);

  const handleTradeSuccess = useCallback(() => {
    load();
    loadTax();
  }, [load, loadTax]);

  const d = data;

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Analytics"
        subtitle="Portfolio performance, risk, and tax insights"
        onRefresh={() => { load(); loadTax(); }}
        loading={loading}
      />

      <div className="flex-1 p-6 space-y-6">

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── KPI row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <div className="stat-card">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total Invested</p>
                <p className="text-2xl font-semibold text-slate-800">{fmt.currency(d?.totalInvestment ?? 0)}</p>
              </div>
              <div className="stat-card">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Current Value</p>
                <p className="text-2xl font-semibold text-slate-800">{fmt.currency(d?.currentPortfolioValue ?? 0)}</p>
              </div>
              <div className="stat-card">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Total P&L</p>
                <p className={`text-2xl font-semibold ${profitClass(d?.totalProfitLoss ?? 0)}`}>
                  {fmt.currency(d?.totalProfitLoss ?? 0)}
                </p>
                <p className={`text-sm font-medium ${profitClass(d?.profitLossPercent ?? 0)}`}>
                  {fmt.percent(d?.profitLossPercent ?? 0)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── Performers ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <><CardSkeleton /><CardSkeleton /></>
          ) : (
            <>
              <PerformerCard holding={d?.topPerformer ?? null} type="top" />
              <PerformerCard holding={d?.worstPerformer ?? null} type="worst" />
            </>
          )}
        </div>

        {/* ── Risk & Health Overview ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-title mb-0">Risk &amp; Health Overview</p>
            <Link
              to="/health"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Full Health &amp; Risk Center <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : !risk || risk.diversificationRating === 'N/A' ? (
              <div className="xl:col-span-4 bg-white rounded-xl border border-surface-200 shadow-card">
                <EmptyState description="Add holdings to see diversification, volatility, and Sharpe ratio." />
              </div>
            ) : (
              <>
                <RiskMetricCard
                  icon={PieIcon}
                  iconColor="bg-blue-50 text-blue-600"
                  label="Diversification Score"
                  value={`${risk.diversificationScore.toFixed(0)} / 100`}
                  sub="Based on HHI"
                  rating={risk.diversificationRating}
                  ratingColor={RATING_COLOR[risk.diversificationRating] ?? RATING_COLOR['N/A']}
                />
                <RiskMetricCard
                  icon={Activity}
                  iconColor="bg-violet-50 text-violet-600"
                  label="Portfolio Volatility"
                  value={`${risk.volatilityPercent.toFixed(1)}%`}
                  sub="Annualised"
                  rating={risk.volatilityRating}
                  ratingColor={RATING_COLOR[risk.volatilityRating] ?? RATING_COLOR['N/A']}
                />
                <RiskMetricCard
                  icon={risk.sharpeRatio > 0 ? TrendingUp : risk.sharpeRatio < 0 ? TrendingDown : Minus}
                  iconColor={
                    risk.sharpeRatio >= 1 ? 'bg-emerald-50 text-emerald-600'
                    : risk.sharpeRatio >= 0 ? 'bg-amber-50 text-amber-600'
                    : 'bg-red-50 text-red-600'
                  }
                  label="Sharpe Ratio"
                  value={risk.sharpeRatio.toFixed(2)}
                  sub="Risk-adjusted return"
                  rating={risk.sharpeRating}
                  ratingColor={RATING_COLOR[risk.sharpeRating] ?? RATING_COLOR['N/A']}
                />
                <RiskMetricCard
                  icon={Gauge}
                  iconColor={risk.healthScore >= 55 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
                  label="Portfolio Health Score"
                  value={`${risk.healthScore.toFixed(0)} / 100`}
                  sub="Composite of all risk factors"
                  rating={risk.healthRating}
                  ratingColor={RATING_COLOR[risk.healthRating] ?? RATING_COLOR['N/A']}
                />
              </>
            )}
          </div>
        </div>

        {/* ── Portfolio metrics charts ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="section-title">Portfolio Growth</p>
            {loading ? (
              <ChartSkeleton height={240} />
            ) : !d?.portfolioGrowth?.length ? (
              <EmptyState description="Buy stocks to start tracking portfolio growth." />
            ) : (
              <GrowthChart data={d.portfolioGrowth} />
            )}
          </div>
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="section-title">Asset Allocation</p>
            {loading ? (
              <ChartSkeleton height={240} />
            ) : !d?.assetAllocation?.length ? (
              <EmptyState description="No holdings yet." />
            ) : (
              <AllocationChart data={d.assetAllocation} />
            )}
          </div>
        </div>

        {/* ── Sector allocation + performance ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="section-title">Sector Allocation</p>
            {loading ? (
              <ChartSkeleton height={240} />
            ) : !d?.sectorAllocation?.length ? (
              <EmptyState description="No sector data yet." />
            ) : (
              <AllocationChart data={d.sectorAllocation} />
            )}
          </div>
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="section-title">Performance by Stock</p>
            {loading ? (
              <ChartSkeleton height={240} />
            ) : !holdings.length ? (
              <EmptyState description="No holdings yet." />
            ) : (
              <PerformanceChart holdings={holdings} />
            )}
          </div>
        </div>

        {/* ── Holdings breakdown table ── */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200">
            <p className="section-title mb-0">Holdings Breakdown</p>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-surface-100 rounded animate-pulse" />
              ))}
            </div>
          ) : !holdings.length ? (
            <EmptyState description="No holdings to display." />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[640px]">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Avg Buy</th>
                    <th className="text-right">Current</th>
                    <th className="text-right">Value</th>
                    <th className="text-right">P&L</th>
                    <th className="text-right">Return</th>
                    <th>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(h => {
                    const totalValue = holdings.reduce(
                      (sum, x) => sum + (x.currentValue ?? 0), 0);
                    const weight = totalValue > 0
                      ? ((h.currentValue ?? 0) / totalValue * 100).toFixed(1)
                      : '0.0';
                    return (
                      <tr key={h.id}>
                        <td>
                          <p className="font-semibold text-slate-800 font-mono text-xs">
                            {h.symbol}
                          </p>
                          <p className="text-slate-400 text-[11px] truncate max-w-[140px]">
                            {h.companyName}
                          </p>
                        </td>
                        <td className="text-right font-mono text-xs text-slate-700">
                          {h.quantity.toFixed(2)}
                        </td>
                        <td className="text-right font-mono text-xs text-slate-600">
                          {fmt.currency(h.averageBuyPrice)}
                        </td>
                        <td className="text-right font-mono text-xs text-slate-700">
                          {fmt.currency(h.currentPrice)}
                        </td>
                        <td className="text-right font-mono text-xs text-slate-700">
                          {fmt.currency(h.currentValue)}
                        </td>
                        <td className={`text-right font-medium ${profitClass(h.profitLoss)}`}>
                          {fmt.currency(h.profitLoss)}
                        </td>
                        <td className={`text-right font-semibold ${profitClass(h.profitLossPercent)}`}>
                          {fmt.percent(h.profitLossPercent)}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-500 rounded-full"
                                style={{ width: `${Math.min(Number(weight), 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-slate-400 w-10 text-right">
                              {weight}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Trade Performance Analytics ── */}
        <div>
          <p className="section-title">Trade Performance Analytics</p>
          <TradeAnalyticsSection data={trades} loading={loading} />
        </div>

        {/* ── Tax Loss Harvesting ── */}
        <TaxHarvestingSection
          data={taxData}
          settings={taxSettings}
          loading={taxLoading}
          onSaveSettings={handleSaveTaxSettings}
          onSell={handleSell}
          onBuy={handleBuy}
        />

      </div>

      {/* Trade modal triggered from tax harvesting cards */}
      {tradeModal && (
        <TradeModal
          mode={tradeModal.mode}
          prefillSymbol={tradeModal.symbol}
          onClose={() => setTradeModal(null)}
          onSuccess={handleTradeSuccess}
        />
      )}
    </div>
  );
}
