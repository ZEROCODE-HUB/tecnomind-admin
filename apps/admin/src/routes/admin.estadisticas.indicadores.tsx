import { createFileRoute, Link } from "@tanstack/react-router";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import {
  Users,
  CheckCircle2,
  ShieldCheck,
  Landmark,
  ArrowRightLeft,
  ArrowRight,
} from "lucide-react";
import { PageHeader, Card, Badge, Stat } from "@/components/portal-shell";
import { useBackoffice, tonePorEstado, formatCOP, formatUSDT } from "@/stores/backoffice-store";

export const Route = createFileRoute("/admin/estadisticas/indicadores")({
  component: Page,
  
});

const PCT = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

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

function Page() {
  const clientes = useBackoffice((s) => s.clientes);
  const pagos = useBackoffice((s) => s.pagos);
  const operacionesOtc = useBackoffice((s) => s.operacionesOtc);

  const activos = clientes.filter((c) => c.estadoCuenta === "Activa").length;
  const verificados = clientes.filter((c) => c.estadoVerificacion === "Aprobada").length;
  const cumplen = clientes.filter((c) => c.estadoCumplimiento === "Pasa").length;
  const pctVerificados = clientes.length ? Math.round((verificados / clientes.length) * 100) : 0;

  const pagosProcesados = pagos.filter((p) => p.estado === "Aprobado");
  const volumenPagosUSD = pagosProcesados.reduce((a, p) => a + p.monto, 0);
  const otcAprobadas = operacionesOtc.filter((o) => o.estado === "Aprobada");
  const volumenOtcCOP = otcAprobadas.reduce((a, o) => a + (o.montoFinalCOP ?? o.montoCOP), 0);
  const otcVolumenUSDT = otcAprobadas.reduce((a, o) => a + (o.montoFinalUSDT ?? 0), 0);

  const pagosPorEstado = [
    {
      name: "Pendiente",
      value: pagos.filter((p) => p.estado === "Pendiente").length,
      color: "#f59e0b",
    },
    {
      name: "En proceso",
      value: pagos.filter((p) => p.estado === "En proceso").length,
      color: "#64748b",
    },
    {
      name: "Aprobado",
      value: pagos.filter((p) => p.estado === "Aprobado").length,
      color: "#059669",
    },
    {
      name: "Rechazado",
      value: pagos.filter((p) => p.estado === "Rechazado").length,
      color: "#d21523",
    },
  ];

  const otcPorEstado = [
    {
      name: "Pendiente",
      value: operacionesOtc.filter((o) => o.estado === "Pendiente").length,
      color: "#f59e0b",
    },
    {
      name: "En revisión",
      value: operacionesOtc.filter((o) => o.estado === "En revisión").length,
      color: "#64748b",
    },
    {
      name: "Aprobada",
      value: operacionesOtc.filter((o) => o.estado === "Aprobada").length,
      color: "#059669",
    },
    {
      name: "Rechazada",
      value: operacionesOtc.filter((o) => o.estado === "Rechazada").length,
      color: "#d21523",
    },
  ];

  const verificacionPorEstado = [
    {
      name: "Aprobada",
      value: clientes.filter((c) => c.estadoVerificacion === "Aprobada").length,
      color: "#059669",
    },
    {
      name: "En revisión",
      value: clientes.filter((c) => c.estadoVerificacion === "En revisión").length,
      color: "#64748b",
    },
    {
      name: "Pendiente",
      value: clientes.filter((c) => c.estadoVerificacion === "Pendiente").length,
      color: "#f59e0b",
    },
    {
      name: "Rechazada",
      value: clientes.filter((c) => c.estadoVerificacion === "Rechazada").length,
      color: "#d21523",
    },
  ];

  return (
    <>
      <PageHeader
        title="Indicadores generales del negocio"
        description="Volumen de pagos procesados, operaciones OTC completadas y clientes activos, tomados del estado operativo actual."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Stat
          label="Volumen de pagos procesados"
          value={PCT.format(volumenPagosUSD)}
          sub={`${pagosProcesados.length} operaciones aprobadas (USD)`}
        />
        <Stat
          label="Operaciones OTC completadas"
          value={String(otcAprobadas.length)}
          sub={`${formatCOP(volumenOtcCOP)} entregados`}
        />
        <Stat
          label="Clientes activos"
          value={String(activos)}
          sub={`de ${clientes.length} registrados`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Landmark size={15} className="text-moli-blue" />
            <h3 className="font-display font-semibold">Pagos internacionales</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {pagosPorEstado.map((e) => (
              <Badge key={e.name} tone={tonePorEstado(e.name)}>
                {e.name}: {e.value}
              </Badge>
            ))}
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pagosPorEstado} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--moli-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "var(--moli-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {pagosPorEstado.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <MetricRow
              label="Volumen aprobado"
              value={PCT.format(volumenPagosUSD)}
              note="Solo operaciones aprobadas"
            />
            <MetricRow
              label="Tasa de aprobación"
              value={`${pagos.length ? Math.round((pagosProcesados.length / pagos.length) * 100) : 0}%`}
              note={`de ${pagos.length} solicitudes totales`}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ArrowRightLeft size={15} className="text-moli-blue" />
            <h3 className="font-display font-semibold">Operaciones OTC</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {otcPorEstado.map((e) => (
              <Badge key={e.name} tone={tonePorEstado(e.name)}>
                {e.name}: {e.value}
              </Badge>
            ))}
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={otcPorEstado} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--moli-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "var(--moli-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {otcPorEstado.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <MetricRow
              label="COP entregados"
              value={formatCOP(volumenOtcCOP)}
              note="Operaciones completadas"
            />
            <MetricRow
              label="USDT gestionados"
              value={formatUSDT(otcVolumenUSDT)}
              note="Por operaciones de compra"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users size={15} className="text-moli-blue" />
            <h3 className="font-display font-semibold">Base de clientes</h3>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={verificacionPorEstado}
                margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--moli-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "var(--moli-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {verificacionPorEstado.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Verificación biométrica aprobada
                </span>
                <span className="font-mono font-semibold tabular-nums">{pctVerificados}%</span>
              </div>
              <Progress value={pctVerificados} tone="success" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <ShieldCheck size={13} /> Filtro de listas restrictivas superado
                </span>
                <span className="font-mono font-semibold tabular-nums">
                  {cumplen}/{clientes.length}
                </span>
              </div>
              <Progress
                value={clientes.length ? Math.round((cumplen / clientes.length) * 100) : 0}
                tone="success"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Cuentas habilitadas</span>
                <span className="font-mono font-semibold tabular-nums">
                  {activos}/{clientes.length}
                </span>
              </div>
              <Progress
                value={clientes.length ? Math.round((activos / clientes.length) * 100) : 0}
                tone="success"
              />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-display font-semibold mb-2">Accesos directos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Consulta rápidamente los módulos operativos para tomar acciones sobre estos indicadores.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/pagos/aprobacion"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors"
          >
            Aprobar pagos pendientes <ArrowRight size={14} />
          </Link>
          <Link
            to="/admin/otc/tasas"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors"
          >
            Registrar tasas OTC <ArrowRight size={14} />
          </Link>
          <Link
            to="/admin/verificacion/identidad"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors"
          >
            Revisar identidad <ArrowRight size={14} />
          </Link>
          <Link
            to="/admin/pagos/comprobantes"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors"
          >
            Validar comprobantes <ArrowRight size={14} />
          </Link>
        </div>
      </Card>
    </>
  );
}
