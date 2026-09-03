import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, FileCheck2 } from "lucide-react";
import { BtnPrimary, BtnOutline, Label } from "./portal-shell";
import { FileDropzone } from "./file-dropzone";
import { useBackoffice } from "@/stores/backoffice-store";

export function ComprobanteUploadModal({
  open,
  onClose,
  defaultSolicitudId,
}: {
  open: boolean;
  onClose: () => void;
  defaultSolicitudId?: string | null;
}) {
  const pagos = useBackoffice((s) => s.pagos);
  const agregarComprobante = useBackoffice((s) => s.agregarComprobante);
  const asociarComprobante = useBackoffice((s) => s.asociarComprobante);
  const [file, setFile] = useState<File | null>(null);
  const [referencia, setReferencia] = useState("");
  const [solicitudId, setSolicitudId] = useState(defaultSolicitudId ?? "");

  useEffect(() => {
    if (open) {
      setFile(null);
      setReferencia("");
      setSolicitudId(defaultSolicitudId ?? "");
    } else {
      setFile(null);
    }
  }, [open, defaultSolicitudId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const guardar = () => {
    if (!file) {
      toast.error("Debe seleccionar el voucher o comprobante de la transferencia.");
      return;
    }
    const id = `CMP-${Date.now().toString().slice(-6)}`;
    const hoy = new Date();
    const fecha = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(
      2,
      "0",
    )}/${hoy.getFullYear()} ${String(hoy.getHours()).padStart(2, "0")}:${String(
      hoy.getMinutes(),
    ).padStart(2, "0")}`;
    agregarComprobante({
      id,
      solicitudId: solicitudId || null,
      nombreArchivo: file.name,
      referencia: referencia.trim() || "—",
      fechaCarga: fecha,
      validado: "Pendiente",
    });
    if (solicitudId) {
      asociarComprobante(solicitudId, id);
      toast.success("Comprobante cargado y asociado a la solicitud");
    } else {
      toast.success("Comprobante cargado correctamente");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-start z-10">
          <div>
            <h3 className="font-display text-lg font-semibold">
              Cargar comprobante de transferencia
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sube el voucher emitido por la entidad bancaria y asócialo a la solicitud.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <Label htmlFor="cmp-solicitud">Solicitud asociada (opcional)</Label>
            <select
              id="cmp-solicitud"
              value={solicitudId}
              onChange={(e) => setSolicitudId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="">Sin asociar</option>
              {pagos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} — {p.beneficiario} (${p.monto.toLocaleString("es-CO")} {p.moneda})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Archivo del voucher</Label>
            <FileDropzone onFile={setFile} accept=".pdf,.png,.jpg,.jpeg" />
          </div>
          <div>
            <Label htmlFor="cmp-ref">Referencia de la transferencia (opcional)</Label>
            <input
              id="cmp-ref"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej. TRF-88231947"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <BtnOutline type="button" className="flex-1" onClick={onClose}>
              Cancelar
            </BtnOutline>
            <BtnPrimary type="button" className="flex-1" onClick={guardar}>
              <FileCheck2 size={16} /> Guardar comprobante
            </BtnPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}
