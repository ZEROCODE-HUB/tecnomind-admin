import { useNavigate } from "react-router-dom";
import { Receipt } from "lucide-react";
import TransactionItem from "./TransactionItem";
import { dashboardTransactions } from "@/data/mockTransactions";
import EmptyState from "@/components/ui/empty-state";

const TransactionsList = () => {
  const navigate = useNavigate();

  return (
    <section className="px-6 py-2 mt-2 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Últimos Movimientos</h3>
        <button 
          onClick={() => navigate("/movements")}
          className="text-accent text-sm font-medium hover:underline"
        >
          Ver todo
        </button>
      </div>
      {dashboardTransactions.length > 0 ? (
        <div className="flex flex-col gap-3">
          {dashboardTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              icon={transaction.icon}
              title={transaction.title}
              description={transaction.description}
              amount={transaction.amount}
              type={transaction.type}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Receipt}
          title="Sin movimientos"
          description="Aún no tienes movimientos registrados"
          className="py-8"
        />
      )}
    </section>
  );
};

export default TransactionsList;