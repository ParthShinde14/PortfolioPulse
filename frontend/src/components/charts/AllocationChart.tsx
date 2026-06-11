import {
  ResponsiveContainer, PieChart, Pie, Cell,
  Tooltip, Legend
} from 'recharts';
import type { AllocationItem } from '../../types';
import { fmt } from '../../utils/format';

interface Props {
  data: AllocationItem[];
  title?: string;
  height?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as AllocationItem;
  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-800 mb-1">{d.name}</p>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-5">
          <span className="text-slate-500">Value</span>
          <span className="font-medium">{fmt.currency(d.value)}</span>
        </div>
        <div className="flex justify-between gap-5">
          <span className="text-slate-500">Weight</span>
          <span className="font-semibold" style={{ color: d.color }}>{d.percentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

const renderCustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
      {payload.map((entry: any, i: number) => (
        <li key={i} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-slate-600">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

export default function AllocationChart({ data, height = 260 }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>
        No allocation data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderCustomLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
