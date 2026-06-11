import { useState, useEffect, useCallback } from 'react';
import { Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getTransactions } from '../api/client';
import type { Transaction } from '../types';
import Header from '../components/layout/Header';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { fmt } from '../utils/format';

export default function TransactionsPage() {
  const [txns, setTxns]       = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [typeFilter, setType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setTxns(await getTransactions()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = txns.filter(t => {
    const matchSearch =
      !search.trim() ||
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (t.companyName ?? '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'ALL' || t.transactionType === typeFilter;
    return matchSearch && matchType;
  });

  const totalBought = txns.filter(t => t.transactionType === 'BUY').reduce((s, t) => s + t.totalValue, 0);
  const totalSold   = txns.filter(t => t.transactionType === 'SELL').reduce((s, t) => s + t.totalValue, 0);

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Transactions"
        subtitle={`${txns.length} total transaction${txns.length !== 1 ? 's' : ''}`}
        onRefresh={load}
        loading={loading}
      />

      <div className="flex-1 p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Summary */}
        {!loading && txns.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="text-xs text-slate-500 mb-1">Total Transactions</p>
              <p className="text-xl font-semibold text-slate-800">{txns.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-slate-500 mb-1">Total Bought</p>
              <p className="text-xl font-semibold text-emerald-600">{fmt.currency(totalBought)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-slate-500 mb-1">Total Sold</p>
              <p className="text-xl font-semibold text-red-600">{fmt.currency(totalSold)}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-surface-200 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input-field pl-8"
                placeholder="Search symbol or company…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex rounded-lg border border-surface-200 overflow-hidden text-xs font-medium">
              {(['ALL', 'BUY', 'SELL'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setType(f)}
                  className={`px-3 py-2 transition-colors ${
                    typeFilter === f
                      ? f === 'BUY'  ? 'bg-emerald-600 text-white'
                      : f === 'SELL' ? 'bg-red-600 text-white'
                      : 'bg-brand-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-surface-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : !filtered.length ? (
            <EmptyState
              title="No transactions found"
              description={search || typeFilter !== 'ALL' ? 'Try adjusting your filters.' : 'Your transaction history will appear here after buying or selling stocks.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[700px]">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Stock</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total Value</th>
                    <th>Date</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const isBuy = t.transactionType === 'BUY';
                    return (
                      <tr key={t.id}>
                        <td>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold ${
                            isBuy ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {isBuy
                              ? <ArrowUpRight size={11} />
                              : <ArrowDownRight size={11} />}
                            {t.transactionType}
                          </span>
                        </td>
                        <td>
                          <div>
                            <p className="font-semibold text-slate-800 font-mono text-xs">{t.symbol}</p>
                            <p className="text-slate-400 text-[11px]">{t.companyName}</p>
                          </div>
                        </td>
                        <td className="text-right font-mono text-xs text-slate-700">{fmt.number(t.quantity)}</td>
                        <td className="text-right font-mono text-xs text-slate-700">{fmt.currency(t.price)}</td>
                        <td className="text-right font-medium text-slate-800">{fmt.currency(t.totalValue)}</td>
                        <td className="text-slate-600 text-xs whitespace-nowrap">{fmt.date(t.transactionDate)}</td>
                        <td className="text-slate-400 text-xs max-w-[140px] truncate">{t.notes ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
