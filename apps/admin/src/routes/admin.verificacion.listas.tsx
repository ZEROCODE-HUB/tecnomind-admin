import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ShieldAlert, Eye, XCircle, AlertTriangle, X, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown } from "@/components/actions-dropdown";
import { PageHeader, Badge, Card, Label } from "@/components/portal-shell";
import {
  useBackoffice,
  tonePorEstado,
  ESTADOS_CUMPLIMIENTO,
  type CumplimientoListas,
  type Cliente,
  type ListaRestrictiva,
  type ResultadoListaCliente,
} from "@/stores/backoffice-store";

export const Route = createFileRoute("/admin/verificacion/listas")({
  component: Page,
  
});

const RESULTADO_TONE: Record<ResultadoListaCliente["resultado"], "success" | "warn" | "danger"> = {
  "Sin coincidencia": "success",
  "En revisión": "warn",
  Coincidencia: "danger",
};

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

function ListasModal({
  cumplimiento,
  cliente,
  onClose,
}: {
  cumplimiento: CumplimientoListas;
  cliente: Cliente;
  onClose: () => void;
}) {
  const setCumplimiento = useBackoffice((s) => s.setCumplimiento);
  const setResultadoLista = useBackoffice((s) => s.setResultadoLista);
  const [obs, setObs] = useState(cumplimiento.observaciones);

  const tieneCoincidencia = cumplimiento.resultados.some((r) => r.resultado === "Coincidencia");

  const guardarCruce = (lista: ListaRestrictiva, resultado: ResultadoListaCliente["resultado"]) => {
    setResultadoLista(cumplimiento.clienteId, lista, resultado);
    toast.success(`${lista}: marcada como "${resultado}".`);
  };

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
              {cliente.nombre} · {cliente.id}
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
              <Badge tone={tonePorEstado(cumplimiento.estadoCumplimiento)}>
                {cumplimiento.estadoCumplimiento}
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
            <div className="space-y-3">
              {cumplimiento.resultados.map((r) => (
                <div
                  key={r.lista}
                  className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{r.lista}</div>
                    {r.detalle && (
                      <div className="text-xs text-muted-foreground mt-0.5">{r.detalle}</div>
                    )}
                  </div>
                  <Badge tone={RESULTADO_TONE[r.resultado]}>{r.resultado}</Badge>
                  <select
                    value={r.resultado}
                    onChange={(e) =>
                      guardarCruce(r.lista, e.target.value as ResultadoListaCliente["resultado"])
                    }
                    className="h-9 px-2 rounded-md border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring/40"
                  >
                    <option value="Sin coincidencia">Sin coincidencia</option>
                    <option value="En revisión">En revisión</option>
                    <option value="Coincidencia">Coincidencia</option>
                  </select>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <Label htmlFor="obs-listas">Observaciones del operador</Label>
            <textarea
              id="obs-listas"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              placeholder="Registra el criterio aplicado en el cruce de listas..."
              className="w-full rounded-lg border border-input bg-background text-sm p-3 outline-none focus:ring-2 focus:ring-ring/20 resize-y"
            />
            <div className="flex flex-wrap justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setCumplimiento(cumplimiento.clienteId, "En revisión", obs.trim());
                  toast.info("Filtro de cumplimiento marcado en revisión");
                  onClose();
                }}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle size={15} /> En revisión
              </button>
              <button
                type="button"
                onClick={() => {
                  setCumplimiento(cumplimiento.clienteId, "No pasa", obs.trim());
                  toast.error(`El cliente ${cliente.nombre} no pasa el filtro de cumplimiento`);
                  onClose();
                }}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                <XCircle size={15} /> No pasa
              </button>
              <button
                type="button"
                onClick={() => {
                  setCumplimiento(cumplimiento.clienteId, "Pasa", obs.trim());
                  toast.success(`El cliente ${cliente.nombre} pasa el filtro de cumplimiento`);
                  onClose();
                }}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark transition-colors"
              >
                <UserCheck size={15} /> Pasa
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Page() {
  const clientes = useBackoffice((s) => s.clientes);
  const cumplimiento = useBackoffice((s) => s.cumplimiento);
  const [active, setActive] = useState<CumplimientoListas | null>(null);

  const registroDe = (c: CumplimientoListas) =>
    clientes.find((x) => x.id === c.clienteId) as Cliente;

  const pendientes = cumplimiento.filter((c) => c.estadoCumplimiento === "Pendiente").length;
  const pasan = cumplimiento.filter((c) => c.estadoCumplimiento === "Pasa").length;
  const noPasan = cumplimiento.filter((c) => c.estadoCumplimiento === "No pasa").length;

  const columns: Column<CumplimientoListas>[] = [
    {
      key: "cliente",
      label: "Cliente",
      sortable: true,
      filterable: true,
      render: (c) => {
        const cl = registroDe(c);
        return (
          <div>
            <div className="font-semibold">{cl.nombre}</div>
            <div className="text-xs text-muted-foreground font-mono">{cl.documento}</div>
          </div>
        );
      },
    },
    {
      key: "estado",
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
        const count = c.resultados.filter((r) => r.resultado === "Coincidencia").length;
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
      filterOptions: ["Sin coincidencia", "Coincidencia", "En revisión"],
      render: (c) => {
        const pep = c.resultados.find((r) => r.lista === "PEP / Funcionario público");
        return pep ? (
          <Badge tone={RESULTADO_TONE[pep.resultado] as "success" | "warn" | "danger"}>
            {pep.resultado}
          </Badge>
        ) : (
          "—"
        );
      },
    },
    {
      key: "fecha",
      label: "Último cruce",
      sortable: true,
      filterable: "date",
      render: (c) => (
        <span className="font-mono text-xs">{c.resultados[c.resultados.length - 1]?.fecha}</span>
      ),
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
            {pendientes}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Pasan el filtro
          </div>
          <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums text-emerald-700">
            {pasan}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">No pasan</div>
          <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums text-red-700">
            {noPasan}
          </div>
        </Card>
      </div>
      <DataTable
        columns={columns}
        data={cumplimiento}
        keyExtractor={(c) => c.clienteId}
        pageSize={10}
        actions={(c) => (
          <ActionsDropdown
            actions={[{ label: "Ver cruces y decidir", icon: Eye, onClick: () => setActive(c) }]}
          />
        )}
      />
      {active && (
        <ListasModal
          cumplimiento={active}
          cliente={registroDe(active)}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
