import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ReferenceLine
} from 'recharts';
import type { SectorExposure } from '../../types';

interface Props { data: SectorExposure[] }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as SectorExposure;
  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-800 mb-1">{d.sector}</p>
      <div className="flex justify-between gap-5">
        <span className="text-slate-500">Allocation</span>
        <span className="font-semibold" style={{ color: d.color }}>{d.percentage.toFixed(1)}%</span>
      </div>
      {d.warning && (
        <p className="text-red-600 font-medium mt-1.5">⚠ Exceeds 40% concentration threshold</p>
      )}
    </div>
  );
};

export default function SectorExposureChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        No sector data available.
      </div>
    );
  }

  // Reverse so largest sector renders at top in a horizontal bar chart
  const chartData = [...data].reverse();
  const height = Math.max(180, chartData.length * 42);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="sector"
          tick={{ fontSize: 12, fill: '#475569' }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <ReferenceLine x={40} stroke="#dc2626" strokeDasharray="4 4" strokeWidth={1}
          label={{ value: '40% threshold', position: 'top', fontSize: 10, fill: '#dc2626' }} />
        <Bar dataKey="percentage" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.warning ? '#dc2626' : entry.color} opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
