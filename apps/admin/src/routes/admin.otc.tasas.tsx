import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { PageHeader, BtnPrimary, BtnOutline } from "@/components/portal-shell";
import { useOtcAssets, useGuardarOtcAsset, useEliminarOtcAsset, type OtcConfig } from "@/lib/otc";
import { formatARS } from "@/lib/clientes";

export const Route = createFileRoute("/admin/otc/tasas")({
  component: Page,
});

const EMPTY: OtcConfig = {
  asset_code: "",
  label: "",
  unit_rate: 0,
  commission_percent: 0,
  company_wallet: null,
  network: null,
  min_amount: 0,
  max_amount: null,
  is_active: true,
};

function Page() {
  const { data: assets = [], isLoading } = useOtcAssets();
  const guardar = useGuardarOtcAsset();
  const eliminar = useEliminarOtcAsset();

  const [editing, setEditing] = useState<{ isNew: boolean; values: OtcConfig } | null>(null);
  const [confirmDel, setConfirmDel] = useState<OtcConfig | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const nuevo = () => { setErr(null); setEditing({ isNew: true, values: { ...EMPTY } }); };
  const editar = (a: OtcConfig) => { setErr(null); setEditing({ isNew: false, values: { ...a } }); };
  const set = (k: keyof OtcConfig, v: any) => setEditing((e) => (e ? { ...e, values: { ...e.values, [k]: v } } : e));

  const submit = async () => {
    if (!editing) return;
    if (!editing.values.asset_code?.trim()) { setErr("El código del activo es obligatorio (ej. USDT)."); return; }
    if (!editing.values.unit_rate || Number(editing.values.unit_rate) <= 0) { setErr("El precio debe ser mayor a 0."); return; }
    try {
      await guardar.mutateAsync({ isNew: editing.isNew, values: editing.values });
      setEditing(null);
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo guardar.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Criptos, tasas y comisiones"
        description="Catálogo de activos OTC. Cada uno con su cotización, comisión y wallet de la empresa."
        action={<BtnPrimary type="button" onClick={nuevo}><Plus size={16} /> Nueva cripto</BtnPrimary>}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8">Cargando…</p>
      ) : assets.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">No hay criptos cargadas. Creá la primera.</p>
      ) : (
        <div className="grid gap-3">
          {assets.map((a) => (
            <div key={a.asset_code} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{a.label || a.asset_code}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{a.asset_code}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${a.is_active ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                      {a.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
                    <p>1 {a.asset_code} = {formatARS(a.unit_rate)} · Comisión {a.commission_percent}%</p>
                    {a.network ? <p>Red: {a.network}</p> : null}
                    {a.company_wallet ? <p className="break-all">Wallet empresa: {a.company_wallet}</p> : <p className="text-amber-600">Sin wallet de empresa (las ventas quedan deshabilitadas)</p>}
                    <p>Mín: {a.min_amount} · Máx: {a.max_amount ?? "sin tope"}</p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button type="button" onClick={() => editar(a)} className="p-1.5 rounded hover:bg-muted" aria-label="Editar"><Pencil size={16} /></button>
                  <button type="button" onClick={() => setConfirmDel(a)} className="p-1.5 rounded hover:bg-muted text-red-600" aria-label="Eliminar"><Trash2 size={16} /></button>
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
              <h3 className="font-display font-semibold text-lg">{editing.isNew ? "Nueva cripto" : `Editar ${editing.values.asset_code}`}</h3>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 hover:bg-muted rounded-md"><X size={18} /></button>
            </div>

            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Código *" value={editing.values.asset_code} onChange={(v) => set("asset_code", v.toUpperCase())} placeholder="USDT" disabled={!editing.isNew} mono />
                <Field label="Nombre visible" value={editing.values.label ?? ""} onChange={(v) => set("label", v)} placeholder="Tether USD" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField label="Precio de 1 unidad (fiat) *" value={editing.values.unit_rate} onChange={(v) => set("unit_rate", v)} placeholder="1000" />
                <NumField label="Comisión (%)" value={editing.values.commission_percent} onChange={(v) => set("commission_percent", v)} placeholder="1.5" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Wallet de la empresa (para ventas)</label>
                <input value={editing.values.company_wallet ?? ""} onChange={(e) => set("company_wallet", e.target.value)}
                  placeholder="Dirección donde el cliente envía la cripto"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Red" value={editing.values.network ?? ""} onChange={(v) => set("network", v)} placeholder="TRC20" />
                <NumField label="Mínimo" value={editing.values.min_amount} onChange={(v) => set("min_amount", v)} placeholder="0" />
                <NumField label="Máximo" value={editing.values.max_amount ?? undefined} onChange={(v) => set("max_amount", v)} placeholder="sin tope" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.values.is_active} onChange={(e) => set("is_active", e.target.checked)} />
                Activa (visible para los clientes)
              </label>
              {err ? <p className="text-sm text-red-600">{err}</p> : null}
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
            <h3 className="font-display font-semibold text-lg mb-2">Eliminar cripto</h3>
            <p className="text-sm text-muted-foreground mb-6">¿Eliminar “{confirmDel.asset_code}”? Las operaciones ya hechas no se afectan.</p>
            <div className="flex gap-2">
              <BtnOutline type="button" className="flex-1" onClick={() => setConfirmDel(null)}>Cancelar</BtnOutline>
              <BtnPrimary type="button" className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => { await eliminar.mutateAsync(confirmDel.asset_code); setConfirmDel(null); }}>
                Eliminar
              </BtnPrimary>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, disabled, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; mono?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className={`w-full rounded-md border border-border bg-background px-3 py-2 text-sm ${mono ? "font-mono" : ""} ${disabled ? "opacity-60" : ""}`} />
    </div>
  );
}

function NumField({ label, value, onChange, placeholder, step }: { label: string; value: any; onChange: (v: string) => void; placeholder?: string; step?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type="number" step={step ?? "0.000001"} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
    </div>
  );
}
