import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import {
  Users,
  CheckCircle2,
  ShieldCheck,
  ArrowRightLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { PageHeader, Card, Badge, Stat } from "@/components/portal-shell";
import { EmptyState } from "@/components/empty-state";
import { useClientes, tonePorEstado, formatARS, mensajeError } from "@/lib/clientes";
import { useIndicadores, useSerieDiaria } from "@/lib/movimientos";

export const Route = createFileRoute("/admin/estadisticas/indicadores")({
  component: Page,
});

type Periodo = 7 | 30 | 90;
const PERIODOS: Periodo[] = [7, 30, 90];

/** Colores por estado, alineados con los tonos de los badges. */
const COLOR = {
  ok: "#059669",
  pendiente: "#f59e0b",
  malo: "#d21523",
  neutro: "#94a3b8",
};

function MetricRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-semibold mt-1 tabular-nums">{value}</div>
      {note && <div className="text-[11px] text-muted-foreground mt-0.5">{note}</div>}
    </div>
  );
}

function Progress({ value, tone }: { value: number; tone: "success" | "warn" | "danger" }) {
  const color =
    tone === "danger" ? "bg-moli-red" : tone === "warn" ? "bg-amber-500" : "bg-emerald-600";
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function GraficoEstados({ datos }: { datos: { name: string; value: number; color: string }[] }) {
  // Dominio explicito: sin el, recharts escala las barras contra un rango
  // distinto al que rotula el eje y quedan aplastadas contra el piso.
  // El minimo de 1 evita un eje degenerado cuando todo esta en cero.
  const tope = Math.max(1, ...datos.map((d) => d.value));
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "var(--moli-text-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, tope]}
            tick={{ fontSize: 10, fill: "var(--moli-text-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {datos.map((e) => (
              <Cell key={e.name} fill={e.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Page() {
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const indicadoresQuery = useIndicadores(periodo);
  const serieQuery = useSerieDiaria(periodo);
  const clientesQuery = useClientes();

  const ind = indicadoresQuery.data;
  const clientes = (clientesQuery.data ?? []).filter((c) => !c.esOperador);
  const total = clientes.length;

  const activos = clientes.filter((c) => c.estadoCuenta === "Activa").length;
  const verificados = clientes.filter((c) => c.estadoVerificacion === "Aprobada").length;
  const cumplen = clientes.filter((c) => c.estadoCumplimiento === "Pasa").length;
  const pctVerificados = total ? Math.round((verificados / total) * 100) : 0;

  const cuenta = (fn: (c: (typeof clientes)[number]) => boolean) => clientes.filter(fn).length;

  const verificacionPorEstado = [
    { name: "Pendiente", value: cuenta((c) => c.estadoVerificacion === "Pendiente"), color: COLOR.pendiente },
    { name: "En revisión", value: cuenta((c) => c.estadoVerificacion === "En revisión"), color: COLOR.neutro },
    { name: "Aprobada", value: verificados, color: COLOR.ok },
    { name: "Rechazada", value: cuenta((c) => c.estadoVerificacion === "Rechazada"), color: COLOR.malo },
  ];

  const cumplimientoPorEstado = [
    { name: "Pendiente", value: cuenta((c) => c.estadoCumplimiento === "Pendiente"), color: COLOR.pendiente },
    { name: "En revisión", value: cuenta((c) => c.estadoCumplimiento === "En revisión"), color: COLOR.neutro },
    { name: "Pasa", value: cumplen, color: COLOR.ok },
    { name: "No pasa", value: cuenta((c) => c.estadoCumplimiento === "No pasa"), color: COLOR.malo },
  ];

  // Los días con más movimiento del periodo, para leer la estacionalidad
  // sin repetir el gráfico completo de la otra pantalla.
  const diasActivos = (serieQuery.data ?? [])
    .filter((d) => d.cantidad > 0)
    .slice(-7)
    .map((d) => ({ name: d.etiqueta, value: d.cantidad, color: COLOR.ok }));

  if (indicadoresQuery.isError) {
    return (
      <>
        <PageHeader title="Indicadores generales" description="Panorama del negocio." />
        <Card>
          <EmptyState
            title="No se pudieron cargar los indicadores"
            description={mensajeError(indicadoresQuery.error)}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Indicadores generales"
        description="Volumen operado, base de clientes y estado del proceso de verificación."
        action={
          <div className="flex items-center gap-1 bg-card border rounded-lg p-1">
            {PERIODOS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  periodo === p ? "bg-moli-blue text-white" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {p} días
              </button>
            ))}
          </div>
        }
      />

      {indicadoresQuery.isLoading ? (
        <div className="py-20 flex justify-center text-muted-foreground">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat
              label="Volumen operado"
              value={formatARS(ind?.volumen ?? 0)}
              sub={`${ind?.operaciones ?? 0} operaciones`}
            />
            <Stat
              label="Ticket promedio"
              value={formatARS(ind?.ticketPromedio ?? 0)}
              sub={`Últimos ${periodo} días`}
            />
            <Stat
              label="Comisiones cobradas"
              value={formatARS(ind?.comisiones ?? 0)}
              sub={`${ind?.operacionesFallidas ?? 0} operaciones fallidas`}
            />
            <Stat
              label="Clientes activos"
              value={String(activos)}
              sub={
                ind?.altas == null
                  ? `de ${total} registrados`
                  : `de ${total} registrados · ${ind.altas} altas`
              }
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <ArrowRightLeft size={15} className="text-moli-blue" />
                <h3 className="font-display font-semibold">Actividad reciente</h3>
              </div>
              {diasActivos.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">
                  Sin operaciones en el periodo.
                </div>
              ) : (
                <GraficoEstados datos={diasActivos} />
              )}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <MetricRow
                  label="Clientes operando"
                  value={String(ind?.clientesOperando ?? 0)}
                  note="Con al menos un egreso"
                />
                <MetricRow
                  label="Tasa de éxito"
                  value={`${
                    (ind?.operaciones ?? 0) + (ind?.operacionesFallidas ?? 0) > 0
                      ? Math.round(
                          ((ind?.operaciones ?? 0) /
                            ((ind?.operaciones ?? 0) + (ind?.operacionesFallidas ?? 0))) *
                            100,
                        )
                      : 100
                  }%`}
                  note="Completadas sobre el total"
                />
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={15} className="text-moli-blue" />
                <h3 className="font-display font-semibold">Cumplimiento</h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {cumplimientoPorEstado.map((e) => (
                  <Badge key={e.name} tone={tonePorEstado(e.name)}>
                    {e.name}: {e.value}
                  </Badge>
                ))}
              </div>
              <GraficoEstados datos={cumplimientoPorEstado} />
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Users size={15} className="text-moli-blue" />
                <h3 className="font-display font-semibold">Base de clientes</h3>
              </div>
              <GraficoEstados datos={verificacionPorEstado} />
              <div className="space-y-4 mt-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground inline-flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Identidad aprobada
                    </span>
                    <span className="font-mono font-semibold tabular-nums">{pctVerificados}%</span>
                  </div>
                  <Progress value={pctVerificados} tone="success" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground inline-flex items-center gap-1.5">
                      <ShieldCheck size={13} /> Listas restrictivas superadas
                    </span>
                    <span className="font-mono font-semibold tabular-nums">
                      {cumplen}/{total}
                    </span>
                  </div>
                  <Progress value={total ? Math.round((cumplen / total) * 100) : 0} tone="success" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Cuentas habilitadas</span>
                    <span className="font-mono font-semibold tabular-nums">
                      {activos}/{total}
                    </span>
                  </div>
                  <Progress value={total ? Math.round((activos / total) * 100) : 0} tone="success" />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="font-display font-semibold mb-2">Accesos directos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Módulos operativos para tomar acciones sobre estos indicadores.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/verificacion/identidad"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors"
              >
                Revisar identidad <ArrowRight size={14} />
              </Link>
              <Link
                to="/admin/verificacion/listas"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors"
              >
                Cruzar listas restrictivas <ArrowRight size={14} />
              </Link>
              <Link
                to="/admin/general/movimientos"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors"
              >
                Ver movimientos <ArrowRight size={14} />
              </Link>
              <Link
                to="/admin/general/usuarios"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors"
              >
                Padrón de usuarios <ArrowRight size={14} />
              </Link>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
