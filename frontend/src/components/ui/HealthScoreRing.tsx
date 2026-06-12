interface Props {
  score: number;     // 0-100
  rating: string;
  size?: number;
}

const RATING_COLORS: Record<string, { stroke: string; text: string; bg: string }> = {
  Excellent: { stroke: '#059669', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  Good:      { stroke: '#3B82F6', text: 'text-blue-600',    bg: 'bg-blue-50'    },
  Fair:      { stroke: '#F59E0B', text: 'text-amber-600',   bg: 'bg-amber-50'   },
  Poor:      { stroke: '#DC2626', text: 'text-red-600',     bg: 'bg-red-50'     },
  'N/A':     { stroke: '#94A3B8', text: 'text-slate-400',   bg: 'bg-surface-100'},
};

export default function HealthScoreRing({ score, rating, size = 140 }: Props) {
  const colors = RATING_COLORS[rating] ?? RATING_COLORS['N/A'];
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke="#f1f5f9" strokeWidth={10}
          />
          <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={colors.stroke} strokeWidth={10}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-800">{score.toFixed(0)}</span>
          <span className="text-[11px] text-slate-400 -mt-0.5">/ 100</span>
        </div>
      </div>
      <span className={`mt-3 text-xs font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
        {rating}
      </span>
    </div>
  );
}
