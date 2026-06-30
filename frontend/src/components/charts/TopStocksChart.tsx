import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ReferenceLine
} from 'recharts';
import type { TradeStat } from '../../types';
import { fmt } from '../../utils/format';

interface Props {
  data: TradeStat[];
  variant: 'profit' | 'loss';
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as TradeStat;
  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-800 mb-1">{d.symbol}</p>
      <p className="text-slate-500 text-[11px] mb-2">{d.companyName}</p>
      <div className="flex justify-between gap-5">
        <span className="text-slate-500">Realized P&L</span>
        <span className={`font-semibold ${d.totalRealizedPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {fmt.currency(d.totalRealizedPnl)}
        </span>
      </div>
      <div className="flex justify-between gap-5">
        <span className="text-slate-500">Trades</span>
        <span className="font-medium text-slate-700">{d.tradeCount}</span>
      </div>
    </div>
  );
};

export default function TopStocksChart({ data, variant }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        No {variant === 'profit' ? 'profitable' : 'losing'} closed trades yet.
      </div>
    );
  }

  const chartData = variant === 'loss' ? [...data].reverse() : data;
  const height = Math.max(140, chartData.length * 40);
  const color = variant === 'profit' ? '#059669' : '#dc2626';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => fmt.currency(v, true)}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="symbol"
          tick={{ fontSize: 12, fill: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1} />
        <Bar dataKey="totalRealizedPnl" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={color} opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
