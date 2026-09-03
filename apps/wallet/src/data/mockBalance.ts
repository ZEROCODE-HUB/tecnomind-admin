import { BalanceData } from "@/types";

export type { BalanceData } from "@/types";

export const mockBalance: BalanceData = {
  available: 1250400,
  formatted: "$ 1.250.400,00",
  todayChange: 124500,
  todayChangeFormatted: "+ $ 124.500",
};

// Saldo disponible para transferencias
export const AVAILABLE_BALANCE = 1250000;