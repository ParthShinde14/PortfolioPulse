import { useState, useEffect, useCallback } from 'react';
import {
  Shield, PieChart as PieIcon, AlertTriangle, Activity,
  Gauge, Sparkles, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { getRiskMetrics } from '../api/client';
import type { RiskMetrics } from '../types';
import Header from '../components/layout/Header';
import { CardSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import HealthScoreRing from '../components/ui/HealthScoreRing';
import InsightCard from '../components/ui/InsightCard';
import SectorExposureChart from '../components/charts/SectorExposureChart';
import { fmt } from '../utils/format';

// ── Rating → color helpers (consistent with profitClass conventions) ────────
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

function RatingBadge({ rating }: { rating: string }) {
  const cls = RATING_COLOR[rating] ?? 'text-slate-500 bg-surface-100';
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      {rating}
    </span>
  );
}

function RiskCard({
  icon: Icon, iconColor, label, value, sub, rating
}: {
  icon: typeof Shield; iconColor: string; label: string;
  value: string; sub?: string; rating: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <RatingBadge rating={rating} />
      </div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function HealthCenterPage() {
  const [data, setData]       = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await getRiskMetrics()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const d = data;
  const hasHoldings = !!d && d.diversificationRating !== 'N/A';

  const SharpeIcon = d && d.sharpeRatio > 0 ? TrendingUp : d && d.sharpeRatio < 0 ? TrendingDown : Minus;

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Portfolio Health & Risk Center"
        subtitle="Diversification, risk, and rule-based insights"
        onRefresh={load}
        loading={loading}
      />

      <div className="flex-1 p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">{error}</div>
        )}

        {!loading && !hasHoldings ? (
          <div className="bg-white rounded-xl border border-surface-200 shadow-card">
            <EmptyState
              icon={Shield}
              title="No portfolio health data yet"
              description="Buy your first stock to unlock diversification, risk, and AI-driven insights."
            />
          </div>
        ) : (
          <>
            {/* Health score + key risk cards */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              {/* Health score ring */}
              <div className="stat-card flex flex-col items-center justify-center xl:col-span-1">
                {loading ? (
                  <div className="h-36 w-36 rounded-full bg-surface-100 animate-pulse" />
                ) : (
                  <>
                    <HealthScoreRing score={d!.healthScore} rating={d!.healthRating} />
                    <p className="text-xs text-slate-400 mt-3 text-center leading-relaxed">
                      {d!.healthExplanation}
                    </p>
                  </>
                )}
                <p className="text-xs font-semibold text-slate-600 mt-2 uppercase tracking-wide">
                  Portfolio Health Score
                </p>
              </div>

              {/* Key risk cards */}
              <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
                ) : (
                  <>
                    <RiskCard
                      icon={PieIcon}
                      iconColor="bg-blue-50 text-blue-600"
                      label="Diversification Score"
                      value={`${d!.diversificationScore.toFixed(0)} / 100`}
                      sub="Based on Herfindahl-Hirschman Index"
                      rating={d!.diversificationRating}
                    />
                    <RiskCard
                      icon={AlertTriangle}
                      iconColor="bg-amber-50 text-amber-600"
                      label="Largest Position"
                      value={d!.largestPositionSymbol}
                      sub={`${fmt.percent(d!.largestPositionPercent).replace('+', '')} of portfolio`}
                      rating={d!.largestPositionRisk}
                    />
                    <RiskCard
                      icon={Activity}
                      iconColor="bg-violet-50 text-violet-600"
                      label="Portfolio Volatility"
                      value={`${d!.volatilityPercent.toFixed(1)}%`}
                      sub="Annualised, based on daily snapshots"
                      rating={d!.volatilityRating}
                    />
                  </>
                )}

                {loading ? (
                  <CardSkeleton />
                ) : (
                  <RiskCard
                    icon={SharpeIcon}
                    iconColor={
                      d!.sharpeRatio >= 1 ? 'bg-emerald-50 text-emerald-600'
                      : d!.sharpeRatio >= 0 ? 'bg-amber-50 text-amber-600'
                      : 'bg-red-50 text-red-600'
                    }
                    label="Sharpe Ratio"
                    value={d!.sharpeRatio.toFixed(2)}
                    sub="Risk-adjusted return vs. risk-free rate"
                    rating={d!.sharpeRating}
                  />
                )}

                {loading ? (
                  <CardSkeleton />
                ) : (
                  <RiskCard
                    icon={Gauge}
                    iconColor={d!.sectorConcentrationWarning ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}
                    label="Dominant Sector"
                    value={d!.dominantSector}
                    sub={`${fmt.percent(d!.dominantSectorPercent).replace('+', '')} of portfolio`}
                    rating={d!.sectorConcentrationWarning ? 'High' : 'Low'}
                  />
                )}
              </div>
            </div>

            {/* Sector exposure */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 bg-white rounded-xl border border-surface-200 shadow-card p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="section-title mb-0">Sector Exposure</p>
                  {!loading && d?.sectorConcentrationWarning && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                      <AlertTriangle size={12} /> Concentration warning
                    </span>
                  )}
                </div>
                {loading
                  ? <ChartSkeleton height={260} />
                  : <SectorExposureChart data={d?.sectorExposures ?? []} />
                }
              </div>

              {/* Sector exposure table */}
              <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-surface-200">
                  <p className="section-title mb-0">Exposure Table</p>
                </div>
                {loading ? (
                  <div className="p-5 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-8 bg-surface-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : !d?.sectorExposures.length ? (
                  <EmptyState title="No sector data" description="" />
                ) : (
                  <table className="data-table w-full">
                    <thead>
                      <tr>
                        <th>Sector</th>
                        <th className="text-right">Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.sectorExposures.map(s => (
                        <tr key={s.sector}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                                style={{ backgroundColor: s.warning ? '#dc2626' : s.color }}
                              />
                              <span className="font-medium text-slate-700">{s.sector}</span>
                              {s.warning && (
                                <AlertTriangle size={12} className="text-red-500 shrink-0" />
                              )}
                            </div>
                          </td>
                          <td className={`text-right font-semibold ${s.warning ? 'text-red-600' : 'text-slate-800'}`}>
                            {s.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-brand-600" />
                <p className="section-title mb-0">Portfolio Insights</p>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 bg-surface-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !d?.insights.length ? (
                <EmptyState
                  icon={Sparkles}
                  title="No insights yet"
                  description="Insights are generated automatically as your portfolio grows."
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {d.insights.map((insight, i) => (
                    <InsightCard key={i} insight={insight} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
