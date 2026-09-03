import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { ArrowDownToLine, ArrowUpFromLine, Minus } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader, Badge, Card } from "@/components/portal-shell";
import { useBackoffice, tonePorEstado } from "@/stores/backoffice-store";

export const Route = createFileRoute("/admin/estadisticas/depositos-retiros")({
  component: Page,
  
});

type Periodo = 7 | 30 | 90;

const PERIODOS: Periodo[] = [7, 30, 90];

type Movimiento = {
  fecha: string;
  cliente: string;
  tipo: "Depósito" | "Retiro";
  monto: number;
  estado: "Aprobado" | "En proceso" | "Rechazado" | "Pendiente";
};

const movimientosIniciales: Movimiento[] = [
  {
    fecha: "09/08/2026",
    cliente: "Comercializadora del Norte S.A.S.",
    tipo: "Depósito",
    monto: 48000000,
    estado: "Aprobado",
  },
  {
    fecha: "08/08/2026",
    cliente: "Miguel Ángel Torres",
    tipo: "Retiro",
    monto: 18500000,
    estado: "Aprobado",
  },
  {
    fecha: "08/08/2026",
    cliente: "Laura Gómez Restrepo",
    tipo: "Depósito",
    monto: 12500000,
    estado: "Aprobado",
  },
  {
    fecha: "07/08/2026",
    cliente: "Mariana Cárdenas López",
    tipo: "Depósito",
    monto: 23000000,
    estado: "En proceso",
  },
  {
    fecha: "07/08/2026",
    cliente: "Andrés Felipe Rojas",
    tipo: "Retiro",
    monto: 9100000,
    estado: "Aprobado",
  },
  {
    fecha: "06/08/2026",
    cliente: "Importadora Caribe Ltda.",
    tipo: "Depósito",
    monto: 56000000,
    estado: "Aprobado",
  },
  {
    fecha: "06/08/2026",
    cliente: "Valentina Ospina Vélez",
    tipo: "Retiro",
    monto: 6400000,
    estado: "Rechazado",
  },
  {
    fecha: "05/08/2026",
    cliente: "Santiago Villaquirán",
    tipo: "Depósito",
    monto: 15200000,
    estado: "Aprobado",
  },
  {
    fecha: "05/08/2026",
    cliente: "Carlos Eduardo Mejía",
    tipo: "Retiro",
    monto: 12000000,
    estado: "Pendiente",
  },
  {
    fecha: "04/08/2026",
    cliente: "Diana Paola Ramírez",
    tipo: "Depósito",
    monto: 8800000,
    estado: "Rechazado",
  },
  {
    fecha: "04/08/2026",
    cliente: "Esteban Rincón Palacios",
    tipo: "Retiro",
    monto: 5200000,
    estado: "Pendiente",
  },
  {
    fecha: "03/08/2026",
    cliente: "Comercializadora del Norte S.A.S.",
    tipo: "Retiro",
    monto: 31000000,
    estado: "Rechazado",
  },
];

const buildSerie = (dias: number) => {
  const base = 26000000 + dias * 1200000;
  const step = dias > 20 ? 2 : 1;
  const arr: { dia: string; depositos: number; retiros: number }[] = [];
  for (let i = Math.max(0, dias - 14); i < dias; i += step) {
    const d = new Date(2026, 7, 8 - i);
    const factor = 0.75 + ((i * 37) % 10) / 10;
    arr.push({
      dia: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      depositos: Math.round(base * factor * 1.35),
      retiros: Math.round(base * factor),
    });
  }
  return arr;
};

const monto = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);

function Page() {
  const pagos = useBackoffice((s) => s.pagos);
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const serie = useMemo(() => buildSerie(periodo), [periodo]);

  const totalDepositos = serie.reduce((a, s) => a + s.depositos, 0);
  const totalRetiros = serie.reduce((a, s) => a + s.retiros, 0);
  const neto = totalDepositos - totalRetiros;

  const operacionesPago = pagos.filter((p) => p.estado !== "Rechazado").length;

  const columns: Column<Movimiento>[] = [
    {
      key: "fecha",
      label: "Fecha",
      sortable: true,
      filterable: "date",
      render: (m) => <span className="font-mono text-xs">{m.fecha}</span>,
    },
    {
      key: "cliente",
      label: "Cliente",
      sortable: true,
      filterable: true,
      render: (m) => <span className="font-semibold">{m.cliente}</span>,
    },
    {
      key: "tipo",
      label: "Tipo",
      sortable: true,
      filterable: "enum",
      filterOptions: ["Depósito", "Retiro"],
      render: (m) => (
        <span
          className={`inline-flex items-center gap-1.5 ${m.tipo === "Depósito" ? "text-emerald-700" : "text-red-700"}`}
        >
          {m.tipo === "Depósito" ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
          {m.tipo}
        </span>
      ),
    },
    {
      key: "monto",
      label: "Monto",
      sortable: true,
      render: (m) => <span className="font-mono tabular-nums">{monto(m.monto)}</span>,
    },
    {
      key: "estado",
      label: "Estado",
      sortable: true,
      filterable: "enum",
      filterOptions: ["Aprobado", "En proceso", "Rechazado", "Pendiente"],
      render: (m) => <Badge tone={tonePorEstado(m.estado)}>{m.estado}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Panel de depósitos y retiros"
        description="Totales y evolución de depósitos y retiros en el periodo seleccionado."
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Total depósitos
            </div>
            <ArrowDownToLine size={16} className="text-emerald-600" />
          </div>
          <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums">
            {monto(totalDepositos)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Últimos {periodo} días</div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Total retiros
            </div>
            <ArrowUpFromLine size={16} className="text-red-600" />
          </div>
          <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums">
            {monto(totalRetiros)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Últimos {periodo} días</div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Flujo neto del periodo
            </div>
            <Minus size={16} className="text-moli-blue" />
          </div>
          <div
            className={`font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums ${
              neto >= 0 ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {monto(neto)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Depósitos − retiros · no incluye pagos internacionales
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <h3 className="font-display font-semibold mb-4">Evolución — depósitos vs retiros</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serie} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--moli-border)" />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 11, fill: "var(--moli-text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `${Math.round(v / 1000000)}M`}
                tick={{ fontSize: 11, fill: "var(--moli-text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [monto(Number(value)), ""]}
                labelFormatter={(label) => `Día ${label}`}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--moli-border)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="depositos" name="Depósitos" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="retiros" name="Retiros" fill="#d21523" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-0">
          <div className="px-5 pt-5 pb-2">
            <h3 className="font-display font-semibold">Últimos movimientos</h3>
            <p className="text-xs text-muted-foreground">
              Registro reciente de depósitos y retiros procesados manualmente.
            </p>
          </div>
          <div className="p-5">
            <DataTable
              columns={columns}
              data={movimientosIniciales}
              keyExtractor={(m) => `${m.fecha}-${m.cliente}-${m.tipo}-${m.monto}`}
              pageSize={8}
            />
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Contexto operativo
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">Pagos internacionales no rechazados</span>
                <span className="font-mono font-semibold tabular-nums">{operacionesPago}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">Ratios depósito / retiro</span>
                <span className="font-mono font-semibold tabular-nums">
                  1,{Math.round((totalDepositos / (totalRetiros || 1)) * 100) % 100}
                </span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-muted-foreground">Canales</span>
                <span className="text-xs font-semibold">Transferencia bancaria · manual</span>
              </li>
            </ul>
          </Card>
          <Card>
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Nota
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              En esta fase los depósitos y retiros se concilian de forma manual contra la cuenta
              recaudadora. Toda conciliación queda respaldada por el comprobante cargado en Gestión
              de pagos.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
