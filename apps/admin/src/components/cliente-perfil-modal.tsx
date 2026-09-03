import { useState, type ReactNode } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge, Card, Label } from "@/components/portal-shell";
import { useAuth } from "@/contexts/auth";
import {
  useSetObservaciones,
  tonePorEstado,
  formatARS,
  formatFecha,
  formatCuit,
  formatDocumento,
  mensajeError,
  type Cliente,
} from "@/lib/clientes";
import { useMovimientosDeCliente } from "@/lib/movimientos";

/**
 * Ficha de cliente. La comparten Verificación > Clientes y General >
 * Usuarios: son la misma persona vista desde dos secciones, y duplicar
 * la ficha garantizaba que se desincronizaran.
 */
function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      {/* break-words: un correo largo se montaba sobre la columna de al lado. */}
      <div className="font-medium mt-0.5 break-words">{value}</div>
    </div>
  );
}

export function PerfilModal({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const { can } = useAuth();
  const puedeEditar = can("verificacion", "update");
  const guardar = useSetObservaciones();
  const [obs, setObs] = useState(cliente.observaciones);

  // Los últimos movimientos reemplazan a la tabla de "productos" del
  // prototipo: en fiat el producto es la cuenta, y lo que el operador
  // necesita ver es la operatoria.
  const movimientos = useMovimientosDeCliente(cliente.id, 10);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-start z-10">
          <div>
            <h3 className="font-display text-lg font-semibold">Perfil de cliente</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{cliente.nombre}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <Card className="p-5">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Datos del cliente
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Nombre" value={cliente.nombre} />
              <Field label="Tipo de documento" value={cliente.tipoDocumento} />
              <Field label="Número de documento" value={formatDocumento(cliente.documento)} />
              <Field label="CUIT / CUIL" value={formatCuit(cliente.cuit)} />
              <Field label="Correo electrónico" value={cliente.email} />
              <Field label="Teléfono" value={cliente.telefono} />
              <Field label="País" value={cliente.pais} />
              <Field label="Fecha de registro" value={formatFecha(cliente.fechaRegistro)} />
              <Field
                label="ID de cliente"
                value={<span className="font-mono text-xs">{cliente.id.slice(0, 8)}</span>}
              />
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Estado de verificación y cumplimiento
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              <Field
                label="Verificación de identidad"
                value={
                  <Badge tone={tonePorEstado(cliente.estadoVerificacion)}>
                    {cliente.estadoVerificacion}
                  </Badge>
                }
              />
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
                value={
                  <Badge tone={tonePorEstado(cliente.estadoCuenta)}>{cliente.estadoCuenta}</Badge>
                }
              />
              {cliente.scoreKyc != null && (
                <Field
                  label={`Score ${cliente.proveedorKyc ?? "KYC"}`}
                  value={<span className="font-mono tabular-nums">{cliente.scoreKyc}/100</span>}
                />
              )}
              {cliente.motivoEstadoCuenta && (
                <Field label="Motivo del estado" value={cliente.motivoEstadoCuenta} />
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Cuenta
            </h4>
            {cliente.cvu ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                <Field label="CVU" value={<span className="font-mono text-xs">{cliente.cvu}</span>} />
                <Field label="CBU" value={<span className="font-mono text-xs">{cliente.cbu}</span>} />
                <Field label="Alias" value={<span className="font-mono text-xs">{cliente.alias}</span>} />
                <Field
                  label="Saldo"
                  value={<span className="font-mono tabular-nums">{formatARS(cliente.saldo)}</span>}
                />
              </div>
            ) : (
              <div className="border border-dashed rounded-lg py-6 text-center text-sm text-muted-foreground">
                El cliente todavía no tiene cuenta creada.
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Últimos movimientos
            </h4>
            {movimientos.isLoading ? (
              <div className="py-6 flex justify-center text-muted-foreground">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : (movimientos.data ?? []).length === 0 ? (
              <div className="border border-dashed rounded-lg py-6 text-center text-sm text-muted-foreground">
                El cliente aún no registra movimientos.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-3 py-2.5 font-display font-semibold">Fecha</th>
                      <th className="px-3 py-2.5 font-display font-semibold">Tipo</th>
                      <th className="px-3 py-2.5 font-display font-semibold">Contraparte</th>
                      <th className="px-3 py-2.5 font-display font-semibold text-right">Monto</th>
                      <th className="px-3 py-2.5 font-display font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(movimientos.data ?? []).map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="px-3 py-2.5 font-mono text-xs">{formatFecha(m.fecha)}</td>
                        <td className="px-3 py-2.5 font-medium">{m.tipo}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {m.origenNombre === cliente.nombre ? m.destinoNombre : m.origenNombre}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          {formatARS(m.monto)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone={tonePorEstado(m.estado)}>{m.estado}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <Label htmlFor="obs-perfil">Observaciones del equipo de cumplimiento</Label>
            <textarea
              id="obs-perfil"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              disabled={!puedeEditar}
              placeholder="Registrá acá observaciones del proceso de revisión..."
              className="w-full rounded-lg border border-input bg-background text-sm p-3 outline-none focus:ring-2 focus:ring-ring/20 resize-y disabled:opacity-60"
            />
            <div className="flex justify-end mt-3">
              <button
                type="button"
                disabled={!puedeEditar || guardar.isPending}
                onClick={() =>
                  guardar.mutate(
                    {
                      userId: cliente.id,
                      estadoActual: cliente.estadoCumplimiento,
                      notas: obs.trim(),
                    },
                    {
                      onSuccess: () => toast.success("Observaciones guardadas"),
                      onError: (e) => toast.error(mensajeError(e)),
                    },
                  )
                }
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark transition-colors disabled:opacity-50"
              >
                {guardar.isPending && <Loader2 size={14} className="animate-spin" />}
                Guardar observaciones
              </button>
            </div>
          </Card>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-border bg-card text-foreground text-sm font-semibold hover:bg-accent transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

