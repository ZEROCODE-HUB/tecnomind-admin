import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatBalance } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface SummaryData {
  income: number;
  expenses: number;
  incomeChange: number;
  expensesChange: number;
}

interface SummaryCardsProps {
  data: SummaryData;
}

const SummaryCards = ({ data }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Income Card */}
      <div className="bg-card rounded-3xl p-5 shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md group">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-0.5">
            Ingresos
          </p>
        </div>
        <div>
          <p className="text-2xl font-black text-foreground tracking-tight">
            {formatBalance(data.income)}
          </p>
        </div>
      </div>

      {/* Expenses Card */}
      <div className="bg-card rounded-3xl p-5 shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md group">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
            <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-0.5">
            Gastos
          </p>
        </div>
        <div>
          <p className="text-2xl font-black text-foreground tracking-tight">
            {formatBalance(data.expenses)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
