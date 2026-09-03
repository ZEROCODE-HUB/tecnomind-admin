import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { Eye, EyeOff, Receipt, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import SearchBar from "@/components/movements/SearchBar";
import FilterChips, { FilterType } from "@/components/movements/FilterChips";
import TransactionGroup, { Transaction } from "@/components/movements/TransactionGroup";
import TransactionReceiptModal, { TransactionDetails } from "@/components/movements/TransactionReceiptModal";
import { useAuth } from "@/contexts/AuthContext";
import { formatBalance } from "@/lib/formatters";
import { useSaldo } from "@/hooks/useAccount";
import { useMovimientos } from "@/hooks/useTransactions";
import EmptyState from "@/components/ui/empty-state";

const Movements = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null);

  const { saldo } = useSaldo();

  // El filtrado por tipo y por fecha lo hace el servidor; la búsqueda por
  // texto va en el hook, que cruza contraparte, concepto y referencia.
  const { data: movimientos, isLoading } = useMovimientos({
    tipo: activeFilter === "ingresos" ? "income" : activeFilter === "egresos" ? "expense" : "all",
    desde: activeFilter === "fechas" ? dateRange?.from : undefined,
    hasta: activeFilter === "fechas" ? dateRange?.to ?? dateRange?.from : undefined,
    busqueda: searchQuery,
  });

  // Clear filters when leaving the page
  useEffect(() => {
    return () => {
      setDateRange(undefined);
      setActiveFilter("todos");
    };
  }, [location.pathname]);

  const filteredTransactions = useMemo(() => movimientos ?? [], [movimientos]);

  // Los movimientos vienen ordenados por fecha descendente, así que el
  // orden en que aparecen los grupos ya es el correcto: no hace falta una
  // lista fija de fechas como la que usaban los datos mock.
  const { groupedTransactions, dateOrder } = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    const orden: string[] = [];
    for (const t of filteredTransactions) {
      const grupo = t.dateGroup ?? "";
      if (!groups[grupo]) {
        groups[grupo] = [];
        orden.push(grupo);
      }
      groups[grupo].push(t);
    }
    return { groupedTransactions: groups, dateOrder: orden };
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
              {showBalance ? formatBalance(saldo.available) : "••••••"}
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

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && filteredTransactions.length === 0 && (
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

        {!isLoading && filteredTransactions.length > 0 && (
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
