import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import TransactionItem from "./TransactionItem";
import EmptyState from "@/components/ui/empty-state";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { AccountMovement } from "@/domain/entities/Transaction";
import { TransactionDataSource } from "@/data/datasources/supabase/TransactionDataSource";
import { TransactionRepository } from "@/data/repositories/TransactionRepository";
import { GetRecentTransactions } from "@/domain/usecases/transaction/GetRecentTransactions";
import { formatBalance } from "@/lib/formatters";

// Initialize dependencies
const transactionDataSource = new TransactionDataSource();
const transactionRepository = new TransactionRepository(transactionDataSource);
const getRecentTransactionsUseCase = new GetRecentTransactions(transactionRepository);

const TransactionsList = () => {
  const navigate = useNavigate();
  const { account } = useAuth();
  const [transactions, setTransactions] = useState<AccountMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account?.id) {
      loadTransactions();
    }
  }, [account?.id]);

  const loadTransactions = async () => {
    if (!account?.id) return;

    try {
      setLoading(true);
      const movements = await getRecentTransactionsUseCase.execute(account.id, 5);
      setTransactions(movements);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (movement: AccountMovement) => {
    if (movement.movement_type === 'income') return ArrowDownLeft;
    if (movement.movement_type === 'expense') return ArrowUpRight;
    return Receipt;
  };

  if (loading) {
    return (
      <section className="px-6 py-2 mt-2 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Últimos Movimientos</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </section>
    );
  }

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
      {transactions.length > 0 ? (
        <div className="flex flex-col gap-3">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.transaction_id}
              icon={getTransactionIcon(transaction)}
              title={transaction.counterpart_name || transaction.payment_reference || transaction.transaction_type_name}
              description={transaction.concept || new Date(transaction.created_at).toLocaleDateString()}
              amount={formatBalance(transaction.movement_type === 'income' ? transaction.income_amount : transaction.expense_amount)}
              type={transaction.movement_type === 'income' ? 'income' : 'expense'}
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
