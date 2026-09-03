import { format, differenceInDays, eachDayOfInterval, eachWeekOfInterval } from "date-fns";
import { es } from "date-fns/locale";

// Generate mock data based on date range
export const generateChartData = (startDate: Date, endDate: Date) => {
  const daysDiff = differenceInDays(endDate, startDate);
  
  let dates: Date[];
  if (daysDiff <= 1) {
    dates = Array.from({ length: 24 }, (_, i) => {
      const d = new Date(startDate);
      d.setHours(i, 0, 0, 0);
      return d;
    });
  } else if (daysDiff <= 14) {
    dates = eachDayOfInterval({ start: startDate, end: endDate });
  } else {
    dates = eachWeekOfInterval({ start: startDate, end: endDate });
  }

  return dates.map((date, index) => {
    const seed = date.getTime();
    const baseValue = 150000 + (seed % 100000);
    const variation = Math.sin(index * 0.5) * 80000 + Math.cos(index * 0.3) * 50000;
    const value = Math.max(50000, baseValue + variation);
    
    let label: string;
    if (daysDiff <= 1) {
      label = format(date, "HH:mm", { locale: es });
    } else {
      label = format(date, "d MMM", { locale: es });
    }
    
    return { date: label, value: Math.round(value), fullDate: date };
  });
};

// Generate summary data based on range
export const generateSummaryData = (range: string, customStart?: Date, customEnd?: Date) => {
  const multipliers: Record<string, number> = {
    "1d": 0.1,
    "7d": 0.5,
    "1m": 1,
    "custom": 0.7,
  };
  
  let actualMult = multipliers[range] || 1;
  if (range === "custom" && customStart && customEnd) {
    const days = differenceInDays(customEnd, customStart);
    actualMult = Math.min(2, days / 30);
  }
  
  const baseIncome = 1250000 * actualMult;
  const baseExpenses = 840500 * actualMult;
  const incomeChange = range === "1d" ? 3.2 : range === "7d" ? 8.5 : range === "1m" ? 12 : 15.3;
  const expensesChange = range === "1d" ? 1.8 : range === "7d" ? 3.2 : range === "1m" ? 5 : 7.8;
  
  return {
    income: baseIncome,
    expenses: baseExpenses,
    incomeChange,
    expensesChange,
    balance: baseIncome - baseExpenses,
    balanceChange: ((baseIncome - baseExpenses) / baseExpenses) * 100,
  };
};
