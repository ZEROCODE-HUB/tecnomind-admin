import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { isWithinInterval } from "date-fns";
import { Eye, EyeOff, Receipt, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import SearchBar from "@/components/movements/SearchBar";
import FilterChips, { FilterType } from "@/components/movements/FilterChips";
import TransactionGroup, { Transaction } from "@/components/movements/TransactionGroup";
import TransactionReceiptModal, { TransactionDetails } from "@/components/movements/TransactionReceiptModal";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { formatBalance } from "@/lib/formatters";
import EmptyState from "@/components/ui/empty-state";
import { AccountMovement } from "@/domain/entities/Transaction";
import { TransactionDataSource } from "@/data/datasources/supabase/TransactionDataSource";
import { TransactionRepository } from "@/data/repositories/TransactionRepository";
import { GetAccountMovements } from "@/domain/usecases/transaction/GetAccountMovements";

// Initialize dependencies
const transactionDataSource = new TransactionDataSource();
const transactionRepository = new TransactionRepository(transactionDataSource);
const getAccountMovementsUseCase = new GetAccountMovements(transactionRepository);

const Movements = () => {
  const location = useLocation();
  const { user, account } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null);
  const [movements, setMovements] = useState<AccountMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fullName = user ? `${user.first_name} ${user.last_name}` : "Usuario";

  // Load movements
  useEffect(() => {
    if (account?.id) {
      loadMovements();
    }
  }, [account?.id]);

  const loadMovements = async () => {
    if (!account?.id) return;

    try {
      setLoading(true);
      const data = await getAccountMovementsUseCase.execute({
        accountId: account.id,
        limit: 100,
        offset: 0
      });


      setMovements(data);
    } catch (error) {
      console.error("Error loading movements:", error);
    } finally {
      setLoading(false);
    }
  };

  // Clear filters when leaving the page
  useEffect(() => {
    return () => {
      setDateRange(undefined);
      setActiveFilter("todos");
    };
  }, [location.pathname]);

  const filteredMovements = useMemo(() => {
    let filtered = movements;

    // Filter by type
    if (activeFilter === "ingresos") {
      filtered = filtered.filter((m) => m.movement_type === "income");
    } else if (activeFilter === "egresos") {
      filtered = filtered.filter((m) => m.movement_type === "expense");
    }

    // Filter by date range
    if (activeFilter === "fechas" && dateRange?.from) {
      filtered = filtered.filter((m) => {
        const movementDate = new Date(m.created_at);
        if (dateRange.to) {
          return isWithinInterval(movementDate, {
            start: dateRange.from!,
            end: dateRange.to,
          });
        }
        return movementDate.toDateString() === dateRange.from!.toDateString();
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.counterpart_name?.toLowerCase().includes(query) ||
          m.transaction_type_name.toLowerCase().includes(query) ||
          m.concept?.toLowerCase().includes(query) ||
          m.reference_number.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [movements, activeFilter, searchQuery, dateRange]);

  // Group by date
  const groupedMovements = useMemo(() => {
    const groups: Record<string, AccountMovement[]> = {};
    filteredMovements.forEach((m) => {
      const date = new Date(m.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel: string;
      if (date.toDateString() === today.toDateString()) {
        dateLabel = "Hoy";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateLabel = "Ayer";
      } else {
        dateLabel = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
      }

      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(m);
    });
    return groups;
  }, [filteredMovements]);

  const getTransactionIcon = (movement: AccountMovement) => {
    if (movement.movement_type === 'income') return ArrowDownLeft;
    if (movement.movement_type === 'expense') return ArrowUpRight;
    return Receipt;
  };

  const handleTransactionClick = async (movement: AccountMovement, dateGroup: string) => {
    // 1. Set initial data from the view
    const initialDetails: TransactionDetails = {
      id: movement.reference_number || movement.transaction_id,
      icon: getTransactionIcon(movement),
      name: movement.counterpart_name || movement.payment_reference || movement.transaction_type_name,
      category: movement.transaction_type_name,
      time: new Date(movement.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      amount: formatBalance(movement.movement_type === 'income' ? movement.income_amount : movement.expense_amount),
      type: movement.movement_type === 'income' ? 'income' : 'expense',
      dateGroup,
      concept: movement.concept,
    };
    setSelectedTransaction(initialDetails);

    // 2. Fetch full details from 'transactions' table to get missing fields like payment_reference (alias)
    try {
      const fullDetails = await transactionDataSource.getTransactionById(movement.transaction_id);
      if (fullDetails) {


        // Determine the best name to show
        // Priority: internal counterpart_name > payment_reference (alias) > external_holder > ...
        const bestName =
          movement.counterpart_name ||
          fullDetails.payment_reference ||
          fullDetails.external_alias ||
          fullDetails.external_holder_name ||
          movement.transaction_type_name;

        const bestConcept =
          movement.concept ||
          fullDetails.concept ||
          movement.category;

        setSelectedTransaction(prev => prev ? ({
          ...prev,
          name: bestName,
          concept: bestConcept
        }) : null);
      }
    } catch (e) {
      console.error('Error fetching extra details', e);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <GlobalHeader
          title="Movimientos"
          showBackButton
          showAvatar
          userName={fullName}
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <GlobalHeader
        title="Movimientos"
        showBackButton
        showAvatar
        userName={fullName}
      />

      {/* Balance display */}
      <div className="px-4 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Saldo disponible</p>
            <p className="text-2xl font-bold text-foreground">
              {showBalance ? formatBalance(account?.balance || 0) : "••••••"}
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
        {Object.entries(groupedMovements).map(([dateLabel, movementsInGroup]) => (
          <TransactionGroup
            key={dateLabel}
            dateLabel={dateLabel}
            transactions={movementsInGroup.map(m => ({
              id: m.reference_number || m.transaction_id,
              icon: getTransactionIcon(m),
              name: m.counterpart_name || m.payment_reference || m.transaction_type_name,
              category: m.transaction_type_name,
              time: new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
              amount: formatBalance(m.movement_type === 'income' ? m.income_amount : m.expense_amount),
              type: m.movement_type === 'income' ? 'income' : 'expense',
            }))}
            onTransactionClick={(t) => {
              const movement = movementsInGroup.find(m => (m.reference_number || m.transaction_id) === t.id);
              if (movement) handleTransactionClick(movement, dateLabel);
            }}
          />
        ))}

        {filteredMovements.length === 0 && (
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

        {filteredMovements.length > 0 && (
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
