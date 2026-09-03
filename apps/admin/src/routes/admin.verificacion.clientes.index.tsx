import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Eye, CheckCircle2, Ban, X, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/data-table";
import { ActionsDropdown, type ActionItem } from "@/components/actions-dropdown";
import { PageHeader, Badge, Card, Label } from "@/components/portal-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import {
  useBackoffice,
  tonePorEstado,
  ESTADOS_VERIFICACION,
  ESTADOS_CUMPLIMIENTO,
  type Cliente,
} from "@/stores/backoffice-store";

export const Route = createFileRoute("/admin/verificacion/clientes/")({
  component: Page,
  
});

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

function PerfilModal({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const setObservaciones = useBackoffice((s) => s.setObservaciones);
  const [obs, setObs] = useState(cliente.observaciones);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-start z-10">
          <div>
            <h3 className="font-display text-lg font-semibold">Perfil de cliente</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {cliente.nombre} · {cliente.id}
            </p>
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
              <Field label="Número de documento" value={cliente.documento} />
              <Field label="Correo electrónico" value={cliente.email} />
              <Field label="Teléfono" value={cliente.telefono} />
              <Field label="Ciudad" value={cliente.ciudad} />
              <Field label="Fecha de registro" value={cliente.fechaRegistro} />
              <Field
                label="ID de cliente"
                value={<span className="font-mono">{cliente.id}</span>}
              />
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Estado de verificación y cumplimiento
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              <Field
                label="Verificación biométrica (Truora)"
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
              {cliente.scoreTruora != null && (
                <Field
                  label="Score Truora"
                  value={<span className="font-mono tabular-nums">{cliente.scoreTruora}/100</span>}
                />
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Productos y operaciones asociadas
            </h4>
            {cliente.productos.length === 0 ? (
              <div className="border border-dashed rounded-lg py-6 text-center text-sm text-muted-foreground">
                El cliente aún no tiene productos ni operaciones asociadas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-3 py-2.5 font-display font-semibold text-foreground">
                        Tipo
                      </th>
                      <th className="px-3 py-2.5 font-display font-semibold text-foreground">
                        Referencia
                      </th>
                      <th className="px-3 py-2.5 font-display font-semibold text-foreground">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cliente.productos.map((p) => (
                      <tr key={p.referencia} className="border-b last:border-0">
                        <td className="px-3 py-2.5 font-medium">{p.tipo}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                          {p.referencia}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone={tonePorEstado(p.estado)}>{p.estado}</Badge>
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
              placeholder="Registra aquí observaciones del proceso de revisión..."
              className="w-full rounded-lg border border-input bg-background text-sm p-3 outline-none focus:ring-2 focus:ring-ring/20 resize-y"
            />
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => {
                  setObservaciones(cliente.id, obs.trim());
                  toast.success("Observaciones guardadas");
                }}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-moli-red-dark transition-colors"
              >
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

function Page() {
  const clientes = useBackoffice((s) => s.clientes);
  const setEstadoCuenta = useBackoffice((s) => s.setEstadoCuenta);
  const [detail, setDetail] = useState<Cliente | null>(null);
  const [confirmBloqueo, setConfirmBloqueo] = useState<Cliente | null>(null);

  const habilitarCuenta = (c: Cliente) => {
    if (c.estadoVerificacion !== "Aprobada") {
      toast.warning(
        "No se puede habilitar la cuenta: la verificación de identidad no está aprobada.",
      );
      return;
    }
    if (c.estadoCumplimiento !== "Pasa") {
      toast.warning(
        "No se puede habilitar la cuenta: el cliente no pasó el filtro de listas restrictivas.",
      );
      return;
    }
    setEstadoCuenta(c.id, "Activa");
    toast.success(`Cuenta de ${c.nombre} habilitada`);
  };

  const getActions = (c: Cliente): ActionItem[] => {
    const actions: ActionItem[] = [{ label: "Ver perfil", icon: Eye, onClick: () => setDetail(c) }];
    if (c.estadoCuenta !== "Activa") {
      actions.push({
        label: "Habilitar cuenta",
        icon: CheckCircle2,
        onClick: () => habilitarCuenta(c),
      });
    }
    if (c.estadoCuenta !== "Bloqueada") {
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
          {c.tipoDocumento} · {c.documento}
        </span>
      ),
    },
    {
      key: "ciudad",
      label: "Ciudad",
      sortable: true,
      filterable: true,
      render: (c) => c.ciudad,
    },
    {
      key: "fechaRegistro",
      label: "Registro",
      sortable: true,
      filterable: "date",
      render: (c) => <span className="font-mono text-xs">{c.fechaRegistro}</span>,
    },
    {
      key: "estadoVerificacion",
      label: "Verificación",
      sortable: true,
      filterable: "enum",
      filterOptions: ESTADOS_VERIFICACION,
      render: (c) => (
        <Badge tone={tonePorEstado(c.estadoVerificacion)}>{c.estadoVerificacion}</Badge>
      ),
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
      filterOptions: ["Pendiente de habilitación", "Activa", "Bloqueada"],
      render: (c) => <Badge tone={tonePorEstado(c.estadoCuenta)}>{c.estadoCuenta}</Badge>,
    },
    {
      key: "productos",
      label: "Productos",
      sortable: true,
      render: (c) => (
        <span className="font-mono tabular-nums text-xs text-muted-foreground">
          {c.productos.length} asociados
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Consulta de perfiles de clientes"
        description="Consulta los datos de cada cliente, su estado de verificación y los productos u operaciones asociadas."
      />
      {clientes.length === 0 ? (
        <Card>
          <EmptyState
            title="Sin perfiles registrados"
            description="No hay clientes para mostrar."
          />
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
      {detail && <PerfilModal cliente={detail} onClose={() => setDetail(null)} />}
      <ConfirmDialog
        open={!!confirmBloqueo}
        onClose={() => setConfirmBloqueo(null)}
        title="Bloquear cuenta"
        message={`¿Confirma el bloqueo de la cuenta de "${confirmBloqueo?.nombre}"? El cliente no podrá operar hasta nueva disposición.`}
        confirmLabel="Bloquear"
        variant="danger"
        onConfirm={() => {
          if (confirmBloqueo) {
            setEstadoCuenta(confirmBloqueo.id, "Bloqueada");
            toast.success(`Cuenta de ${confirmBloqueo.nombre} bloqueada`);
          }
          setConfirmBloqueo(null);
        }}
      />
    </>
  );
}
