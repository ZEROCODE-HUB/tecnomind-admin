import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ThumbsUp, ThumbsDown, Clock, CheckCircle2, XCircle, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown } from "@/components/actions-dropdown";
import { PageHeader, Badge, Card, Stat, Label } from "@/components/portal-shell";
import { useBackoffice, tonePorEstado, type SolicitudPago } from "@/stores/backoffice-store";

export const Route = createFileRoute("/admin/pagos/aprobacion")({
  component: Page,
  
});

type Filtro = "Pendientes" | "En proceso" | "Todos por decidir";

const FILTROS: Filtro[] = ["Todos por decidir", "Pendientes", "En proceso"];

function DecisionModal({
  pago,
  decision,
  onCancel,
  onConfirm,
}: {
  pago: SolicitudPago;
  decision: "aprobar" | "rechazar" | "proceso";
  onCancel: () => void;
  onConfirm: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");

  const title =
    decision === "aprobar"
      ? "Aprobar pago"
      : decision === "rechazar"
        ? "Rechazar pago"
        : "Marcar en proceso";
  const text =
    decision === "aprobar"
      ? `Confirma que se ejecutó la transferencia de USD ${pago.monto.toLocaleString(
          "es-CO",
        )} a favor de ${pago.beneficiario}. La operación quedará aprobada.`
      : decision === "rechazar"
        ? `La solicitud ${pago.id} dejará de procesarse y se notificará al cliente.`
        : `La solicitud ${pago.id} quedará en proceso hasta completar la transferencia.`;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-xl w-full max-w-md shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onCancel} className="p-1.5 hover:bg-muted rounded-md">
            <X size={18} />
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-mono text-foreground font-semibold">{pago.id}</span> ·{" "}
          {pago.clienteNombre} · {pago.beneficiario} · ${pago.monto.toLocaleString("es-CO")}{" "}
          {pago.moneda}
        </div>
        <p className="text-sm text-muted-foreground">{text}</p>
        {decision !== "proceso" && (
          <div>
            <Label htmlFor="dm-motivo">Motivo (opcional)</Label>
            <textarea
              id="dm-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder={
                decision === "aprobar"
                  ? "Ej. Transferencia confirmada por el banco corresponsal."
                  : "Ej. Beneficiario no coincide con la factura soporte."
              }
              className="w-full rounded-lg border border-input bg-background text-sm p-3 outline-none focus:ring-2 focus:ring-ring/20 resize-y"
            />
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg border border-border bg-card text-sm font-semibold hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(motivo.trim())}
            className={`flex-1 h-10 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
              decision === "aprobar"
                ? "bg-primary text-primary-foreground hover:bg-moli-red-dark"
                : decision === "rechazar"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-moli-blue text-white hover:bg-moli-blue-dark"
            }`}
          >
            {decision === "aprobar" ? (
              <>
                <CheckCircle2 size={15} /> Aprobar
              </>
            ) : decision === "rechazar" ? (
              <>
                <XCircle size={15} /> Rechazar
              </>
            ) : (
              <>
                <Clock size={15} /> En proceso
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Page() {
  const pagos = useBackoffice((s) => s.pagos);
  const setPagoEstado = useBackoffice((s) => s.setPagoEstado);
  const [filtro, setFiltro] = useState<Filtro>("Todos por decidir");
  const [decidir, setDecidir] = useState<{
    pago: SolicitudPago;
    tipo: "aprobar" | "rechazar" | "proceso";
  } | null>(null);

  const porDecidir = pagos.filter((p) => p.estado === "Pendiente" || p.estado === "En proceso");

  const listado = porDecidir.filter((p) => {
    if (filtro === "Pendientes") return p.estado === "Pendiente";
    if (filtro === "En proceso") return p.estado === "En proceso";
    return true;
  });

  const stats = {
    pendientes: porDecidir.filter((p) => p.estado === "Pendiente").length,
    enProceso: porDecidir.filter((p) => p.estado === "En proceso").length,
    aprobados: pagos.filter((p) => p.estado === "Aprobado").length,
    rechazados: pagos.filter((p) => p.estado === "Rechazado").length,
  };

  const ejecutarDecision = (motivo: string) => {
    if (!decidir) return;
    const { pago, tipo } = decidir;
    if (tipo === "aprobar") {
      setPagoEstado(pago.id, "Aprobado", motivo || "Transferencia confirmada.");
      toast.success(`Pago ${pago.id} aprobado`);
    } else if (tipo === "rechazar") {
      setPagoEstado(pago.id, "Rechazado", motivo || "Rechazado por el equipo operativo.");
      toast.error(`Pago ${pago.id} rechazado`);
    } else {
      setPagoEstado(pago.id, "En proceso", motivo || "En proceso por el equipo operativo.");
      toast.info(`Pago ${pago.id} marcado en proceso`);
    }
    setDecidir(null);
  };

  const getActions = (p: SolicitudPago) => [
    {
      label: "Aprobar pago",
      icon: ThumbsUp,
      onClick: () => setDecidir({ pago: p, tipo: "aprobar" }),
    },
    {
      label: "Marcar en proceso",
      icon: Clock,
      onClick: () => setDecidir({ pago: p, tipo: "proceso" }),
    },
    {
      label: "Rechazar pago",
      icon: ThumbsDown,
      variant: "danger" as const,
      onClick: () => setDecidir({ pago: p, tipo: "rechazar" }),
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
      render: (p) => (
        <span className="font-mono tabular-nums">USD {p.monto.toLocaleString("es-CO")}</span>
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      sortable: true,
      filterable: "date",
      render: (p) => <span className="font-mono text-xs">{p.fecha}</span>,
    },
    {
      key: "estado",
      label: "Estado",
      sortable: true,
      filterable: "enum",
      filterOptions: ["Pendiente", "En proceso"],
      render: (p) => <Badge tone={tonePorEstado(p.estado)}>{p.estado}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Aprobación y rechazo de operaciones"
        description="Marca cada pago como aprobado, rechazado o en proceso, con motivo opcional para dejar trazabilidad."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Pendientes" value={String(stats.pendientes)} />
        <Stat label="En proceso" value={String(stats.enProceso)} />
        <Stat label="Aprobados" value={String(stats.aprobados)} />
        <Stat label="Rechazados" value={String(stats.rechazados)} />
      </div>
      <Card className="p-0 mb-4">
        <div className="flex flex-wrap gap-1 p-2">
          {FILTROS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtro === f ? "bg-moli-blue text-white" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </Card>
      <DataTable
        columns={columns}
        data={listado}
        keyExtractor={(p) => p.id}
        pageSize={10}
        actions={(p) => <ActionsDropdown actions={getActions(p)} />}
      />
      {decidir && (
        <DecisionModal
          pago={decidir.pago}
          decision={decidir.tipo}
          onCancel={() => setDecidir(null)}
          onConfirm={ejecutarDecision}
        />
      )}
    </>
  );
}
