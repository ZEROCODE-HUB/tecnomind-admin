import { ArrowDownLeft, ArrowUpRight, Building2 } from "lucide-react";
import { Transaction, DashboardTransaction } from "@/types";

export type { Transaction, DashboardTransaction } from "@/types";

// Transacciones para el Dashboard (vista resumida)
export const dashboardTransactions: DashboardTransaction[] = [
  {
    id: 1,
    icon: ArrowDownLeft,
    title: "María González",
    description: "Transferencia recibida • Hoy",
    amount: "+ $ 25.000,00",
    type: "income",
  },
  {
    id: 2,
    icon: ArrowUpRight,
    title: "Carlos Rodríguez",
    description: "Transferencia enviada • Hoy",
    amount: "- $ 15.490,00",
    type: "expense",
  },
  {
    id: 3,
    icon: ArrowDownLeft,
    title: "Juan Pérez",
    description: "Transferencia recibida • Ayer",
    amount: "+ $ 50.000,00",
    type: "income",
  },
  {
    id: 4,
    icon: ArrowUpRight,
    title: "Ana Martínez",
    description: "Transferencia enviada • 20 Oct",
    amount: "- $ 8.200,00",
    type: "expense",
  },
];

// Transacciones completas para Movements
export const allTransactions: (Transaction & { dateGroup: string })[] = [
  {
    id: 1,
    icon: ArrowDownLeft,
    name: "María González",
    category: "Transferencia recibida",
    time: "14:30",
    amount: "+ $ 25.000,00",
    numericAmount: 25000,
    type: "income",
    dateGroup: "Hoy, 24 Oct",
  },
  {
    id: 2,
    icon: ArrowUpRight,
    name: "Carlos Rodríguez",
    category: "Transferencia enviada",
    time: "11:15",
    amount: "- $ 15.490,00",
    numericAmount: -15490,
    type: "expense",
    dateGroup: "Hoy, 24 Oct",
  },
  {
    id: 3,
    icon: Building2,
    name: "Startup TechSolution",
    category: "Pago a negocio",
    time: "09:45",
    amount: "- $ 85.000,00",
    numericAmount: -85000,
    type: "expense",
    dateGroup: "Hoy, 24 Oct",
  },
  {
    id: 4,
    icon: ArrowDownLeft,
    name: "Juan Pérez",
    category: "Transferencia recibida",
    time: "16:20",
    amount: "+ $ 50.000,00",
    numericAmount: 50000,
    type: "income",
    dateGroup: "Ayer, 23 Oct",
  },
  {
    id: 5,
    icon: ArrowUpRight,
    name: "Ana Martínez",
    category: "Transferencia enviada",
    time: "10:00",
    amount: "- $ 8.200,00",
    numericAmount: -8200,
    type: "expense",
    dateGroup: "Ayer, 23 Oct",
  },
  {
    id: 6,
    icon: ArrowDownLeft,
    name: "Roberto Sánchez",
    category: "Transferencia recibida",
    time: "18:45",
    amount: "+ $ 32.500,00",
    numericAmount: 32500,
    type: "income",
    dateGroup: "21 Oct",
  },
];

// Orden de fechas para agrupación
export const dateOrder = ["Hoy, 24 Oct", "Ayer, 23 Oct", "21 Oct"];