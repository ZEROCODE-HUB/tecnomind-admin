import { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useCuenta, useVerificarAlias, useCambiarAlias } from "@/hooks/useAccount";

/**
 * Cambio de alias de la cuenta.
 *
 * Antes esta pantalla simulaba todo: el alias se armaba con el CUIT en
 * el propio componente, la verificación era un setTimeout con
 * Math.random() y "Confirmar" no guardaba nada. Ahora el alias sale de la
 * cuenta, la disponibilidad la responde la base y el guardado es real.
 */
const AliasManagement = () => {
  const { data: cuenta, isLoading } = useCuenta();
  const verificar = useVerificarAlias();
  const guardar = useCambiarAlias();

  const [alias, setAlias] = useState("");
  const [resultado, setResultado] = useState<{ disponible: boolean; motivo: string | null } | null>(
    null,
  );

  // El alias real llega de forma asíncrona; se copia al campo la primera
  // vez y en cada cambio confirmado.
  useEffect(() => {
    if (cuenta?.alias) setAlias(cuenta.alias);
  }, [cuenta?.alias]);

  const aliasOriginal = cuenta?.alias ?? "";
  const cambio = alias.trim().toLowerCase() !== aliasOriginal.toLowerCase();

  const handleAliasChange = (value: string) => {
    setAlias(value.toLowerCase().replace(/[^a-z0-9.-]/g, ""));
    setResultado(null);
  };

  const handleVerify = () =>
    verificar.mutate(alias.trim(), {
      onSuccess: setResultado,
      onError: () =>
        toast.error("No se pudo verificar el alias. Revisá tu conexión e intentá de nuevo."),
    });

  const handleConfirm = () => {
    if (!cuenta) return;
    guardar.mutate(
      { cuentaId: cuenta.id, alias: alias.trim() },
      {
        onSuccess: () => {
          toast.success("Alias actualizado correctamente");
          setResultado(null);
        },
        onError: (e: Error) => {
          toast.error(e.message);
          setResultado(null);
        },
      },
    );
  };

  return (
    <section className="md:hidden bg-card border border-border rounded-2xl p-4 mx-4 mt-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-3">Administración de Alias</h3>

      <div className="flex gap-2">
        <Input
          value={alias}
          onChange={(e) => handleAliasChange(e.target.value)}
          placeholder="tunombre.apellido"
          disabled={isLoading || guardar.isPending}
          className="flex-1 bg-muted/50 border-border rounded-xl"
        />
        <Button
          onClick={handleVerify}
          disabled={verificar.isPending || !alias || !cambio || resultado?.disponible === true}
          variant={resultado?.disponible ? "outline" : "default"}
          className="rounded-xl px-4 min-w-[100px]"
        >
          {verificar.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : resultado?.disponible ? (
            <Check className="size-4 text-green-600" />
          ) : (
            "Verificar"
          )}
        </Button>
      </div>

      {resultado?.disponible && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400 px-3 py-2 rounded-xl">
            <Check className="size-4" />
            <span>Alias disponible</span>
          </div>
          <Button onClick={handleConfirm} disabled={guardar.isPending} className="w-full rounded-xl">
            {guardar.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
            Confirmar cambio
          </Button>
        </div>
      )}

      {resultado && !resultado.disponible && (
        <div className="flex items-center gap-2 mt-3 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
          <X className="size-4 shrink-0" />
          <span>{resultado.motivo ?? "Alias no disponible. Probá con otro."}</span>
        </div>
      )}

      {!cambio && !resultado && (
        <p className="text-xs text-muted-foreground mt-3">
          Modificá el alias para verificar su disponibilidad.
        </p>
      )}
    </section>
  );
};

export default AliasManagement;
