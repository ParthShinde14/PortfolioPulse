import { useState, useEffect, useCallback } from 'react';
import { Award, AlertTriangle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { getAnalytics, getHoldings } from '../api/client';
import type { Analytics, Holding } from '../types';
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

export default function AnalyticsPage() {
  const [data, setData]         = useState<Analytics | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [a, h] = await Promise.all([getAnalytics(), getHoldings()]);
      setData(a);
      setHoldings(h);
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
