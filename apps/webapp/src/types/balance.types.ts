/**
 * Tipos relacionados con saldos y balances
 */

export interface BalanceData {
  available: number;
  formatted: string;
  todayChange: number;
  todayChangeFormatted: string;
}

export interface SummaryData {
  income: number;
  expenses: number;
  incomeChange: number;
  expensesChange: number;
  balance: number;
  balanceChange: number;
}
