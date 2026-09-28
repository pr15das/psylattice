-- PsyLattice Mixed Methods Lab: integrated findings
-- Stores researcher-authored meta-inferences without duplicating quantitative or qualitative source data.

begin;

create table if not exists public.mixed_method_integrated_findings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  quant_variable text,
  qualitative_theme_id uuid references public.qualitative_themes(id) on delete set null,
  integration_type text not null default 'unclear'
    check (
      integration_type in (
        'convergent',
        'complementary',
        'divergent',
        'expansion',
        'negative_case',
        'unclear'
      )
    ),
  quantitative_finding text not null default '',
  qualitative_finding text not null default '',
  integrated_interpretation text not null default '',
  evidence_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'final')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mixed_method_integrated_findings_study_idx
  on public.mixed_method_integrated_findings
  (owner_user_id, study_id, updated_at desc);

create index if not exists mixed_method_integrated_findings_theme_idx
  on public.mixed_method_integrated_findings
  (study_id, qualitative_theme_id)
  where qualitative_theme_id is not null;

drop trigger if exists mixed_method_integrated_findings_touch_updated_at
  on public.mixed_method_integrated_findings;
create trigger mixed_method_integrated_findings_touch_updated_at
before update on public.mixed_method_integrated_findings
for each row execute function public.psylattice_touch_mixed_methods_updated_at();

create or replace function public.psylattice_validate_mixed_method_finding()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.research_studies s
    where s.id = new.study_id
      and s.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Mixed-methods findings must belong to a study owned by the same researcher.'
      using errcode = '23514';
  end if;

  if new.qualitative_theme_id is not null and not exists (
    select 1
    from public.qualitative_themes t
    where t.id = new.qualitative_theme_id
      and t.study_id = new.study_id
      and t.owner_user_id = new.owner_user_id
  ) then
    raise exception 'The selected qualitative theme must belong to the same study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists mixed_method_integrated_findings_validate
  on public.mixed_method_integrated_findings;
create trigger mixed_method_integrated_findings_validate
before insert or update of owner_user_id, study_id, qualitative_theme_id
on public.mixed_method_integrated_findings
for each row execute function public.psylattice_validate_mixed_method_finding();

alter table public.mixed_method_integrated_findings enable row level security;

drop policy if exists mixed_method_integrated_findings_owner_all
  on public.mixed_method_integrated_findings;
create policy mixed_method_integrated_findings_owner_all
on public.mixed_method_integrated_findings
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

grant select, insert, update, delete
on table public.mixed_method_integrated_findings
to authenticated, service_role;

commit;
