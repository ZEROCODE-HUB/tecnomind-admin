import { LucideIcon } from "lucide-react";

interface TransactionCardProps {
  icon: LucideIcon;
  name: string;
  category: string;
  time: string;
  amount: string;
  type: "income" | "expense";
  onClick?: () => void;
}

const TransactionCard = ({
  icon: Icon,
  name,
  category,
  time,
  amount,
  type,
  onClick,
}: TransactionCardProps) => {
  const isIncome = type === "income";

  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between py-3 border-b border-border group active:bg-muted rounded-lg px-2 -mx-2 transition-colors cursor-pointer min-h-[56px] hover:bg-muted/50"
    >
      <div className="flex items-center gap-4">
        <div
          className={`size-10 rounded-full flex items-center justify-center shrink-0 border ${
            isIncome
              ? "bg-accent/10 border-transparent"
              : "bg-muted border-border"
          }`}
        >
          <Icon
            className={`size-5 ${
              isIncome ? "text-accent" : "text-foreground"
            }`}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-foreground text-base font-semibold">
            {name}
          </span>
          <span className="text-muted-foreground text-xs font-medium">
            {category} • {time}
          </span>
        </div>
      </div>
      <span
        className={`font-bold text-base ${
          isIncome ? "text-success" : "text-foreground"
        }`}
      >
        {amount}
      </span>
    </div>
  );
};

export default TransactionCard;
