import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Users,
  ArrowLeftRight,
  BarChart3,
  ArrowRight,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { PageHeader, Card, Stat, Badge } from "@/components/portal-shell";
import { EmptyState } from "@/components/empty-state";
import { useResumen } from "@/lib/movimientos";
import { useClientes, formatARS, mensajeError } from "@/lib/clientes";
import { useAuth } from "@/contexts/auth";

/**
 * Un contador que el rol no puede consultar llega en null y se muestra
 * como guion: cero seria afirmar que no hay nada (ver migracion 00031).
 */
const cifra = (v: number | null | undefined) => (v == null ? "—" : String(v));
const importe = (v: number | null | undefined) => (v == null ? "—" : formatARS(v));

export const Route = createFileRoute("/admin/")({ component: Page });

function ModuleCard({
  icon: Icon,
  title,
  description,
  mainTo,
  mainLabel,
  items,
  highlight,
  highlightTone = "warn",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  mainTo: string;
  mainLabel: string;
  items: { to: string; label: string; count?: number }[];
  highlight?: { label: string; value: number };
  highlightTone?: "success" | "warn" | "danger";
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-moli-blue-light text-moli-blue flex items-center justify-center shrink-0">
          <Icon size={18} strokeWidth={1.75} />
        </div>
        {highlight && (
          <Badge tone={highlightTone}>
            {highlight.label}: {highlight.value}
          </Badge>
        )}
      </div>
      <h3 className="font-display font-semibold mt-3">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 flex-1">{description}</p>
      <Link
        to={mainTo}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-moli-red-dark transition-colors"
      >
        {mainLabel} <ArrowRight size={14} />
      </Link>
      <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-x-4 gap-y-1">
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className="text-xs text-muted-foreground hover:text-moli-blue transition-colors"
          >
            {it.label}
            {it.count != null && ` (${it.count})`}
          </Link>
        ))}
      </div>
    </Card>
  );
}

/** Tarjeta de cola de trabajo: un número y a dónde ir a resolverlo. */
function Cola({ to, label, value }: { to: string; label: string; value: number }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-border p-4 hover:bg-accent/40 transition-colors"
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-semibold mt-1 tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
        Ver cola <ArrowRight size={11} />
      </div>
    </Link>
  );
}

function Page() {
  const { can } = useAuth();
  const veClientes = can("verificacion", "read") || can("usuarios", "read");
  const veMovimientos = can("movimientos", "read");
  const veEstadisticas = can("estadisticas", "read");

  const resumen = useResumen();
  // Sin permiso el padrón vuelve vacío y todo contador derivado daría 0,
  // que se leería como "no hay", no como "no podés ver". Ni se pide.
  const clientesQuery = useClientes(veClientes);

  // El resumen sale de una sola función en la base; el padrón sirve para
  // los cortes que dependen del cruce de dos estados.
  const clientes = (clientesQuery.data ?? []).filter((c) => !c.esOperador);
  const r = resumen.data;

  const porRevisar = clientes.filter(
    (c) => c.estadoVerificacion === "Pendiente" || c.estadoVerificacion === "En revisión",
  ).length;
  const listasPorCruzar = clientes.filter((c) => c.estadoCumplimiento === "Pendiente").length;
  const clientesActivos = clientes.filter((c) => c.estadoCuenta === "Activa").length;

  if (resumen.isLoading) {
    return (
      <div className="py-20 flex justify-center text-muted-foreground">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (resumen.isError) {
    return (
      <>
        <PageHeader title="Panel general" description="Visión operativa de la plataforma." />
        <Card>
          <EmptyState title="No se pudo cargar el panel" description={mensajeError(resumen.error)} />
        </Card>
      </>
    );
  }

  return (
    <div className="bg-white -m-4 md:-m-6 lg:-mx-8 lg:-my-6 p-4 md:p-6 lg:p-8 min-h-[calc(100vh-3.5rem)]">
      <PageHeader
        title="Panel general"
        description="Visión operativa de la plataforma: verificación de clientes, movimientos y estadísticas."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          label="Clientes por verificar"
          value={cifra(r?.clientesPendientes)}
          sub={r?.clientesEnRevision == null ? "Sin acceso al padrón" : `${r.clientesEnRevision} en revisión`}
        />
        <Stat
          label="Movimientos de hoy"
          value={cifra(r?.movimientosHoy)}
          sub={r?.volumenHoy == null ? "Sin acceso a movimientos" : `${formatARS(r.volumenHoy)} operados`}
        />
        <Stat label="Saldo en cuentas" value={importe(r?.saldoTotal)} sub="Cuentas activas" />
        <Stat
          label="Clientes activos"
          value={veClientes ? String(clientesActivos) : "—"}
          sub={r?.cuentasBloqueadas == null ? "Sin acceso al padrón" : `${r.cuentasBloqueadas} cuentas bloqueadas`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {can("verificacion", "read") && (
        <ModuleCard
          icon={ShieldCheck}
          title="Verificación de clientes"
          description="Consulta de perfiles, revisión de identidad y validación contra listas restrictivas antes de habilitar la cuenta."
          mainTo="/admin/verificacion/clientes"
          mainLabel="Ir a perfiles de clientes"
          highlight={{ label: "Por revisar", value: porRevisar }}
          items={[
            { to: "/admin/verificacion/clientes", label: "Perfiles" },
            { to: "/admin/verificacion/identidad", label: "Identidad" },
            { to: "/admin/verificacion/listas", label: "Listas restrictivas" },
          ]}
        />
        )}
        {veMovimientos && (
        <ModuleCard
          icon={ArrowLeftRight}
          title="Movimientos"
          description="Historial completo de transacciones: depósitos, retiros, transferencias y comisiones, con el detalle de ambas contrapartes."
          mainTo="/admin/general/movimientos"
          mainLabel="Ir a todos los movimientos"
          highlight={{ label: "Pendientes", value: r?.movimientosPendientes ?? 0 }}
          items={[
            { to: "/admin/general/movimientos", label: "Todos" },
            { to: "/admin/general/movimientos/depositos", label: "Depósitos" },
            { to: "/admin/general/movimientos/retiros", label: "Retiros" },
            { to: "/admin/general/movimientos/comisiones", label: "Comisiones" },
          ]}
        />
        )}
        {can("usuarios", "read") && (
        <ModuleCard
          icon={Users}
          title="Usuarios"
          description="Padrón de clientes con su estado, su cuenta y su saldo. Suspensión y reactivación de cuentas."
          mainTo="/admin/general/usuarios"
          mainLabel="Ir al padrón de usuarios"
          highlight={{ label: "Registrados", value: r?.clientesTotal ?? 0 }}
          highlightTone="success"
          items={[
            { to: "/admin/general/usuarios", label: "Personas físicas" },
            { to: "/admin/administracion/usuarios/roles", label: "Roles y permisos" },
          ]}
        />
        )}
        {veEstadisticas && (
        <ModuleCard
          icon={BarChart3}
          title="Estadísticas operativas"
          description="Panel de depósitos y retiros e indicadores generales del negocio."
          mainTo="/admin/estadisticas/depositos-retiros"
          mainLabel="Ir a depósitos y retiros"
          items={[
            { to: "/admin/estadisticas/depositos-retiros", label: "Depósitos y retiros" },
            { to: "/admin/estadisticas/indicadores", label: "Indicadores generales" },
          ]}
        />
        )}
      </div>

      <Card className="mt-6">
        <h3 className="font-display font-semibold mb-3">Colas de trabajo del día</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {can("verificacion", "read") && (
            <>
              <Cola
                to="/admin/verificacion/identidad"
                label="Identidad por revisar"
                value={porRevisar}
              />
              <Cola to="/admin/verificacion/listas" label="Listas por cruzar" value={listasPorCruzar} />
            </>
          )}
          {veMovimientos && (
            <Cola
              to="/admin/general/movimientos"
              label="Movimientos pendientes"
              value={r?.movimientosPendientes ?? 0}
            />
          )}
          {can("usuarios", "read") && (
            <Cola
              to="/admin/general/usuarios"
              label="Cuentas bloqueadas"
              value={r?.cuentasBloqueadas ?? 0}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
