import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import type { Benchmark, BenchmarkKey } from '../../types';
import { fmt, profitClass } from '../../utils/format';
import BenchmarkChart from '../charts/BenchmarkChart';
import { ChartSkeleton } from './Skeleton';

interface Props {
  data: Benchmark | null;
  loading?: boolean;
  selected: BenchmarkKey;
  onSelect: (key: BenchmarkKey) => void;
}

export default function BenchmarkCard({ data, loading, selected, onSelect }: Props) {
  const options = data?.availableBenchmarks ?? [
    { key: 'SP500', name: 'S&P 500', symbol: 'SPY' },
    { key: 'NASDAQ', name: 'NASDAQ', symbol: 'QQQ' },
    { key: 'NIFTY50', name: 'NIFTY 50', symbol: '^NSEI' },
  ];

  const outperformed = (data?.outperformance ?? 0) >= 0;
  const OutIcon = outperformed ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-brand-600" />
          <p className="section-title mb-0">Portfolio vs Benchmark</p>
        </div>
        <div className="flex rounded-lg border border-surface-200 overflow-hidden text-xs font-medium">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onSelect(opt.key as BenchmarkKey)}
              className={`px-3 py-1.5 transition-colors ${
                selected === opt.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-surface-50'
              }`}
            >
              {opt.name}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <ChartSkeleton height={280} />
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Portfolio Return</p>
              <p className={`text-xl font-semibold ${profitClass(data.portfolioReturn)}`}>
                {fmt.percent(data.portfolioReturn)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">{data.benchmarkName}</p>
              <p className={`text-xl font-semibold ${profitClass(data.benchmarkReturn)}`}>
                {fmt.percent(data.benchmarkReturn)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">
                {outperformed ? 'Outperformed by' : 'Underperformed by'}
              </p>
              <p className={`text-xl font-semibold flex items-center gap-1 ${profitClass(data.outperformance)}`}>
                <OutIcon size={16} />
                {fmt.percent(Math.abs(data.outperformance))}
              </p>
            </div>
          </div>

          <BenchmarkChart data={data.growthSeries} benchmarkName={data.benchmarkName} />

          <p className="text-[11px] text-slate-400 mt-3">
            Portfolio return reflects all-time gain/loss vs. cost basis. Benchmark return is{' '}
            {data.benchmarkSymbol} ({data.benchmarkName}) change since your earliest tracked snapshot.
            Both series are indexed to 100 for comparison.
          </p>
        </>
      )}
    </div>
  );
}
