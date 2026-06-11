import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { getHoldings } from '../api/client';
import type { Holding } from '../types';
import Header from '../components/layout/Header';
import { TableSkeleton } from '../components/ui/Skeleton';
import TradeModal from '../components/ui/TradeModal';
import EmptyState from '../components/ui/EmptyState';
import { fmt, profitClass } from '../utils/format';

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState<{ mode: 'buy' | 'sell'; symbol?: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setHoldings(await getHoldings()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? holdings.filter(h =>
        h.symbol.toLowerCase().includes(search.toLowerCase()) ||
        h.companyName.toLowerCase().includes(search.toLowerCase())
      )
    : holdings;

  const totalValue    = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalInvested = holdings.reduce((s, h) => s + h.investedValue, 0);
  const totalPL       = totalValue - totalInvested;

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Holdings"
        subtitle={`${holdings.length} position${holdings.length !== 1 ? 's' : ''}`}
        onRefresh={load}
        loading={loading}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setModal({ mode: 'buy' })} className="btn-primary flex items-center gap-1.5">
              <Plus size={14} /> Buy
            </button>
            <button onClick={() => setModal({ mode: 'sell' })} className="btn-danger flex items-center gap-1.5">
              <Minus size={14} /> Sell
            </button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Summary strip */}
        {!loading && holdings.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Invested',       value: fmt.currency(totalInvested), color: 'text-slate-800' },
              { label: 'Current Value',  value: fmt.currency(totalValue),    color: 'text-slate-800' },
              { label: 'Total P&L',      value: fmt.currency(totalPL),       color: profitClass(totalPL) },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search + table */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-surface-200 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input-field pl-8"
                placeholder="Search symbol or company…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600">
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : !filtered.length ? (
            <EmptyState
              title={search ? 'No matching stocks' : 'No holdings yet'}
              description={search ? 'Try a different search term.' : 'Click Buy to add your first stock position.'}
              action={
                !search && (
                  <button onClick={() => setModal({ mode: 'buy' })} className="btn-primary">
                    Buy your first stock
                  </button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[900px]">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Avg Buy</th>
                    <th className="text-right">CMP</th>
                    <th className="text-right">Invested</th>
                    <th className="text-right">Cur. Value</th>
                    <th className="text-right">P&L</th>
                    <th className="text-right">Return</th>
                    <th className="text-right">Day Chg</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(h => {
                    const pl      = h.profitLoss;
                    const dayChg  = h.dayChange;
                    return (
                      <tr key={h.id}>
                        <td>
                          <div>
                            <p className="font-semibold text-slate-800 font-mono text-xs tracking-wide">{h.symbol}</p>
                            <p className="text-slate-400 text-[11px] truncate max-w-[180px]">{h.companyName}</p>
                            {h.sector && (
                              <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 bg-surface-100 text-slate-500 rounded">
                                {h.sector}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right font-mono text-xs text-slate-700">{fmt.number(h.quantity)}</td>
                        <td className="text-right font-mono text-xs text-slate-600">{fmt.currency(h.averageBuyPrice)}</td>
                        <td className="text-right font-mono text-xs font-medium text-slate-800">{fmt.currency(h.currentPrice)}</td>
                        <td className="text-right text-slate-600">{fmt.currency(h.investedValue)}</td>
                        <td className="text-right font-medium text-slate-800">{fmt.currency(h.currentValue)}</td>
                        <td className={`text-right font-medium ${profitClass(pl)}`}>{fmt.currency(pl)}</td>
                        <td className={`text-right font-semibold ${profitClass(h.profitLossPercent)}`}>
                          <span className="flex items-center justify-end gap-0.5">
                            {h.profitLossPercent >= 0
                              ? <TrendingUp size={12} />
                              : <TrendingDown size={12} />}
                            {fmt.percent(h.profitLossPercent)}
                          </span>
                        </td>
                        <td className={`text-right text-xs ${profitClass(dayChg)}`}>
                          {fmt.currency(dayChg)}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setModal({ mode: 'buy', symbol: h.symbol })}
                              className="text-[11px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors"
                            >
                              Buy
                            </button>
                            <button
                              onClick={() => setModal({ mode: 'sell', symbol: h.symbol })}
                              className="text-[11px] px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors"
                            >
                              Sell
                            </button>
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
      </div>

      {modal && (
        <TradeModal
          mode={modal.mode}
          prefillSymbol={modal.symbol}
          onClose={() => setModal(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
