import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowRight, Eye } from 'lucide-react';
import type { WatchlistItem } from '../../types';
import { fmt, profitClass } from '../../utils/format';
import EmptyState from './EmptyState';
import { CardSkeleton } from './Skeleton';

interface Props {
  items: WatchlistItem[];
  loading?: boolean;
}

export default function WatchlistPreview({ items, loading }: Props) {
  const preview = items.slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-brand-600" />
          <p className="section-title mb-0">Watchlist Preview</p>
        </div>
        <Link
          to="/watchlist"
          className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !preview.length ? (
        <EmptyState
          icon={Eye}
          title="No stocks watched yet"
          description="Add stocks to your watchlist to track them here."
        />
      ) : (
        <div className="space-y-1">
          {preview.map((item) => {
            const change = item.changePercent ?? 0;
            const TrendIcon = change >= 0 ? TrendingUp : TrendingDown;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between py-2.5 border-b border-surface-100 last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 font-mono text-xs">{item.symbol}</p>
                  <p className="text-slate-400 text-[11px] truncate max-w-[160px]">{item.companyName}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {item.currentPrice != null ? fmt.currency(item.currentPrice) : '—'}
                  </p>
                  <span className={`inline-flex items-center justify-end gap-0.5 text-xs font-medium ${profitClass(change)}`}>
                    <TrendIcon size={11} />
                    {fmt.percent(change)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
