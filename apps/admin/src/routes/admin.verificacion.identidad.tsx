import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Eye, CheckCircle2, XCircle, AlertTriangle, X, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown } from "@/components/actions-dropdown";
import { PageHeader, Badge, Card, Label, Stat } from "@/components/portal-shell";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/contexts/auth";
import {
  useClientes,
  useSetVerificacion,
  tonePorEstado,
  formatFecha,
  formatDocumento,
  mensajeError,
  ESTADOS_VERIFICACION,
  type Cliente,
} from "@/lib/clientes";

export const Route = createFileRoute("/admin/verificacion/identidad")({
  component: Page,
});

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      {/* break-words: un correo largo se montaba sobre la columna de al lado. */}
      <div className="font-medium mt-0.5 break-words">{value}</div>
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
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
    </div>
  );
}

function RevisionModal({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const { can } = useAuth();
  const puedeEditar = can("verificacion", "update");
  const setVerificacion = useSetVerificacion();
  const [obs, setObs] = useState("");

  const score = cliente.scoreKyc;
  const scoreTone = score == null ? "warn" : score >= 80 ? "success" : score >= 50 ? "warn" : "danger";
  const estaPendiente =
    cliente.estadoVerificacion !== "Aprobada" && cliente.estadoVerificacion !== "Rechazada";

  const resolver = (estado: "En revisión" | "Aprobada" | "Rechazada") =>
    setVerificacion.mutate(
      { userId: cliente.id, estado, notas: obs.trim() },
      {
        onSuccess: () => {
          if (estado === "Rechazada") toast.error(`Verificación rechazada para ${cliente.nombre}`);
          else if (estado === "Aprobada") toast.success(`Verificación aprobada para ${cliente.nombre}`);
          else toast.success("Observaciones registradas — verificación en revisión");
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
            <h3 className="font-display text-lg font-semibold">Revisión de identidad</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {cliente.nombre} · {cliente.tipoDocumento} {formatDocumento(cliente.documento)}
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
                Resultado de la verificación
              </h4>
              <Badge tone={tonePorEstado(cliente.estadoVerificacion)}>
                {cliente.estadoVerificacion}
              </Badge>
            </div>

            {score != null ? (
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
                <ResultadoScore
                  score={score}
                  label={`Score ${cliente.proveedorKyc ?? "del proveedor"}`}
                  tone={scoreTone}
                />
              </div>
            ) : (
              // Honestidad de producto: no hay proveedor biométrico
              // integrado todavía, así que no se inventa un score.
              <div className="flex gap-2.5 rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-sm text-blue-900">
                <Info size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Sin verificación automática</p>
                  <p className="mt-0.5">
                    Todavía no hay un proveedor biométrico integrado. La resolución de esta
                    verificación es manual y queda registrada a tu nombre en la auditoría.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 mt-5">
              <Field label="Tipo de documento" value={cliente.tipoDocumento} />
              <Field label="Número de documento" value={formatDocumento(cliente.documento)} />
              <Field label="Correo" value={cliente.email} />
              <Field label="Teléfono" value={cliente.telefono} />
              <Field label="Alta del cliente" value={formatFecha(cliente.fechaRegistro)} />
              <Field label="Proveedor" value={cliente.proveedorKyc ?? "—"} />
              <Field
                label="Listas restrictivas"
                value={
                  <Badge tone={tonePorEstado(cliente.estadoCumplimiento)}>
                    {cliente.estadoCumplimiento}
                  </Badge>
                }
              />
              <Field
                label="Estado de la cuenta"
                value={<Badge tone={tonePorEstado(cliente.estadoCuenta)}>{cliente.estadoCuenta}</Badge>}
              />
            </div>
          </Card>

          <Card className="p-5">
            <Label htmlFor="obs-identidad">Observaciones del operador</Label>
            <textarea
              id="obs-identidad"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              disabled={!puedeEditar}
              placeholder="Detallá criterios, documentos verificados o motivos de rechazo..."
              className="w-full rounded-lg border border-input bg-background text-sm p-3 outline-none focus:ring-2 focus:ring-ring/20 resize-y disabled:opacity-60"
            />
            {!puedeEditar && (
              <p className="text-xs text-muted-foreground mt-2">
                Tu rol puede consultar esta revisión pero no resolverla.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2 mt-4">
              {estaPendiente && (
                <button
                  type="button"
                  disabled={!puedeEditar || setVerificacion.isPending}
                  onClick={() => resolver("En revisión")}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  <AlertTriangle size={15} /> Marcar observaciones
                </button>
              )}
              <button
                type="button"
                disabled={!puedeEditar || setVerificacion.isPending}
                onClick={() => resolver("Rechazada")}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <XCircle size={15} /> Rechazar
              </button>
              <button
                type="button"
                disabled={!puedeEditar || setVerificacion.isPending}
                onClick={() => resolver("Aprobada")}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark transition-colors disabled:opacity-50"
              >
                {setVerificacion.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                Aprobar
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
  const [activeId, setActiveId] = useState<string | null>(null);

  // Los operadores del backoffice no son sujetos de verificación KYC.
  const clientes = (clientesQuery.data ?? []).filter((c) => !c.esOperador);
  const active = clientes.find((c) => c.id === activeId) ?? null;

  const cuenta = (estado: string) =>
    clientes.filter((c) => c.estadoVerificacion === estado).length;

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
      key: "email",
      label: "Correo",
      sortable: true,
      filterable: true,
      render: (c) => <span className="text-xs">{c.email}</span>,
    },
    {
      key: "fechaRegistro",
      label: "Alta",
      sortable: true,
      filterable: "date",
      render: (c) => <span className="font-mono text-xs">{formatFecha(c.fechaRegistro)}</span>,
    },
    {
      key: "scoreKyc",
      label: "Score",
      sortable: true,
      render: (c) =>
        c.scoreKyc == null ? (
          <span className="text-xs text-muted-foreground">Sin proveedor</span>
        ) : (
          <span className="font-mono tabular-nums font-semibold">{c.scoreKyc}/100</span>
        ),
    },
    {
      key: "proveedorKyc",
      label: "Proveedor",
      sortable: true,
      render: (c) => <span className="text-xs">{c.proveedorKyc ?? "—"}</span>,
    },
    {
      key: "estadoVerificacion",
      label: "Estado",
      sortable: true,
      filterable: "enum",
      filterOptions: ESTADOS_VERIFICACION,
      render: (c) => <Badge tone={tonePorEstado(c.estadoVerificacion)}>{c.estadoVerificacion}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Revisión de identidad"
        description="Resolvé la verificación de identidad de cada cliente. Cada aprobación o rechazo queda auditado."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Por verificar" value={String(cuenta("Pendiente"))} />
        <Stat label="En revisión" value={String(cuenta("En revisión"))} />
        <Stat label="Aprobadas" value={String(cuenta("Aprobada"))} />
        <Stat label="Rechazadas" value={String(cuenta("Rechazada"))} />
      </div>

      {clientesQuery.isLoading ? (
        <Card>
          <div className="py-12 flex justify-center text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
          </div>
        </Card>
      ) : clientesQuery.isError ? (
        <Card>
          <div className="py-10 text-center text-sm text-muted-foreground">
            {mensajeError(clientesQuery.error)}
          </div>
        </Card>
      ) : clientes.length === 0 ? (
        <Card>
          <EmptyState
            title="Sin verificaciones pendientes"
            description="No hay clientes registrados para revisar."
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
              actions={[{ label: "Revisar resultado", icon: Eye, onClick: () => setActiveId(c.id) }]}
            />
          )}
        />
      )}

      {active && <RevisionModal cliente={active} onClose={() => setActiveId(null)} />}
    </>
  );
}
