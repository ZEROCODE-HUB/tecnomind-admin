import { LucideIcon } from "lucide-react";

interface TransactionItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  amount: string;
  type: "income" | "expense";
}

const TransactionItem = ({ icon: Icon, title, description, amount, type }: TransactionItemProps) => {
  const isIncome = type === "income";

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-sm hover:border-accent/20 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={`size-10 rounded-full flex items-center justify-center shrink-0 border ${isIncome ? "bg-accent/10 border-transparent" : "bg-muted border-border"
            }`}
        >
          <Icon className={`size-5 ${isIncome ? "text-accent" : "text-foreground"}`} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </div>
      <span className={`text-sm font-bold whitespace-nowrap shrink-0 ${isIncome ? "text-success" : "text-foreground"}`}>
        {amount}
      </span>
    </div>
  );
};

export default TransactionItem;
