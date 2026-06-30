import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';
import type { BenchmarkPoint } from '../../types';
import { fmt } from '../../utils/format';

interface Props {
  data: BenchmarkPoint[];
  benchmarkName: string;
}

const CustomTooltip = ({ active, payload, benchmarkName }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as BenchmarkPoint;
  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{fmt.date(d.date)}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-blue-600 font-medium">Portfolio</span>
          <span className="font-semibold text-slate-800">{d.portfolioIndexed.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">{benchmarkName}</span>
          <span className="font-medium text-slate-700">{d.benchmarkIndexed.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default function BenchmarkChart({ data, benchmarkName }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        No comparison data yet. Portfolio growth history is needed to compare against a benchmark.
      </div>
    );
  }

  const chartData = data.map((d) => ({ ...d, dateLabel: fmt.shortDate(d.date) }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => v.toFixed(0)}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip benchmarkName={benchmarkName} />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
        <Legend
          formatter={(value) => (value === 'portfolioIndexed' ? 'Portfolio' : benchmarkName)}
          wrapperStyle={{ fontSize: 12 }}
        />
        <ReferenceLine y={100} stroke="#cbd5e1" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="portfolioIndexed"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="benchmarkIndexed"
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
