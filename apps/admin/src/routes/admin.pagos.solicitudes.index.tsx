import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Eye, Paperclip, Download, Building2, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown } from "@/components/actions-dropdown";
import { PageHeader, Badge, Card, Stat } from "@/components/portal-shell";
import { ComprobanteUploadModal } from "@/components/comprobante-upload";
import {
  useBackoffice,
  tonePorEstado,
  ESTADOS_PAGO,
  type SolicitudPago,
} from "@/stores/backoffice-store";

export const Route = createFileRoute("/admin/pagos/solicitudes/")({
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

function SolicitudModal({
  pago,
  onClose,
  onCargarComprobante,
}: {
  pago: SolicitudPago;
  onClose: () => void;
  onCargarComprobante: (p: SolicitudPago) => void;
}) {
  const comprobantes = useBackoffice((s) => s.comprobantes);
  const comprobante = comprobantes.find((c) => c.id === pago.comprobanteId);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-start z-10">
          <div>
            <h3 className="font-display text-lg font-semibold">Solicitud de pago internacional</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pago.id} · {pago.clienteNombre}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <Card className="p-5">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Datos de la operación
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Cliente solicitante" value={pago.clienteNombre} />
              <Field label="Fecha de solicitud" value={pago.fecha} />
              <Field
                label="Monto solicitado"
                value={
                  <span className="font-mono tabular-nums font-semibold">
                    {pago.moneda === "USD" ? "USD " : "$ "}
                    {pago.monto.toLocaleString("es-CO")}
                  </span>
                }
              />
              <Field
                label="Estado"
                value={<Badge tone={tonePorEstado(pago.estado)}>{pago.estado}</Badge>}
              />
              <Field label="Concepto" value={pago.concepto} />
              <Field label="Banco de origen (cliente)" value={pago.bancoOrigen} />
            </div>
            {pago.motivoEstado && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
                <Building2 size={15} className="shrink-0 mt-0.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Motivo registrado: </span>
                  {pago.motivoEstado}
                </span>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Beneficiario
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
              <Field label="Beneficiario" value={pago.beneficiario} />
              <Field label="Banco del beneficiario" value={pago.bancoBeneficiario} />
              <Field label="Cuenta del beneficiario" value={pago.cuentaBeneficiario} />
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Factura cargada por el cliente
            </h4>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-moli-blue-light text-moli-blue flex items-center justify-center">
                  <Paperclip size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold">{pago.factura}</div>
                  <div className="text-xs text-muted-foreground">Soporte de la solicitud</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast.success("Descarga de factura iniciada (demo)")}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors"
              >
                <Download size={14} /> Descargar factura
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Comprobante de transferencia
            </h4>
            {comprobante ? (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-sm font-semibold">{comprobante.nombreArchivo}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Referencia: {comprobante.referencia} · Cargado el {comprobante.fechaCarga}
                  </div>
                </div>
                <Badge tone={tonePorEstado(comprobante.validado)}>{comprobante.validado}</Badge>
              </div>
            ) : (
              <div className="border border-dashed rounded-lg py-6 text-center text-sm text-muted-foreground">
                Aún no se ha cargado el comprobante de esta transferencia.
              </div>
            )}
          </Card>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              onCargarComprobante(pago);
              onClose();
            }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-foreground text-sm font-semibold hover:bg-accent transition-colors"
          >
            <Paperclip size={15} /> Cargar comprobante
          </button>
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

function Page() {
  const pagos = useBackoffice((s) => s.pagos);
  const comprobantes = useBackoffice((s) => s.comprobantes);
  const [detail, setDetail] = useState<SolicitudPago | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadTarget, setUploadTarget] = useState<SolicitudPago | null>(null);

  const pendientes = pagos.filter((p) => p.estado === "Pendiente").length;
  const enProceso = pagos.filter((p) => p.estado === "En proceso").length;
  const aprobados = pagos.filter((p) => p.estado === "Aprobado").length;
  const rechazados = pagos.filter((p) => p.estado === "Rechazado").length;

  const nombreComprobante = (p: SolicitudPago) => {
    const c = comprobantes.find((x) => x.id === p.comprobanteId);
    return c ? c.nombreArchivo : null;
  };

  const getActions = (p: SolicitudPago) => [
    {
      label: "Ver solicitud",
      icon: Eye,
      onClick: () => setDetail(p),
    },
    {
      label: p.comprobanteId ? "Reemplazar comprobante" : "Cargar comprobante",
      icon: Paperclip,
      onClick: () => {
        setUploadTarget(p);
        setUploading(true);
      },
    },
  ];

  const columns: Column<SolicitudPago>[] = [
    {
      key: "id",
      label: "Solicitud",
      sortable: true,
      filterable: true,
      render: (p) => <span className="font-mono text-xs font-semibold">{p.id}</span>,
    },
    {
      key: "cliente",
      label: "Cliente",
      sortable: true,
      filterable: true,
      render: (p) => <span className="font-semibold">{p.clienteNombre}</span>,
    },
    {
      key: "beneficiario",
      label: "Beneficiario",
      sortable: true,
      filterable: true,
      render: (p) => (
        <div>
          <div>{p.beneficiario}</div>
          <div className="text-xs text-muted-foreground">{p.bancoBeneficiario}</div>
        </div>
      ),
    },
    {
      key: "monto",
      label: "Monto",
      sortable: true,
      filterable: true,
      render: (p) => (
        <span className="font-mono tabular-nums">
          {p.moneda === "USD" ? "USD " : "$ "}
          {p.monto.toLocaleString("es-CO")}
        </span>
      ),
    },
    {
      key: "factura",
      label: "Factura",
      sortable: true,
      filterable: true,
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <Paperclip size={13} className="text-muted-foreground" />
          <span className="text-xs">{p.factura}</span>
        </div>
      ),
    },
    {
      key: "comprobante",
      label: "Comprobante",
      filterable: true,
      render: (p) => {
        const n = nombreComprobante(p);
        return n ? (
          <span className="text-xs text-primary font-semibold">{n}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Sin cargar</span>
        );
      },
    },
    {
      key: "estado",
      label: "Estado",
      sortable: true,
      filterable: "enum",
      filterOptions: ESTADOS_PAGO,
      render: (p) => <Badge tone={tonePorEstado(p.estado)}>{p.estado}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Procesamiento manual de pagos"
        description="Listado de solicitudes de pago internacional con los datos del beneficiario y la factura cargada por el cliente."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Pendientes" value={String(pendientes)} />
        <Stat label="En proceso" value={String(enProceso)} />
        <Stat label="Aprobados" value={String(aprobados)} />
        <Stat label="Rechazados" value={String(rechazados)} />
      </div>
      <DataTable
        columns={columns}
        data={pagos}
        keyExtractor={(p) => p.id}
        pageSize={10}
        actions={(p) => <ActionsDropdown actions={getActions(p)} />}
      />
      {detail && (
        <SolicitudModal
          pago={detail}
          onClose={() => setDetail(null)}
          onCargarComprobante={(p) => {
            setUploadTarget(p);
            setUploading(true);
          }}
        />
      )}
      {uploading && (
        <ComprobanteUploadModal
          open
          onClose={() => setUploading(false)}
          defaultSolicitudId={uploadTarget?.id ?? null}
        />
      )}
      <Card className="mt-6">
        <div className="text-sm text-muted-foreground">
          Todos los pagos se procesan de forma manual: el equipo verifica la factura, ejecuta la
          transferencia desde la cuenta bancaria y registra el comprobante para cerrar la operación.
        </div>
      </Card>
    </>
  );
}
