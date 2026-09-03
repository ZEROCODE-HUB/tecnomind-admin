import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, XCircle, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ActionsDropdown, type ActionItem } from "@/components/actions-dropdown";
import { EmptyState } from "@/components/empty-state";
import { Badge, Card } from "@/components/portal-shell";
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
  type Cliente,
} from "@/lib/clientes";

export const Route = createFileRoute("/admin/general/usuarios/")({
  component: PersonasFisicasPage,
});

/**
 * Estado del usuario tal como lo lee el operador: combina la
 * verificación de identidad con el estado de la cuenta, que en la base
 * son dos campos distintos porque responden a procesos distintos.
 */
function estadoDe(c: Cliente): string {
  if (c.estadoCuenta === "Bloqueada") return "Bloqueado";
  if (c.estadoCuenta === "Suspendida") return "Suspendido";
  if (c.estadoCuenta === "Cerrada") return "Deshabilitado";
  if (c.estadoVerificacion === "Rechazada") return "Rechazado";
  if (c.estadoVerificacion === "Aprobada") return "Activado";
  if (c.estadoVerificacion === "En revisión") return "En revisión";
  return "Registrado";
}

const ESTADOS = [
  "Registrado",
  "En revisión",
  "Activado",
  "Rechazado",
  "Suspendido",
  "Bloqueado",
  "Deshabilitado",
];

function PersonasFisicasPage() {
  const { can } = useAuth();
  const puedeEditar = can("usuarios", "update");
  const clientesQuery = useClientes();
  const setEstadoCuenta = useSetEstadoCuenta();

  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    variant: "default" | "danger";
    onConfirm: () => void;
  } | null>(null);

  // Los operadores del backoffice viven en la misma tabla que los
  // clientes; esta pantalla es el padrón de clientes.
  const clientes = (clientesQuery.data ?? []).filter((c) => !c.esOperador);
  const detail = clientes.find((c) => c.id === detailId) ?? null;

  const cambiarEstado = (c: Cliente, estado: "Activa" | "Suspendida", motivo: string) =>
    setEstadoCuenta.mutate(
      { userId: c.id, estado, motivo },
      {
        onSuccess: () =>
          toast.success(
            estado === "Activa" ? `${c.nombre} reactivado` : `${c.nombre} suspendido`,
          ),
        onError: (e) => toast.error(mensajeError(e)),
      },
    );

  const getActions = (c: Cliente): ActionItem[] => {
    const actions: ActionItem[] = [
      { label: "Ver ficha", icon: Eye, onClick: () => setDetailId(c.id) },
    ];
    // Sin cuenta creada no hay estado que mover: el alta la hace el
    // trigger de registro, no el operador.
    if (!puedeEditar || !c.cvu) return actions;

    if (c.estadoCuenta === "Suspendida" || c.estadoCuenta === "Bloqueada") {
      actions.push({
        label: "Reactivar",
        icon: RotateCcw,
        onClick: () =>
          setConfirmAction({
            title: "Reactivar usuario",
            message: `¿Reactivar la cuenta de ${c.nombre}? Volverá a poder operar.`,
            confirmLabel: "Reactivar",
            variant: "default",
            onConfirm: () => cambiarEstado(c, "Activa", "Reactivación dispuesta por el operador"),
          }),
      });
    } else {
      actions.push({
        label: "Suspender",
        icon: XCircle,
        variant: "danger",
        onClick: () =>
          setConfirmAction({
            title: "Suspender usuario",
            message: `¿Suspender la cuenta de ${c.nombre}? No podrá operar hasta que se reactive.`,
            confirmLabel: "Suspender",
            variant: "danger",
            onConfirm: () => cambiarEstado(c, "Suspendida", "Suspensión dispuesta por el operador"),
          }),
      });
    }
    return actions;
  };

  // Se omite "Eliminar": borrar a un cliente arrastraría en cascada sus
  // cuentas y sus transacciones, y un backoffice financiero no borra
  // historia. La baja se expresa suspendiendo o cerrando la cuenta.

  const columns: Column<Cliente>[] = [
    {
      key: "cvu",
      label: "CVU",
      filterable: true,
      render: (c) => (
        <span className="font-mono tabular-nums text-xs">{c.cvu ?? "sin cuenta"}</span>
      ),
    },
    { key: "email", label: "Usuario", filterable: true, render: (c) => c.email },
    { key: "nombre", label: "Nombre y apellido", filterable: true, render: (c) => c.nombre },
    {
      key: "documento",
      label: "Documento",
      filterable: true,
      render: (c) => (
        <span className="font-mono text-xs">
          {c.tipoDocumento} {formatDocumento(c.documento)}
        </span>
      ),
    },
    {
      key: "cuit",
      label: "CUIT / CUIL",
      filterable: true,
      render: (c) => <span className="font-mono text-xs">{formatCuit(c.cuit)}</span>,
    },
    {
      key: "estado",
      label: "Estado",
      filterable: "enum",
      filterOptions: ESTADOS,
      render: (c) => {
        const e = estadoDe(c);
        return <Badge tone={tonePorEstado(e)}>{e}</Badge>;
      },
    },
    {
      key: "saldo",
      label: "Saldo",
      sortable: true,
      render: (c) => (
        <span className="font-mono tabular-nums text-xs">{c.cvu ? formatARS(c.saldo) : "—"}</span>
      ),
    },
    {
      key: "fechaRegistro",
      label: "Fecha de registro",
      filterable: "date",
      sortable: true,
      render: (c) => (
        <span className="font-mono tabular-nums text-xs">{formatFecha(c.fechaRegistro)}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Personas físicas"
        description="Usuarios individuales registrados en la plataforma."
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
          <EmptyState
            title="Sin usuarios registrados"
            description="Todavía no hay personas físicas dadas de alta."
          />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={clientes}
          keyExtractor={(c) => c.id}
          actions={(c) => <ActionsDropdown actions={getActions(c)} />}
        />
      )}

      {detail && <PerfilModal cliente={detail} onClose={() => setDetailId(null)} />}

      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          variant={confirmAction.variant}
          onConfirm={() => {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }}
        />
      )}
    </>
  );
}
