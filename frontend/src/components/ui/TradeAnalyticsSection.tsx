import { Target, Award, AlertTriangle, Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { TradeAnalytics } from '../../types';
import { fmt, profitClass } from '../../utils/format';
import { CardSkeleton, ChartSkeleton } from './Skeleton';
import EmptyState from './EmptyState';
import TopStocksChart from '../charts/TopStocksChart';

interface Props {
  data: TradeAnalytics | null;
  loading?: boolean;
}

function MetricCard({
  icon: Icon, iconColor, label, value, sub
}: { icon: typeof Target; iconColor: string; label: string; value: string; sub?: string }) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${iconColor}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function TradeAnalyticsSection({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <ChartSkeleton height={240} />
      </div>
    );
  }

  if (!data || data.totalTrades === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 shadow-card">
        <EmptyState
          icon={Target}
          title="No closed trades yet"
          description="Sell a holding to start tracking win rate, profit factor, and realized P&L."
        />
      </div>
    );
  }

  const profitFactorLabel = data.profitFactor == null ? '∞' : data.profitFactor.toFixed(2);

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={Target}
          iconColor="bg-blue-50 text-blue-600"
          label="Win Rate"
          value={`${data.winRate.toFixed(1)}%`}
          sub={`${data.winningTrades}W / ${data.losingTrades}L of ${data.totalTrades}`}
        />
        <MetricCard
          icon={Award}
          iconColor="bg-emerald-50 text-emerald-600"
          label="Best Trade"
          value={data.bestTrade ? fmt.currency(data.bestTrade.realizedPnl) : '—'}
          sub={data.bestTrade ? `${data.bestTrade.symbol} · ${fmt.percent(data.bestTrade.realizedPnlPercent)}` : undefined}
        />
        <MetricCard
          icon={AlertTriangle}
          iconColor="bg-red-50 text-red-600"
          label="Worst Trade"
          value={data.worstTrade ? fmt.currency(data.worstTrade.realizedPnl) : '—'}
          sub={data.worstTrade ? `${data.worstTrade.symbol} · ${fmt.percent(data.worstTrade.realizedPnlPercent)}` : undefined}
        />
        <MetricCard
          icon={Scale}
          iconColor="bg-violet-50 text-violet-600"
          label="Profit Factor"
          value={profitFactorLabel}
          sub={`Avg gain ${fmt.currency(data.averageGain)} / Avg loss ${fmt.currency(data.averageLoss)}`}
        />
      </div>

      {/* Top profitable / losing stocks */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <p className="section-title">Top Profitable Stocks</p>
          <TopStocksChart data={data.topProfitableStocks} variant="profit" />
        </div>
        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
          <p className="section-title">Top Losing Stocks</p>
          <TopStocksChart data={data.topLosingStocks} variant="loss" />
        </div>
      </div>

      {/* Trade breakdown table */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200">
          <p className="section-title mb-0">Trade Performance Breakdown</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[700px]">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Date</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Sell Price</th>
                <th className="text-right">Avg Buy</th>
                <th className="text-right">P&L</th>
                <th className="text-right">Return</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {data.trades.map((t, i) => (
                <tr key={i}>
                  <td>
                    <p className="font-semibold text-slate-800 font-mono text-xs">{t.symbol}</p>
                    <p className="text-slate-400 text-[11px]">{t.companyName}</p>
                  </td>
                  <td className="text-slate-600 text-xs whitespace-nowrap">{fmt.date(t.date)}</td>
                  <td className="text-right font-mono text-xs text-slate-700">{fmt.number(t.quantity)}</td>
                  <td className="text-right font-mono text-xs text-slate-700">{fmt.currency(t.sellPrice)}</td>
                  <td className="text-right font-mono text-xs text-slate-600">{fmt.currency(t.avgBuyPrice)}</td>
                  <td className={`text-right font-medium ${profitClass(t.realizedPnl)}`}>{fmt.currency(t.realizedPnl)}</td>
                  <td className={`text-right font-semibold ${profitClass(t.realizedPnlPercent)}`}>
                    {fmt.percent(t.realizedPnlPercent)}
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold ${
                      t.outcome === 'WIN' ? 'bg-emerald-50 text-emerald-700'
                        : t.outcome === 'LOSS' ? 'bg-red-50 text-red-700'
                        : 'bg-surface-100 text-slate-500'
                    }`}>
                      {t.outcome === 'WIN'
                        ? <ArrowUpRight size={11} />
                        : t.outcome === 'LOSS'
                          ? <ArrowDownRight size={11} />
                          : null}
                      {t.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
