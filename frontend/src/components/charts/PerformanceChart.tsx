import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ReferenceLine
} from 'recharts';
import type { Holding } from '../../types';
import { fmt } from '../../utils/format';

interface Props { holdings: Holding[] }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-800 mb-1">{d.symbol}</p>
      <p className="text-slate-500 text-[11px] mb-2">{d.companyName}</p>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-5">
          <span className="text-slate-500">Return</span>
          <span className={`font-semibold ${d.profitLossPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {fmt.percent(d.profitLossPercent)}
          </span>
        </div>
        <div className="flex justify-between gap-5">
          <span className="text-slate-500">P&L</span>
          <span className="font-medium">{fmt.currency(d.profitLoss)}</span>
        </div>
      </div>
    </div>
  );
};

export default function PerformanceChart({ holdings }: Props) {
  if (!holdings.length) return null;

  const data = [...holdings]
    .sort((a, b) => b.profitLossPercent - a.profitLossPercent)
    .slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="symbol"
          tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
        <Bar dataKey="profitLossPercent" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.profitLossPercent >= 0 ? '#059669' : '#dc2626'}
              opacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
