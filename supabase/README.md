# Supabase — TecnoMind Fiat

Una base por producto: este directorio corresponde **solo** a `tecnomind-fiat`.
`tecnomind-otc` tiene su propio proyecto Supabase y sus propias migraciones.

## Estado

`migrations/` está **vacío a propósito**. El esquema se reconstruye en la Fase 1,
a partir del backup del Supabase de Magnate (`pg_dump --schema-only`), que a la
fecha todavía no está disponible.

## Tablas confirmadas en el Supabase de Magnate

Sondeadas vía PostgREST (existen, aunque su definición completa aún no se conoce):

| Tabla | Notas |
|---|---|
| `users` | RLS activo |
| `accounts` | RLS activo |
| `account_types` | catálogo (3 filas) |
| `transactions` | RLS activo |
| `transaction_types` | catálogo (7 filas) |
| `user_devices` | RLS activo |
| `api_access` | RLS activo |
| `account_movements` | vista de movimientos |
| `support` | tickets/contacto |

No existen `support_settings` ni `admin_users` (el admin las necesitará: se crean nuevas).

## Reglas para toda migración nueva

1. **RLS habilitado siempre**, en cada tabla, desde su propia migración de creación.
   Ninguna tabla se da por terminada sin sus políticas.
2. La `service_role` key jamás llega al frontend.
3. Cambios acordados respecto al modelo de Magnate:
   - `users.dni` + `users.cuit_cuil` → `document_type` + `document_number` + `tax_id`
   - `users.country_code` nuevo
   - `currency` (ya existe en `accounts`/`transactions`) se usa de verdad, sin hardcodear ARS
   - KYC genérico: `kyc_verifications` con `provider` + `payload jsonb`
