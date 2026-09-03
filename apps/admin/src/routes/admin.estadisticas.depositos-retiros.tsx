import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { ArrowDownToLine, ArrowUpFromLine, Minus, Loader2 } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader, Card } from "@/components/portal-shell";
import { EmptyState } from "@/components/empty-state";
import { estadoBadge } from "@/components/movimiento-detail";
import { formatARS, formatFechaHora, mensajeError } from "@/lib/clientes";
import { useSerieDiaria, useMovimientos, type Movimiento } from "@/lib/movimientos";

export const Route = createFileRoute("/admin/estadisticas/depositos-retiros")({
  component: Page,
});

type Periodo = 7 | 30 | 90;
const PERIODOS: Periodo[] = [7, 30, 90];

/**
 * Escala del eje Y según el orden de magnitud real de la serie.
 *
 * El prototipo dividía siempre por un millón; con montos chicos todas
 * las barras quedaban rotuladas "0M".
 */
function escala(max: number) {
  if (max >= 1_000_000) return { div: 1_000_000, sufijo: "M" };
  if (max >= 1_000) return { div: 1_000, sufijo: "k" };
  return { div: 1, sufijo: "" };
}

function Page() {
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const serieQuery = useSerieDiaria(periodo);
  // Los últimos movimientos van sin filtro de tipo: la tabla de abajo es
  // el registro reciente, no el corte del gráfico.
  const movimientosQuery = useMovimientos("todos", 30);

  const serie = serieQuery.data ?? [];
  const totalIngresos = serie.reduce((a, s) => a + s.ingresos, 0);
  const totalEgresos = serie.reduce((a, s) => a + s.egresos, 0);
  const totalInternas = serie.reduce((a, s) => a + s.internas, 0);
  const neto = totalIngresos - totalEgresos;
  const operaciones = serie.reduce((a, s) => a + s.cantidad, 0);

  // Tope del eje: el mayor valor de UN DIA, no el acumulado del periodo.
  // Usar el total hacia que el eje llegara a 330.000 mientras la barra mas
  // alta valia 250.000, y recharts escalaba las barras contra otro
  // dominio: se veian aplastadas contra el piso. Con el dominio fijo y
  // explicito, eje y barras usan la misma escala por construccion.
  const maximoDiario = serie.reduce(
    (max, d) => Math.max(max, d.ingresos, d.egresos, d.internas),
    0,
  );
  // Un 10% de aire arriba para que la barra mas alta no toque el borde.
  const tope = maximoDiario > 0 ? Math.ceil((maximoDiario * 1.1) / 1000) * 1000 : 1000;
  const { div, sufijo } = escala(tope);

  const columns: Column<Movimiento>[] = [
    {
      key: "fecha",
      label: "Fecha",
      sortable: true,
      filterable: "date",
      render: (m) => <span className="font-mono text-xs">{formatFechaHora(m.fecha)}</span>,
    },
    {
      key: "origenNombre",
      label: "Cliente",
      sortable: true,
      filterable: true,
      render: (m) => <span className="font-semibold">{m.origenNombre ?? m.destinoNombre ?? "—"}</span>,
    },
    {
      key: "tipo",
      label: "Tipo",
      sortable: true,
      filterable: true,
      render: (m) => (
        <span
          className={`inline-flex items-center gap-1.5 ${
            m.categoria === "income" ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {m.categoria === "income" ? (
            <ArrowDownToLine size={14} />
          ) : (
            <ArrowUpFromLine size={14} />
          )}
          {m.tipo}
        </span>
      ),
    },
    {
      key: "monto",
      label: "Monto",
      sortable: true,
      render: (m) => <span className="font-mono tabular-nums">{formatARS(m.monto)}</span>,
    },
    {
      key: "estado",
      label: "Estado",
      sortable: true,
      filterable: "enum",
      filterOptions: ["APROBADO", "EN PROGRESO", "PENDIENTE", "RECHAZADO"],
      render: (m) => estadoBadge(m.estado),
    },
  ];

  return (
    <>
      <PageHeader
        title="Panel de depósitos y retiros"
        description="Totales y evolución de ingresos y egresos en el periodo seleccionado."
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

      {serieQuery.isError ? (
        <Card>
          <EmptyState
            title="No se pudieron cargar las estadísticas"
            description={mensajeError(serieQuery.error)}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total ingresos
                </div>
                <ArrowDownToLine size={16} className="text-emerald-600" />
              </div>
              <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums">
                {formatARS(totalIngresos)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Últimos {periodo} días</div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total egresos
                </div>
                <ArrowUpFromLine size={16} className="text-red-600" />
              </div>
              <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums">
                {formatARS(totalEgresos)}
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
                {formatARS(neto)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {operaciones} operaciones · {formatARS(totalInternas)} en transferencias internas
              </div>
            </Card>
          </div>

          <Card className="mb-6">
            <h3 className="font-display font-semibold mb-4">Evolución del flujo</h3>
            <p className="text-xs text-muted-foreground -mt-3 mb-4">
              Ingresos y egresos son el dinero que entra y sale de la plataforma. Las
              transferencias entre cuentas propias se muestran aparte: no son ni una cosa ni la
              otra.
            </p>
            <div className="h-72">
              {serieQuery.isLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <Loader2 size={22} className="animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serie} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--moli-border)"
                    />
                    <XAxis
                      dataKey="etiqueta"
                      tick={{ fontSize: 11, fill: "var(--moli-text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                      // Con 90 días no entran todas las etiquetas.
                      interval={serie.length > 40 ? 6 : serie.length > 14 ? 2 : 0}
                    />
                    <YAxis
                      domain={[0, tope]}
                      tickFormatter={(v: number) => `${Math.round(v / div)}${sufijo}`}
                      tick={{ fontSize: 11, fill: "var(--moli-text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [formatARS(Number(value)), ""]}
                      labelFormatter={(label) => `Día ${label}`}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid var(--moli-border)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {/* Sin animacion: con datos que cambian al mover el
                        periodo, la transicion dejaba barras a media altura. */}
                    <Bar dataKey="ingresos" name="Ingresos" fill="#059669" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="egresos" name="Egresos" fill="#d21523" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="internas" name="Internas" fill="#64748b" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-0">
            <div className="px-5 pt-5 pb-2">
              <h3 className="font-display font-semibold">Últimos movimientos</h3>
              <p className="text-xs text-muted-foreground">
                Registro reciente de operaciones procesadas en la plataforma.
              </p>
            </div>
            <div className="p-5">
              {movimientosQuery.isLoading ? (
                <div className="py-10 flex justify-center text-muted-foreground">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : (movimientosQuery.data ?? []).length === 0 ? (
                <EmptyState
                  title="Sin movimientos"
                  description="Todavía no hay operaciones registradas."
                />
              ) : (
                <DataTable
                  columns={columns}
                  data={movimientosQuery.data ?? []}
                  keyExtractor={(m) => m.id}
                  pageSize={8}
                />
              )}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
