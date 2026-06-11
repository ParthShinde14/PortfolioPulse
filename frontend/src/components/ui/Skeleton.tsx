interface Props { rows?: number; cols?: number }

export function TableSkeleton({ rows = 6, cols = 6 }: Props) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3 border-b border-surface-100">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 bg-surface-200 rounded animate-pulse"
              style={{ width: `${[20, 18, 12, 14, 12, 10][c] ?? 12}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="stat-card space-y-3">
      <div className="h-3 w-20 bg-surface-200 rounded animate-pulse" />
      <div className="h-7 w-28 bg-surface-200 rounded animate-pulse" />
      <div className="h-3 w-16 bg-surface-200 rounded animate-pulse" />
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="bg-surface-100 rounded-xl animate-pulse"
      style={{ height }}
    />
  );
}
