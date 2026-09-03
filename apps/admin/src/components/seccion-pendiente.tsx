import { Construction } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/portal-shell";

/**
 * Sección del diseño que todavía no tiene datos reales detrás.
 *
 * Se muestra explícita en vez de dejar los datos de demostración: un
 * operador no puede distinguir un número inventado de uno real, y sobre
 * un backoffice financiero eso es peor que no mostrar nada.
 */
export function SeccionPendiente({
  titulo,
  descripcion,
  motivo,
}: {
  titulo: string;
  descripcion: string;
  motivo: string;
}) {
  return (
    <>
      <PageHeader title={titulo} description={descripcion} />
      <Card>
        <div className="py-12 flex flex-col items-center gap-3 text-center max-w-lg mx-auto">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Construction size={20} strokeWidth={1.75} />
          </div>
          <p className="font-display font-semibold">Sección sin datos todavía</p>
          <p className="text-sm text-muted-foreground">{motivo}</p>
        </div>
      </Card>
    </>
  );
}
