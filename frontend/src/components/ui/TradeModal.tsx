import { useState, useEffect, useCallback } from 'react';
import {
  X, TrendingUp, TrendingDown, Clock, AlertTriangle,
  CheckCircle2, History, Zap
} from 'lucide-react';
import { getStockInfo, buyStock, sellStock, getMarketStatus } from '../../api/client';
import type { StockInfo, StockSelection, TransactionRequest, MarketStatus, TransactionMode } from '../../types';
import { fmt, today } from '../../utils/format';
import StockSelector from './StockSelector';

interface Props {
  mode: 'buy' | 'sell';
  prefillSymbol?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TradeModal({ mode, prefillSymbol, onClose, onSuccess }: Props) {
  const [symbol, setSymbol]           = useState(prefillSymbol ?? '');
  const [selected, setSelected]       = useState<StockSelection | StockInfo | null>(null);
  const [transactionMode, setTxMode]  = useState<TransactionMode>('LIVE');
  const [marketStatus, setMktStatus]  = useState<MarketStatus | null>(null);
  const [mktLoading, setMktLoading]   = useState(false);
  const [qty, setQty]                 = useState('');
  const [price, setPrice]             = useState('');
  const [date, setDate]               = useState(today());
  const [notes, setNotes]             = useState('');
  const [submitting, setSub]          = useState(false);
  const [error, setError]             = useState('');

  // Fetch market status whenever the resolved symbol changes
  const fetchMarketStatus = useCallback(async (sym: string) => {
    if (!sym) return;
    setMktLoading(true);
    try {
      const status = await getMarketStatus(sym);
      setMktStatus(status);
    } catch {
      setMktStatus(null);
    } finally {
      setMktLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!prefillSymbol) return;
    (async () => {
      try {
        const info = await getStockInfo(prefillSymbol);
        setSelected(info);
        setPrice(String(info.currentPrice));
      } catch {
        // Leave fields empty; user can still type manually.
      }
    })();
    fetchMarketStatus(prefillSymbol);
  }, [prefillSymbol, fetchMarketStatus]);

  const handleSelect = (selection: StockSelection) => {
    setSelected(selection);
    if (selection.currentPrice != null) {
      setPrice(String(selection.currentPrice));
    }
    fetchMarketStatus(selection.symbol);
  };

  // When switching to MANUAL mode, clear the date lock so user can pick any past date.
  // When switching back to LIVE, reset the date to today.
  const handleModeSwitch = (newMode: TransactionMode) => {
    setTxMode(newMode);
    setError('');
    if (newMode === 'LIVE') {
      setDate(today());
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!symbol.trim())            return setError('Search and select a stock');
    if (!qty || Number(qty) <= 0)  return setError('Enter a valid quantity');
    if (!price || Number(price) <= 0) return setError('Enter a valid price');
    if (!date)                     return setError('Select a transaction date');

    const req: TransactionRequest = {
      symbol: symbol.toUpperCase().trim(),
      quantity: Number(qty),
      price: Number(price),
      transactionDate: date,
      notes: notes || undefined,
      transactionMode,
    };

    setSub(true);
    try {
      if (mode === 'buy') await buyStock(req);
      else await sellStock(req);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSub(false);
    }
  };

  const total = qty && price ? (Number(qty) * Number(price)) : null;
  const isBuy = mode === 'buy';
  const isLive = transactionMode === 'LIVE';

  const companyName   = selected?.companyName ?? null;
  const sector        = selected?.sector ?? null;
  const currentPrice  = selected?.currentPrice ?? null;
  const changePercent = selected && 'changePercent' in selected ? selected.changePercent : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-surface-200 rounded-t-2xl sticky top-0 z-10
          ${isBuy ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2.5">
            {isBuy
              ? <TrendingUp  size={18} className="text-emerald-600" />
              : <TrendingDown size={18} className="text-red-600" />}
            <h2 className={`font-semibold text-base ${isBuy ? 'text-emerald-800' : 'text-red-800'}`}>
              {isBuy ? 'Buy Stock' : 'Sell Stock'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-4">

          {/* ── LIVE / MANUAL toggle ── */}
          <div className="flex rounded-xl border border-surface-200 overflow-hidden text-xs font-semibold">
            <button
              onClick={() => handleModeSwitch('LIVE')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors
                ${isLive
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-surface-50'}`}
            >
              <Zap size={12} />
              Live Trade
            </button>
            <button
              onClick={() => handleModeSwitch('MANUAL')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors border-l border-surface-200
                ${!isLive
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-500 hover:bg-surface-50'}`}
            >
              <History size={12} />
              Log Past Trade
            </button>
          </div>

          {/* ── Mode description ── */}
          <p className="text-xs text-slate-400 -mt-1">
            {isLive
              ? 'Live Trade: executes at current market price. Market hours are enforced.'
              : 'Log Past Trade: record any historical transaction at any date and price. No time restrictions.'}
          </p>

          {/* ── Market status badge (only for LIVE) ── */}
          {isLive && symbol && (
            <div className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 border text-xs font-medium
              ${mktLoading
                ? 'bg-surface-50 border-surface-200 text-slate-400'
                : marketStatus?.open
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'}`}
            >
              {mktLoading ? (
                <Clock size={14} className="animate-pulse shrink-0" />
              ) : marketStatus?.open ? (
                <CheckCircle2 size={14} className="shrink-0" />
              ) : (
                <AlertTriangle size={14} className="shrink-0" />
              )}
              <span>
                {mktLoading
                  ? 'Checking market hours…'
                  : marketStatus
                    ? `${marketStatus.exchange} is ${marketStatus.open ? 'OPEN' : 'CLOSED'} · ${marketStatus.hoursLabel} · ${marketStatus.currentLocalTime}`
                    : 'Market status unavailable'}
              </span>
              {!mktLoading && marketStatus && !marketStatus.open && (
                <span className="ml-auto shrink-0 underline underline-offset-2 cursor-pointer"
                  onClick={() => handleModeSwitch('MANUAL')}>
                  Log past trade →
                </span>
              )}
            </div>
          )}

          {/* ── Stock selector ── */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Stock</label>
            {prefillSymbol ? (
              <div className="input-field font-mono flex items-center justify-between bg-surface-50">
                <span>{symbol}</span>
                {companyName && <span className="text-xs text-slate-400 truncate ml-2">{companyName}</span>}
              </div>
            ) : (
              <StockSelector
                value={symbol}
                onChange={setSymbol}
                onSelect={handleSelect}
                placeholder="e.g. AAPL, Microsoft, RELIANCE.NS"
                autoFocus
              />
            )}
          </div>

          {/* ── Stock info chip ── */}
          {selected && (
            <div className="flex items-center justify-between bg-surface-50 border border-surface-200 rounded-lg px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{symbol}</p>
                <p className="text-xs text-slate-500 truncate">{companyName}</p>
                {sector && (
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-surface-100 text-slate-500 rounded">
                    {sector}
                  </span>
                )}
              </div>
              {currentPrice != null && (
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-slate-800">{fmt.currency(currentPrice)}</p>
                  {changePercent != null && (
                    <p className={`text-xs font-medium ${changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {fmt.percent(changePercent)} today
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Qty + Price ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Quantity</label>
              <input
                type="number" min="0" step="0.001"
                className="input-field font-mono"
                placeholder="0"
                value={qty}
                onChange={e => setQty(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {isLive ? 'Price per Share (live)' : 'Price per Share (historical)'}
              </label>
              <input
                type="number" min="0" step="0.01"
                className="input-field font-mono"
                placeholder="0.00"
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
            </div>
          </div>

          {/* ── Date: locked to today for LIVE, free for MANUAL ── */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Transaction Date</label>
            {isLive ? (
              <div className="input-field bg-surface-50 text-slate-500 flex items-center gap-2">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <span>{date}</span>
                <span className="ml-auto text-[11px] text-slate-400">Locked to today for live trades</span>
              </div>
            ) : (
              <input
                type="date"
                className="input-field"
                value={date}
                max={today()}
                onChange={e => setDate(e.target.value)}
              />
            )}
          </div>

          {/* ── Notes ── */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes (optional)</label>
            <input
              className="input-field"
              placeholder={isLive ? 'Add a note…' : 'e.g. Bought at IPO, backdated entry, etc.'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* ── Total ── */}
          {total != null && (
            <div className="bg-surface-50 rounded-lg px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-500">Total {isBuy ? 'Cost' : 'Proceeds'}</span>
              <span className="font-semibold text-slate-800">{fmt.currency(total)}</span>
            </div>
          )}

          {/* ── Market closed nudge (LIVE + market is closed) ── */}
          {isLive && marketStatus && !marketStatus.open && !error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
              <p className="font-semibold mb-1">
                {marketStatus.exchange} is currently closed
              </p>
              <p>Trading hours: <span className="font-medium">{marketStatus.hoursLabel}</span></p>
              <p className="mt-1.5">
                Want to record a transaction outside market hours?{' '}
                <button
                  onClick={() => handleModeSwitch('MANUAL')}
                  className="font-semibold underline underline-offset-2 hover:text-amber-900"
                >
                  Switch to Log Past Trade
                </button>
              </p>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-6 pb-5 sticky bottom-0 bg-white pt-2 border-t border-surface-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (isLive && !!marketStatus && !marketStatus.open)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white transition-all active:scale-95
              ${isBuy ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
              disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isLive && marketStatus && !marketStatus.open
              ? `${marketStatus.exchange} is closed — switch to Log Past Trade to record this`
              : undefined}
          >
            {submitting
              ? 'Processing…'
              : isLive
                ? (isBuy ? 'Confirm Buy' : 'Confirm Sell')
                : (isBuy ? 'Log Buy Entry' : 'Log Sell Entry')}
          </button>
        </div>
      </div>
    </div>
  );
}
