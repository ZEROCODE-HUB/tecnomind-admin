import { LucideIcon } from "lucide-react";

/**
 * Tipos relacionados con transacciones
 */

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: number;
  icon: LucideIcon;
  name: string;
  category: string;
  time: string;
  amount: string;
  numericAmount: number;
  type: TransactionType;
  dateGroup?: string;
}

export interface DashboardTransaction {
  id: number;
  icon: LucideIcon;
  title: string;
  description: string;
  amount: string;
  type: TransactionType;
}

export interface TransactionDetails extends Transaction {
  dateGroup: string;
}
