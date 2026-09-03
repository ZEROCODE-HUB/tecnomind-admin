import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, CheckCircle2, Ban, UserCheck, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown, type ActionItem } from "@/components/actions-dropdown";
import { PageHeader, Badge, Card } from "@/components/portal-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { PerfilModal } from "@/components/cliente-perfil-modal";
import { useAuth } from "@/contexts/auth";
import {
  useClientes,
  useSetEstadoCuenta,
  tonePorEstado,
  formatARS,
  formatFecha,
  formatCuit,
  formatDocumento,
  mensajeError,
  ESTADOS_VERIFICACION,
  ESTADOS_CUMPLIMIENTO,
  type Cliente,
} from "@/lib/clientes";

export const Route = createFileRoute("/admin/verificacion/clientes/")({
  component: Page,
});

function Page() {
  const { can } = useAuth();
  const puedeEditar = can("usuarios", "update");
  const clientesQuery = useClientes();
  const setEstadoCuenta = useSetEstadoCuenta();

  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmBloqueo, setConfirmBloqueo] = useState<Cliente | null>(null);

  // Los operadores del backoffice viven en la misma tabla; esta pantalla
  // es el padrón de clientes, no el de usuarios internos.
  const clientes = (clientesQuery.data ?? []).filter((c) => !c.esOperador);
  // El modal se alimenta de la lista para que refleje los cambios sin
  // tener que cerrarse y volverse a abrir.
  const detail = clientes.find((c) => c.id === detailId) ?? null;

  useEffect(() => {
    if (detailId && !clientesQuery.isLoading && !detail) setDetailId(null);
  }, [detailId, detail, clientesQuery.isLoading]);

  const habilitarCuenta = (c: Cliente) => {
    // La puerta sigue siendo la misma que en el prototipo: identidad
    // aprobada y listas superadas. La diferencia es que ahora ambos
    // estados vienen de la base.
    if (c.estadoVerificacion !== "Aprobada") {
      toast.warning("No se puede habilitar la cuenta: la verificación de identidad no está aprobada.");
      return;
    }
    if (c.estadoCumplimiento !== "Pasa") {
      toast.warning("No se puede habilitar la cuenta: el cliente no pasó el filtro de listas restrictivas.");
      return;
    }
    setEstadoCuenta.mutate(
      { userId: c.id, estado: "Activa" },
      {
        onSuccess: () => toast.success(`Cuenta de ${c.nombre} habilitada`),
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  };

  const getActions = (c: Cliente): ActionItem[] => {
    const actions: ActionItem[] = [
      { label: "Ver perfil", icon: Eye, onClick: () => setDetailId(c.id) },
    ];
    if (!puedeEditar) return actions;
    if (c.estadoCuenta !== "Activa") {
      actions.push({ label: "Habilitar cuenta", icon: CheckCircle2, onClick: () => habilitarCuenta(c) });
    }
    if (c.estadoCuenta !== "Bloqueada" && c.cvu) {
      actions.push({
        label: "Bloquear cuenta",
        icon: Ban,
        variant: "danger",
        onClick: () => setConfirmBloqueo(c),
      });
    }
    return actions;
  };

  const columns: Column<Cliente>[] = [
    {
      key: "nombre",
      label: "Cliente",
      sortable: true,
      filterable: true,
      render: (c) => (
        <div>
          <div className="font-semibold">{c.nombre}</div>
          <div className="text-xs text-muted-foreground">{c.email}</div>
        </div>
      ),
    },
    {
      key: "documento",
      label: "Documento",
      sortable: true,
      filterable: true,
      render: (c) => (
        <span className="text-xs text-muted-foreground font-mono">
          {c.tipoDocumento} · {formatDocumento(c.documento)}
        </span>
      ),
    },
    {
      key: "cuit",
      label: "CUIT / CUIL",
      sortable: true,
      filterable: true,
      render: (c) => <span className="font-mono text-xs">{formatCuit(c.cuit)}</span>,
    },
    {
      key: "fechaRegistro",
      label: "Registro",
      sortable: true,
      filterable: "date",
      render: (c) => <span className="font-mono text-xs">{formatFecha(c.fechaRegistro)}</span>,
    },
    {
      key: "estadoVerificacion",
      label: "Verificación",
      sortable: true,
      filterable: "enum",
      filterOptions: ESTADOS_VERIFICACION,
      render: (c) => <Badge tone={tonePorEstado(c.estadoVerificacion)}>{c.estadoVerificacion}</Badge>,
    },
    {
      key: "estadoCumplimiento",
      label: "Listas restrictivas",
      sortable: true,
      filterable: "enum",
      filterOptions: ESTADOS_CUMPLIMIENTO,
      render: (c) => (
        <div className="flex items-center gap-2">
          <Badge tone={tonePorEstado(c.estadoCumplimiento)}>{c.estadoCumplimiento}</Badge>
          {c.estadoCumplimiento === "Pasa" && <UserCheck size={14} className="text-emerald-600" />}
        </div>
      ),
    },
    {
      key: "estadoCuenta",
      label: "Cuenta",
      sortable: true,
      filterable: "enum",
      filterOptions: ["Pendiente de habilitación", "Activa", "Bloqueada", "Suspendida", "Cerrada"],
      render: (c) => <Badge tone={tonePorEstado(c.estadoCuenta)}>{c.estadoCuenta}</Badge>,
    },
    {
      key: "saldo",
      label: "Saldo",
      sortable: true,
      render: (c) => (
        <span className="font-mono tabular-nums text-xs">
          {c.cvu ? formatARS(c.saldo) : "—"}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Consulta de perfiles de clientes"
        description="Consultá los datos de cada cliente, su estado de verificación y su cuenta."
      />

      {clientesQuery.isLoading ? (
        <Card>
          <div className="py-12 flex justify-center text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
          </div>
        </Card>
      ) : clientesQuery.isError ? (
        <Card>
          <div className="py-10 flex flex-col items-center gap-2 text-center">
            <AlertCircle size={22} className="text-destructive" />
            <p className="text-sm font-semibold">No se pudo cargar el padrón</p>
            <p className="text-sm text-muted-foreground">{mensajeError(clientesQuery.error)}</p>
          </div>
        </Card>
      ) : clientes.length === 0 ? (
        <Card>
          <EmptyState title="Sin perfiles registrados" description="No hay clientes para mostrar." />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={clientes}
          keyExtractor={(c) => c.id}
          pageSize={10}
          actions={(c) => <ActionsDropdown actions={getActions(c)} />}
        />
      )}

      {detail && <PerfilModal cliente={detail} onClose={() => setDetailId(null)} />}

      <ConfirmDialog
        open={!!confirmBloqueo}
        onClose={() => setConfirmBloqueo(null)}
        title="Bloquear cuenta"
        message={`¿Confirmás el bloqueo de la cuenta de "${confirmBloqueo?.nombre}"? El cliente no podrá operar hasta nueva disposición.`}
        confirmLabel="Bloquear"
        variant="danger"
        onConfirm={() => {
          if (confirmBloqueo) {
            const c = confirmBloqueo;
            setEstadoCuenta.mutate(
              { userId: c.id, estado: "Bloqueada", motivo: "Bloqueo dispuesto por cumplimiento" },
              {
                onSuccess: () => toast.success(`Cuenta de ${c.nombre} bloqueada`),
                onError: (e) => toast.error(mensajeError(e)),
              },
            );
          }
          setConfirmBloqueo(null);
        }}
      />
    </>
  );
}
