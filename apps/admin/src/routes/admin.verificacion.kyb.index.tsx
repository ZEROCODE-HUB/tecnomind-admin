import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X, Loader2, CheckCircle2, XCircle, FileText, ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown } from "@/components/actions-dropdown";
import { PageHeader, Badge, Card, Label, Stat } from "@/components/portal-shell";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/contexts/auth";
import { tonePorEstado, formatFechaHora, mensajeError } from "@/lib/clientes";
import {
  useKybSubmissions,
  useKybDetalle,
  useResolverKyb,
  KYB_LABELS,
  KYB_DOC_LABELS,
  type KybRow,
  type KybEstado,
} from "@/lib/kyb";

export const Route = createFileRoute("/admin/verificacion/kyb/")({
  component: Page,
});

const ESTADOS: KybEstado[] = ["Pendiente", "En revisión", "Aprobada", "Rechazada"];

function DetalleModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { can } = useAuth();
  const puedeEditar = can("verificacion", "update");
  const detalleQuery = useKybDetalle(userId);
  const resolver = useResolverKyb();
  const [notas, setNotas] = useState("");

  const d = detalleQuery.data;
  const pendiente = d && d.estado !== "Aprobada";

  const accion = (aprobar: boolean) =>
    resolver.mutate(
      { userId, aprobar, notas: notas.trim() || undefined },
      {
        onSuccess: () => {
          toast[aprobar ? "success" : "error"](aprobar ? "Verificación aprobada — cuenta activada" : "Verificación rechazada");
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
            <h3 className="font-display text-lg font-semibold">Vinculación KYB</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {d?.usuario ? `${d.usuario.nombre} · ${d.usuario.email}` : "Persona jurídica"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md">
            <X size={18} />
          </button>
        </div>

        {detalleQuery.isLoading || !d ? (
          <div className="py-16 flex justify-center text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Enviado: {formatFechaHora(d.enviado)}</span>
              <Badge tone={tonePorEstado(d.estado)}>{d.estado}</Badge>
            </div>

            {/* Respuestas */}
            <Card className="p-5">
              <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                Respuestas del formulario
              </h4>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                {Object.keys(KYB_LABELS).map((k) => {
                  const v = d.answers[k];
                  if (v == null || v === "") return null;
                  return (
                    <div key={k}>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">{KYB_LABELS[k]}</div>
                      <div className="font-medium mt-0.5 break-words">{String(v)}</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Documentos */}
            <Card className="p-5">
              <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                Anexo documental
              </h4>
              <div className="space-y-2">
                {Object.keys(KYB_DOC_LABELS).map((dt) => {
                  const doc = d.documentos.find((x) => x.docType === dt);
                  return (
                    <div key={dt} className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
                      <span className="text-sm flex items-center gap-2 min-w-0">
                        <FileText size={15} className="shrink-0 text-muted-foreground" />
                        <span className="truncate">{KYB_DOC_LABELS[dt]}</span>
                      </span>
                      {doc?.signedUrl ? (
                        <a
                          href={doc.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline shrink-0"
                        >
                          Ver PDF <ExternalLink size={13} />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0">No subido</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Resolución */}
            <Card className="p-5">
              <Label htmlFor="kyb-notas">Notas del operador / motivo de rechazo</Label>
              <textarea
                id="kyb-notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                disabled={!puedeEditar}
                placeholder="Detallá criterios o el motivo del rechazo (se le muestra al cliente)…"
                className="w-full rounded-lg border border-input bg-background text-sm p-3 outline-none focus:ring-2 focus:ring-ring/20 resize-y disabled:opacity-60"
              />
              {d.notasAdmin && (
                <p className="text-xs text-muted-foreground mt-2">Última nota: {d.notasAdmin}</p>
              )}
              {!puedeEditar && (
                <p className="text-xs text-muted-foreground mt-2">Tu rol puede consultar pero no resolver.</p>
              )}
              {puedeEditar && (
                <div className="flex flex-wrap justify-end gap-2 mt-4">
                  <button
                    type="button"
                    disabled={resolver.isPending}
                    onClick={() => accion(false)}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={15} /> Rechazar
                  </button>
                  <button
                    type="button"
                    disabled={resolver.isPending || !pendiente}
                    onClick={() => accion(true)}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark transition-colors disabled:opacity-50"
                  >
                    {resolver.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    Aprobar
                  </button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Page() {
  const query = useKybSubmissions();
  const [activeId, setActiveId] = useState<string | null>(null);
  const rows = query.data ?? [];
  const cuenta = (estado: KybEstado) => rows.filter((r) => r.estado === estado).length;

  const columns: Column<KybRow>[] = [
    {
      key: "razonSocial",
      label: "Razón social",
      sortable: true,
      filterable: true,
      render: (r) => (
        <div>
          <div className="font-semibold">{r.razonSocial}</div>
          <div className="text-xs text-muted-foreground font-mono">NIT {r.nit}</div>
        </div>
      ),
    },
    { key: "tipoServicio", label: "Servicio", sortable: true, filterable: true, render: (r) => <span className="text-sm">{r.tipoServicio}</span> },
    { key: "volumen", label: "Volumen mensual", sortable: true, render: (r) => <span className="text-xs">{r.volumen}</span> },
    { key: "enviado", label: "Enviado", sortable: true, filterable: "date", render: (r) => <span className="font-mono text-xs">{formatFechaHora(r.enviado)}</span> },
    {
      key: "estado",
      label: "Estado",
      sortable: true,
      filterable: "enum",
      filterOptions: ESTADOS,
      render: (r) => <Badge tone={tonePorEstado(r.estado)}>{r.estado}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Vinculación KYB"
        description="Revisá las solicitudes de vinculación de personas jurídicas: respuestas y documentos. Aprobar activa la cuenta y notifica al cliente."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Pendientes" value={String(cuenta("Pendiente"))} />
        <Stat label="En revisión" value={String(cuenta("En revisión"))} />
        <Stat label="Aprobadas" value={String(cuenta("Aprobada"))} />
        <Stat label="Rechazadas" value={String(cuenta("Rechazada"))} />
      </div>

      {query.isLoading ? (
        <Card>
          <div className="py-12 flex justify-center text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
          </div>
        </Card>
      ) : query.isError ? (
        <Card>
          <div className="py-10 text-center text-sm text-muted-foreground">{mensajeError(query.error)}</div>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState title="Sin solicitudes KYB" description="Todavía no hay vinculaciones de personas jurídicas para revisar." />
        </Card>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          keyExtractor={(r) => r.userId}
          pageSize={10}
          actions={(r) => (
            <ActionsDropdown actions={[{ label: "Revisar", icon: Eye, onClick: () => setActiveId(r.userId) }]} />
          )}
        />
      )}

      {activeId && <DetalleModal userId={activeId} onClose={() => setActiveId(null)} />}
    </>
  );
}
