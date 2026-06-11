import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import type { PortfolioSnapshot } from '../../types';
import { fmt } from '../../utils/format';

interface Props { data: PortfolioSnapshot[] }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as PortfolioSnapshot;
  const isProfit = d.profitLoss >= 0;
  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{fmt.date(d.snapshotDate)}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Portfolio Value</span>
          <span className="font-semibold text-slate-800">{fmt.currency(d.portfolioValue)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Invested</span>
          <span className="font-medium text-slate-700">{fmt.currency(d.totalInvestment)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">P&L</span>
          <span className={`font-semibold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
            {fmt.currency(d.profitLoss)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function GrowthChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        No growth data yet. Add stocks to see your portfolio trend.
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    date: fmt.shortDate(d.snapshotDate),
  }));

  const allValues = data.map(d => d.portfolioValue);
  const minVal = Math.min(...allValues) * 0.98;
  const maxVal = Math.max(...allValues) * 1.02;
  const lastItem = data[data.length - 1];
  const isOverallProfit = lastItem ? lastItem.profitLoss >= 0 : true;
  const strokeColor = isOverallProfit ? '#059669' : '#dc2626';
  const fillId = isOverallProfit ? 'growthGreen' : 'growthRed';
  const fillStart = isOverallProfit ? '#059669' : '#dc2626';

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={fillStart} stopOpacity={0.15} />
            <stop offset="95%" stopColor={fillStart} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minVal, maxVal]}
          tickFormatter={v => fmt.currency(v, true)}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
        {data.length > 0 && (
          <ReferenceLine
            y={data[0].totalInvestment}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: 'Cost Basis', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }}
          />
        )}
        <Area
          type="monotone"
          dataKey="portfolioValue"
          stroke={strokeColor}
          strokeWidth={2}
          fill={`url(#${fillId})`}
          dot={data.length <= 10 ? { fill: strokeColor, r: 3, strokeWidth: 0 } : false}
          activeDot={{ r: 5, fill: strokeColor, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
