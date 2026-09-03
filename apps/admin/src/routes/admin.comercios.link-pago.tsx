import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/portal-shell";

export const Route = createFileRoute("/admin/comercios/link-pago")({
  component: Page,
  
});

function Page() {
  return (
    <>
      <PageHeader
        title="Link de pago"
        description="Gestión de enlaces de pago."
      />
      <EmptyState
        title="Módulo Link de pago — pendiente de definición."
        description="Esta funcionalidad se encuentra en etapa de definición. Estará disponible próximamente."
      />
    </>
  );
}
