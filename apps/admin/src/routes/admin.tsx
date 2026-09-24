import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  ScanFace,
  FileCheck,
  CreditCard,
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
  Settings,
} from "lucide-react";
import { PortalShell, type NavItem, type NavGroup } from "@/components/portal-shell";
import type { Resource } from "@tecnomind/core";
import { useDemoMode } from "@/contexts/demo-mode";
import { RouteSkeleton } from "@/components/route-skeleton";
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
      { to: "/admin/verificacion/kyb", label: "Vinculación KYB", icon: FileCheck },
      // OCULTO: "Revisión de identidad" quedó redundante con la Vinculación KYB
      // (la verificación se resuelve ahí). La ruta sigue existiendo, solo se
      // saca del menú.
      // { to: "/admin/verificacion/identidad", label: "Revisión de identidad", icon: ScanFace },
      // OCULTO: "Listas restrictivas" (filtro de sanciones/PEP) está cableado a
      // la base pero sin uso (0 chequeos). Se saca del menú; la ruta sigue
      // accesible por URL si se reactiva. Reactivar volviendo a listar acá:
      //   { to: "/admin/verificacion/listas", label: "Listas restrictivas", icon: ShieldAlert },
    ],
  },
  {
    label: "Usuarios",
    icon: UserCog,
    recurso: "usuarios",
    items: [
      { to: "/admin/general/usuarios", label: "Personas físicas", icon: Users },
      {
        to: "/admin/administracion/usuarios/operadores",
        label: "Operadores",
        icon: UserCog,
        recurso: "backoffice",
      },
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
      { to: "/admin/pagos/aprobacion", label: "Depósitos y retiros", icon: ThumbsUp },
      { to: "/admin/pagos/metodos", label: "Métodos de pago", icon: Wallet },
    ],
  },
  {
    label: "Operaciones OTC",
    icon: ArrowLeftRight,
    recurso: "otc",
    items: [
      { to: "/admin/otc/registro", label: "Registro de operaciones", icon: ListChecks },
      { to: "/admin/otc/tasas", label: "Criptos y tasas", icon: SlidersHorizontal },
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
  { to: "/admin/configuracion", label: "Configuración", icon: Settings, recurso: "configuracion" },
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
      </PortalShell>
    </RequireAuth>
  );
}
