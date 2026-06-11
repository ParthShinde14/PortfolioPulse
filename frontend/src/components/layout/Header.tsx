import { RefreshCw } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, onRefresh, loading, actions }: Props) {
  return (
    <div className="h-16 bg-white border-b border-surface-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary flex items-center gap-1.5"
            title="Refresh data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}
