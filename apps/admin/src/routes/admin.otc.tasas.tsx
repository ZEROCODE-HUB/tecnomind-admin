import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { SlidersHorizontal, CheckCircle2, XCircle, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown, type ActionItem } from "@/components/actions-dropdown";
import { PageHeader, Badge, Card, Stat, Label } from "@/components/portal-shell";
import {
  useBackoffice,
  tonePorEstado,
  ESTADOS_OTC,
  formatCOP,
  formatUSDT,
  formatTasa,
  type OperacionOtc,
} from "@/stores/backoffice-store";

export const Route = createFileRoute("/admin/otc/tasas")({
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

function TasaModal({ op, onClose }: { op: OperacionOtc; onClose: () => void }) {
  const setOtcTasa = useBackoffice((s) => s.setOtcTasa);
  const esVenta = op.tipo === "Venta USDT";
  const [tasa, setTasa] = useState(op.tasaAplicada != null ? String(op.tasaAplicada) : "");
  const tasaNum = Number(String(tasa).replace(/\s/g, "").replace(/,/g, "."));
  const [montoFinal, setMontoFinal] = useState(() => {
    if (esVenta) return op.montoFinalCOP != null ? String(op.montoFinalCOP) : "";
    return op.montoFinalUSDT != null ? String(op.montoFinalUSDT) : "";
  });

  const preview = (() => {
    if (!tasaNum || tasaNum <= 0) return null;
    if (esVenta) return Math.round(op.montoUSDT * tasaNum);
    return op.montoCOP / tasaNum;
  })();

  const guardar = () => {
    if (!tasaNum || tasaNum <= 0) {
      toast.error("Debe ingresar una tasa válida (COP por USDT).");
      return;
    }
    const finalNum = Number(String(montoFinal).replace(/\s/g, "").replace(/,/g, "."));
    if (!finalNum || finalNum <= 0) {
      toast.error("Debe ingresar el monto final correspondiente.");
      return;
    }
    if (esVenta) {
      setOtcTasa(op.id, tasaNum, finalNum, 0);
    } else {
      setOtcTasa(op.id, tasaNum, op.montoCOP, finalNum);
    }
    toast.success(`Tasa y monto final registrados para ${op.id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Control de tasas y montos</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {op.id} · {op.clienteNombre} · {op.tipo}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md">
            <X size={18} />
          </button>
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Solicitud
            </h4>
            <Badge tone={tonePorEstado(op.estado)}>{op.estado}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            <Field
              label="Monto de referencia"
              value={
                <span className="font-mono tabular-nums">
                  {esVenta ? formatUSDT(op.montoUSDT) : formatCOP(op.montoCOP)}
                </span>
              }
            />
            <Field label="Tipo de operación" value={op.tipo} />
            <Field label="Fecha" value={op.fecha} />
          </div>
        </Card>

        <div>
          <Label htmlFor="tas-cotizacion">Tasa aplicada (COP por USDT)</Label>
          <input
            id="tas-cotizacion"
            value={tasa}
            onChange={(e) => {
              setTasa(e.target.value);
              if (e.target.value) {
                const t = Number(e.target.value.replace(/\s/g, "").replace(/,/g, "."));
                if (t > 0) {
                  setMontoFinal(
                    esVenta ? String(Math.round(op.montoUSDT * t)) : String(op.montoCOP / t),
                  );
                }
              }
            }}
            inputMode="numeric"
            placeholder="Ej. 4210"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/20"
          />
          {preview != null && (
            <p className="text-xs text-muted-foreground mt-1.5">
              Cálculo automático:{" "}
              <span className="font-mono font-semibold text-foreground">
                {esVenta ? formatCOP(preview) : formatUSDT(Number(preview.toFixed(2)))}
              </span>
              {esVenta ? " a entregar al cliente" : " a entregar al cliente"}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="tas-monto">
            {esVenta ? "Monto final a entregar (COP)" : "Monto final a entregar (USDT)"}
          </Label>
          <input
            id="tas-monto"
            value={montoFinal}
            onChange={(e) => setMontoFinal(e.target.value)}
            inputMode="decimal"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/20"
          />
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
            onClick={guardar}
            className="flex-1 h-10 rounded-lg bg-moli-blue text-white text-sm font-semibold hover:bg-moli-blue-dark transition-colors inline-flex items-center justify-center gap-2"
          >
            <SlidersHorizontal size={15} /> Guardar tasa y monto
          </button>
        </div>
      </div>
    </div>
  );
}

function DecisionOtcModal({
  op,
  decision,
  onCancel,
  onConfirm,
}: {
  op: OperacionOtc;
  decision: "aprobar" | "rechazar";
  onCancel: () => void;
  onConfirm: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-xl w-full max-w-md shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">
            {decision === "aprobar" ? "Aprobar operación OTC" : "Rechazar operación OTC"}
          </h3>
          <button type="button" onClick={onCancel} className="p-1.5 hover:bg-muted rounded-md">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          {op.id} · {op.clienteNombre} · Tasa{" "}
          {op.tasaAplicada != null ? formatTasa(op.tasaAplicada) : "—"} · Monto final{" "}
          {op.montoFinalCOP != null && op.montoFinalCOP > 0
            ? formatCOP(op.montoFinalCOP)
            : op.montoFinalUSDT != null && op.montoFinalUSDT > 0
              ? formatUSDT(op.montoFinalUSDT)
              : "—"}
        </p>
        <div>
          <Label htmlFor="dm-motivo-otc">Motivo (opcional)</Label>
          <textarea
            id="dm-motivo-otc"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            placeholder={
              decision === "aprobar"
                ? "Ej. Confirmado con el cliente y con fondos disponibles."
                : "Ej. Verificación de origen de fondos incompleta."
            }
            className="w-full rounded-lg border border-input bg-background text-sm p-3 outline-none focus:ring-2 focus:ring-ring/20 resize-y"
          />
        </div>
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
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {decision === "aprobar" ? (
              <>
                <CheckCircle2 size={15} /> Aprobar
              </>
            ) : (
              <>
                <XCircle size={15} /> Rechazar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Page() {
  const operaciones = useBackoffice((s) => s.operacionesOtc);
  const setOtcEstado = useBackoffice((s) => s.setOtcEstado);
  const [tasando, setTasando] = useState<OperacionOtc | null>(null);
  const [decidir, setDecidir] = useState<{ op: OperacionOtc; tipo: "aprobar" | "rechazar" } | null>(
    null,
  );

  const sinTasar = operaciones.filter(
    (o) => (o.tasaAplicada == null || o.montoFinalCOP == null) && o.estado !== "Rechazada",
  ).length;
  const enRevision = operaciones.filter((o) => o.estado === "En revisión").length;
  const aprobadas = operaciones.filter((o) => o.estado === "Aprobada").length;
  const rechazadas = operaciones.filter((o) => o.estado === "Rechazada").length;

  const getActions = (o: OperacionOtc): ActionItem[] => {
    const t = o.tasaAplicada == null || o.montoFinalCOP == null;
    const actions: ActionItem[] = [
      {
        label: t ? "Ingresar tasa y monto" : "Revisar tasa y monto",
        icon: SlidersHorizontal,
        onClick: () => setTasando(o),
      },
    ];
    if (o.estado !== "Aprobada") {
      actions.push({
        label: "Aprobar operación",
        icon: CheckCircle2,
        onClick: () => setDecidir({ op: o, tipo: "aprobar" }),
      });
    }
    if (o.estado !== "Rechazada") {
      actions.push({
        label: "Rechazar operación",
        icon: XCircle,
        variant: "danger",
        onClick: () => setDecidir({ op: o, tipo: "rechazar" }),
      });
    }
    return actions;
  };

  const columns: Column<OperacionOtc>[] = [
    {
      key: "id",
      label: "Operación",
      sortable: true,
      filterable: true,
      render: (o) => <span className="font-mono text-xs font-semibold">{o.id}</span>,
    },
    {
      key: "cliente",
      label: "Cliente",
      sortable: true,
      filterable: true,
      render: (o) => <span className="font-semibold">{o.clienteNombre}</span>,
    },
    {
      key: "tipo",
      label: "Tipo",
      sortable: true,
      filterable: "enum",
      filterOptions: ["Compra USDT", "Venta USDT"],
      render: (o) => (
        <Badge tone={o.tipo === "Compra USDT" ? "success" : "neutral"}>{o.tipo}</Badge>
      ),
    },
    {
      key: "referencia",
      label: "Monto solicitado",
      sortable: true,
      render: (o) => (
        <span className="font-mono tabular-nums">
          {o.montoUSDT > 0 ? formatUSDT(o.montoUSDT) : formatCOP(o.montoCOP)}
        </span>
      ),
    },
    {
      key: "tasa",
      label: "Tasa aplicada",
      sortable: true,
      render: (o) =>
        o.tasaAplicada != null ? (
          <span className="font-mono tabular-nums font-semibold">{formatTasa(o.tasaAplicada)}</span>
        ) : (
          <Badge tone="warn">Por definir</Badge>
        ),
    },
    {
      key: "montoFinal",
      label: "Monto final",
      sortable: true,
      render: (o) => {
        if (o.montoFinalCOP != null && o.montoFinalCOP > 0)
          return <span className="font-mono tabular-nums">{formatCOP(o.montoFinalCOP)}</span>;
        if (o.montoFinalUSDT != null && o.montoFinalUSDT > 0)
          return <span className="font-mono tabular-nums">{formatUSDT(o.montoFinalUSDT)}</span>;
        return <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      key: "estado",
      label: "Estado",
      sortable: true,
      filterable: "enum",
      filterOptions: ESTADOS_OTC,
      render: (o) => <Badge tone={tonePorEstado(o.estado)}>{o.estado}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Control de tasas y montos"
        description="El operador ingresa manualmente la tasa aplicada y el monto final que corresponde entregar al cliente."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Por tasar" value={String(sinTasar)} />
        <Stat label="En revisión" value={String(enRevision)} />
        <Stat label="Aprobadas" value={String(aprobadas)} />
        <Stat label="Rechazadas" value={String(rechazadas)} />
      </div>
      <DataTable
        columns={columns}
        data={operaciones}
        keyExtractor={(o) => o.id}
        pageSize={10}
        actions={(o) => <ActionsDropdown actions={getActions(o)} />}
      />
      {tasando && <TasaModal op={tasando} onClose={() => setTasando(null)} />}
      {decidir && (
        <DecisionOtcModal
          op={decidir.op}
          decision={decidir.tipo}
          onCancel={() => setDecidir(null)}
          onConfirm={(motivo) => {
            const { op, tipo } = decidir;
            if (tipo === "aprobar") {
              setOtcEstado(op.id, "Aprobada", motivo || "Operación confirmada.");
              toast.success(`Operación ${op.id} aprobada`);
            } else {
              setOtcEstado(op.id, "Rechazada", motivo || "Rechazada por el equipo operativo.");
              toast.error(`Operación ${op.id} rechazada`);
            }
            setDecidir(null);
          }}
        />
      )}
    </>
  );
}
