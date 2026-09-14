-- Team Scheduler — initial schema (Phase 2)
--
-- Single-tenant MVP (one business), but every row carries a
-- business_id FK so tightening to multi-tenant later is a policy change, not a
-- schema rewrite.
--
-- Times are stored as minutes-from-midnight (integer), matching the prototype
-- (e.g. 450 = 7:30am). Store hours + per-shift-type templates live in
-- businesses.settings as JSONB (the app treats settings as one object).
--
-- ⚠️ RLS below is permissive ("any authenticated user may read/write everything").
-- That is safe while there is ONE business and ONE manager login. BEFORE onboarding
-- a second business, replace these with per-business membership checks.

create extension if not exists "pgcrypto";

-- Businesses ------------------------------------------------------------------
create table public.businesses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  settings    jsonb not null default '{}'::jsonb,   -- { prepMinutes, days: [...] }
  created_at  timestamptz not null default now()
);

-- Employees -------------------------------------------------------------------
create table public.employees (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  name          text not null,
  phone         text not null default '',
  color         text not null default '#3F4A55',
  min_hours     integer not null default 20,
  max_hours     integer not null default 40,
  flex          integer not null default 2 check (flex between 1 and 3),
  can_open      boolean not null default false,
  can_close     boolean not null default false,
  availability  boolean[] not null default array[true,true,true,true,true,true,true],  -- Mon..Sun
  created_at    timestamptz not null default now()
);
create index employees_business_id_idx on public.employees(business_id);

-- Time-off requests -----------------------------------------------------------
create table public.time_off (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  start_date   date not null,
  end_date     date not null,
  note         text not null default '',
  created_at   timestamptz not null default now()
);
create index time_off_employee_id_idx on public.time_off(employee_id);

-- Shifts ----------------------------------------------------------------------
create table public.shifts (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  employee_id  uuid not null references public.employees(id) on delete cascade,
  date         date not null,
  type         text not null check (type in ('open','swing','close','full','training')),
  start_min    integer not null,
  end_min      integer not null,
  created_at   timestamptz not null default now()
);
create index shifts_business_id_date_idx on public.shifts(business_id, date);
create index shifts_employee_id_idx on public.shifts(employee_id);

-- Row Level Security ----------------------------------------------------------
alter table public.businesses enable row level security;
alter table public.employees  enable row level security;
alter table public.time_off   enable row level security;
alter table public.shifts     enable row level security;

create policy "authenticated full access" on public.businesses
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.employees
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.time_off
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.shifts
  for all to authenticated using (true) with check (true);
