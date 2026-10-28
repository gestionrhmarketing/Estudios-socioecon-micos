-- ============================================================================
-- ESQUEMA SUPABASE PARA APP DE ESTUDIOS SOCIOECONÓMICOS (GESTIÓN RH) v1.1.3
-- Ejecuta este script en el SQL Editor de tu proyecto en https://supabase.com
-- ============================================================================

-- 1. TABLA PRINCIPAL DE ESTUDIOS SOCIOECONÓMICOS
create table if not exists public.estudios_socioeconomicos (
  id uuid primary key default gen_random_uuid(),
  folio text not null,
  candidato_nombre text not null default '',
  puesto text not null default '',
  dictamen text not null default 'ACEPTABLE',
  fecha_realizacion text not null default '',
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para búsqueda rápida por folio, candidato y estatus
create index if not exists idx_estudios_folio on public.estudios_socioeconomicos (folio);
create index if not exists idx_estudios_candidato on public.estudios_socioeconomicos (candidato_nombre);
create index if not exists idx_estudios_dictamen on public.estudios_socioeconomicos (dictamen);
create index if not exists idx_estudios_updated_at on public.estudios_socioeconomicos (updated_at desc);

-- Habilitar Row Level Security (RLS)
alter table public.estudios_socioeconomicos enable row level security;

drop policy if exists "Permitir acceso completo a estudios_socioeconomicos" on public.estudios_socioeconomicos;
create policy "Permitir acceso completo a estudios_socioeconomicos"
  on public.estudios_socioeconomicos
  for all
  using (true)
  with check (true);

alter table public.estudios_socioeconomicos replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'estudios_socioeconomicos'
  ) then
    alter publication supabase_realtime add table public.estudios_socioeconomicos;
  end if;
end $$;

-- 2. TABLA DE EVALUADORES / CAPTURISTAS
create table if not exists public.evaluadores (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  created_at timestamptz not null default now()
);

alter table public.evaluadores enable row level security;

drop policy if exists "Permitir acceso completo a evaluadores" on public.evaluadores;
create policy "Permitir acceso completo a evaluadores"
  on public.evaluadores for all
  using (true)
  with check (true);

alter table public.evaluadores replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'evaluadores'
  ) then
    alter publication supabase_realtime add table public.evaluadores;
  end if;
end $$;

-- 3. TABLA DE USUARIOS DEL SISTEMA Y AUTENTICACIÓN INTERNA
create table if not exists public.usuarios_sistema (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text unique not null,
  password text not null,
  rol text not null default 'evaluador', -- 'admin' | 'evaluador'
  estado text not null default 'pendiente', -- 'activo' | 'pendiente' | 'rechazado'
  banco text not null default '',
  numero_tarjeta text not null default '',
  clabe text not null default '',
  zonas jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Asegurar columnas de datos bancarios y zonas si la tabla ya existía previamente
alter table public.usuarios_sistema add column if not exists banco text not null default '';
alter table public.usuarios_sistema add column if not exists numero_tarjeta text not null default '';
alter table public.usuarios_sistema add column if not exists clabe text not null default '';
alter table public.usuarios_sistema add column if not exists zonas jsonb not null default '[]'::jsonb;

-- Cuenta administradora principal por defecto (Gaby Rodriguez)
insert into public.usuarios_sistema (nombre, email, password, rol, estado)
values ('Gaby Rodriguez', 'seleccion@gestionrh.com.mx', '6327', 'admin', 'activo')
on conflict (email) do update 
set rol = 'admin', estado = 'activo', password = '6327';

alter table public.usuarios_sistema enable row level security;

drop policy if exists "Permitir acceso completo a usuarios_sistema" on public.usuarios_sistema;
create policy "Permitir acceso completo a usuarios_sistema"
  on public.usuarios_sistema for all
  using (true)
  with check (true);

alter table public.usuarios_sistema replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'usuarios_sistema'
  ) then
    alter publication supabase_realtime add table public.usuarios_sistema;
  end if;
end $$;
