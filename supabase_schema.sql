-- Schema para la tabla "deals" en Supabase (Postgres)
-- Generado a partir de la interfaz `Deal` en types.ts
-- NO EJECUTAR AUTOMÁTICAMENTE: revisar y correr manualmente en el SQL Editor de Supabase.

create table if not exists public.deals (
  id text primary key,
  title text not null,
  value numeric not null default 0,
  currency text not null check (currency in ('COP', 'USD', 'MXN')),

  contact_id text,
  contact_name text not null default '',
  contact_title text,

  organization text not null default '',
  phone text,
  email text,
  address text,

  status text not null check (status in (
    'Lead In',
    'Contactado',
    'Reunión Agendada',
    'Propuesta Enviada',
    'Negociación',
    'Cerrado',
    'Ganado',
    'Perdido',
    'Descartado'
  )),

  priority text not null check (priority in ('low', 'medium', 'high')),

  -- Activity[] tal cual se guarda en el estado de React
  activities jsonb not null default '[]'::jsonb,

  next_steps text,
  created_at timestamptz not null default now(),

  country text not null check (country in ('Colombia', 'México', 'Otros')),
  seller_id text not null,

  -- LeadQualification | undefined
  qualification jsonb
);

-- RLS: la tabla no la tenía habilitada (por defecto en `create table` queda
-- deshabilitada). Este es un CRM interno sin Supabase Auth -- el login es
-- propio con password hardcodeado -- así que se habilita RLS y se agregan
-- políticas explícitas de acceso completo para el rol "anon" (el que usa
-- el cliente con la anon key), en vez de dejar la tabla sin RLS.

alter table public.deals enable row level security;

create policy "anon_select_deals"
  on public.deals
  for select
  to anon
  using (true);

create policy "anon_insert_deals"
  on public.deals
  for insert
  to anon
  with check (true);

create policy "anon_update_deals"
  on public.deals
  for update
  to anon
  using (true)
  with check (true);

create policy "anon_delete_deals"
  on public.deals
  for delete
  to anon
  using (true);
