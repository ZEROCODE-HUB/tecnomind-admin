import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
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
  UserCog,
  ArrowDownToLine,
  ArrowUpFromLine,
  Percent,
  Wallet,
} from "lucide-react";
import { PortalShell, type NavItem, type NavGroup } from "@/components/portal-shell";
import type { Resource } from "@tecnomind/core";
import { useDemoMode } from "@/contexts/demo-mode";
import { RouteSkeleton } from "@/components/route-skeleton";
import { AdminChatbot } from "@/components/admin-chatbot";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/contexts/auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  pendingComponent: RouteSkeleton,
});

/**
 * Menú completo. Cada grupo declara el recurso de backoffice_resources
 * que lo gobierna; abajo se filtra según los permisos del operador, para
 * que el menú no ofrezca secciones que la base va a rechazar igual.
 */
const NAV_COMPLETO: NavItem[] = [
  { to: "/admin", label: "Panel general", icon: LayoutDashboard },
  {
    label: "Verificación de clientes",
    icon: ShieldCheck,
    recurso: "verificacion",
    items: [
      { to: "/admin/verificacion/clientes", label: "Perfiles de clientes", icon: Users },
      { to: "/admin/verificacion/identidad", label: "Revisión de identidad", icon: ScanFace },
      { to: "/admin/verificacion/listas", label: "Listas restrictivas", icon: ShieldAlert },
    ],
  },
  {
    label: "Usuarios",
    icon: UserCog,
    recurso: "usuarios",
    items: [
      { to: "/admin/general/usuarios", label: "Personas físicas", icon: Users },
      {
        to: "/admin/administracion/usuarios/roles",
        label: "Roles y permisos",
        icon: ShieldCheck,
        recurso: "backoffice",
      },
    ],
  },
  {
    label: "Movimientos",
    icon: Wallet,
    recurso: "movimientos",
    items: [
      { to: "/admin/general/movimientos", label: "Todos", icon: ListChecks },
      { to: "/admin/general/movimientos/depositos", label: "Depósitos", icon: ArrowDownToLine },
      { to: "/admin/general/movimientos/retiros", label: "Retiros", icon: ArrowUpFromLine },
      { to: "/admin/general/movimientos/comisiones", label: "Comisiones", icon: Percent },
    ],
  },
  {
    label: "Gestión de pagos",
    icon: CreditCard,
    recurso: "pagos",
    items: [
      { to: "/admin/pagos/solicitudes", label: "Solicitudes de pago", icon: Receipt },
      { to: "/admin/pagos/comprobantes", label: "Comprobantes", icon: FileCheck2 },
      { to: "/admin/pagos/aprobacion", label: "Aprobación y rechazo", icon: ThumbsUp },
    ],
  },
  {
    label: "Operaciones OTC",
    icon: ArrowLeftRight,
    recurso: "otc",
    items: [
      { to: "/admin/otc/registro", label: "Registro de operaciones", icon: ListChecks },
      { to: "/admin/otc/tasas", label: "Control de tasas y montos", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Estadísticas operativas",
    icon: BarChart3,
    recurso: "estadisticas",
    items: [
      { to: "/admin/estadisticas/depositos-retiros", label: "Depósitos y retiros", icon: Landmark },
      { to: "/admin/estadisticas/indicadores", label: "Indicadores generales", icon: Gauge },
    ],
  },
];

const esGrupo = (item: NavItem): item is NavGroup => "items" in item;

function AdminLayout() {
  const { role, setRole } = useDemoMode();
  const { can } = useAuth();

  useEffect(() => {
    if (role !== "admin" && role !== "operador") setRole("admin");
  }, [role, setRole]);

  const nav = useMemo(() => {
    const visible = (recurso?: Resource) => !recurso || can(recurso, "read");
    return NAV_COMPLETO.flatMap<NavItem>((item) => {
      if (!esGrupo(item)) return visible(item.recurso) ? [item] : [];
      if (!visible(item.recurso)) return [];
      // Una hoja puede exigir su propio recurso (Roles y permisos, dentro
      // de Usuarios, requiere permiso sobre 'backoffice').
      const items = item.items.filter((hoja) => visible(hoja.recurso));
      return items.length ? [{ ...item, items }] : [];
    });
  }, [can]);

  return (
    <RequireAuth>
      <PortalShell nav={nav} title="Backoffice">
        <Outlet />
        <AdminChatbot />
      </PortalShell>
    </RequireAuth>
  );
}
