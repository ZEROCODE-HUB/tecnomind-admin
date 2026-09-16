import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Card, Input, BtnPrimary } from "@/components/portal-shell";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { useDeviceVerificationGlobal, useSetDeviceVerificationGlobal } from "@/lib/seguridad";
import { mensajeError } from "@/lib/clientes";

export const Route = createFileRoute("/admin/configuracion/")({
  component: Page,
});

/**
 * Configuración de la plataforma. Antes había un "gestor de integraciones"
 * 100% mock; se quitó. Queda solo lo real: el interruptor de verificación de
 * dispositivo (global). Acá se irán sumando ajustes reales a futuro.
 */
function Page() {
  const { can } = useAuth();
  const puede = can("configuracion", "update"); // el backend valida el mismo permiso
  const q = useDeviceVerificationGlobal();
  const setG = useSetDeviceVerificationGlobal();
  const activo = q.data ?? false;

  // Cambiar mi propia contraseña (útil sobre todo para operadores que entraron
  // con una contraseña temporal).
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [guardandoPw, setGuardandoPw] = useState(false);
  const cambiarPassword = async () => {
    if (pw1.length < 8) {
      toast.warning("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (pw1 !== pw2) {
      toast.warning("Las contraseñas no coinciden.");
      return;
    }
    setGuardandoPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setGuardandoPw(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Contraseña actualizada");
      setPw1("");
      setPw2("");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Configuración" description="Ajustes de seguridad y acceso de la plataforma." />

      <Card className="flex flex-col gap-3 max-w-2xl">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-moli-blue" />
          <h3 className="font-display font-semibold">Seguridad de acceso</h3>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-medium">Verificación de dispositivo (global)</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Al entrar desde un dispositivo nuevo, la app pide un código enviado por correo.
              Aplica a todos los clientes. Requiere que el envío de correo esté configurado.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={activo}
            disabled={!puede || q.isLoading || setG.isPending}
            onClick={() =>
              setG.mutate(!activo, {
                onSuccess: () =>
                  toast.success(`Verificación de dispositivo ${!activo ? "activada" : "desactivada"}`),
                onError: (e) => toast.error(mensajeError(e)),
              })
            }
            className={`relative shrink-0 h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
              activo ? "bg-emerald-500" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                activo ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        {(q.isLoading || setG.isPending) && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" /> Actualizando…
          </div>
        )}
        {!puede && (
          <p className="text-xs text-amber-600">Solo un administrador puede cambiar esta opción.</p>
        )}
      </Card>

      <Card className="flex flex-col gap-3 max-w-2xl">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-moli-blue" />
          <h3 className="font-display font-semibold">Cambiar mi contraseña</h3>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          Actualizá la contraseña de tu propia cuenta de operador. Si entraste con una contraseña
          temporal, cambiala acá.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input
            type="password"
            placeholder="Nueva contraseña"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            className="flex-1"
            autoComplete="new-password"
          />
          <Input
            type="password"
            placeholder="Repetir contraseña"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className="flex-1"
            autoComplete="new-password"
          />
          <BtnPrimary onClick={cambiarPassword} disabled={guardandoPw}>
            {guardandoPw && <Loader2 size={14} className="animate-spin" />}
            Guardar
          </BtnPrimary>
        </div>
      </Card>
    </div>
  );
}
