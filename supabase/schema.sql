-- ============================================================================
-- ESQUEMA SUPABASE PARA APP DE ESTUDIOS SOCIOECONÓMICOS (GESTIÓN RH)
-- Ejecuta este script en el SQL Editor de tu proyecto en https://supabase.com
-- ============================================================================

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

-- Habilitar Row Level Security (RLS) con política de acceso para la app
alter table public.estudios_socioeconomicos enable row level security;

create policy "Permitir acceso completo a estudios_socioeconomicos"
  on public.estudios_socioeconomicos
  for all
  using (true)
  with check (true);

-- ============================================================================
-- ACTIVAR TRANSMISIÓN EN TIEMPO REAL (REALTIME WEBSOCKETS)
-- Permite que 5 computadoras y 5 celulares vean altas, bajas y cambios en vivo
-- ============================================================================
alter table public.estudios_socioeconomicos replica identity full;
alter publication supabase_realtime add table public.estudios_socioeconomicos;

-- ============================================================================
-- TABLA DE EVALUADORES / CAPTURISTAS (PERSISTENCIA CENTRALIZADA)
-- Guarda las personas que capturan estudios para que se compartan entre dispositivos
-- ============================================================================
create table if not exists public.evaluadores (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  created_at timestamptz not null default now()
);

alter table public.evaluadores enable row level security;

create policy "Permitir acceso completo a evaluadores"
  on public.evaluadores for all
  using (true)
  with check (true);

alter table public.evaluadores replica identity full;
alter publication supabase_realtime add table public.evaluadores;
