import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, Briefcase, Plus, Minus,
  Shield, PieChart as PieIcon, AlertTriangle, ArrowRight
} from 'lucide-react';
import { getDashboard, getRiskMetrics } from '../api/client';
import type { Dashboard, RiskMetrics } from '../types';
import Header from '../components/layout/Header';
import StatCard from '../components/ui/StatCard';
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import TradeModal from '../components/ui/TradeModal';
import GrowthChart from '../components/charts/GrowthChart';
import AllocationChart from '../components/charts/AllocationChart';
import EmptyState from '../components/ui/EmptyState';
import HealthScoreRing from '../components/ui/HealthScoreRing';
import { fmt, profitClass } from '../utils/format';

export default function DashboardPage() {
  const [data, setData]       = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [modal, setModal]     = useState<'buy' | 'sell' | null>(null);

  // Portfolio Health & Risk snapshot (additive — independent of main dashboard load)
  const [risk, setRisk]               = useState<RiskMetrics | null>(null);
  const [riskLoading, setRiskLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await getDashboard()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const loadRisk = useCallback(async () => {
    setRiskLoading(true);
    try { setRisk(await getRiskMetrics()); }
    catch { /* non-critical — silently ignore on dashboard */ }
    finally { setRiskLoading(false); }
  }, []);

  useEffect(() => { load(); loadRisk(); }, [load, loadRisk]);

  const d = data;
  const hasRisk = risk && risk.diversificationRating !== 'N/A';

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Dashboard"
        subtitle="Real-time portfolio overview"
        onRefresh={load}
        loading={loading}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setModal('buy')} className="btn-primary flex items-center gap-1.5">
              <Plus size={14} /> Buy
            </button>
            <button onClick={() => setModal('sell')} className="btn-danger flex items-center gap-1.5">
              <Minus size={14} /> Sell
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
            {error} — is the backend running on port 8080?
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                label="Total Investment"
                value={fmt.currency(d?.totalInvestment)}
                icon={DollarSign}
                iconColor="bg-blue-50 text-blue-600"
              />
              <StatCard
                label="Portfolio Value"
                value={fmt.currency(d?.currentPortfolioValue)}
                change={d?.dayChangePercent}
                changeLabel="today"
                icon={Briefcase}
                iconColor="bg-violet-50 text-violet-600"
              />
              <StatCard
                label="Total P&L"
                value={fmt.currency(d?.totalProfitLoss)}
                change={d?.profitLossPercent}
                changeLabel="overall"
                icon={d && d.totalProfitLoss >= 0 ? TrendingUp : TrendingDown}
                iconColor={d && d.totalProfitLoss >= 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-600'}
              />
              <StatCard
                label="Stocks Held"
                value={String(d?.totalStocks ?? '—')}
                icon={Briefcase}
                iconColor="bg-amber-50 text-amber-600"
              />
            </>
          )}
        </div>

        {/* Portfolio Health snapshot */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-brand-600" />
              <p className="section-title mb-0">Portfolio Health Snapshot</p>
            </div>
            <Link
              to="/health"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
            >
              View full Health & Risk Center <ArrowRight size={12} />
            </Link>
          </div>

          {riskLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : !hasRisk ? (
            <EmptyState
              icon={Shield}
              title="No health data yet"
              description="Buy your first stock to see diversification and risk scores."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
              {/* Health score ring */}
              <div className="flex items-center justify-center">
                <HealthScoreRing score={risk!.healthScore} rating={risk!.healthRating} size={110} />
              </div>

              {/* Diversification */}
              <div className="bg-surface-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <PieIcon size={14} className="text-blue-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Diversification</p>
                </div>
                <p className="text-xl font-semibold text-slate-800">{risk!.diversificationScore.toFixed(0)} / 100</p>
                <p className="text-xs text-slate-400 mt-1">{risk!.diversificationRating}</p>
              </div>

              {/* Largest position */}
              <div className="bg-surface-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Largest Position</p>
                </div>
                <p className="text-xl font-semibold text-slate-800 font-mono">{risk!.largestPositionSymbol}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {fmt.percent(risk!.largestPositionPercent).replace('+', '')} · {risk!.largestPositionRisk} risk
                </p>
              </div>

              {/* Sector concentration */}
              <div className="bg-surface-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield size={14} className={risk!.sectorConcentrationWarning ? 'text-red-600' : 'text-emerald-600'} />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Dominant Sector</p>
                </div>
                <p className="text-xl font-semibold text-slate-800">{risk!.dominantSector}</p>
                <p className={`text-xs mt-1 ${risk!.sectorConcentrationWarning ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                  {fmt.percent(risk!.dominantSectorPercent).replace('+', '')}
                  {risk!.sectorConcentrationWarning ? ' · Concentration warning' : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Growth chart – takes 2 cols */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="section-title">Portfolio Growth</p>
            {loading
              ? <ChartSkeleton height={280} />
              : <GrowthChart data={d?.portfolioGrowth ?? []} />
            }
          </div>

          {/* Asset allocation */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="section-title">Asset Allocation</p>
            {loading
              ? <ChartSkeleton height={260} />
              : <AllocationChart data={d?.assetAllocation ?? []} height={260} />
            }
          </div>
        </div>

        {/* Sector + top holdings row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Sector allocation */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="section-title">Sector Allocation</p>
            {loading
              ? <ChartSkeleton height={260} />
              : <AllocationChart data={d?.sectorAllocation ?? []} height={260} />
            }
          </div>

          {/* Top holdings table */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-200">
              <p className="section-title mb-0">Top Holdings</p>
            </div>
            {loading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : !d?.topHoldings?.length ? (
              <EmptyState description="Buy your first stock to see holdings." />
            ) : (
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th className="text-right">Current Value</th>
                    <th className="text-right">Invested</th>
                    <th className="text-right">P&L</th>
                    <th className="text-right">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {d.topHoldings.map(h => (
                    <tr key={h.id}>
                      <td>
                        <div>
                          <p className="font-semibold text-slate-800 font-mono text-xs">{h.symbol}</p>
                          <p className="text-slate-400 text-[11px] truncate max-w-[160px]">{h.companyName}</p>
                        </div>
                      </td>
                      <td className="text-right font-medium text-slate-800">{fmt.currency(h.currentValue)}</td>
                      <td className="text-right text-slate-600">{fmt.currency(h.investedValue)}</td>
                      <td className={`text-right font-medium ${profitClass(h.profitLoss)}`}>
                        {fmt.currency(h.profitLoss)}
                      </td>
                      <td className={`text-right font-semibold ${profitClass(h.profitLossPercent)}`}>
                        {fmt.percent(h.profitLossPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <TradeModal
          mode={modal}
          onClose={() => setModal(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
