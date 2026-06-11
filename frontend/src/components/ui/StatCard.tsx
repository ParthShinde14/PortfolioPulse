import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { fmt, profitClass } from '../../utils/format';

interface Props {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  loading?: boolean;
}

export default function StatCard({
  label, value, change, changeLabel, icon: Icon, iconColor = 'bg-brand-50 text-brand-600', loading
}: Props) {
  const Arrow =
    change == null ? null :
    change > 0    ? TrendingUp :
    change < 0    ? TrendingDown : Minus;

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
          {loading ? (
            <div className="h-7 w-32 bg-surface-200 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold text-slate-800 tracking-tight">{value}</p>
          )}
          {change != null && !loading && (
            <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${profitClass(change)}`}>
              {Arrow && <Arrow size={12} strokeWidth={2.5} />}
              <span>{fmt.percent(change)}</span>
              {changeLabel && <span className="text-slate-400 font-normal">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-3 ${iconColor}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
