import type { TecnoMindClient } from "./supabase";

/** Recursos protegidos del backoffice. Espejo de public.backoffice_resources. */
export const RESOURCES = [
  "usuarios",
  "movimientos",
  "alertas",
  "soporte",
  "backoffice",
  "reportes",
  "registros",
  "modulos",
  "configuracion",
  "incidentes",
  "comercios",
  "verificacion",
  "pagos",
  "otc",
  "estadisticas",
  "notificaciones",
] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = "read" | "update" | "create" | "delete";

/** Permisos de un operador: por recurso, qué acciones puede hacer. */
export type PermissionMap = Record<string, Record<Action, boolean>>;

export const EMPTY_PERMISSIONS: PermissionMap = {};

/**
 * Trae los permisos efectivos del usuario logueado.
 *
 * Un operador puede tener varios roles: los permisos se acumulan, basta
 * que uno de sus roles conceda la acción. RLS ya limita las filas a las
 * de este usuario, así que la consulta no necesita filtrar por id.
 */
export async function fetchPermissions(client: TecnoMindClient): Promise<PermissionMap> {
  // Se resuelve con una función y no con un embed de PostgREST:
  // backoffice_user_roles y backoffice_role_permissions no tienen relación
  // directa (ambas apuntan a backoffice_roles), y la función ya agrega los
  // permisos cuando el operador tiene más de un rol.
  const { data, error } = await client.rpc("get_my_backoffice_permissions");
  if (error) throw error;

  const map: PermissionMap = {};
  for (const p of data ?? []) {
    map[p.resource_code] = {
      read: Boolean(p.can_read),
      update: Boolean(p.can_update),
      create: Boolean(p.can_create),
      delete: Boolean(p.can_delete),
    };
  }
  return map;
}

export function can(permissions: PermissionMap, resource: Resource, action: Action = "read"): boolean {
  return permissions[resource]?.[action] ?? false;
}

/** True si el operador puede entrar al backoffice (lee al menos un recurso). */
export function hasAnyAccess(permissions: PermissionMap): boolean {
  return Object.values(permissions).some((p) => p.read);
}
