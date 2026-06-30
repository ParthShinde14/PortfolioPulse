import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchCatalog, getStockSelection } from '../../api/client';
import type { StockCatalogItem, StockSelection } from '../../types';

interface Props {
  value: string;
  onChange: (symbol: string) => void;
  /** Fired once full catalog + live-quote details are resolved for a selection. */
  onSelect: (selection: StockSelection) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function StockSelector({ value, onChange, onSelect, placeholder, autoFocus }: Props) {
  const [results, setResults] = useState<StockCatalogItem[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [error, setError] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = value.trim();
    if (query.length < 1) {
      setResults([]);
      setOpen(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchCatalog(query, 10);
        setResults(res);
        setOpen(res.length > 0);
        setHighlightIdx(-1);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const selectStock = async (item: StockCatalogItem) => {
    skipNextSearch.current = true;
    onChange(item.symbol);
    setOpen(false);
    setResults([]);
    setError('');
    setResolving(true);
    try {
      const selection = await getStockSelection(item.symbol);
      onSelect(selection);
    } catch (e: any) {
      setError(e.message || 'Could not load stock details');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus={autoFocus}
          className="input-field pl-9 pr-9 font-mono uppercase"
          placeholder={placeholder ?? 'Search symbol or company…'}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (!open || results.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightIdx((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && highlightIdx >= 0) {
              e.preventDefault();
              selectStock(results[highlightIdx]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        {(searching || resolving) && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && results.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-surface-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {results.map((item, i) => (
            <li
              key={item.symbol}
              onMouseDown={() => selectStock(item)}
              onMouseEnter={() => setHighlightIdx(i)}
              className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-colors ${
                i === highlightIdx ? 'bg-brand-50' : 'hover:bg-surface-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs font-semibold text-slate-800 shrink-0">
                  {item.symbol}
                </span>
                <span className="text-xs text-slate-500 truncate">{item.companyName}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.sector && (
                  <span className="text-[10px] text-slate-400 hidden sm:inline">{item.sector}</span>
                )}
                <span className="text-[10px] uppercase tracking-wide text-slate-400 bg-surface-100 px-1.5 py-0.5 rounded">
                  {item.exchange ?? '—'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
