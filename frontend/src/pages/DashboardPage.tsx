import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Briefcase, Plus, Minus
} from 'lucide-react';
import { getDashboard } from '../api/client';
import type { Dashboard } from '../types';
import Header from '../components/layout/Header';
import StatCard from '../components/ui/StatCard';
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import TradeModal from '../components/ui/TradeModal';
import GrowthChart from '../components/charts/GrowthChart';
import AllocationChart from '../components/charts/AllocationChart';
import EmptyState from '../components/ui/EmptyState';
import { fmt, profitClass } from '../utils/format';

export default function DashboardPage() {
  const [data, setData]       = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [modal, setModal]     = useState<'buy' | 'sell' | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await getDashboard()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const d = data;

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
