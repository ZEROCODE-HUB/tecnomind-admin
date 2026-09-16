import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Check, ExternalLink, X } from "lucide-react";

import { PageHeader, BtnPrimary, BtnOutline } from "@/components/portal-shell";
import { useOtcOrders, useResolverOtcOrder, type OtcOrder } from "@/lib/otc";
import { formatARS } from "@/lib/clientes";

export const Route = createFileRoute("/admin/otc/registro/")({
  component: Page,
});

const ESTADO_BADGE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600",
  completed: "bg-emerald-500/15 text-emerald-600",
  rejected: "bg-red-500/15 text-red-600",
};
const ESTADO_LABEL: Record<string, string> = {
  pending: "Pendiente",
  completed: "Completada",
  rejected: "Rechazada",
};

const fmtCrypto = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 6 });

function Page() {
  const [soloPendientes, setSoloPendientes] = useState(true);
  const { data: items = [], isLoading, isError } = useOtcOrders(soloPendientes);
  const resolver = useResolverOtcOrder();

  const [dialog, setDialog] = useState<{ orden: OtcOrder; accion: "completar" | "rechazar" } | null>(null);
  const [comentario, setComentario] = useState("");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const abrir = (orden: OtcOrder, accion: "completar" | "rechazar") => {
    setComentario("");
    setTxHash(orden.txHash ?? "");
    setErrorMsg(null);
    setDialog({ orden, accion });
  };

  const confirmar = async () => {
    if (!dialog) return;
    try {
      await resolver.mutateAsync({ id: dialog.orden.id, accion: dialog.accion, comentario, txHash });
      setDialog(null);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "No se pudo procesar la operación");
    }
  };

  const fecha = (iso: string) =>
    new Date(iso).toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <PageHeader
        title="Registro de operaciones OTC"
        description="Compras y ventas de USDT solicitadas por los clientes."
        action={
          <div className="flex items-center gap-1 rounded-md border border-border p-1 text-sm">
            <button type="button" onClick={() => setSoloPendientes(true)}
              className={`px-3 py-1 rounded ${soloPendientes ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              Pendientes
            </button>
            <button type="button" onClick={() => setSoloPendientes(false)}
              className={`px-3 py-1 rounded ${!soloPendientes ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              Todas
            </button>
          </div>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8">Cargando operaciones…</p>
      ) : isError ? (
        <p className="text-sm text-red-600 py-8">No se pudieron cargar las operaciones.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">
          {soloPendientes ? "No hay operaciones pendientes." : "No hay operaciones."}
        </p>
      ) : (
        <div className="grid gap-3">
          {items.map((o) => {
            const esCompra = o.side === "buy";
            return (
              <div key={o.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-10 h-10 rounded-full grid place-items-center ${esCompra ? "bg-primary/15 text-primary" : "bg-emerald-500/15 text-emerald-600"}`}>
                    {esCompra ? <ArrowUpFromLine size={18} /> : <ArrowDownToLine size={18} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{esCompra ? "Compra USDT" : "Venta USDT"}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[o.status]}`}>
                        {ESTADO_LABEL[o.status] ?? o.status}
                      </span>
                    </div>
                    {o.reference ? <p className="text-xs font-mono text-primary">{o.reference}</p> : null}
                    <p className="text-sm text-muted-foreground">
                      {o.clienteNombre}{o.clienteNit ? ` · NIT ${o.clienteNit}` : ""}{o.clienteEmail ? ` · ${o.clienteEmail}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fecha(o.creadaEn)}{o.resueltaEn ? ` · Acreditada: ${fecha(o.resueltaEn)}` : ""}</p>

                    <div className="mt-2 text-sm space-y-0.5">
                      <p><span className="text-muted-foreground">Cantidad:</span> {fmtCrypto(o.amountCrypto)} {o.assetCode}</p>
                      <p><span className="text-muted-foreground">Cotización:</span> {formatARS(o.unitRate)} / {o.assetCode} · Comisión {o.commissionPercent}% ({formatARS(o.commissionAmount)})</p>
                      {o.txHash ? <p className="break-all"><span className="text-muted-foreground">Hash tx:</span> <span className="font-mono">{o.txHash}</span></p> : null}
                      {esCompra ? (
                        <p className="break-all"><span className="text-muted-foreground">Enviar USDT a la wallet del cliente:</span> {o.wallet}</p>
                      ) : (
                        <p className="break-all"><span className="text-muted-foreground">Cliente envió a la wallet de la empresa:</span> {o.wallet}</p>
                      )}
                      {o.comentarioCliente ? <p><span className="text-muted-foreground">Comentario del cliente:</span> {o.comentarioCliente}</p> : null}
                      {o.comentarioOperador ? <p><span className="text-muted-foreground">Comentario del operador:</span> {o.comentarioOperador}</p> : null}
                      {o.comprobante ? (
                        <a href={o.comprobante} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink size={14} /> Ver comprobante
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-mono tabular-nums font-semibold">{formatARS(o.fiatAmount)}</p>
                    <p className="text-[11px] text-muted-foreground">{esCompra ? "debitado" : "a acreditar"}</p>
                    {o.status === "pending" ? (
                      <div className="flex gap-2 mt-2 justify-end">
                        <BtnOutline type="button" className="!py-1 !px-3 text-red-600" onClick={() => abrir(o, "rechazar")}>
                          <X size={16} /> Rechazar
                        </BtnOutline>
                        <BtnPrimary type="button" className="!py-1 !px-3" onClick={() => abrir(o, "completar")}>
                          <Check size={16} /> Completar
                        </BtnPrimary>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dialog ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !resolver.isPending && setDialog(null)} />
          <div className="relative bg-card rounded-lg w-full max-w-md shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg">
                {dialog.accion === "completar" ? "Completar" : "Rechazar"} {dialog.orden.side === "buy" ? "compra" : "venta"}
              </h3>
              <button type="button" onClick={() => setDialog(null)} className="p-1.5 hover:bg-muted rounded-md">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {dialog.orden.clienteNombre} · {fmtCrypto(dialog.orden.amountCrypto)} USDT · {formatARS(dialog.orden.fiatAmount)}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {dialog.accion === "completar" && dialog.orden.side === "buy"
                ? "Confirmá SOLO después de haber enviado los USDT a la wallet del cliente."
                : dialog.accion === "completar"
                  ? "Confirmá SOLO después de verificar que llegaron los USDT. Se acreditará el saldo al cliente."
                  : dialog.orden.side === "buy"
                    ? "Se devolverá el saldo retenido al cliente."
                    : "La venta se marca como rechazada (no hubo débito de saldo)."}
            </p>
            {dialog.accion === "completar" ? (
              <>
                <label className="block text-sm font-medium mb-1">Id Transacción / Hash on-chain (opcional)</label>
                <input
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-3 font-mono"
                  placeholder="0x… o hash del envío de cripto"
                />
              </>
            ) : null}
            <label className="block text-sm font-medium mb-1">Comentario {dialog.accion === "rechazar" ? "(recomendado)" : "(opcional)"}</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-3"
              placeholder={dialog.accion === "rechazar" ? "Motivo del rechazo…" : "Nota / hash de la transferencia…"}
            />
            {errorMsg ? <p className="text-sm text-red-600 mb-3">{errorMsg}</p> : null}
            <div className="flex gap-2">
              <BtnOutline type="button" className="flex-1" onClick={() => setDialog(null)} disabled={resolver.isPending}>
                Cancelar
              </BtnOutline>
              <BtnPrimary
                type="button"
                className={`flex-1 ${dialog.accion === "rechazar" ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                onClick={confirmar}
                disabled={resolver.isPending}
              >
                {resolver.isPending ? "Procesando…" : dialog.accion === "completar" ? "Completar" : "Rechazar"}
              </BtnPrimary>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
