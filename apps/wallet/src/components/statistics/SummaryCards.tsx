import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

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
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border transition-all duration-300">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          Total Ingresos
        </p>
        <p className="text-xl font-bold text-foreground">
          {formatCurrency(data.income, { compact: true })}
        </p>
      </div>

      {/* Expenses Card */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border transition-all duration-300">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          Total Egresos
        </p>
        <p className="text-xl font-bold text-foreground">
          {formatCurrency(data.expenses, { compact: true })}
        </p>
      </div>
    </div>
  );
};

export default SummaryCards;
