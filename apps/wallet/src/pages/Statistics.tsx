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
import { generateChartData, generateSummaryData } from "@/data/statisticsData";

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

  const chartData = useMemo(() => {
    return generateChartData(dateRange.start, dateRange.end);
  }, [dateRange]);

  const summaryData = useMemo(() => {
    return generateSummaryData(
      selectedRange, 
      appliedCustomRange?.start, 
      appliedCustomRange?.end
    );
  }, [selectedRange, appliedCustomRange]);

  const currentBalance = chartData[chartData.length - 1]?.value || 0;

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
