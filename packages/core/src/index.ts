// @tecnomind/core — código compartido entre webapp y admin.
export type { Database, Json } from "./database.types";
export { createTecnoMindClient, type TecnoMindClient } from "./supabase";
export {
  RESOURCES,
  EMPTY_PERMISSIONS,
  fetchPermissions,
  can,
  hasAnyAccess,
  type Resource,
  type Action,
  type PermissionMap,
} from "./permissions";
