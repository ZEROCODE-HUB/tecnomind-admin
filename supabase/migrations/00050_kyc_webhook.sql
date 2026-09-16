-- 00050_kyc_webhook.sql
-- Registro server-side de verificaciones de identidad (KYC) recibidas por el
-- webhook de ZapSign. Cierra el hueco de "confiar en el cliente": el servidor
-- guarda de forma independiente qué email completó la firma/verificación.

create table if not exists public.kyc_completions (
  id          uuid primary key default gen_random_uuid(),
  email       text,
  doc_token   text,
  event       text,
  status      text,
  signer_name text,
  raw         jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_kyc_completions_email
  on public.kyc_completions (lower(email), created_at desc);
create index if not exists idx_kyc_completions_doc
  on public.kyc_completions (doc_token);

-- RLS cerrada: solo lo tocan la Edge Function (service_role) y las RPC DEFINER.
alter table public.kyc_completions enable row level security;
revoke all on public.kyc_completions from anon, authenticated;

-- ¿Ese email tiene una verificación de identidad COMPLETADA? (para el alta de
-- cuenta). Los estados exactos de ZapSign se afinan cuando veamos un payload
-- real; por eso es lenient con varias variantes de "firmado/concluido".
create or replace function public.email_completo_kyc(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.kyc_completions
     where lower(email) = lower(trim(p_email))
       and (
         status is null -- algún evento de conclusión sin status explícito
         or lower(status) in (
           'signed','completed','concluido','concluído','assinado','finished','doc_signed'
         )
       )
  );
$$;

grant execute on function public.email_completo_kyc(text) to anon, authenticated;
