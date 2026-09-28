-- PsyLattice Mixed Methods Lab foundation
-- Saved joint-display configurations and integration workspace state.

begin;

create table if not exists public.mixed_method_joint_displays (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  description text,
  row_mode text not null default 'participant'
    check (row_mode in ('participant')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mixed_method_joint_displays_name_idx
  on public.mixed_method_joint_displays
  (owner_user_id, study_id, lower(name));

create index if not exists mixed_method_joint_displays_study_idx
  on public.mixed_method_joint_displays
  (owner_user_id, study_id, updated_at desc);

create or replace function public.psylattice_touch_mixed_methods_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mixed_method_joint_displays_touch_updated_at
  on public.mixed_method_joint_displays;
create trigger mixed_method_joint_displays_touch_updated_at
before update on public.mixed_method_joint_displays
for each row execute function public.psylattice_touch_mixed_methods_updated_at();

alter table public.mixed_method_joint_displays enable row level security;

drop policy if exists mixed_method_joint_displays_owner_all
  on public.mixed_method_joint_displays;
create policy mixed_method_joint_displays_owner_all
on public.mixed_method_joint_displays
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

grant select, insert, update, delete
on table public.mixed_method_joint_displays
to authenticated, service_role;

commit;
