import { useState, useEffect, useRef } from 'react';
import { X, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { getStockInfo, buyStock, sellStock, searchStocks } from '../../api/client';
import type { StockInfo, TransactionRequest, StockSuggestion } from '../../types';
import { fmt, today } from '../../utils/format';

interface Props {
  mode: 'buy' | 'sell';
  prefillSymbol?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TradeModal({ mode, prefillSymbol, onClose, onSuccess }: Props) {
  const [symbol, setSymbol]       = useState(prefillSymbol ?? '');
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [lookupLoading, setLL]    = useState(false);
  const [lookupError, setLE]      = useState('');
  const [qty, setQty]             = useState('');
  const [price, setPrice]         = useState('');
  const [date, setDate]           = useState(today());
  const [notes, setNotes]         = useState('');
  const [submitting, setSub]      = useState(false);
  const [error, setError]         = useState('');

  // Smart search / autocomplete state
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (prefillSymbol) lookupSymbol(prefillSymbol);
  }, [prefillSymbol]);

  // Debounced autocomplete search by symbol or company name
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    const query = symbol.trim();
    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await searchStocks(query, 8);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setHighlightIdx(-1);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);

    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [symbol]);

  const selectSuggestion = (s: StockSuggestion) => {
    skipNextSearch.current = true;
    setSymbol(s.symbol);
    setShowSuggestions(false);
    setSuggestions([]);
    lookupSymbol(s.symbol);
  };

  const lookupSymbol = async (sym: string) => {
    if (!sym.trim()) return;
    setShowSuggestions(false);
    setLL(true); setLE(''); setStockInfo(null);
    try {
      const info = await getStockInfo(sym.trim().toUpperCase());
      setStockInfo(info);
      setPrice(String(info.currentPrice));
    } catch (e: any) {
      setLE(e.message || 'Symbol not found');
    } finally {
      setLL(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!symbol.trim())          return setError('Enter a stock symbol');
    if (!qty || Number(qty) <= 0) return setError('Enter a valid quantity');
    if (!price || Number(price) <= 0) return setError('Enter a valid price');
    if (!date)                   return setError('Select a transaction date');

    const req: TransactionRequest = {
      symbol: symbol.toUpperCase().trim(),
      quantity: Number(qty),
      price: Number(price),
      transactionDate: date,
      notes: notes || undefined,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-surface-200 rounded-t-2xl ${isBuy ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2.5">
            {isBuy
              ? <TrendingUp size={18} className="text-emerald-600" />
              : <TrendingDown size={18} className="text-red-600" />}
            <h2 className={`font-semibold text-base ${isBuy ? 'text-emerald-800' : 'text-red-800'}`}>
              {isBuy ? 'Buy Stock' : 'Sell Stock'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Symbol lookup */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Stock Symbol or Company</label>
            <div className="flex gap-2">
              <input
                className="input-field uppercase font-mono"
                placeholder="e.g. AAPL, Microsoft, RELIANCE.NS"
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                onKeyDown={e => {
                  if (showSuggestions && suggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1));
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightIdx(i => Math.max(i - 1, 0));
                      return;
                    }
                    if (e.key === 'Enter' && highlightIdx >= 0) {
                      e.preventDefault();
                      selectSuggestion(suggestions[highlightIdx]);
                      return;
                    }
                    if (e.key === 'Escape') {
                      setShowSuggestions(false);
                      return;
                    }
                  }
                  if (e.key === 'Enter') lookupSymbol(symbol);
                }}
              />
              <button
                onClick={() => lookupSymbol(symbol)}
                disabled={lookupLoading}
                className="btn-secondary flex items-center gap-1.5 shrink-0"
              >
                <Search size={14} className={lookupLoading ? 'animate-pulse' : ''} />
                {lookupLoading ? '…' : 'Look up'}
              </button>
            </div>
            {lookupError && <p className="text-xs text-red-500 mt-1">{lookupError}</p>}

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-surface-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                {suggestions.map((s, i) => (
                  <li
                    key={s.symbol}
                    onMouseDown={() => selectSuggestion(s)}
                    onMouseEnter={() => setHighlightIdx(i)}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                      i === highlightIdx ? 'bg-brand-50' : 'hover:bg-surface-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-semibold text-slate-800 shrink-0">{s.symbol}</span>
                      <span className="text-xs text-slate-500 truncate">{s.companyName}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-slate-400 shrink-0 ml-2">
                      {s.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Stock info chip */}
          {stockInfo && (
            <div className="flex items-center justify-between bg-surface-50 border border-surface-200 rounded-lg px-4 py-2.5">
              <div>
                <p className="text-sm font-semibold text-slate-800">{stockInfo.symbol}</p>
                <p className="text-xs text-slate-500">{stockInfo.companyName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">{fmt.currency(stockInfo.currentPrice)}</p>
                <p className={`text-xs font-medium ${stockInfo.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmt.percent(stockInfo.changePercent)} today
                </p>
              </div>
            </div>
          )}

          {/* Qty + Price */}
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
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Price per Share</label>
              <input
                type="number" min="0" step="0.01"
                className="input-field font-mono"
                placeholder="0.00"
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Transaction Date</label>
            <input
              type="date"
              className="input-field"
              value={date}
              max={today()}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes (optional)</label>
            <input
              className="input-field"
              placeholder="Add a note…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Total */}
          {total != null && (
            <div className="bg-surface-50 rounded-lg px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-500">Total {isBuy ? 'Cost' : 'Proceeds'}</span>
              <span className="font-semibold text-slate-800">{fmt.currency(total)}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white transition-all active:scale-95
              ${isBuy ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
              disabled:opacity-60`}
          >
            {submitting ? 'Processing…' : isBuy ? 'Confirm Buy' : 'Confirm Sell'}
          </button>
        </div>
      </div>
    </div>
  );
}
