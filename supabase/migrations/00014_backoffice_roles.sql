-- =====================================================================
-- Roles y permisos del backoffice
--
-- Magnate solo tenia users.role text ('user' | 'admin'): un unico nivel,
-- sin granularidad. El diseño de tecnomind-admin ya define un modelo mas
-- fino -- roles con permisos por recurso x (leer, modificar, crear,
-- borrar) -- y esta migracion lo lleva a la base tal cual, para que la
-- pantalla Administracion > Usuarios > Roles se conecte sin rediseñarse.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Recursos protegidos. Coinciden con la constante `recursos` de
-- admin.administracion.usuarios.roles.tsx.
-- ---------------------------------------------------------------------
create table if not exists public.backoffice_resources (
  code         varchar(50) primary key,
  name         varchar(100) not null,
  description  text,
  sort_order   integer not null default 0
);

comment on table public.backoffice_resources is
  'Catalogo de recursos sobre los que se otorgan permisos en el backoffice.';

insert into public.backoffice_resources (code, name, sort_order) values
  ('usuarios',      'Usuarios',      1),
  ('movimientos',   'Movimientos',   2),
  ('alertas',       'Alertas',       3),
  ('soporte',       'Soporte',       4),
  ('backoffice',    'Backoffice',    5),
  ('reportes',      'Reportes',      6),
  ('registros',     'Registros',     7),
  ('modulos',       'Módulos',       8),
  ('configuracion', 'Configuración', 9),
  ('incidentes',    'Incidentes',   10),
  ('comercios',     'Comercios',    11),
  ('verificacion',  'Verificación', 12),
  ('pagos',         'Pagos',        13),
  ('otc',           'OTC',          14),
  ('estadisticas',  'Estadísticas', 15),
  ('notificaciones','Notificaciones',16)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------
create table if not exists public.backoffice_roles (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(50)  not null unique,
  name        varchar(100) not null,
  description text,
  is_system   boolean      not null default false,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

comment on column public.backoffice_roles.is_system is
  'Un rol de sistema no se puede borrar desde la UI. Protege al rol admin.';

-- ---------------------------------------------------------------------
-- Permisos: una fila por (rol, recurso) con las cuatro acciones
-- ---------------------------------------------------------------------
create table if not exists public.backoffice_role_permissions (
  role_id       uuid        not null references public.backoffice_roles(id) on delete cascade,
  resource_code varchar(50) not null references public.backoffice_resources(code) on delete cascade,
  can_read      boolean     not null default false,
  can_update    boolean     not null default false,
  can_create    boolean     not null default false,
  can_delete    boolean     not null default false,
  primary key (role_id, resource_code)
);

-- ---------------------------------------------------------------------
-- Asignacion de roles a usuarios del backoffice
--
-- Se apoya en public.users (misma identidad que auth.users) en vez de
-- crear una tabla de usuarios paralela: un operador del backoffice es un
-- usuario con rol asignado, y asi el login es el de Supabase Auth.
-- ---------------------------------------------------------------------
create table if not exists public.backoffice_user_roles (
  user_id     uuid not null references public.users(id) on delete cascade,
  role_id     uuid not null references public.backoffice_roles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.users(id),
  primary key (user_id, role_id)
);

create index if not exists backoffice_user_roles_user_idx on public.backoffice_user_roles (user_id);

-- ---------------------------------------------------------------------
-- Auditoria del backoffice
--
-- Un backoffice financiero sin traza de quien hizo que es indefendible
-- ante cualquier auditoria. Magnate no tenia nada equivalente.
-- ---------------------------------------------------------------------
create table if not exists public.backoffice_audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.users(id) on delete set null,
  action        varchar(50)  not null,
  resource_code varchar(50)  references public.backoffice_resources(code),
  target_type   varchar(50),
  target_id     text,
  before_data   jsonb,
  after_data    jsonb,
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz  not null default now()
);

create index if not exists backoffice_audit_log_actor_idx   on public.backoffice_audit_log (actor_id);
create index if not exists backoffice_audit_log_created_idx on public.backoffice_audit_log (created_at desc);
create index if not exists backoffice_audit_log_target_idx  on public.backoffice_audit_log (target_type, target_id);

comment on table public.backoffice_audit_log is
  'Traza de acciones del backoffice. Solo se inserta: nunca se edita ni se borra.';

-- ---------------------------------------------------------------------
-- Funcion de autorizacion
--
-- SECURITY DEFINER y search_path fijo: se consulta desde las politicas
-- RLS, y sin eso habria recursion al leer las propias tablas.
-- ---------------------------------------------------------------------
create or replace function public.has_backoffice_permission(
  p_resource varchar, p_action varchar default 'read'
) returns boolean
  language sql stable security definer
  set search_path to 'public'
as $fn$
  select exists (
    select 1
    from public.backoffice_user_roles ur
    join public.backoffice_role_permissions rp on rp.role_id = ur.role_id
    where ur.user_id = auth.uid()
      and rp.resource_code = p_resource
      and case p_action
            when 'read'   then rp.can_read
            when 'update' then rp.can_update
            when 'create' then rp.can_create
            when 'delete' then rp.can_delete
            else false
          end
  );
$fn$;

comment on function public.has_backoffice_permission(varchar, varchar) is
  'True si el usuario actual tiene la accion indicada sobre el recurso.';

-- Reemplaza al is_admin() heredado, que miraba users.role = 'admin'.
-- Se mantiene is_admin() para no romper las 55 politicas heredadas, pero
-- ahora responde tambien a quien tenga el rol admin del backoffice.
create or replace function public.is_admin() returns boolean
  language sql stable security definer
  set search_path to 'public'
as $fn$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  ) or exists (
    select 1
    from public.backoffice_user_roles ur
    join public.backoffice_roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.code = 'admin'
  );
$fn$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.backoffice_resources        enable row level security;
alter table public.backoffice_roles            enable row level security;
alter table public.backoffice_role_permissions enable row level security;
alter table public.backoffice_user_roles       enable row level security;
alter table public.backoffice_audit_log        enable row level security;

-- Cualquier operador logueado necesita leer el catalogo para pintar el menu.
create policy "Operadores leen el catalogo de recursos"
  on public.backoffice_resources for select to authenticated using (true);

create policy "Operadores leen los roles"
  on public.backoffice_roles for select to authenticated
  using (public.has_backoffice_permission('backoffice', 'read'));

create policy "Gestion de roles con permiso"
  on public.backoffice_roles for all to authenticated
  using (public.has_backoffice_permission('backoffice', 'update'))
  with check (public.has_backoffice_permission('backoffice', 'update'));

create policy "Lectura de permisos"
  on public.backoffice_role_permissions for select to authenticated
  using (public.has_backoffice_permission('backoffice', 'read'));

create policy "Gestion de permisos"
  on public.backoffice_role_permissions for all to authenticated
  using (public.has_backoffice_permission('backoffice', 'update'))
  with check (public.has_backoffice_permission('backoffice', 'update'));

-- Cada operador ve sus propios roles: la UI los necesita para decidir que
-- secciones mostrar, sin exigirle permiso sobre 'backoffice'.
create policy "Cada operador ve sus propios roles"
  on public.backoffice_user_roles for select to authenticated
  using (user_id = auth.uid());

create policy "Lectura de asignaciones con permiso"
  on public.backoffice_user_roles for select to authenticated
  using (public.has_backoffice_permission('backoffice', 'read'));

create policy "Gestion de asignaciones"
  on public.backoffice_user_roles for all to authenticated
  using (public.has_backoffice_permission('backoffice', 'update'))
  with check (public.has_backoffice_permission('backoffice', 'update'));

create policy "Lectura de auditoria con permiso"
  on public.backoffice_audit_log for select to authenticated
  using (public.has_backoffice_permission('registros', 'read'));

-- Insertar si: el actor es uno mismo. Sin update ni delete para NADIE:
-- un log que se puede editar no sirve como evidencia.
create policy "Registrar la propia actividad"
  on public.backoffice_audit_log for insert to authenticated
  with check (actor_id = auth.uid());

create trigger trigger_update_backoffice_roles_timestamp
  before update on public.backoffice_roles
  for each row execute function public.update_updated_at_column();
