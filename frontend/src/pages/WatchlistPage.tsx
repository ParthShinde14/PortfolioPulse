import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, ShoppingCart, LineChart, Eye } from 'lucide-react';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../api/client';
import type { WatchlistItem } from '../types';
import Header from '../components/layout/Header';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import TradeModal from '../components/ui/TradeModal';
import StockSelector from '../components/ui/StockSelector';
import { fmt, profitClass } from '../utils/format';

export default function WatchlistPage() {
  const [items, setItems]     = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [adding, setAdding]   = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [addError, setAddError]   = useState('');
  const [saving, setSaving]   = useState(false);

  const [tradeModal, setTradeModal] = useState<{ mode: 'buy'; symbol: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await getWatchlist()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newSymbol.trim()) return setAddError('Search and select a stock');
    setAddError('');
    setSaving(true);
    try {
      await addToWatchlist({ symbol: newSymbol.trim().toUpperCase() });
      setNewSymbol('');
      setAdding(false);
      await load();
    } catch (e: any) {
      setAddError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeFromWatchlist(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Watchlist"
        subtitle={`${items.length} stock${items.length !== 1 ? 's' : ''} tracked`}
        onRefresh={load}
        loading={loading}
        actions={
          <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} /> Add Stock
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Add-stock panel */}
        {adding && (
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <p className="section-title">Add to Watchlist</p>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex-1 w-full">
                <StockSelector
                  value={newSymbol}
                  onChange={setNewSymbol}
                  onSelect={(sel) => setNewSymbol(sel.symbol)}
                  placeholder="Search symbol or company…"
                  autoFocus
                />
                {addError && <p className="text-xs text-red-500 mt-1">{addError}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={handleAdd} disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? 'Adding…' : 'Add'}
                </button>
                <button onClick={() => { setAdding(false); setNewSymbol(''); setAddError(''); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Watchlist table */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : !items.length ? (
            <EmptyState
              icon={Eye}
              title="Your watchlist is empty"
              description="Track stocks you're interested in without owning them yet."
              action={
                !adding && (
                  <button onClick={() => setAdding(true)} className="btn-primary">
                    Add your first stock
                  </button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[640px]">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Day Change</th>
                    <th className="text-right">Trend</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const change = item.changePercent ?? 0;
                    const TrendIcon = change >= 0 ? TrendingUp : TrendingDown;
                    return (
                      <tr key={item.id}>
                        <td>
                          <div>
                            <p className="font-semibold text-slate-800 font-mono text-xs">{item.symbol}</p>
                            <p className="text-slate-400 text-[11px] truncate max-w-[180px]">{item.companyName}</p>
                            {item.sector && (
                              <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 bg-surface-100 text-slate-500 rounded">
                                {item.sector}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right font-mono text-xs font-medium text-slate-800">
                          {item.currentPrice != null ? fmt.currency(item.currentPrice) : '—'}
                        </td>
                        <td className={`text-right text-xs font-medium ${profitClass(change)}`}>
                          {item.change != null ? fmt.currency(item.change) : '—'}
                        </td>
                        <td className="text-right">
                          <span className={`inline-flex items-center justify-end gap-1 text-xs font-semibold ${profitClass(change)}`}>
                            <TrendIcon size={12} />
                            {fmt.percent(change)}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setTradeModal({ mode: 'buy', symbol: item.symbol })}
                              title="Quick Buy"
                              className="text-[11px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors flex items-center gap-1"
                            >
                              <ShoppingCart size={11} /> Buy
                            </button>
                            <a
                              href={`https://finance.yahoo.com/quote/${item.symbol}`}
                              target="_blank"
                              rel="noreferrer"
                              title="View chart on Yahoo Finance"
                              className="text-[11px] px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors flex items-center gap-1"
                            >
                              <LineChart size={11} /> Chart
                            </a>
                            <button
                              onClick={() => handleRemove(item.id)}
                              title="Remove from watchlist"
                              className="text-[11px] px-2 py-1 rounded bg-surface-100 text-slate-500 hover:bg-red-50 hover:text-red-600 font-medium transition-colors"
                            >
                              <Trash2 size={11} />
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

      {tradeModal && (
        <TradeModal
          mode={tradeModal.mode}
          prefillSymbol={tradeModal.symbol}
          onClose={() => setTradeModal(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
