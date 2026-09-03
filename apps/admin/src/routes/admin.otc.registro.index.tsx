import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Eye, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown } from "@/components/actions-dropdown";
import { PageHeader, Badge, Card, Stat, Label } from "@/components/portal-shell";
import {
  useBackoffice,
  tonePorEstado,
  ESTADOS_OTC,
  formatCOP,
  formatUSDT,
  formatTasa,
  type OperacionOtc,
  type TipoOperacionOtc,
} from "@/stores/backoffice-store";

export const Route = createFileRoute("/admin/otc/registro/")({
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

function OtcModal({ op, onClose }: { op: OperacionOtc; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-start z-10">
          <div>
            <h3 className="font-display text-lg font-semibold">Detalle de operación OTC</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {op.id} · {op.clienteNombre}
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
                Solicitud de cambio
              </h4>
              <Badge tone={tonePorEstado(op.estado)}>{op.estado}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Cliente" value={op.clienteNombre} />
              <Field label="Tipo de operación" value={op.tipo} />
              <Field label="Fecha de solicitud" value={op.fecha} />
              <Field
                label="Monto USDT"
                value={
                  op.montoUSDT > 0 ? (
                    <span className="font-mono tabular-nums">{formatUSDT(op.montoUSDT)}</span>
                  ) : (
                    "—"
                  )
                }
              />
              <Field
                label="Monto COP"
                value={
                  op.montoCOP > 0 ? (
                    <span className="font-mono tabular-nums">{formatCOP(op.montoCOP)}</span>
                  ) : (
                    "—"
                  )
                }
              />
              <Field
                label="Tasa aplicada"
                value={
                  op.tasaAplicada != null ? (
                    <span className="font-mono tabular-nums">
                      {formatTasa(op.tasaAplicada)}/USDT
                    </span>
                  ) : (
                    "Por definir"
                  )
                }
              />
              {op.montoFinalCOP != null && op.montoFinalCOP > 0 && (
                <Field
                  label="Monto final COP"
                  value={
                    <span className="font-mono tabular-nums">{formatCOP(op.montoFinalCOP)}</span>
                  }
                />
              )}
              {op.montoFinalUSDT != null && op.montoFinalUSDT > 0 && (
                <Field
                  label="Monto final USDT"
                  value={
                    <span className="font-mono tabular-nums">{formatUSDT(op.montoFinalUSDT)}</span>
                  }
                />
              )}
            </div>
            {op.motivoEstado && (
              <div className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Nota: </span>
                {op.motivoEstado}
              </div>
            )}
          </Card>
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

function NuevaOtcModal({ onClose }: { onClose: () => void }) {
  const clientes = useBackoffice((s) => s.clientes);
  const crearOtc = useBackoffice((s) => s.crearOtc);
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [tipo, setTipo] = useState<TipoOperacionOtc>("Venta USDT");
  const [monto, setMonto] = useState("");

  const guardar = () => {
    const valor = Number(String(monto).replace(/\s/g, "").replace(/,/g, "."));
    if (!valor || valor <= 0) {
      toast.error("Ingrese un monto válido mayor a cero.");
      return;
    }
    const cliente = clientes.find((c) => c.id === clienteId);
    const id = `OTC-2026-${Date.now().toString().slice(-6)}`;
    const hoy = new Date();
    const fecha = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(
      2,
      "0",
    )}/${hoy.getFullYear()}`;
    crearOtc({
      id,
      clienteNombre: cliente?.nombre ?? "Cliente",
      tipo,
      montoUSDT: tipo === "Venta USDT" ? valor : 0,
      montoCOP: tipo === "Compra USDT" ? valor : 0,
      tasaAplicada: null,
      montoFinalCOP: null,
      montoFinalUSDT: null,
      estado: "Pendiente",
      motivoEstado: "",
      fecha,
    });
    toast.success(`Solicitud ${id} registrada (${tipo})`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Registrar solicitud OTC</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Compra o venta de USDT contra pesos colombianos.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md">
            <X size={18} />
          </button>
        </div>
        <div>
          <Label htmlFor="otc-cliente">Cliente</Label>
          <select
            id="otc-cliente"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} · {c.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="otc-tipo">Tipo de operación</Label>
          <select
            id="otc-tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoOperacionOtc)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="Venta USDT">Venta USDT (cliente entrega USDT, recibe COP)</option>
            <option value="Compra USDT">Compra USDT (cliente entrega COP, recibe USDT)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="otc-monto">
            Monto solicitado {tipo === "Venta USDT" ? "(USDT)" : "(COP)"}
          </Label>
          <input
            id="otc-monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            inputMode="numeric"
            placeholder={tipo === "Venta USDT" ? "Ej. 2500" : "Ej. 11500000"}
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
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark transition-colors"
          >
            Registrar solicitud
          </button>
        </div>
      </div>
    </div>
  );
}

function Page() {
  const operaciones = useBackoffice((s) => s.operacionesOtc);
  const [detail, setDetail] = useState<OperacionOtc | null>(null);
  const [nueva, setNueva] = useState(false);

  const pendientes = operaciones.filter((o) => o.estado === "Pendiente").length;
  const porTasar = operaciones.filter(
    (o) => o.tasaAplicada == null && o.estado === "Pendiente",
  ).length;
  const aprobadas = operaciones.filter((o) => o.estado === "Aprobada").length;
  const rechazadas = operaciones.filter((o) => o.estado === "Rechazada").length;

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
      key: "monto",
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
      label: "Tasa",
      sortable: true,
      render: (o) =>
        o.tasaAplicada != null ? (
          <span className="font-mono tabular-nums">{formatTasa(o.tasaAplicada)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
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
    {
      key: "fecha",
      label: "Fecha",
      sortable: true,
      filterable: "date",
      render: (o) => <span className="font-mono text-xs">{o.fecha}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Registro de operaciones de cambio"
        description="Listado de solicitudes de compra/venta de criptomonedas (USDT a pesos colombianos) con el monto solicitado."
        action={
          <button
            type="button"
            onClick={() => setNueva(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark transition-colors"
          >
            <Plus size={16} /> Registrar solicitud
          </button>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Solicitudes pendientes" value={String(pendientes)} />
        <Stat label="Por tasar" value={String(porTasar)} />
        <Stat label="Aprobadas" value={String(aprobadas)} />
        <Stat label="Rechazadas" value={String(rechazadas)} />
      </div>
      <DataTable
        columns={columns}
        data={operaciones}
        keyExtractor={(o) => o.id}
        pageSize={10}
        actions={(o) => (
          <ActionsDropdown
            actions={[{ label: "Ver detalle", icon: Eye, onClick: () => setDetail(o) }]}
          />
        )}
      />
      {detail && <OtcModal op={detail} onClose={() => setDetail(null)} />}
      {nueva && <NuevaOtcModal onClose={() => setNueva(false)} />}
    </>
  );
}
