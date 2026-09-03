import { useState, useMemo, useEffect } from "react";
import { format, subDays, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import TimeRangeTabs from "@/components/statistics/TimeRangeTabs";
import CustomDateRangePicker from "@/components/statistics/CustomDateRangePicker";
import SummaryCards from "@/components/statistics/SummaryCards";
import BalanceChart from "@/components/statistics/BalanceChart";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { TransactionDataSource } from "@/data/datasources/supabase/TransactionDataSource";
import { TransactionRepository } from "@/data/repositories/TransactionRepository";
import { GetAccountStatistics } from "@/domain/usecases/transaction/GetAccountStatistics";
import { GetBalanceTimeline } from "@/domain/usecases/transaction/GetBalanceTimeline";

const Statistics = () => {
  const { user, account } = useAuth();
  const [selectedRange, setSelectedRange] = useState("1d");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [appliedCustomRange, setAppliedCustomRange] = useState<{ start: Date; end: Date } | null>(null);

  const [summaryData, setSummaryData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize UseCases
  const transactionDataSource = useMemo(() => new TransactionDataSource(), []);
  const transactionRepository = useMemo(() => new TransactionRepository(transactionDataSource), [transactionDataSource]);
  const getAccountStatisticsUC = useMemo(() => new GetAccountStatistics(transactionRepository), [transactionRepository]);
  const getBalanceTimelineUC = useMemo(() => new GetBalanceTimeline(transactionRepository), [transactionRepository]);

  const dateRange = useMemo(() => {
    const now = new Date();

    switch (selectedRange) {
      case "1d":
        return { start: subDays(now, 1), end: now };
      case "7d":
        return { start: subDays(now, 7), end: now };
      case "1m":
        return { start: subMonths(now, 1), end: now };
      case "custom":
        if (appliedCustomRange) {
          return { start: appliedCustomRange.start, end: appliedCustomRange.end };
        }
        return { start: subDays(now, 7), end: now };
      default:
        return { start: subDays(now, 1), end: now };
    }
  }, [selectedRange, appliedCustomRange]);

  useEffect(() => {
    const loadData = async () => {
      if (!account) return;

      setIsLoading(true);
      try {
        const now = new Date();
        const start = dateRange.start;
        const end = dateRange.end;

        // 1. Obtener todos los movimientos desde 'start' hasta 'ahora'
        // Necesitamos los movimientos post-periodo para calcular el balance exacto en 'end'
        const allMovementsSinceStart = await transactionDataSource.getMovementsInRange(
          account.id,
          start,
          now
        );

        // 2. Separar movimientos en 'dentro del rango' y 'después del rango'
        const movementsInRange = allMovementsSinceStart.filter(m =>
          new Date(m.completed_at) <= end
        );
        const movementsAfterRange = allMovementsSinceStart.filter(m =>
          new Date(m.completed_at) > end
        );

        // 3. Calcular ingresos y egresos del periodo
        let periodIncome = 0;
        let periodExpense = 0;
        movementsInRange.forEach(m => {
          periodIncome += Number(m.income_amount || 0);
          periodExpense += Number(m.expense_amount || 0);
        });

        // 4. Calcular balance al FINAL del periodo (end)
        // Balance Final Periodo = Balance Actual - Movimientos Netos ocurridos después
        const netAfter = movementsAfterRange.reduce((acc, m) =>
          acc + (Number(m.income_amount) - Number(m.expense_amount)), 0
        );
        let runningBalance = account.balance - netAfter;

        // 5. Generar la serie de tiempo (Buckets)
        const isHourly = selectedRange === "1d";
        const buckets: any[] = [];

        if (isHourly) {
          // Últimas 24 horas, punto por hora
          for (let i = 24; i >= 0; i--) {
            const bucketDate = new Date(end);
            bucketDate.setHours(bucketDate.getHours() - i, 0, 0, 0);
            buckets.push({ date: bucketDate, net: 0 });
          }
        } else {
          // Dias
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          for (let i = diffDays; i >= 0; i--) {
            const bucketDate = new Date(end);
            bucketDate.setDate(bucketDate.getDate() - i);
            bucketDate.setHours(0, 0, 0, 0);
            buckets.push({ date: bucketDate, net: 0 });
          }
        }

        // 6. Asignar movimientos a buckets (Neto por bucket)
        movementsInRange.forEach(m => {
          const mDate = new Date(m.completed_at);
          const bucket = buckets.find((b, idx) => {
            const nextB = buckets[idx + 1];
            if (isHourly) {
              return mDate >= b.date && (!nextB || mDate < nextB.date);
            } else {
              return mDate.toDateString() === b.date.toDateString();
            }
          });
          if (bucket) {
            bucket.net += (Number(m.income_amount) - Number(m.expense_amount));
          }
        });

        // 7. Reconstruir hacia atrás o hacia adelante
        // Vamos a calcular el balance inicial del primer bucket y luego sumar
        const totalNetInRange = periodIncome - periodExpense;
        let currentIterBalance = runningBalance - totalNetInRange;

        const processedChartData = buckets.map(b => {
          currentIterBalance += b.net;
          return {
            date: isHourly
              ? format(b.date, "HH:mm", { locale: es })
              : format(b.date, "d MMM", { locale: es }),
            value: currentIterBalance,
            fullDate: b.date
          };
        });

        setChartData(processedChartData);

        // 8. Calcular el cambio porcentual
        const firstVal = processedChartData[0]?.value || 0;
        const lastVal = processedChartData[processedChartData.length - 1]?.value || 0;
        const bChange = firstVal !== 0 ? ((lastVal - firstVal) / Math.abs(firstVal)) * 100 : (lastVal !== 0 ? 100 : 0);

        setSummaryData({
          income: periodIncome,
          expenses: periodExpense,
          incomeChange: 0,
          expensesChange: 0,
          balanceChange: bChange,
        });

      } catch (error) {
        console.error("❌ Error loading stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [account, dateRange, selectedRange]);

  const currentBalance = account?.balance || 0;

  const handleRangeChange = (rangeId: string) => {
    setSelectedRange(rangeId);
    if (rangeId !== "custom") {
      setStartDate(undefined);
      setEndDate(undefined);
      setAppliedCustomRange(null);
    }
  };

  const handleApplyCustomRange = () => {
    if (startDate && endDate) {
      setAppliedCustomRange({ start: startDate, end: endDate });
    }
  };

  const getRangeLabel = () => {
    if (selectedRange === "custom" && appliedCustomRange) {
      return `${format(appliedCustomRange.start, "d MMM", { locale: es })} - ${format(appliedCustomRange.end, "d MMM", { locale: es })}`;
    }
    const labels: Record<string, string> = {
      "1d": "Últimas 24 horas",
      "7d": "Últimos 7 días",
      "1m": "Último mes",
    };
    return labels[selectedRange] || "";
  };

  return (
    <AppLayout>
      <GlobalHeader
        title="Estadísticas"
        showBackButton
        showAvatar
        userName={user ? `${user.first_name} ${user.last_name}` : "Usuario"}
      />

      <div className="p-4 space-y-5 pb-24 md:pb-8">
        <TimeRangeTabs
          selectedRange={selectedRange}
          onRangeChange={handleRangeChange}
        />

        {selectedRange === "custom" && (
          <CustomDateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onApply={handleApplyCustomRange}
          />
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground animate-pulse">Cargando estadísticas...</p>
          </div>
        ) : (
          <>
            {summaryData && <SummaryCards data={summaryData} />}

            <BalanceChart
              data={chartData}
              currentBalance={currentBalance}
              balanceChange={summaryData?.balanceChange || 0}
              rangeLabel={getRangeLabel()}
              lastUpdated={format(new Date(), "HH:mm", { locale: es })}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Statistics;
