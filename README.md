# TecnoMind — Fiat (base de datos + backoffice)

Producto **fiat** (sin cripto) de TecnoMind. Este repo contiene el **esquema de
Supabase** (la base compartida de todo el producto) y el **backoffice**.

> ## La app de usuarios vive en otro repo
>
> El producto de cara al usuario es la **app React Native (Proxpera)**, no una web.
> Está tomada de `magnate-virtual-wallet` rama `master` y se trabaja aparte.
>
> La web de usuarios que estuvo acá (`apps/wallet` y `apps/webapp`) se **eliminó**:
> era la app equivocada. Lo que se hizo con ella, y qué de eso sigue sirviendo (todo
> vive en la base, no en la web), quedó documentado en
> [docs/web-de-usuarios-estado.md](docs/web-de-usuarios-estado.md).

## Estructura

```
apps/
  admin/     Backoffice — React 19 + TanStack Router + Tailwind v4   :8081
packages/
  core/      Código compartido del admin (tipos de DB, cliente Supabase, permisos)
supabase/
  migrations/  Esquema versionado (35 migraciones, aplicadas)
  functions/   Edge Functions (zapsign-proxy: KYC del lado servidor)
docs/        Documentación funcional y estado
IDENTIDAD/   Manual de marca y design tokens
```

Una **sola base de datos** para el producto. Este repo la versiona en
`supabase/migrations`; el backoffice y la app nativa la consumen.

## Requisitos

- Node.js >= 22
- npm 11+ (npm workspaces)

## Puesta en marcha

```bash
npm install            # instala el monorepo desde la raíz
cp .env.example .env   # completar con las credenciales de Supabase
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Admin en http://localhost:8081 |
| `npm run build` | Compila el admin |
| `npm run lint` | Lint de los workspaces |

## Variables de entorno

En `.env` (nunca versionado) y en Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

> La `service_role` key **no va nunca en el frontend**: saltea todas las políticas
> RLS. Solo del lado de Supabase o de un servidor.

## Estado

- [x] **Esquema de Supabase** versionado y aplicado (35 migraciones), con las
  correcciones de seguridad heredadas de Magnate
- [x] **Backoffice** contra datos reales (verificación, usuarios, movimientos,
  estadísticas) con roles, permisos y auditoría
- [x] **Edge Function `zapsign-proxy`** desplegada (KYC del lado servidor)
- [ ] Reestructuración de repos: mover el backoffice a `tecnomind-admin` y definir
  dónde viven las migraciones (recomendado: junto al admin, único que opera sobre
  toda la base). Ver docs.
- [ ] Derivar el producto OTC
- [ ] Despliegue y QA end-to-end
