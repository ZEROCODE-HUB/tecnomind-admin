-- =====================================================================
-- Cambios de modelo propios de TecnoMind
--
-- Son los tres cambios acordados: nombres de identidad neutros, país y
-- moneda como dato, y KYC desacoplado del proveedor. Se hacen ahora, con
-- la base vacía, porque hacerlos con datos productivos cuesta mucho más.
-- No convierten el sistema en multi-país: solo dejan de impedirlo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Identidad con nombres neutros
--    dni       -> document_number (+ document_type)
--    cuit_cuil -> tax_id
-- ---------------------------------------------------------------------
alter table public.users rename column dni       to document_number;
alter table public.users rename column cuit_cuil to tax_id;

alter table public.users
  add column document_type varchar(20) not null default 'DNI',
  add column country_code  char(2)     not null default 'AR';

comment on column public.users.document_type   is 'DNI, CI, CC, PAS… Por defecto DNI (Argentina).';
comment on column public.users.document_number is 'Número de documento. Antes se llamaba dni.';
comment on column public.users.tax_id          is 'Identificación fiscal (CUIT/CUIL en AR, NIT en CO). Antes cuit_cuil.';
comment on column public.users.country_code    is 'ISO 3166-1 alfa-2. Determina las reglas de identidad y la moneda por defecto.';

-- Un mismo número puede repetirse entre países o tipos de documento.
create unique index if not exists users_document_unique
  on public.users (country_code, document_type, document_number);

-- ---------------------------------------------------------------------
-- 2. KYC desacoplado del proveedor
--
-- Magnate tenía ZapSign incrustado en cuatro columnas de users. El
-- backoffice de TecnoMind muestra Truora y listas restrictivas. En vez de
-- agregar más columnas por cada proveedor, una tabla con payload jsonb.
-- ---------------------------------------------------------------------
create table if not exists public.kyc_verifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  provider        varchar(50)  not null,
  external_id     varchar(255),
  status          varchar(20)  not null default 'pending',
  score           numeric(5,2),
  document_url    text,
  payload         jsonb,
  verified_at     timestamptz,
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now(),
  constraint kyc_verifications_status_check
    check (status in ('pending','in_review','approved','rejected','expired')),
  constraint kyc_verifications_provider_check
    check (provider in ('zapsign','truora','manual'))
);

comment on table  public.kyc_verifications is 'Verificaciones de identidad, agnóstico del proveedor.';
comment on column public.kyc_verifications.payload is 'Respuesta cruda del proveedor. Lo específico vive acá, no en columnas.';

create index if not exists kyc_verifications_user_id_idx on public.kyc_verifications (user_id);
create index if not exists kyc_verifications_status_idx  on public.kyc_verifications (status);

alter table public.kyc_verifications enable row level security;

create policy "El usuario ve sus verificaciones"
  on public.kyc_verifications for select to authenticated
  using (user_id = auth.uid());

create policy "Los admins ven todas las verificaciones"
  on public.kyc_verifications for select to authenticated
  using (public.is_admin());

create policy "Solo service_role escribe verificaciones"
  on public.kyc_verifications for all to service_role
  using (true) with check (true);

create trigger trigger_update_kyc_verifications_timestamp
  before update on public.kyc_verifications
  for each row execute function public.update_updated_at_column();

-- Traslada lo que hubiera en las columnas zapsign_* (no-op si la base está vacía).
insert into public.kyc_verifications (user_id, provider, external_id, status, document_url, payload, verified_at)
select u.id, 'zapsign', u.zapsign_verification_id,
       case when u.zapsign_verified_at is not null then 'approved' else 'pending' end,
       u.zapsign_contract_url, u.zapsign_data, u.zapsign_verified_at
from public.users u
where u.zapsign_verification_id is not null
   or u.zapsign_data is not null;

alter table public.users
  drop column zapsign_verification_id,
  drop column zapsign_verified_at,
  drop column zapsign_data,
  drop column zapsign_contract_url;

-- ---------------------------------------------------------------------
-- 3. La webapp registra dispositivos 'web' y el CHECK solo permitía
--    ios/android: cualquier login desde el navegador fallaba.
-- ---------------------------------------------------------------------
alter table public.user_devices drop constraint if exists user_devices_platform_check;
alter table public.user_devices
  add constraint user_devices_platform_check
  check (platform in ('ios','android','web'));

-- ---------------------------------------------------------------------
-- 4. Triggers duplicados heredados
--
-- Tres tablas tenían DOS triggers idénticos llamando a
-- update_updated_at_column() en el mismo evento. Se deja uno de cada.
-- ---------------------------------------------------------------------
drop trigger if exists update_account_limits_updated_at          on public.account_limits;
drop trigger if exists update_api_access_updated_at              on public.api_access;
drop trigger if exists update_user_auth_credentials_updated_at   on public.user_auth_credentials;
