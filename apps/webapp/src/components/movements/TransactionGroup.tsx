import { LucideIcon } from "lucide-react";
import TransactionCard from "./TransactionCard";

export interface Transaction {
  id: string;
  icon: LucideIcon;
  name: string;
  category: string;
  time: string;
  amount: string;
  type: "income" | "expense";
}

interface TransactionGroupProps {
  dateLabel: string;
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction & { dateGroup: string }) => void;
}

const TransactionGroup = ({ dateLabel, transactions, onTransactionClick }: TransactionGroupProps) => {
  if (transactions.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="sticky top-0 z-10 py-2 mb-1 bg-background/90 backdrop-blur-sm w-full">
        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
          {dateLabel}
        </h3>
      </div>
      {transactions.map((transaction) => (
        <TransactionCard
          key={transaction.id}
          icon={transaction.icon}
          name={transaction.name}
          category={transaction.category}
          time={transaction.time}
          amount={transaction.amount}
          type={transaction.type}
          onClick={() => onTransactionClick?.({ ...transaction, dateGroup: dateLabel })}
        />
      ))}
    </div>
  );
};

export default TransactionGroup;
