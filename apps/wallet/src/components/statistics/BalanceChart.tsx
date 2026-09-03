import { MoreHorizontal } from "lucide-react";
import { 
  AreaChart,
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
        {formatCurrency(payload[0].value, { compact: true })}
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
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Balance Neto
            </h3>
            <span className="text-3xl font-bold text-foreground transition-all duration-300">
              {formatBalance(currentBalance)}
            </span>
          </div>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(214, 84%, 56%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(214, 84%, 56%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="hsl(210, 20%, 90%)" 
            />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(213, 30%, 45%)', fontSize: 12 }}
              dy={10}
            />
            <YAxis hide />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: 'hsl(214, 84%, 56%)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(214, 84%, 56%)"
              strokeWidth={2.5}
              fill="url(#colorBalance)"
              dot={false}
              activeDot={{ 
                r: 6, 
                fill: 'hsl(214, 84%, 56%)', 
                stroke: 'white', 
                strokeWidth: 3 
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="px-5 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {rangeLabel} • Actualizado {lastUpdated}
        </p>
      </div>
    </div>
  );
};

export default BalanceChart;
