import { useState, useMemo } from "react";
import { format, subDays, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import AppLayout from "@/components/layout/AppLayout";
import GlobalHeader from "@/components/layout/GlobalHeader";
import TimeRangeTabs from "@/components/statistics/TimeRangeTabs";
import CustomDateRangePicker from "@/components/statistics/CustomDateRangePicker";
import SummaryCards from "@/components/statistics/SummaryCards";
import BalanceChart from "@/components/statistics/BalanceChart";
import { useAuth } from "@/contexts/AuthContext";
import { useEstadisticas } from "@/hooks/useStatistics";
import { useSaldo } from "@/hooks/useAccount";

const Statistics = () => {
  const { user } = useAuth();
  const [selectedRange, setSelectedRange] = useState("1d");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [appliedCustomRange, setAppliedCustomRange] = useState<{ start: Date; end: Date } | null>(null);

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

  const { data: estadisticas, isLoading } = useEstadisticas(dateRange.start, dateRange.end);
  const { saldo } = useSaldo();

  const chartData = estadisticas?.chartData ?? [];
  const summaryData = estadisticas?.resumen ?? {
    income: 0,
    expenses: 0,
    incomeChange: 0,
    expensesChange: 0,
    balance: 0,
    balanceChange: 0,
  };

  // El saldo actual es el de la cuenta, no el último punto del gráfico: el
  // gráfico se reconstruye hacia atrás y su último punto es una derivación.
  const currentBalance = saldo.available;

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
        userName={user?.name || "Usuario"}
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

        <SummaryCards data={summaryData} />

        <BalanceChart
          data={chartData}
          currentBalance={currentBalance}
          balanceChange={summaryData.balanceChange}
          rangeLabel={getRangeLabel()}
          lastUpdated={format(new Date(), "HH:mm", { locale: es })}
        />
      </div>
    </AppLayout>
  );
};

export default Statistics;
