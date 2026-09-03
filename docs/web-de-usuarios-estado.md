# La web de usuarios — estado y cómo retomarla

**Estado: en pausa. No es el producto.** Este documento existe para que, si en
algún momento se retoma, no haya que reconstruir el contexto.

## Qué pasó

`NoCodeHero83/magnate-virtual-wallet` tiene **dos ramas con dos aplicaciones
distintas**:

| Rama | Contenido |
|---|---|
| `main` (rama por defecto) | app **web** — Vite + React 18 + react-router + Tailwind v3 |
| `master` | app **React Native** — Expo SDK 54, la app de verdad |

El pedido apuntaba a `/tree/master`. Al clonar se tomó la rama por defecto y se
trabajó sobre la web durante las fases 3 a 5. El producto es la app nativa; la
web de usuarios **no va**.

La confusión tenía una pista que se pasó por alto: el esquema heredado estaba
diseñado para una app nativa (`user_devices.player_id` de OneSignal,
`biometric_enabled`, y un CHECK que solo admitía `platform IN ('ios','android')`
— hubo que agregar `'web'` en la migración `00011` justamente porque el login
desde el navegador fallaba). Eso era la señal de que el cliente esperado era
otro.

## Qué quedó hecho, y sirve

Nada de lo siguiente se pierde: **vive en la base de datos**, no en la web. La
app nativa lo aprovecha tal cual.

- **35 migraciones** aplicadas: el esquema completo, las correcciones de
  seguridad, el modelo de backoffice, el OTP real y la disponibilidad de alias.
- **Las dos vulnerabilidades críticas de Magnate**, corregidas y verificadas
  explotándolas primero (ver `supabase/README.md`).
- **El backoffice** (`apps/admin`) conectado a datos reales. Ese trabajo **no
  está en pausa**: el panel es un producto propio y sigue vigente.
- El **OTP** (`00035`), la **disponibilidad de alias** (`00034`), los mutadores
  auditados del backoffice y las vistas de agregación.

## Qué queda solo en la web y habría que rehacer si se retoma

Todo esto es código de interfaz en `apps/wallet`. La lógica de negocio que
consume ya está resuelta del lado de la base.

| Pantalla | Estado en que quedó |
|---|---|
| Login / registro | Conectado (PIN como credencial de Supabase Auth) |
| Dashboard | Conectado (saldo y últimos movimientos reales) |
| Transferir → Confirmar → Comprobante | Conectado, con OTP real |
| Movimientos | Conectado, agrupado por día, contraparte resuelta |
| Estadísticas | Conectado |
| Perfil | Conectado, incluido el cambio de alias |
| Compartir CVU | Conectado, con QR real generado desde `qr_codes.qr_data` |
| Configuración, Dispositivos, API, Acceso web, Escanear QR | **Sin conectar** |

Los hooks reutilizables están en `apps/wallet/src/hooks/`: `useAccount`,
`useTransactions`, `useTransfer`, `useStatistics`, `useOtpVerification`. Son
React puro sin dependencias de DOM salvo el temporizador, así que sirven de
referencia directa para la app nativa aunque no se copien tal cual.

## Si el día de mañana hace falta un acceso web

El esquema ya lo contempla y **no es esta app**: `users.web_access_enabled`,
`users.web_password_hash` y `users.web_access_enabled_at`. El diseño original de
Magnate era **app nativa como producto principal + acceso web secundario**, que
el usuario habilita con una contraseña aparte. Para eso está `apps/webapp`, que
es la versión reducida (sin registro, sin QR, sin dispositivos) y que nunca se
llegó a conectar.

O sea: si se retoma algo del lado web, lo que corresponde retomar es
`apps/webapp` en ese rol, no `apps/wallet` como producto.

## Cuentas de prueba creadas

Quedan en la base y hay que **borrarlas antes de producción**:

- `demo@tecnomind.app` / PIN `202601` — Camila Ibarra
- `demo2@tecnomind.app` / PIN `202602` — Diego Navarro
