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

---

## Fase 3 — Autenticación de la app (migración 00021)

### Decisión: el PIN es la credencial, y vive en un solo lugar

Magnate guardaba **dos** secretos para la misma identidad: `users.pin_hash`
y, en `user_auth_credentials`, una contraseña automática **cifrada de forma
reversible**. Dos superficies de ataque, una de ellas descifrable.

Acá la credencial es una sola y vive en **Supabase Auth**, que la guarda con
bcrypt y ya trae rotación de tokens, rate limiting por IP y revocación de
sesiones. Esa credencial es el PIN.

Consecuencias asumidas:
- **El PIN pasa de 4 a 6 dígitos.** Con 4 son 10.000 combinaciones, muy poco
  para ser la única credencial; con 6 son 1.000.000.
- `users.pin_hash` y `user_auth_credentials` quedan **sin usar**, marcadas con
  un `COMMENT` en la base para que nadie vuelva a escribir ahí.

**Limitación conocida:** un PIN de 6 dígitos sigue siendo débil comparado con
una contraseña. La defensa de fondo es el rate limiting por IP de Supabase más
el registro de intentos. Si el negocio lo requiere, la vía correcta es una Edge
Function que valide el PIN server-side con bloqueo por cuenta y recién entonces
emita la sesión. Queda planteado, no implementado, porque cambia el flujo.

### Otras piezas

- `login_attempts` — intentos de acceso. Solo se insertan; los lee el backoffice
  con permiso sobre `alertas`. Un cliente no puede leerlos: expondría qué
  cuentas existen.
- `check_login_blocked()` — 5 fallos en 15 minutos bloquean. Responde **igual
  para cuentas inexistentes**, para no convertirse en un enumerador de usuarios.
- `can_register()` — reemplaza a `check_user_exists()` de cara al cliente.
  Aquella devolvía *qué* campo estaba repetido, lo que permitía enumerar
  documentos y CUITs de clientes reales. Esta responde solo sí o no.

## ⚠️ Pendiente de configuración: SMTP

El proyecto **no tiene SMTP propio** y usa el de Supabase, limitado a
**2 emails por hora**. Con la confirmación de email activada
(`mailer_autoconfirm: false`, el valor actual), el registro público devuelve
`429 over_email_send_rate_limit` a partir del tercer alta de cada hora.

Hay que elegir una de estas dos, desde el dashboard de Supabase:

1. **Configurar un SMTP propio** (Resend, SendGrid, SES). Es lo correcto para
   producción y mantiene la confirmación de email.
2. **Desactivar la confirmación** (`mailer_autoconfirm: true`). El usuario entra
   directo tras registrarse. La verificación de identidad real es el KYC
   (`kyc_verifications`), que sigue en `pending`; el email solo confirma que la
   dirección existe.

Hasta que se resuelva, el registro público está limitado a 2 altas por hora.
El token de acceso disponible no tiene privilegios para cambiar esta
configuración: hay que hacerlo desde el dashboard.

---

## Fase 3 — Pantallas contra datos reales (migración 00022)

### 🔴 Bloqueador encontrado al probar la primera transferencia

```
TRANSFER_FAILED: relation "pgmq.q_notification_jobs" does not exist
```

**Ninguna transferencia podía completarse.** La cadena es:
`process_transfer` marca la transacción como `completed` → el trigger
`on_transaction_completed_enqueue` → `trigger_enqueue_transaction_notification`
→ `enqueue_notification` → `pgmq.send('notification_jobs', ...)`.

La cola vive en el schema `pgmq`, no en `public`, así que quedó fuera de la
extracción inicial del backup — el mismo problema que el trigger de
`auth.users`. Creada en `00022`, de forma idempotente.

Como la transacción entera se revertía, no hubo saldos inconsistentes: la
operación simplemente no se podía hacer.

### ⚠️ El saldo es un valor DERIVADO: no tocar `accounts.balance` a mano

`process_transfer` no actualiza el saldo de forma incremental: llama a
`reconcile_account_balance()`, que lo **recalcula desde cero** sumando las
transacciones de la cuenta.

Consecuencia práctica: un `update accounts set balance = X` queda inconsistente
y hace fallar la **siguiente** operación con
`accounts_balance_check` (el saldo recalculado da negativo). Para acreditar
saldo hay que insertar una transacción real —un depósito— y reconciliar.
Lo descubrí acreditando saldo a mano en una prueba.

### Hooks de datos de la app

`apps/wallet/src/hooks/`: `useAccount` (cuenta, saldo con variación del día,
límites), `useTransactions` (recientes y listado con filtros), `useTransfer`
(búsqueda de destinatario y `process_transfer`), `useStatistics`.

Los tres archivos de datos mock (`mockBalance`, `mockTransactions`,
`statisticsData`) fueron **eliminados**. Detalles que corregí al conectar:

- `Movements` filtraba fechas con una función que **hardcodeaba el mes de
  octubre**, porque los mocks eran de octubre.
- `Statistics` generaba el gráfico con una onda de seno y coseno. Ahora agrega
  los movimientos reales por hora, día o semana según el rango, y la variación
  porcentual se compara contra el período anterior de igual duración.
- `Transfer` validaba contra una constante `AVAILABLE_BALANCE` y **no resolvía
  el destinatario**: se confirmaba a ciegas. Ahora lo busca antes de confirmar
  y muestra el titular.

### ⚠️ Pendiente de seguridad: el OTP de transferencia no es real

`ConfirmPay` pide un código de 6 dígitos, pero está **fijo en `123456`** y no se
envía por ningún canal. Hoy ese paso **no verifica nada**. La tabla `email_otps`
ya existe en el esquema; falta implementarlo cuando esté Resend. Marcado con un
comentario en el código. **No puede salir a producción así.**

---

## Verificación en navegador (migraciones 00023–00025)

Probado en Chrome contra los servidores locales, con datos reales. Apareció
una cadena de bugs que ninguna prueba de API había detectado.

### La app no montaba: dos copias de React

Pantalla en blanco, sin errores en consola. El árbol fallaba con
`Cannot read properties of null (reading 'useEffect')` en
`QueryClientProvider`, capturado con un error boundary inyectado a mano.

**Causa:** el monorepo tiene React 18 (wallet, webapp) y React 19 (admin).
npm hoistea React 19 a la raíz junto a dependencias compartidas como
`@tanstack/react-query`, y esa librería cargaba el React equivocado. Es el
riesgo asumido al mantener dos stacks, y se manifestó solo en dev.

**Corrección:** `resolve.dedupe` + alias explícitos a la copia local de React
en el `vite.config.ts` de `wallet` y `webapp`.

### El nombre de la contraparte: tres intentos hasta la causa real

El listado mostraba `tecnomind.28987654` en lugar de `Martin Lopez`.

1. **00023** — el `COALESCE` heredado ponía `payment_reference` (el
   identificador que escribió el usuario) **antes** del nombre del titular.
   Invertí la prioridad. Seguía mostrando el alias.
2. **00024** — `process_transfer` crea **dos** transacciones para una
   transferencia interna, y en la de egreso `to_account_id` queda en NULL: la
   contraparte viaja en `metadata`. Lo leí de ahí. Seguía mostrando el alias.
3. **00025** — la causa de fondo: la vista tiene `security_invoker = true`, así
   que sus subconsultas corren con los permisos de quien consulta, y el RLS
   —con razón— no deja que un cliente lea la cuenta ni el perfil de otro. El
   subselect devolvía NULL.

No se podía arreglar relajando el RLS: eso es justo lo que `00010` y `00018`
cerraron. La salida fue exponer **solo el nombre** con
`get_account_holder_name()`, una función `SECURITY DEFINER`, igual que ya hacía
`search_account_for_transfer` antes de transferir. Verificado: el cliente ve
"Martin Lopez" en su movimiento, y `GET /users?first_name=eq.Martin` le sigue
devolviendo `[]`.

### Otros bugs de UI corregidos

- **`ConfirmPay`** mostraba el alias como destinatario en vez del titular.
- **`SuccessPay`** mostraba el destinatario **vacío**: espera un objeto
  `{name, cuit, type}` y `ConfirmPay` le pasaba un string.
- **El botón "Cerrar Sesión" del sidebar solo navegaba a `/login`**: nunca
  cerraba la sesión. Volver a `/dashboard` por URL seguía mostrando los datos.
  Ahora llama a `logout()`, que además fuerza `signOut({scope:'local'})` si la
  llamada al servidor falla, para que el token no quede vivo en el navegador.
