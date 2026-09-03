import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { isWithinInterval } from "date-fns";
import { Eye, EyeOff, Receipt } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import SearchBar from "@/components/movements/SearchBar";
import FilterChips, { FilterType } from "@/components/movements/FilterChips";
import TransactionGroup, { Transaction } from "@/components/movements/TransactionGroup";
import TransactionReceiptModal, { TransactionDetails } from "@/components/movements/TransactionReceiptModal";
import { useAuth } from "@/contexts/AuthContext";
import { allTransactions, dateOrder } from "@/data/mockTransactions";
import { formatBalance } from "@/lib/formatters";
import { mockBalance } from "@/data/mockBalance";
import EmptyState from "@/components/ui/empty-state";

// Helper to parse dateGroup to actual Date for filtering
const parseDateGroup = (dateGroup: string): Date => {
  const currentYear = new Date().getFullYear();
  if (dateGroup.includes("Hoy")) {
    return new Date(currentYear, 9, 24);
  } else if (dateGroup.includes("Ayer")) {
    return new Date(currentYear, 9, 23);
  } else {
    const parts = dateGroup.split(" ");
    const day = parseInt(parts[0]);
    return new Date(currentYear, 9, day);
  }
};

const Movements = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null);

  // Clear filters when leaving the page
  useEffect(() => {
    return () => {
      setDateRange(undefined);
      setActiveFilter("todos");
    };
  }, [location.pathname]);

  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Filter by type
    if (activeFilter === "ingresos") {
      filtered = filtered.filter((t) => t.type === "income");
    } else if (activeFilter === "egresos") {
      filtered = filtered.filter((t) => t.type === "expense");
    }

    // Filter by date range
    if (activeFilter === "fechas" && dateRange?.from) {
      filtered = filtered.filter((t) => {
        const transactionDate = parseDateGroup(t.dateGroup);
        if (dateRange.to) {
          return isWithinInterval(transactionDate, {
            start: dateRange.from!,
            end: dateRange.to,
          });
        }
        return transactionDate.toDateString() === dateRange.from!.toDateString();
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.amount.toLowerCase().includes(query) ||
          t.dateGroup.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activeFilter, searchQuery, dateRange]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((t) => {
      if (!groups[t.dateGroup]) {
        groups[t.dateGroup] = [];
      }
      groups[t.dateGroup].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  const handleTransactionClick = (transaction: Transaction & { dateGroup: string }) => {
    setSelectedTransaction(transaction as TransactionDetails);
  };

  return (
    <AppLayout>
      <GlobalHeader 
        title="Movimientos" 
        showBackButton
        showAvatar
        userName={user?.name || "Usuario"}
      />

      {/* Balance display */}
      <div className="px-4 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Saldo disponible</p>
            <p className="text-2xl font-bold text-foreground">
              {showBalance ? formatBalance(mockBalance.available) : "••••••"}
            </p>
          </div>
          <button 
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            {showBalance ? (
              <EyeOff className="size-5 text-muted-foreground" />
            ) : (
              <Eye className="size-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Sticky search and filters */}
      <div className="sticky top-[60px] z-20 bg-background/95 backdrop-blur-md pb-2 border-b border-border">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <FilterChips
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-2 bg-background">
        {dateOrder.map((dateGroup) => {
          const transactions = groupedTransactions[dateGroup];
          if (!transactions || transactions.length === 0) return null;
          return (
            <TransactionGroup
              key={dateGroup}
              dateLabel={dateGroup}
              transactions={transactions}
              onTransactionClick={handleTransactionClick}
            />
          );
        })}

        {filteredTransactions.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="Sin movimientos"
            description={
              searchQuery || activeFilter !== "todos"
                ? "No encontramos resultados con esos filtros"
                : "Aún no tienes movimientos registrados"
            }
          />
        )}

        {filteredTransactions.length > 0 && (
          <div className="py-4 flex justify-center">
            <span className="text-muted-foreground text-2xl font-black opacity-20">
              . . .
            </span>
          </div>
        )}
      </div>

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </AppLayout>
  );
};

export default Movements;
