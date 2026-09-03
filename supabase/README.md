# Supabase — TecnoMind Fiat

Una base por producto: este directorio corresponde **solo** a `tecnomind-fiat`.
`tecnomind-otc` tendrá su propio proyecto y sus propias migraciones.

| | |
|---|---|
| Proyecto | `spieokzbbwmgkcdigsxo` |
| Región | us-west-2 |
| Postgres | 17.6 |

## Migraciones

Reconstruidas desde el backup del Supabase de Magnate. Se aplican en orden.

| Archivo | Contenido |
|---|---|
| `00001_extensions` | pgcrypto, pg_net, pgmq, pg_cron |
| `00002_tables` | 22 tablas, tal cual venían |
| `00003_functions` | 56 funciones (transferencias, límites, saldos, QR, dispositivos, cola de notificaciones) |
| `00004_constraints` | 42 constraints + 65 índices |
| `00005_foreign_keys` | 24 FKs |
| `00006_views` | 4 vistas |
| `00007_triggers` | 25 triggers |
| `00008_rls` | RLS + 55 políticas heredadas |
| `00009_grants` | permisos heredados |
| `00010_tecnomind_seguridad` | **correcciones de seguridad** |
| `00011_tecnomind_modelo` | cambios de modelo de TecnoMind |
| `00012_tecnomind_funciones` | funciones y vista adaptadas a 00011 |
| `00013_catalogos` | catálogos (16 filas). **Ningún dato personal** |

Los archivos `00001`–`00009` son herencia de Magnate sin tocar; del `00010` en
adelante son decisiones de TecnoMind. La separación es deliberada: permite ver
de un vistazo qué cambió respecto del original.

## Qué se corrigió (00010)

En el Supabase de Magnate, **las 4 vistas eran legibles sin autenticación**.
La causa: una vista sin `security_invoker` corre con los permisos de su owner e
**ignora el RLS de las tablas base**. Las tablas estaban bien protegidas; las
vistas las sorteaban. Sumado a `GRANT ALL ... TO anon` y a una anon key
publicada en un repo público, `admin_transaction_list` exponía nombre, email,
teléfono y documento de ambas partes de cada transacción.

Corregido acá: `security_invoker = true` en las cuatro, `revoke` a `anon`,
la política pública de `support` eliminada, y RLS habilitado en las dos tablas
que no lo tenían.

## Cambios de modelo (00011)

- `users.dni` → `document_number`, `users.cuit_cuil` → `tax_id`
- nuevas `users.document_type` (def. `DNI`) y `users.country_code` (def. `AR`)
- `kyc_verifications` con `provider` + `payload jsonb`, en lugar de las cuatro
  columnas `zapsign_*` que estaban incrustadas en `users`
- `user_devices.platform` ahora acepta `web` — el CHECK solo permitía
  ios/android, así que **cualquier login desde el navegador fallaba**
- eliminados 3 triggers duplicados que llamaban dos veces a `update_updated_at_column()`

## Reglas para toda migración nueva

1. **RLS habilitado siempre**, en la misma migración que crea la tabla.
2. Toda vista se crea `with (security_invoker = true)`.
3. La `service_role` key jamás llega al frontend.
4. Ningún dato personal de Magnate se importa a TecnoMind.

## Aplicar

Las migraciones se aplicaron vía la Management API de Supabase. Para reaplicarlas
en otro proyecto, ejecutarlas en orden numérico.

## Pendiente

- Tablas propias del backoffice (roles de admin, alertas, comercios, soporte
  ampliado): el diseño las necesita y no existen en Magnate. Van en la Fase 2.
- `transactions` tiene dos triggers de número de referencia
  (`set_transaction_reference` y `trigger_generate_reference`) que llaman a
  funciones distintas. Se dejaron ambos por no cambiar comportamiento a ciegas;
  hay que definir cuál queda.

---

## Fase 2 — Backoffice (migraciones 00014–00020)

| Archivo | Contenido |
|---|---|
| `00014_backoffice_roles` | roles, permisos por recurso, asignaciones, auditoría, `has_backoffice_permission()` |
| `00015_backoffice_roles_seed` | los 6 roles del diseño con su matriz de permisos |
| `00016_auth_trigger` | `on_auth_user_created` sobre `auth.users` |
| `00017_permisos_efectivos` | `get_my_backoffice_permissions()` |
| `00018_privilegios_por_columna` | **cierra escalada de privilegios y alteración de saldos** |
| `00019_vista_admin_transacciones` | devuelve `admin_transaction_list` al backoffice |
| `00020_trigger_qr_security_definer` | corrige el trigger de sincronización de QR |

### Vulnerabilidad crítica corregida en 00018

Verificada explotándola con un usuario común contra el endpoint REST:

```
PATCH /rest/v1/accounts?id=eq.<propia>  {"balance": 999999}       -> saldo modificado
PATCH /rest/v1/users?id=eq.<propio>     {"role": "admin"}          -> usuario hecho admin
PATCH /rest/v1/users?id=eq.<propio>     {"verification_status":"verified"} -> KYC auto-aprobado
```

**Causa:** las políticas `Users can update own X` evalúan *quién* escribe
(`auth.uid() = user_id`) pero no *qué* escribe. RLS opera a nivel de fila, no de
columna: siendo dueño de la fila se podía tocar cualquier campo, incluido el
propio saldo o el propio rol. Como `is_admin()` lee `users.role`, la escalada
daba acceso a todos los datos del sistema.

**Corrección:** privilegios de columna (`GRANT UPDATE (col)`), que sí son
granulares. RLS decide qué filas, el GRANT decide qué columnas. Lo demás se
modifica desde funciones `SECURITY DEFINER` o con `service_role`.

Los cinco ataques quedaron verificados como bloqueados (HTTP 403), y lo legítimo
—cambiar teléfono y alias— sigue funcionando.

### Roles del backoffice

| Rol | Lee | Modifica | Crea | Borra |
|---|---|---|---|---|
| Admin | 16 | 16 | 16 | 16 |
| Compliance | 16 | 2 | 0 | 0 |
| Management | 16 | 15 | 2 | 0 |
| Reader | 16 | 0 | 0 | 0 |
| Accounting | 3 | 0 | 0 | 0 |
| User | 0 | 0 | 0 | 0 |

El log de auditoría es inmutable por diseño: hay política de INSERT y de SELECT,
ninguna de UPDATE ni DELETE. Nadie puede alterarlo, tampoco un admin.
