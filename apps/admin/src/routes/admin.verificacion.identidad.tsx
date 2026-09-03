import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Eye, CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown } from "@/components/actions-dropdown";
import { PageHeader, Badge, Card, Label, Stat } from "@/components/portal-shell";
import {
  useBackoffice,
  tonePorEstado,
  ESTADOS_VERIFICACION,
  type RevisionIdentidad,
  type Cliente,
} from "@/stores/backoffice-store";

export const Route = createFileRoute("/admin/verificacion/identidad")({
  component: Page,
  
});

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

function ResultadoScore({
  score,
  label,
  tone = "success",
}: {
  score: number;
  label: string;
  tone?: "success" | "warn" | "danger";
}) {
  const barColor =
    tone === "danger" ? "bg-moli-red" : tone === "warn" ? "bg-amber-500" : "bg-emerald-600";
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold tabular-nums">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted mt-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  );
}

function RevisionModal({
  revision,
  cliente,
  onClose,
}: {
  revision: RevisionIdentidad;
  cliente: Cliente;
  onClose: () => void;
}) {
  const setVerificacion = useBackoffice((s) => s.setVerificacion);
  const [obs, setObs] = useState(revision.observaciones);

  const scoreTone = revision.score >= 80 ? "success" : revision.score >= 50 ? "warn" : "danger";
  const matchTone =
    revision.matchBiometrico >= 85 ? "success" : revision.matchBiometrico >= 55 ? "warn" : "danger";
  const estaPendiente = revision.estado !== "Aprobada" && revision.estado !== "Rechazada";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-start z-10">
          <div>
            <h3 className="font-display text-lg font-semibold">Revisión de identidad</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {cliente.nombre} · {cliente.id} · Proveedor {revision.proveedor}
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
                Resultado de la verificación biométrica
              </h4>
              <Badge tone={tonePorEstado(revision.estado)}>{revision.estado}</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
              <ResultadoScore
                score={revision.score}
                label="Score general Truora"
                tone={scoreTone}
              />
              <ResultadoScore
                score={revision.matchBiometrico}
                label="Cotejo biométrico (facial)"
                tone={matchTone}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 mt-5">
              <Field
                label="Prueba de vida (liveness)"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    {revision.liveness === "Aprobado" ? (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    ) : revision.liveness === "Fallido" ? (
                      <XCircle size={14} className="text-red-600" />
                    ) : (
                      <AlertTriangle size={14} className="text-amber-500" />
                    )}
                    {revision.liveness}
                  </span>
                }
              />
              <Field label="Validación de documento" value={revision.validacionDocumento} />
              <Field label="Tipo de documento" value={revision.tipoDocumento} />
              <Field label="Número de documento" value={revision.numeroDocumento} />
              <Field label="Fecha de verificación" value={revision.fecha} />
              <Field label="Proveedor" value={revision.proveedor} />
            </div>
          </Card>

          {revision.flags.length > 0 && (
            <Card className="p-5">
              <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Indicadores a revisar
              </h4>
              <ul className="space-y-2">
                {revision.flags.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-5">
            <Label htmlFor="obs-identidad">Observaciones del operador</Label>
            <textarea
              id="obs-identidad"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              placeholder="Detalla criterios, documentos verificados o motivos de rechazo..."
              className="w-full rounded-lg border border-input bg-background text-sm p-3 outline-none focus:ring-2 focus:ring-ring/20 resize-y"
            />
            <div className="flex flex-wrap justify-end gap-2 mt-4">
              {estaPendiente && (
                <button
                  type="button"
                  onClick={() => {
                    setVerificacion(revision.clienteId, "En revisión", obs.trim());
                    toast.success("Observaciones registradas — verificación en revisión");
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 transition-colors"
                >
                  <AlertTriangle size={15} /> Marcar observaciones
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setVerificacion(revision.clienteId, "Rechazada", obs.trim());
                  toast.error(`Verificación rechazada para ${cliente.nombre}`);
                  onClose();
                }}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                <XCircle size={15} /> Rechazar
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerificacion(revision.clienteId, "Aprobada", obs.trim());
                  toast.success(`Verificación aprobada para ${cliente.nombre}`);
                  onClose();
                }}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark transition-colors"
              >
                <CheckCircle2 size={15} /> Aprobar
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
  const revisiones = useBackoffice((s) => s.revisiones);
  const [active, setActive] = useState<RevisionIdentidad | null>(null);

  const clienteDe = (r: RevisionIdentidad) => clientes.find((c) => c.id === r.clienteId) as Cliente;

  const pendientes = revisiones.filter((r) => r.estado === "Pendiente").length;
  const enRevision = revisiones.filter((r) => r.estado === "En revisión").length;
  const aprobadas = revisiones.filter((r) => r.estado === "Aprobada").length;
  const rechazadas = revisiones.filter((r) => r.estado === "Rechazada").length;

  const columns: Column<RevisionIdentidad>[] = [
    {
      key: "cliente",
      label: "Cliente",
      sortable: true,
      filterable: true,
      render: (r) => {
        const c = clienteDe(r);
        return (
          <div>
            <div className="font-semibold">{c.nombre}</div>
            <div className="text-xs text-muted-foreground font-mono">{c.documento}</div>
          </div>
        );
      },
    },
    {
      key: "fecha",
      label: "Fecha de verificación",
      sortable: true,
      filterable: "date",
      render: (r) => <span className="font-mono text-xs">{r.fecha}</span>,
    },
    {
      key: "score",
      label: "Score Truora",
      sortable: true,
      render: (r) => <span className="font-mono tabular-nums font-semibold">{r.score}/100</span>,
    },
    {
      key: "matchBiometrico",
      label: "Cotejo biométrico",
      sortable: true,
      render: (r) => <span className="font-mono tabular-nums">{r.matchBiometrico}%</span>,
    },
    {
      key: "liveness",
      label: "Prueba de vida",
      sortable: true,
      filterable: "enum",
      filterOptions: ["Aprobado", "Fallido", "Revisión manual"],
      render: (r) => <span>{r.liveness}</span>,
    },
    {
      key: "estado",
      label: "Estado",
      sortable: true,
      filterable: "enum",
      filterOptions: ESTADOS_VERIFICACION,
      render: (r) => <Badge tone={tonePorEstado(r.estado)}>{r.estado}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Revisión de identidad"
        description="Visualiza el resultado de la verificación biométrica (Truora) de cada cliente y aprueba o registra observaciones."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Por verificar" value={String(pendientes)} />
        <Stat label="En revisión" value={String(enRevision)} />
        <Stat label="Aprobadas" value={String(aprobadas)} />
        <Stat label="Rechazadas" value={String(rechazadas)} />
      </div>
      <DataTable
        columns={columns}
        data={revisiones}
        keyExtractor={(r) => r.clienteId}
        pageSize={10}
        actions={(r) => (
          <ActionsDropdown
            actions={[{ label: "Revisar resultado", icon: Eye, onClick: () => setActive(r) }]}
          />
        )}
      />
      {active && (
        <RevisionModal
          revision={active}
          cliente={clienteDe(active)}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
