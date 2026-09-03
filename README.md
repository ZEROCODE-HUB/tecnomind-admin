# TecnoMind — Fiat

Monorepo del producto **fiat** (sin cripto) de TecnoMind. Derivado de Magnate,
con el backoffice basado en el diseño de `ZEROCODE-HUB/tecnomind-admin`.

El producto con cripto vive en un repo aparte: `ZEROCODE-HUB/tecnomind-otc`,
con su **propio proyecto Supabase**.

## Estructura

```
apps/
  webapp/    App de usuario final    — Vite + React 18 + react-router + Tailwind v3
  admin/     Backoffice              — Vite + React 19 + TanStack Router + Tailwind v4
packages/
  core/      Código compartido (tipos de DB, entidades, cliente Supabase)
supabase/
  migrations/  Esquema versionado (vacío hasta la Fase 1)
docs/        Documentación funcional y planes de test
IDENTIDAD/   Manual de marca y design tokens
```

Las dos apps mantienen **stacks distintos a propósito**: portar el admin al stack
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
| `npm run dev` | Webapp en http://localhost:8080 |
| `npm run dev:admin` | Admin en http://localhost:8081 |
| `npm run dev:all` | Ambas a la vez |
| `npm run build` | Compila todos los workspaces |
| `npm run build:webapp` / `npm run build:admin` | Compila una sola |
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
| webapp | `apps/webapp` | a definir |
| admin | `apps/admin` | a definir |

Cada `vercel.json` construye desde la raíz del monorepo para respetar los workspaces.

## Estado

- [x] **Fase 0** — Andamiaje del monorepo, ambas apps compilando y corriendo en paralelo
- [ ] **Fase 1** — Esquema de Supabase versionado *(bloqueada: falta el backup de Magnate)*
- [ ] **Fase 2** — RLS y roles de backoffice
- [ ] **Fase 3** — Webapp contra datos reales
- [ ] **Fase 4** — Admin contra datos reales, sección por sección
- [ ] **Fase 5** — Derivar el producto OTC
- [ ] **Fase 6** — Despliegue y QA end-to-end

El admin funciona hoy con **datos mock** (`src/stores/backoffice-store.ts` + `demo-mode`);
la Fase 4 los reemplaza por Supabase sección por sección.
