import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Check, ExternalLink, X } from "lucide-react";

import { PageHeader, BtnPrimary, BtnOutline } from "@/components/portal-shell";
import { useSolicitudes, useResolverSolicitud, type Solicitud } from "@/lib/solicitudes";
import { formatARS } from "@/lib/clientes";

export const Route = createFileRoute("/admin/pagos/aprobacion")({
  component: Page,
});

const ESTADO_BADGE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600",
  approved: "bg-emerald-500/15 text-emerald-600",
  rejected: "bg-red-500/15 text-red-600",
};
const ESTADO_LABEL: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

function Page() {
  const [soloPendientes, setSoloPendientes] = useState(true);
  const { data: items = [], isLoading, isError } = useSolicitudes(soloPendientes);
  const resolver = useResolverSolicitud();

  const [dialog, setDialog] = useState<{ sol: Solicitud; accion: "aprobar" | "rechazar" } | null>(null);
  const [comentario, setComentario] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const abrir = (sol: Solicitud, accion: "aprobar" | "rechazar") => {
    setComentario("");
    setErrorMsg(null);
    setDialog({ sol, accion });
  };

  const confirmar = async () => {
    if (!dialog) return;
    try {
      await resolver.mutateAsync({
        id: dialog.sol.id,
        kind: dialog.sol.kind,
        accion: dialog.accion,
        comentario,
      });
      setDialog(null);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "No se pudo procesar la solicitud");
    }
  };

  const fecha = (iso: string) =>
    new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <PageHeader
        title="Aprobación y rechazo"
        description="Solicitudes de depósito y retiro enviadas por los clientes."
        action={
          <div className="flex items-center gap-1 rounded-md border border-border p-1 text-sm">
            <button
              type="button"
              onClick={() => setSoloPendientes(true)}
              className={`px-3 py-1 rounded ${soloPendientes ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Pendientes
            </button>
            <button
              type="button"
              onClick={() => setSoloPendientes(false)}
              className={`px-3 py-1 rounded ${!soloPendientes ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Todas
            </button>
          </div>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8">Cargando solicitudes…</p>
      ) : isError ? (
        <p className="text-sm text-red-600 py-8">No se pudieron cargar las solicitudes.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">
          {soloPendientes ? "No hay solicitudes pendientes." : "No hay solicitudes."}
        </p>
      ) : (
        <div className="grid gap-3">
          {items.map((s) => {
            const esDeposito = s.kind === "deposit";
            return (
              <div key={s.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-10 h-10 rounded-full grid place-items-center ${esDeposito ? "bg-emerald-500/15 text-emerald-600" : "bg-primary/15 text-primary"}`}>
                    {esDeposito ? <ArrowDownToLine size={18} /> : <ArrowUpFromLine size={18} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{esDeposito ? "Depósito" : "Retiro"}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[s.status]}`}>
                        {ESTADO_LABEL[s.status] ?? s.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {s.clienteNombre}{s.clienteEmail ? ` · ${s.clienteEmail}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fecha(s.creadaEn)}</p>

                    <div className="mt-2 text-sm space-y-0.5">
                      {esDeposito && s.metodo ? <p><span className="text-muted-foreground">Método:</span> {s.metodo}</p> : null}
                      {!esDeposito && s.destino ? (
                        <p><span className="text-muted-foreground">Destino:</span> {s.destino.identifier}{s.destino.holder ? ` (${s.destino.holder})` : ""}</p>
                      ) : null}
                      {s.comentarioCliente ? <p><span className="text-muted-foreground">Comentario del cliente:</span> {s.comentarioCliente}</p> : null}
                      {s.comentarioOperador ? <p><span className="text-muted-foreground">Comentario del operador:</span> {s.comentarioOperador}</p> : null}
                      {s.comprobante ? (
                        <a href={s.comprobante} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink size={14} /> Ver comprobante
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-mono tabular-nums font-semibold">{formatARS(s.amount)}</p>
                    {s.status === "pending" ? (
                      <div className="flex gap-2 mt-2 justify-end">
                        <BtnOutline type="button" className="!py-1 !px-3 text-red-600" onClick={() => abrir(s, "rechazar")}>
                          <X size={16} /> Rechazar
                        </BtnOutline>
                        <BtnPrimary type="button" className="!py-1 !px-3" onClick={() => abrir(s, "aprobar")}>
                          <Check size={16} /> Aprobar
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
                {dialog.accion === "aprobar" ? "Aprobar" : "Rechazar"} {dialog.sol.kind === "deposit" ? "depósito" : "retiro"}
              </h3>
              <button type="button" onClick={() => setDialog(null)} className="p-1.5 hover:bg-muted rounded-md">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {dialog.sol.clienteNombre} · {formatARS(dialog.sol.amount)}
            </p>
            <label className="block text-sm font-medium mb-1">Comentario {dialog.accion === "rechazar" ? "(recomendado)" : "(opcional)"}</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-3"
              placeholder={dialog.accion === "rechazar" ? "Motivo del rechazo…" : "Nota interna o para el cliente…"}
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
                {resolver.isPending ? "Procesando…" : dialog.accion === "aprobar" ? "Aprobar" : "Rechazar"}
              </BtnPrimary>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
