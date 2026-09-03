import { useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";
import { formatCurrency, formatBalance } from "@/lib/formatters";

interface ChartDataPoint {
  date: string;
  value: number;
  fullDate: Date;
}

interface BalanceChartProps {
  data: ChartDataPoint[];
  currentBalance: number;
  balanceChange: number;
  rangeLabel: string;
  lastUpdated: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1a3a5c] border border-border shadow-xl p-3 rounded-xl animate-in fade-in zoom-in duration-200">
        <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>
        <p className="text-sm font-bold text-foreground">
          {formatBalance(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const BalanceChart = ({
  data,
  currentBalance,
  balanceChange,
  rangeLabel,
  lastUpdated
}: BalanceChartProps) => {
  // Lógica para no saturar el eje X
  const selectedInterval = useMemo(() => {
    if (data.length > 20) return Math.floor(data.length / 6);
    if (data.length > 10) return 2;
    return 0;
  }, [data.length]);

  return (
    <div className="bg-card rounded-3xl shadow-lg border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Balance Proyectado
              </h3>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-foreground tracking-tight">
                {formatBalance(currentBalance)}
              </span>
            </div>
          </div>
          <button className="p-2 hover:bg-muted rounded-xl transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full pr-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(214, 84%, 56%)" stopOpacity={0.25} />
                <stop offset="40%" stopColor="hsl(214, 84%, 56%)" stopOpacity={0.10} />
                <stop offset="95%" stopColor="hsl(214, 84%, 56%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="hsla(var(--border), 0.4)"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 500 }}
              interval={selectedInterval}
              padding={{ left: 10, right: 10 }}
              dy={10}
            />
            <YAxis
              hide
              domain={['dataMin - 50', 'dataMax + 50']}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'hsl(214, 84%, 56%)', strokeWidth: 1.5, strokeDasharray: '5 5' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(214, 84%, 56%)"
              strokeWidth={3.5}
              fill="url(#colorBalance)"
              animationDuration={1500}
              dot={false}
              activeDot={{
                r: 6,
                fill: 'hsl(214, 84%, 56%)',
                stroke: 'white',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="px-6 py-4 bg-muted/30 border-t border-border/50 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
          {rangeLabel}
        </p>
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
          Actualizado {lastUpdated}
        </p>
      </div>
    </div>
  );
};

export default BalanceChart;
