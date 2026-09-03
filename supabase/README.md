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
