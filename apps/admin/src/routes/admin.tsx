import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  ScanFace,
  ShieldAlert,
  CreditCard,
  Receipt,
  FileCheck2,
  ThumbsUp,
  ArrowLeftRight,
  ListChecks,
  SlidersHorizontal,
  BarChart3,
  Landmark,
  Gauge,
} from "lucide-react";
import { PortalShell, type NavItem } from "@/components/portal-shell";
import { useDemoMode } from "@/contexts/demo-mode";
import { RouteSkeleton } from "@/components/route-skeleton";
import { AdminChatbot } from "@/components/admin-chatbot";
import { RequireAuth } from "@/components/require-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  pendingComponent: RouteSkeleton,
});

const nav: NavItem[] = [
  { to: "/admin", label: "Panel general", icon: LayoutDashboard },
  {
    label: "Verificación de clientes",
    icon: ShieldCheck,
    items: [
      { to: "/admin/verificacion/clientes", label: "Perfiles de clientes", icon: Users },
      { to: "/admin/verificacion/identidad", label: "Revisión de identidad", icon: ScanFace },
      { to: "/admin/verificacion/listas", label: "Listas restrictivas", icon: ShieldAlert },
    ],
  },
  {
    label: "Gestión de pagos",
    icon: CreditCard,
    items: [
      { to: "/admin/pagos/solicitudes", label: "Solicitudes de pago", icon: Receipt },
      { to: "/admin/pagos/comprobantes", label: "Comprobantes", icon: FileCheck2 },
      { to: "/admin/pagos/aprobacion", label: "Aprobación y rechazo", icon: ThumbsUp },
    ],
  },
  {
    label: "Operaciones OTC",
    icon: ArrowLeftRight,
    items: [
      { to: "/admin/otc/registro", label: "Registro de operaciones", icon: ListChecks },
      { to: "/admin/otc/tasas", label: "Control de tasas y montos", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Estadísticas operativas",
    icon: BarChart3,
    items: [
      { to: "/admin/estadisticas/depositos-retiros", label: "Depósitos y retiros", icon: Landmark },
      { to: "/admin/estadisticas/indicadores", label: "Indicadores generales", icon: Gauge },
    ],
  },
];

function AdminLayout() {
  const { role, setRole } = useDemoMode();
  useEffect(() => {
    if (role !== "admin" && role !== "operador") setRole("admin");
  }, [role, setRole]);
  return (
    <RequireAuth>
      <PortalShell nav={nav} title="Backoffice">
        <Outlet />
        <AdminChatbot />
      </PortalShell>
    </RequireAuth>
  );
}
