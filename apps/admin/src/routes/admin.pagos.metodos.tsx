import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { PageHeader, BtnPrimary, BtnOutline } from "@/components/portal-shell";
import { FileDropzone } from "@/components/file-dropzone";
import {
  useMetodosPago,
  useGuardarMetodo,
  useEliminarMetodo,
  subirImagenMetodo,
  type MetodoPago,
  type MetodoInput,
} from "@/lib/metodos-pago";

export const Route = createFileRoute("/admin/pagos/metodos")({
  component: Page,
});

const EMPTY: MetodoInput = {
  label: "",
  image_path: null,
  bank_name: null,
  holder_name: null,
  account_number: null,
  alias: null,
  instructions: null,
  is_active: true,
  sort_order: 0,
};

function Page() {
  const { data: metodos = [], isLoading } = useMetodosPago();
  const guardar = useGuardarMetodo();
  const eliminar = useEliminarMetodo();

  const [editing, setEditing] = useState<{ id?: string; values: MetodoInput } | null>(null);
  const [confirmDel, setConfirmDel] = useState<MetodoPago | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const nuevo = () => { setErrorMsg(null); setEditing({ values: { ...EMPTY, sort_order: metodos.length } }); };
  const editar = (m: MetodoPago) => { setErrorMsg(null); setEditing({ id: m.id, values: { ...m } as MetodoInput }); };

  const set = (k: keyof MetodoInput, v: any) =>
    setEditing((e) => (e ? { ...e, values: { ...e.values, [k]: v === "" ? null : v } } : e));

  const submit = async () => {
    if (!editing) return;
    if (!editing.values.label?.trim()) { setErrorMsg("El nombre visible es obligatorio."); return; }
    try {
      await guardar.mutateAsync({ id: editing.id, values: { ...editing.values, label: editing.values.label.trim() } });
      setEditing(null);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "No se pudo guardar.");
    }
  };

  const toggleActivo = (m: MetodoPago) =>
    guardar.mutate({ id: m.id, values: { ...(m as MetodoInput), is_active: !m.is_active } });

  return (
    <div>
      <PageHeader
        title="Métodos de pago"
        description="Datos que ve el cliente al depositar (transferencia, QR, alias)."
        action={<BtnPrimary type="button" onClick={nuevo}><Plus size={16} /> Nuevo método</BtnPrimary>}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8">Cargando…</p>
      ) : metodos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">No hay métodos cargados. Creá el primero.</p>
      ) : (
        <div className="grid gap-3">
          {metodos.map((m) => (
            <div key={m.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{m.label}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${m.is_active ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                      {m.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
                    {m.bank_name ? <p>Banco: {m.bank_name}</p> : null}
                    {m.holder_name ? <p>Titular: {m.holder_name}</p> : null}
                    {m.account_number ? <p>CBU/CVU: {m.account_number}</p> : null}
                    {m.alias ? <p>Alias: {m.alias}</p> : null}
                    {m.instructions ? <p>{m.instructions}</p> : null}
                    {m.image_path ? <p>Imagen/QR: {m.image_path}</p> : null}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button type="button" onClick={() => toggleActivo(m)} className="text-xs px-2 py-1 rounded border border-border hover:bg-muted">
                    {m.is_active ? "Desactivar" : "Activar"}
                  </button>
                  <button type="button" onClick={() => editar(m)} className="p-1.5 rounded hover:bg-muted" aria-label="Editar"><Pencil size={16} /></button>
                  <button type="button" onClick={() => setConfirmDel(m)} className="p-1.5 rounded hover:bg-muted text-red-600" aria-label="Eliminar"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !guardar.isPending && setEditing(null)} />
          <div className="relative bg-card rounded-lg w-full max-w-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg">{editing.id ? "Editar método" : "Nuevo método"}</h3>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 hover:bg-muted rounded-md"><X size={18} /></button>
            </div>

            <div className="grid gap-3">
              <Field label="Nombre visible *" value={editing.values.label} onChange={(v) => set("label", v)} placeholder="Transferencia bancaria" />
              <Field label="Banco" value={editing.values.bank_name} onChange={(v) => set("bank_name", v)} />
              <Field label="Titular" value={editing.values.holder_name} onChange={(v) => set("holder_name", v)} />
              <Field label="CBU / CVU / Nº de cuenta" value={editing.values.account_number} onChange={(v) => set("account_number", v)} />
              <Field label="Alias" value={editing.values.alias} onChange={(v) => set("alias", v)} />
              <div>
                <label className="block text-sm font-medium mb-1">Imagen / QR</label>
                {editing.values.image_path ? (
                  <div className="mb-2 flex items-center gap-3">
                    <img src={editing.values.image_path} alt="QR" className="w-20 h-20 object-contain rounded border border-border" />
                    <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => set("image_path", "")}>Quitar imagen</button>
                  </div>
                ) : null}
                <FileDropzone
                  accept="image/*"
                  onFile={async (f) => {
                    if (!f) return;
                    try {
                      setSubiendo(true);
                      setErrorMsg(null);
                      const url = await subirImagenMetodo(f);
                      set("image_path", url);
                    } catch (e: any) {
                      setErrorMsg(e?.message ?? "No se pudo subir la imagen.");
                    } finally {
                      setSubiendo(false);
                    }
                  }}
                />
                {subiendo ? <p className="text-xs text-muted-foreground mt-1">Subiendo imagen…</p> : null}
                <input
                  value={editing.values.image_path ?? ""}
                  onChange={(e) => set("image_path", e.target.value)}
                  placeholder="…o pegá una URL"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Instrucciones</label>
                <textarea rows={2} value={editing.values.instructions ?? ""} onChange={(e) => set("instructions", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.values.is_active} onChange={(e) => set("is_active", e.target.checked)} />
                Activo (visible para los clientes)
              </label>
              {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}
            </div>

            <div className="flex gap-2 mt-5">
              <BtnOutline type="button" className="flex-1" onClick={() => setEditing(null)} disabled={guardar.isPending}>Cancelar</BtnOutline>
              <BtnPrimary type="button" className="flex-1" onClick={submit} disabled={guardar.isPending}>
                {guardar.isPending ? "Guardando…" : "Guardar"}
              </BtnPrimary>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDel ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDel(null)} />
          <div className="relative bg-card rounded-lg w-full max-w-sm shadow-xl p-6">
            <h3 className="font-display font-semibold text-lg mb-2">Eliminar método</h3>
            <p className="text-sm text-muted-foreground mb-6">¿Eliminar “{confirmDel.label}”? Los depósitos ya hechos no se afectan.</p>
            <div className="flex gap-2">
              <BtnOutline type="button" className="flex-1" onClick={() => setConfirmDel(null)}>Cancelar</BtnOutline>
              <BtnPrimary type="button" className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => { await eliminar.mutateAsync(confirmDel.id); setConfirmDel(null); }}>
                Eliminar
              </BtnPrimary>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string | null; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
    </div>
  );
}
