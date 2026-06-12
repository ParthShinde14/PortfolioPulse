import { AlertTriangle, Info, CheckCircle2, Lightbulb } from 'lucide-react';
import type { Insight, InsightType } from '../../types';

const STYLES: Record<InsightType, { icon: typeof AlertTriangle; bg: string; iconColor: string; border: string }> = {
  WARNING: { icon: AlertTriangle, bg: 'bg-red-50',     iconColor: 'text-red-600',     border: 'border-red-100'     },
  INFO:    { icon: Info,          bg: 'bg-blue-50',    iconColor: 'text-blue-600',    border: 'border-blue-100'    },
  SUCCESS: { icon: CheckCircle2,  bg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-emerald-100' },
  TIP:     { icon: Lightbulb,     bg: 'bg-amber-50',   iconColor: 'text-amber-600',   border: 'border-amber-100'   },
};

export default function InsightCard({ insight }: { insight: Insight }) {
  const style = STYLES[insight.type] ?? STYLES.INFO;
  const Icon = style.icon;

  return (
    <div className={`flex items-start gap-3 rounded-xl border ${style.border} ${style.bg} px-4 py-3`}>
      <div className={`shrink-0 mt-0.5 ${style.iconColor}`}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-slate-800">{insight.title}</p>
          <span className="text-[10px] uppercase tracking-wide font-medium text-slate-400 bg-white/70 px-1.5 py-0.5 rounded">
            {insight.category}
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">{insight.message}</p>
      </div>
    </div>
  );
}
