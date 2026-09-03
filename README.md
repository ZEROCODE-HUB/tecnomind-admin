# TecnoMind — Fiat

Monorepo del producto **fiat** (sin cripto) de TecnoMind. Derivado de Magnate,
con el backoffice basado en el diseño de `ZEROCODE-HUB/tecnomind-admin`.

El producto con cripto vive en un repo aparte: `ZEROCODE-HUB/tecnomind-otc`,
con su **propio proyecto Supabase**.

## Estructura

```
apps/
  wallet/    La app (producto principal)  — React 18 + react-router + Tailwind v3  :8082
  admin/     Backoffice                   — React 19 + TanStack Router + Tailwind v4  :8081
  webapp/    Acceso web (complemento)     — React 18 + react-router + Tailwind v3  :8080
packages/
  core/      Código compartido (tipos de DB, cliente Supabase, permisos)
supabase/
  migrations/  Esquema versionado (20 migraciones, aplicadas)
docs/        Documentación funcional y planes de test
IDENTIDAD/   Manual de marca y design tokens
```

### Las tres apps

- **`wallet`** — la app, el producto principal. Mobile-first: registro por pasos
  con PIN y biometría, escaneo de QR, dispositivos vinculados, configuración de API.
- **`admin`** — el backoffice para operadores.
- **`webapp`** — complemento para navegador, reducido (sin registro, sin QR, sin
  dispositivos). Se entra con la contraseña de acceso web que el usuario habilita
  *desde la app*: por eso el esquema tiene `web_access_enabled` y `web_password_hash`.

El admin mantiene un **stack distinto a propósito**: portar el admin al stack
de la webapp implicaría reescribir su ruteo y su CSS, degradando un diseño ya
aprobado. Conviven sin problema bajo npm workspaces.

## Requisitos

- Node.js >= 22
- npm 11+ (se usa **npm workspaces**, no bun ni pnpm)

## Puesta en marcha

```bash
npm install            # instala todo el monorepo desde la raíz
cp .env.example .env   # completar con las credenciales de Supabase
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | La app en http://localhost:8082 |
| `npm run dev:admin` | Admin en http://localhost:8081 |
| `npm run dev:webapp` | Acceso web en http://localhost:8080 |
| `npm run dev:all` | App y admin a la vez |
| `npm run build` | Compila todos los workspaces |
| `npm run build:wallet` / `:admin` / `:webapp` | Compila una sola |
| `npm run lint` | Lint de todos los workspaces |

## Variables de entorno

Se configuran en `.env` (nunca versionado) y en Vercel por proyecto:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

> La `service_role` key **no va nunca en el frontend**: saltea todas las
> políticas RLS. Solo del lado de Supabase o de un servidor.

## Despliegue

Vercel, **un proyecto por app**, ambos apuntando a este repo:

| App | Root Directory | Dominio |
|---|---|---|
| wallet | `apps/wallet` | a definir |
| admin | `apps/admin` | a definir |
| webapp | `apps/webapp` | a definir |

Cada `vercel.json` construye desde la raíz del monorepo para respetar los workspaces.

## Estado

- [x] **Fase 0** — Andamiaje del monorepo; las tres apps compilan y corren en paralelo
- [x] **Fase 1** — Esquema de Supabase versionado y aplicado
- [x] **Fase 2** — Roles, permisos y auditoría del backoffice + login del admin
- [ ] **Fase 3** — La app (`wallet`) contra datos reales
- [ ] **Fase 4** — Admin contra datos reales, sección por sección
- [ ] **Fase 5** — Acceso web (`webapp`) contra datos reales
- [ ] **Fase 6** — Derivar el producto OTC
- [ ] **Fase 7** — Despliegue y QA end-to-end

El admin y la app funcionan hoy mayormente con **datos mock** (`src/stores/backoffice-store.ts` + `demo-mode`);
la Fase 4 los reemplaza por Supabase sección por sección.
