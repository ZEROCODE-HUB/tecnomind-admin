import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ShieldAlert, Eye, XCircle, AlertTriangle, X, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown } from "@/components/actions-dropdown";
import { PageHeader, Badge, Card, Label } from "@/components/portal-shell";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/contexts/auth";
import {
  useClientes,
  useChequeos,
  useChequeosPorCliente,
  useSetChequeo,
  useSetCumplimiento,
  tonePorEstado,
  formatFecha,
  formatDocumento,
  mensajeError,
  ESTADOS_CUMPLIMIENTO,
  RESULTADOS_LISTA,
  type Chequeo,
  type Cliente,
  type ResultadoLista,
} from "@/lib/clientes";

export const Route = createFileRoute("/admin/verificacion/listas")({
  component: Page,
});

const RESULTADO_TONE: Record<ResultadoLista, "neutral" | "success" | "warn" | "danger"> = {
  Pendiente: "neutral",
  "Sin coincidencia": "success",
  "En revisión": "warn",
  Coincidencia: "danger",
};

/** El código de la lista PEP, para la columna destacada del listado. */
const LISTA_PEP = "pep";

function ListasModal({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const { can } = useAuth();
  const puedeEditar = can("verificacion", "update");
  const chequeos = useChequeos(cliente.id);
  const setChequeo = useSetChequeo();
  const setCumplimiento = useSetCumplimiento();
  const [obs, setObs] = useState(cliente.observaciones);

  const resultados = chequeos.data ?? [];
  const tieneCoincidencia = resultados.some((r) => r.resultado === "Coincidencia");

  const guardarCruce = (listaCode: string, listaNombre: string, resultado: ResultadoLista) =>
    setChequeo.mutate(
      { userId: cliente.id, listaCode, resultado },
      {
        onSuccess: () => toast.success(`${listaNombre}: marcada como "${resultado}".`),
        onError: (e) => toast.error(mensajeError(e)),
      },
    );

  const resolver = (estado: "En revisión" | "Pasa" | "No pasa") =>
    setCumplimiento.mutate(
      { userId: cliente.id, estado, notas: obs.trim() },
      {
        onSuccess: () => {
          if (estado === "Pasa") toast.success(`El cliente ${cliente.nombre} pasa el filtro de cumplimiento`);
          else if (estado === "No pasa") toast.error(`El cliente ${cliente.nombre} no pasa el filtro`);
          else toast.info("Filtro de cumplimiento marcado en revisión");
          onClose();
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-start z-10">
          <div>
            <h3 className="font-display text-lg font-semibold">
              Validación contra listas restrictivas
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {cliente.nombre} · {formatDocumento(cliente.documento)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resultado del filtro de cumplimiento
              </h4>
              <Badge tone={tonePorEstado(cliente.estadoCumplimiento)}>
                {cliente.estadoCumplimiento}
              </Badge>
            </div>

            {tieneCoincidencia && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300 p-3 text-sm mb-4">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span>
                  Existen coincidencias en listas restrictivas. La cuenta del cliente no debe
                  habilitarse hasta resolver el cruce.
                </span>
              </div>
            )}

            {chequeos.isLoading ? (
              <div className="py-6 flex justify-center text-muted-foreground">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {resultados.map((r) => (
                  <div
                    key={r.listaCode}
                    className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 border-b last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{r.listaNombre}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {r.detalle || (r.fecha ? `Cruzada el ${formatFecha(r.fecha)}` : "Sin cruzar")}
                      </div>
                    </div>
                    <Badge tone={RESULTADO_TONE[r.resultado]}>{r.resultado}</Badge>
                    <select
                      value={r.resultado}
                      disabled={!puedeEditar || setChequeo.isPending}
                      onChange={(e) =>
                        guardarCruce(r.listaCode, r.listaNombre, e.target.value as ResultadoLista)
                      }
                      className="h-9 px-2 rounded-md border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-60"
                    >
                      {RESULTADOS_LISTA.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <Label htmlFor="obs-listas">Observaciones del operador</Label>
            <textarea
              id="obs-listas"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              disabled={!puedeEditar}
              placeholder="Registrá el criterio aplicado en el cruce de listas..."
              className="w-full rounded-lg border border-input bg-background text-sm p-3 outline-none focus:ring-2 focus:ring-ring/20 resize-y disabled:opacity-60"
            />
            {!puedeEditar && (
              <p className="text-xs text-muted-foreground mt-2">
                Tu rol puede consultar el cruce pero no resolverlo.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2 mt-4">
              <button
                type="button"
                disabled={!puedeEditar || setCumplimiento.isPending}
                onClick={() => resolver("En revisión")}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                <AlertTriangle size={15} /> En revisión
              </button>
              <button
                type="button"
                disabled={!puedeEditar || setCumplimiento.isPending}
                onClick={() => resolver("No pasa")}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <XCircle size={15} /> No pasa
              </button>
              <button
                type="button"
                disabled={!puedeEditar || setCumplimiento.isPending}
                onClick={() => resolver("Pasa")}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark transition-colors disabled:opacity-50"
              >
                {setCumplimiento.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <UserCheck size={15} />
                )}
                Pasa
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Page() {
  const clientesQuery = useClientes();
  const chequeosQuery = useChequeosPorCliente();
  const [activeId, setActiveId] = useState<string | null>(null);

  const clientes = (clientesQuery.data ?? []).filter((c) => !c.esOperador);
  const active = clientes.find((c) => c.id === activeId) ?? null;
  const porCliente: Map<string, Chequeo[]> = chequeosQuery.data ?? new Map();

  const cuenta = (estado: string) => clientes.filter((c) => c.estadoCumplimiento === estado).length;

  const columns: Column<Cliente>[] = [
    {
      key: "nombre",
      label: "Cliente",
      sortable: true,
      filterable: true,
      render: (c) => (
        <div>
          <div className="font-semibold">{c.nombre}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {formatDocumento(c.documento)}
          </div>
        </div>
      ),
    },
    {
      key: "estadoCumplimiento",
      label: "Resultado del filtro",
      sortable: true,
      filterable: "enum",
      filterOptions: ESTADOS_CUMPLIMIENTO,
      render: (c) => (
        <Badge tone={tonePorEstado(c.estadoCumplimiento)}>{c.estadoCumplimiento}</Badge>
      ),
    },
    {
      key: "coincidencias",
      label: "Cruces positivos",
      sortable: true,
      render: (c) => {
        const count = (porCliente.get(c.id) ?? []).filter(
          (r) => r.resultado === "Coincidencia",
        ).length;
        return count === 0 ? (
          <span className="text-xs text-muted-foreground">Ninguno</span>
        ) : (
          <Badge tone="danger">
            {count} coincidencia{count > 1 ? "s" : ""}
          </Badge>
        );
      },
    },
    {
      key: "pep",
      label: "PEP / Funcionario",
      sortable: true,
      filterable: "enum",
      filterOptions: RESULTADOS_LISTA,
      render: (c) => {
        const pep = (porCliente.get(c.id) ?? []).find((r) => r.listaCode === LISTA_PEP);
        const resultado = pep?.resultado ?? "Pendiente";
        return <Badge tone={RESULTADO_TONE[resultado]}>{resultado}</Badge>;
      },
    },
    {
      key: "ultimoCruce",
      label: "Último cruce",
      sortable: true,
      filterable: "date",
      render: (c) => {
        const fechas = (porCliente.get(c.id) ?? [])
          .map((r) => r.fecha)
          .filter(Boolean)
          .sort();
        return (
          <span className="font-mono text-xs">
            {fechas.length ? formatFecha(fechas[fechas.length - 1]) : "—"}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Validación contra listas restrictivas"
        description="Indicador claro de si cada cliente pasó el filtro de cumplimiento antes de habilitar su cuenta."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Pendientes de cruce
          </div>
          <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums">
            {cuenta("Pendiente")}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Pasan el filtro
          </div>
          <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums text-emerald-700">
            {cuenta("Pasa")}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">No pasan</div>
          <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums text-red-700">
            {cuenta("No pasa")}
          </div>
        </Card>
      </div>

      {clientesQuery.isLoading ? (
        <Card>
          <div className="py-12 flex justify-center text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
          </div>
        </Card>
      ) : clientes.length === 0 ? (
        <Card>
          <EmptyState
            title="Sin clientes para cruzar"
            description="No hay clientes registrados todavía."
          />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={clientes}
          keyExtractor={(c) => c.id}
          pageSize={10}
          actions={(c) => (
            <ActionsDropdown
              actions={[{ label: "Ver cruces y decidir", icon: Eye, onClick: () => setActiveId(c.id) }]}
            />
          )}
        />
      )}

      {active && <ListasModal cliente={active} onClose={() => setActiveId(null)} />}
    </>
  );
}
