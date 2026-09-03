import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Trash2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { BtnPrimary } from "@/components/portal-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";

type Accion = "leer" | "modificar" | "crear" | "borrar";

/** Columna de la tabla <-> columna en backoffice_role_permissions. */
const COLUMNA: Record<Accion, "can_read" | "can_update" | "can_create" | "can_delete"> = {
  leer: "can_read",
  modificar: "can_update",
  crear: "can_create",
  borrar: "can_delete",
};

type Recurso = { code: string; name: string; sort_order: number };
type Permiso = {
  role_id: string;
  resource_code: string;
  can_read: boolean;
  can_update: boolean;
  can_create: boolean;
  can_delete: boolean;
};
type Rol = { id: string; code: string; name: string; is_system: boolean };

export const Route = createFileRoute("/admin/administracion/usuarios/roles")({
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const puedeEditar = can("backoffice", "update");

  const [selectedRol, setSelectedRol] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Rol | null>(null);

  const recursosQuery = useQuery({
    queryKey: ["backoffice", "resources"],
    queryFn: async (): Promise<Recurso[]> => {
      const { data, error } = await supabase
        .from("backoffice_resources")
        .select("code, name, sort_order")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const rolesQuery = useQuery({
    queryKey: ["backoffice", "roles"],
    queryFn: async (): Promise<Rol[]> => {
      const { data, error } = await supabase
        .from("backoffice_roles")
        .select("id, code, name, is_system")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const permisosQuery = useQuery({
    queryKey: ["backoffice", "permissions"],
    queryFn: async (): Promise<Permiso[]> => {
      const { data, error } = await supabase
        .from("backoffice_role_permissions")
        .select("role_id, resource_code, can_read, can_update, can_create, can_delete");
      if (error) throw error;
      return data ?? [];
    },
  });

  const togglePermiso = useMutation({
    mutationFn: async (vars: { roleId: string; resource: string; accion: Accion; valor: boolean }) => {
      // Se arma explícito en vez de con clave computada: los tipos
      // generados de Supabase rechazan un índice dinámico.
      const cambio: Partial<Record<(typeof COLUMNA)[Accion], boolean>> = {};
      cambio[COLUMNA[vars.accion]] = vars.valor;

      const { error } = await supabase
        .from("backoffice_role_permissions")
        .update(cambio)
        .eq("role_id", vars.roleId)
        .eq("resource_code", vars.resource);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backoffice", "permissions"] }),
    onError: (e: Error) => toast.error("No se pudo guardar el permiso", { description: e.message }),
  });

  const crearRol = useMutation({
    mutationFn: async (nombre: string) => {
      const code = nombre.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      if (!code) throw new Error("El nombre del rol no es válido.");

      const { data: rol, error } = await supabase
        .from("backoffice_roles")
        .insert({ code, name: nombre.trim() })
        .select("id, code, name, is_system")
        .single();
      if (error) throw error;

      // Un rol nuevo arranca sin ningún permiso: se otorgan a mano.
      const filas = (recursosQuery.data ?? []).map((r) => ({
        role_id: rol.id,
        resource_code: r.code,
      }));
      if (filas.length) {
        const { error: e2 } = await supabase.from("backoffice_role_permissions").insert(filas);
        if (e2) throw e2;
      }
      return rol;
    },
    onSuccess: (rol) => {
      queryClient.invalidateQueries({ queryKey: ["backoffice"] });
      setSelectedRol(rol.id);
      setNewName("");
      setShowNew(false);
      toast.success(`Rol "${rol.name}" creado`);
    },
    onError: (e: Error) => toast.error("No se pudo crear el rol", { description: e.message }),
  });

  const borrarRol = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("backoffice_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, id) => {
      queryClient.invalidateQueries({ queryKey: ["backoffice"] });
      if (selectedRol === id) setSelectedRol(null);
      toast.success("Rol eliminado");
    },
    onError: (e: Error) => toast.error("No se pudo eliminar el rol", { description: e.message }),
  });

  const cargando = recursosQuery.isLoading || rolesQuery.isLoading || permisosQuery.isLoading;
  const error = recursosQuery.error ?? rolesQuery.error ?? permisosQuery.error;

  if (cargando) {
    return (
      <>
        <PageHeader title="Roles y permisos" description="Gestión dinámica de roles y permisos por recurso" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Roles y permisos" description="Gestión dinámica de roles y permisos por recurso" />
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">No se pudieron cargar los roles</p>
            <p className="mt-1 opacity-90">{(error as Error).message}</p>
          </div>
        </div>
      </>
    );
  }

  const roles = rolesQuery.data ?? [];
  const recursos = recursosQuery.data ?? [];
  const rolActivo = roles.find((r) => r.id === selectedRol) ?? roles[0];

  const permisoDe = (resource: string): Permiso | undefined =>
    permisosQuery.data?.find((p) => p.role_id === rolActivo?.id && p.resource_code === resource);

  return (
    <>
      <PageHeader
        title="Roles y permisos"
        description="Gestión dinámica de roles y permisos por recurso"
      />

      {!puedeEditar && (
        <div className="mb-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Tenés acceso de solo lectura sobre los roles.
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRol(r.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              rolActivo?.id === r.id
                ? "bg-primary text-primary-foreground"
                : "bg-card border hover:bg-muted"
            }`}
          >
            {r.name}
            {!r.is_system && puedeEditar && (
              <Trash2
                size={12}
                className="opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(r);
                }}
              />
            )}
          </button>
        ))}
        {puedeEditar && (
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-dashed text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-solid"
          >
            <Plus size={14} /> Nuevo rol
          </button>
        )}
      </div>

      <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left font-semibold py-3 px-4">Recurso</th>
              <th className="text-center font-semibold py-3 px-2">Leer</th>
              <th className="text-center font-semibold py-3 px-2">Modificar</th>
              <th className="text-center font-semibold py-3 px-2">Crear</th>
              <th className="text-center font-semibold py-3 px-2">Borrar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {recursos.map((recurso) => {
              const permiso = permisoDe(recurso.code);
              return (
                <tr key={recurso.code} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{recurso.name}</td>
                  {(["leer", "modificar", "crear", "borrar"] as const).map((accion) => (
                    <td key={accion} className="text-center py-3 px-2">
                      <input
                        type="checkbox"
                        checked={permiso?.[COLUMNA[accion]] ?? false}
                        disabled={!puedeEditar || !rolActivo || togglePermiso.isPending}
                        onChange={(e) => {
                          if (!rolActivo) return;
                          togglePermiso.mutate({
                            roleId: rolActivo.id,
                            resource: recurso.code,
                            accion,
                            valor: e.target.checked,
                          });
                        }}
                        className="accent-primary w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowNew(false)}
        >
          <div
            className="bg-card border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Nuevo rol</h3>
              <button onClick={() => setShowNew(false)} className="p-1 hover:opacity-70">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Nombre del rol
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Auditor"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <BtnPrimary
                onClick={() => crearRol.mutate(newName)}
                disabled={!newName.trim() || crearRol.isPending}
                className="w-full"
              >
                {crearRol.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear rol"}
              </BtnPrimary>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar rol"
        message={`¿Estás seguro de eliminar el rol "${confirmDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) borrarRol.mutate(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </>
  );
}
