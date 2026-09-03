import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Eye, CheckCircle2, XCircle, Paperclip, UploadCloud, Download, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown, type ActionItem } from "@/components/actions-dropdown";
import { PageHeader, Badge, Card, Label } from "@/components/portal-shell";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ComprobanteUploadModal } from "@/components/comprobante-upload";
import { useBackoffice, tonePorEstado, type Comprobante } from "@/stores/backoffice-store";

export const Route = createFileRoute("/admin/pagos/comprobantes")({
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

function ComprobanteModal({
  comprobante,
  onClose,
}: {
  comprobante: Comprobante;
  onClose: () => void;
}) {
  const pagos = useBackoffice((s) => s.pagos);
  const pago = pagos.find((p) => p.id === comprobante.solicitudId);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-start z-10">
          <div>
            <h3 className="font-display text-lg font-semibold">Comprobante de transferencia</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{comprobante.id}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
            <div className="w-12 h-12 rounded-lg bg-moli-blue-light text-moli-blue flex items-center justify-center shrink-0">
              <Paperclip size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{comprobante.nombreArchivo}</div>
              <div className="text-xs text-muted-foreground">Voucher de transferencia</div>
            </div>
            <button
              type="button"
              onClick={() => toast.success("Descarga del voucher iniciada (demo)")}
              className="ml-auto inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors"
            >
              <Download size={14} /> Descargar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Referencia" value={comprobante.referencia} />
            <Field label="Fecha de carga" value={comprobante.fechaCarga} />
            <Field label="Solicitud asociada" value={pago ? pago.id : "Sin asociar"} />
            {pago && <Field label="Beneficiario" value={pago.beneficiario} />}
            <Field
              label="Estado de validación"
              value={
                <Badge tone={tonePorEstado(comprobante.validado)}>{comprobante.validado}</Badge>
              }
            />
          </div>
        </div>
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function AsociarModal({ comprobante, onClose }: { comprobante: Comprobante; onClose: () => void }) {
  const pagos = useBackoffice((s) => s.pagos);
  const setComprobanteSolicitud = useBackoffice((s) => s.setComprobanteSolicitud);
  const [solicitudId, setSolicitudId] = useState(comprobante.solicitudId ?? "");

  const dinero = (v: number) => v.toLocaleString("es-CO");

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl w-full max-w-lg shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Asociar comprobante a solicitud</h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Comprobante <span className="font-mono text-foreground">{comprobante.id}</span> ·{" "}
          {comprobante.nombreArchivo}
        </p>
        <div>
          <Label htmlFor="asi-solicitud">Solicitud de pago destino</Label>
          <select
            id="asi-solicitud"
            value={solicitudId}
            onChange={(e) => setSolicitudId(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">Sin asociar</option>
            {pagos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} — {p.beneficiario} (${dinero(p.monto)} {p.moneda})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (solicitudId) {
                setComprobanteSolicitud(comprobante.id, solicitudId);
                toast.success("Comprobante asociado a la solicitud");
              } else {
                toast.info("Comprobante sin asociar");
              }
              onClose();
            }}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark transition-colors"
          >
            Guardar asociación
          </button>
        </div>
      </div>
    </div>
  );
}

function Page() {
  const comprobantes = useBackoffice((s) => s.comprobantes);
  const validarComprobante = useBackoffice((s) => s.validarComprobante);
  const [registrar, setRegistrar] = useState(false);
  const [detail, setDetail] = useState<Comprobante | null>(null);
  const [asociar, setAsociar] = useState<Comprobante | null>(null);
  const [rechazo, setRechazo] = useState<Comprobante | null>(null);

  const pendientes = comprobantes.filter((c) => c.validado === "Pendiente").length;
  const validados = comprobantes.filter((c) => c.validado === "Validado").length;
  const rechazados = comprobantes.filter((c) => c.validado === "Rechazado").length;
  const sinAsociar = comprobantes.filter((c) => !c.solicitudId).length;

  const getActions = (c: Comprobante): ActionItem[] => {
    const actions: ActionItem[] = [
      { label: "Ver comprobante", icon: Eye, onClick: () => setDetail(c) },
    ];
    if (c.validado !== "Validado") {
      actions.push({
        label: "Validar comprobante",
        icon: CheckCircle2,
        onClick: () => {
          validarComprobante(c.id, "Validado");
          toast.success(`Comprobante ${c.id} validado`);
        },
      });
    }
    if (c.validado !== "Rechazado") {
      actions.push({
        label: "Rechazar comprobante",
        icon: XCircle,
        variant: "danger",
        onClick: () => setRechazo(c),
      });
    }
    actions.push({
      label: "Asociar a solicitud",
      icon: Paperclip,
      onClick: () => setAsociar(c),
    });
    return actions;
  };

  const columns: Column<Comprobante>[] = [
    {
      key: "id",
      label: "ID",
      sortable: true,
      filterable: true,
      render: (c) => <span className="font-mono text-xs font-semibold">{c.id}</span>,
    },
    {
      key: "nombreArchivo",
      label: "Archivo",
      sortable: true,
      filterable: true,
      render: (c) => (
        <div className="flex items-center gap-2">
          <Paperclip size={13} className="text-muted-foreground shrink-0" />
          <span className="text-xs font-medium">{c.nombreArchivo}</span>
        </div>
      ),
    },
    {
      key: "referencia",
      label: "Referencia",
      sortable: true,
      filterable: true,
      render: (c) => <span className="font-mono text-xs">{c.referencia}</span>,
    },
    {
      key: "solicitudId",
      label: "Solicitud",
      sortable: true,
      filterable: true,
      render: (c) =>
        c.solicitudId ? (
          <span className="font-mono text-xs text-primary font-semibold">{c.solicitudId}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Sin asociar</span>
        ),
    },
    {
      key: "fechaCarga",
      label: "Fecha de carga",
      sortable: true,
      filterable: "date",
      render: (c) => <span className="font-mono text-xs">{c.fechaCarga}</span>,
    },
    {
      key: "validado",
      label: "Validación",
      sortable: true,
      filterable: "enum",
      filterOptions: ["Pendiente", "Validado", "Rechazado"],
      render: (c) => <Badge tone={tonePorEstado(c.validado)}>{c.validado}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Carga y validación de comprobantes"
        description="Sube el voucher de la transferencia realizada y asócialo a la solicitud correspondiente para validarlo."
        action={
          <button
            type="button"
            onClick={() => setRegistrar(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark transition-colors"
          >
            <UploadCloud size={16} /> Registrar comprobante
          </button>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Por validar</div>
          <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums">
            {pendientes}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Validados</div>
          <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums text-emerald-700">
            {validados}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Rechazados</div>
          <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums text-red-700">
            {rechazados}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Sin asociar</div>
          <div className="font-display text-xl md:text-2xl font-semibold mt-1 tabular-nums">
            {sinAsociar}
          </div>
        </Card>
      </div>
      {comprobantes.length === 0 ? (
        <Card>
          <EmptyState
            title="Sin comprobantes registrados"
            description="Registra el primer comprobante de transferencia con el botón superior."
          />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={comprobantes}
          keyExtractor={(c) => c.id}
          pageSize={10}
          actions={(c) => <ActionsDropdown actions={getActions(c)} />}
        />
      )}
      {registrar && <ComprobanteUploadModal open onClose={() => setRegistrar(false)} />}
      {detail && <ComprobanteModal comprobante={detail} onClose={() => setDetail(null)} />}
      {asociar && <AsociarModal comprobante={asociar} onClose={() => setAsociar(null)} />}
      <ConfirmDialog
        open={!!rechazo}
        onClose={() => setRechazo(null)}
        title="Rechazar comprobante"
        message={`¿Confirma el rechazo del comprobante "${rechazo?.nombreArchivo}"? La solicitud asociada requerirá un nuevo voucher.`}
        confirmLabel="Rechazar"
        variant="danger"
        onConfirm={() => {
          if (rechazo) {
            validarComprobante(rechazo.id, "Rechazado");
            toast.error(`Comprobante ${rechazo.id} rechazado`);
          }
          setRechazo(null);
        }}
      />
    </>
  );
}
