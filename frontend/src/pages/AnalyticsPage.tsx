import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, AlertTriangle, TrendingUp, TrendingDown, BarChart3,
  PieChart as PieIcon, Activity, Gauge, ArrowRight, Minus
} from 'lucide-react';
import { getAnalytics, getHoldings, getRiskMetrics } from '../api/client';
import type { Analytics, Holding, RiskMetrics } from '../types';
import Header from '../components/layout/Header';
import { CardSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import GrowthChart from '../components/charts/GrowthChart';
import AllocationChart from '../components/charts/AllocationChart';
import PerformanceChart from '../components/charts/PerformanceChart';
import EmptyState from '../components/ui/EmptyState';
import { fmt, profitClass } from '../utils/format';

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-slate-800">{value}</span>
        {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function PerformerCard({
  holding, type
}: { holding: Holding | null; type: 'top' | 'worst' }) {
  if (!holding) return (
    <div className="stat-card flex items-center justify-center h-28 text-slate-400 text-sm">No data</div>
  );
  const isTop = type === 'top';
  return (
    <div className={`stat-card border ${isTop ? 'border-emerald-100' : 'border-red-100'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
          isTop ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {isTop ? <Award size={12} /> : <AlertTriangle size={12} />}
          {isTop ? 'Best Performer' : 'Worst Performer'}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800 font-mono text-sm">{holding.symbol}</p>
          <p className="text-xs text-slate-400 truncate max-w-[140px]">{holding.companyName}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${profitClass(holding.profitLossPercent)}`}>
            {fmt.percent(holding.profitLossPercent)}
          </p>
          <p className={`text-xs font-medium ${profitClass(holding.profitLoss)}`}>
            {fmt.currency(holding.profitLoss)}
          </p>
        </div>
      </div>
    </div>
  );
}

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
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ratingColor}`}>{rating}</span>
      </div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 tracking-tight">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

const RATING_COLOR: Record<string, string> = {
  Excellent: 'text-emerald-600 bg-emerald-50',
  Good:      'text-blue-600 bg-blue-50',
  Moderate:  'text-amber-600 bg-amber-50',
  Average:   'text-amber-600 bg-amber-50',
  Fair:      'text-amber-600 bg-amber-50',
  Poor:      'text-red-600 bg-red-50',
  Low:       'text-emerald-600 bg-emerald-50',
  Medium:    'text-amber-600 bg-amber-50',
  High:      'text-red-600 bg-red-50',
  'Very High': 'text-red-700 bg-red-100',
  'N/A':     'text-slate-400 bg-surface-100',
};

export default function AnalyticsPage() {
  const [data, setData]         = useState<Analytics | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [risk, setRisk]         = useState<RiskMetrics | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [a, h, r] = await Promise.all([getAnalytics(), getHoldings(), getRiskMetrics()]);
      setData(a);
      setHoldings(h);
      setRisk(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const d = data;

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Analytics" subtitle="Deep portfolio insights" onRefresh={load} loading={loading} />

      <div className="flex-1 p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              <PerformerCard holding={d?.topPerformer ?? null} type="top" />
              <PerformerCard holding={d?.worstPerformer ?? null} type="worst" />
            </>
          )}
        </div>

        {/* Risk & Health Overview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-title mb-0">Risk &amp; Health Overview</p>
            <Link
              to="/health"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
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

        {/* Portfolio metrics */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="section-title">Portfolio Summary</p>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-surface-100 rounded animate-pulse" />
                ))}
              </div>
            ) : !d ? (
              <EmptyState />
            ) : (
              <div>
                <MetricRow label="Total Invested"     value={fmt.currency(d.totalInvestment)} />
                <MetricRow label="Current Value"      value={fmt.currency(d.currentPortfolioValue)} />
                <MetricRow
                  label="Total P&L"
                  value={fmt.currency(d.totalProfitLoss)}
                  sub={fmt.percent(d.profitLossPercent)}
                />
                <MetricRow label="Stocks Held"        value={String(holdings.length)} />
                <MetricRow
                  label="Avg Stock Return"
                  value={holdings.length
                    ? fmt.percent(holdings.reduce((s, h) => s + h.profitLossPercent, 0) / holdings.length)
                    : '—'}
                />
              </div>
            )}
          </div>

          {/* Performance bar chart */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="section-title">Return by Stock</p>
            {loading ? (
              <ChartSkeleton height={260} />
            ) : !holdings.length ? (
              <EmptyState
                icon={BarChart3}
                title="No holdings data"
                description="Add stocks to see performance breakdown."
              />
            ) : (
              <PerformanceChart holdings={holdings} />
            )}
          </div>
        </div>

        {/* Portfolio growth */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <p className="section-title">Portfolio Growth Over Time</p>
          {loading
            ? <ChartSkeleton height={280} />
            : <GrowthChart data={d?.portfolioGrowth ?? []} />
          }
        </div>

        {/* Allocation charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="section-title">Asset Allocation</p>
            {loading
              ? <ChartSkeleton height={280} />
              : <AllocationChart data={d?.assetAllocation ?? []} height={280} />
            }
          </div>
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="section-title">Sector Allocation</p>
            {loading
              ? <ChartSkeleton height={280} />
              : <AllocationChart data={d?.sectorAllocation ?? []} height={280} />
            }
          </div>
        </div>

        {/* Holdings breakdown table */}
        {!loading && holdings.length > 0 && (
          <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-200">
              <p className="section-title mb-0">Holdings Breakdown</p>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[720px]">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Sector</th>
                    <th className="text-right">Weight</th>
                    <th className="text-right">Invested</th>
                    <th className="text-right">Current Value</th>
                    <th className="text-right">P&L</th>
                    <th className="text-right">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {[...holdings]
                    .sort((a, b) => b.currentValue - a.currentValue)
                    .map(h => {
                      const totalCv = holdings.reduce((s, x) => s + x.currentValue, 0);
                      const weight  = totalCv ? (h.currentValue / totalCv * 100).toFixed(1) : '0';
                      return (
                        <tr key={h.id}>
                          <td>
                            <p className="font-semibold text-slate-800 font-mono text-xs">{h.symbol}</p>
                            <p className="text-slate-400 text-[11px]">{h.companyName}</p>
                          </td>
                          <td>
                            <span className="text-xs px-2 py-0.5 bg-surface-100 text-slate-500 rounded">
                              {h.sector ?? 'Unknown'}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-surface-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-brand-500 rounded-full"
                                  style={{ width: `${weight}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-600 w-10 text-right">{weight}%</span>
                            </div>
                          </td>
                          <td className="text-right text-slate-600">{fmt.currency(h.investedValue)}</td>
                          <td className="text-right font-medium text-slate-800">{fmt.currency(h.currentValue)}</td>
                          <td className={`text-right font-medium ${profitClass(h.profitLoss)}`}>{fmt.currency(h.profitLoss)}</td>
                          <td className={`text-right font-semibold ${profitClass(h.profitLossPercent)}`}>
                            <span className="flex items-center justify-end gap-0.5">
                              {h.profitLossPercent >= 0
                                ? <TrendingUp size={11} />
                                : <TrendingDown size={11} />}
                              {fmt.percent(h.profitLossPercent)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
