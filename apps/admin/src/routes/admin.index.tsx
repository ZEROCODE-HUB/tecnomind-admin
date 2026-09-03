import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  CreditCard,
  ArrowLeftRight,
  BarChart3,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { PageHeader, Card, Stat, Badge } from "@/components/portal-shell";
import { useBackoffice } from "@/stores/backoffice-store";

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
            {typeof it.count === "number" && (
              <span className="font-mono tabular-nums"> · {it.count}</span>
            )}
          </Link>
        ))}
      </div>
    </Card>
  );
}

function Page() {
  const clientes = useBackoffice((s) => s.clientes);
  const pagos = useBackoffice((s) => s.pagos);
  const operacionesOtc = useBackoffice((s) => s.operacionesOtc);

  const clientesPendientes = clientes.filter((c) => c.estadoVerificacion === "Pendiente").length;
  const pagosPorDecidir = pagos.filter(
    (p) => p.estado === "Pendiente" || p.estado === "En proceso",
  ).length;
  const otcPorTasar = operacionesOtc.filter(
    (o) => o.tasaAplicada == null && o.estado !== "Rechazada",
  ).length;
  const clientesActivos = clientes.filter((c) => c.estadoCuenta === "Activa").length;

  return (
    <div className="bg-white -m-4 md:-m-6 lg:-mx-8 lg:-my-6 p-4 md:p-6 lg:p-8 min-h-[calc(100vh-3.5rem)]">
      <PageHeader
        title="Panel general"
        description="Visión operativa de la plataforma: verificación de clientes, pagos, operaciones OTC y estadísticas."
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          label="Clientes por verificar"
          value={String(clientesPendientes)}
          sub={`${clientes.filter((c) => c.estadoVerificacion === "En revisión").length} en revisión`}
        />
        <Stat
          label="Pagos por decidir"
          value={String(pagosPorDecidir)}
          sub="Pendientes y en proceso"
        />
        <Stat label="OTC por tasar" value={String(otcPorTasar)} sub="Sin tasa ni monto final" />
        <Stat label="Clientes activos" value={String(clientesActivos)} sub="Cuentas habilitadas" />
      </div>

      {/* Módulos */}
      <div className="grid md:grid-cols-2 gap-6">
        <ModuleCard
          icon={ShieldCheck}
          title="Verificación de clientes"
          description="Consulta de perfiles, revisión de identidad biométrica (Truora) y validación contra listas restrictivas antes de habilitar la cuenta."
          mainTo="/admin/verificacion/clientes"
          mainLabel="Ir a perfiles de clientes"
          highlight={{
            label: "Por revisar",
            value: clientes.filter(
              (c) => c.estadoVerificacion === "Pendiente" || c.estadoVerificacion === "En revisión",
            ).length,
          }}
          items={[
            { to: "/admin/verificacion/clientes", label: "Perfiles" },
            { to: "/admin/verificacion/identidad", label: "Identidad" },
            { to: "/admin/verificacion/listas", label: "Listas restrictivas" },
          ]}
        />
        <ModuleCard
          icon={CreditCard}
          title="Gestión de pagos"
          description="Procesamiento manual de pagos internacionales, carga y validación de comprobantes, y decisión de aprobación o rechazo de cada operación."
          mainTo="/admin/pagos/solicitudes"
          mainLabel="Ir a solicitudes de pago"
          highlight={{
            label: "Por decidir",
            value: pagosPorDecidir,
          }}
          items={[
            { to: "/admin/pagos/solicitudes", label: "Solicitudes" },
            { to: "/admin/pagos/comprobantes", label: "Comprobantes" },
            { to: "/admin/pagos/aprobacion", label: "Aprobación" },
          ]}
        />
        <ModuleCard
          icon={ArrowLeftRight}
          title="Operaciones OTC"
          description="Registro de operaciones de cambio USDT a pesos colombianos y control manual de tasas aplicadas y montos finales a entregar."
          mainTo="/admin/otc/registro"
          mainLabel="Ir a registro de operaciones"
          highlight={{
            label: "Por tasar",
            value: otcPorTasar,
          }}
          items={[
            { to: "/admin/otc/registro", label: "Registro" },
            { to: "/admin/otc/tasas", label: "Tasas y montos" },
          ]}
        />
        <ModuleCard
          icon={BarChart3}
          title="Estadísticas operativas"
          description="Panel de depósitos y retiros, y los indicadores generales del negocio: volumen de pagos, operaciones OTC completadas y clientes activos."
          mainTo="/admin/estadisticas/depositos-retiros"
          mainLabel="Ir a depósitos y retiros"
          items={[
            { to: "/admin/estadisticas/depositos-retiros", label: "Depósitos y retiros" },
            { to: "/admin/estadisticas/indicadores", label: "Indicadores generales" },
          ]}
        />
      </div>

      {/* Colas de trabajo */}
      <Card className="mt-6">
        <h3 className="font-display font-semibold mb-3">Colas de trabajo del día</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/verificacion/identidad"
            className="rounded-lg border border-border p-4 hover:bg-accent/40 transition-colors"
          >
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Identidad por revisar
            </div>
            <div className="font-display text-2xl font-semibold mt-1 tabular-nums">
              {clientes.filter((c) => c.estadoVerificacion === "En revisión").length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
              Ver cola <ArrowRight size={11} />
            </div>
          </Link>
          <Link
            to="/admin/pagos/aprobacion"
            className="rounded-lg border border-border p-4 hover:bg-accent/40 transition-colors"
          >
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Pagos por decidir
            </div>
            <div className="font-display text-2xl font-semibold mt-1 tabular-nums">
              {pagosPorDecidir}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
              Ver cola <ArrowRight size={11} />
            </div>
          </Link>
          <Link
            to="/admin/otc/tasas"
            className="rounded-lg border border-border p-4 hover:bg-accent/40 transition-colors"
          >
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              OTC por tasar
            </div>
            <div className="font-display text-2xl font-semibold mt-1 tabular-nums">
              {otcPorTasar}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
              Ver cola <ArrowRight size={11} />
            </div>
          </Link>
          <Link
            to="/admin/verificacion/listas"
            className="rounded-lg border border-border p-4 hover:bg-accent/40 transition-colors"
          >
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Listas por cruzar
            </div>
            <div className="font-display text-2xl font-semibold mt-1 tabular-nums">
              {clientes.filter((c) => c.estadoCumplimiento === "Pendiente").length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
              Ver cola <ArrowRight size={11} />
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
