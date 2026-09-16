-- 00052_kyc_documentos.sql
-- Reutilización de documentos de ZapSign por email. ZapSign COBRA al CREAR un
-- documento (aunque no se firme) y borrarlo NO libera cupo. Con el link público
-- cada apertura crea uno nuevo => se gasta plata en balde por cada reintento.
--
-- Solución: cuando la creación la controla el servidor (flujo API / Edge
-- Function), guardamos el documento creado por email y lo REUTILIZAMOS. Si el
-- usuario vuelve a intentar, se le devuelve el mismo sign_url en vez de crear
-- otro documento. Un email = un documento (hasta que complete).
--
-- La escribe SOLO la Edge Function zapsign-proxy (service_role). RLS cerrada.

create table if not exists public.kyc_documentos (
  email        text primary key,             -- normalizado (lower/trim)
  doc_token    text not null,
  signer_token text,
  sign_url     text not null,
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_kyc_documentos_doc on public.kyc_documentos (doc_token);

alter table public.kyc_documentos enable row level security;
revoke all on public.kyc_documentos from anon, authenticated;
-- Sin policies: nadie con anon/authenticated la toca. Solo service_role (Edge
-- Function) la lee/escribe, que bypassa RLS.
