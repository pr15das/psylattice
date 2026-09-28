-- PsyLattice Qualitative Synthesis V5
-- Theme Builder, framework matrices, and codebook audit support.

begin;

create table if not exists public.qualitative_themes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  parent_theme_id uuid references public.qualitative_themes(id) on delete set null,
  name text not null,
  description text,
  color text not null default '#8b5cf6',
  position integer not null default 0 check (position >= 0),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists qualitative_themes_unique_name_idx
  on public.qualitative_themes (owner_user_id, study_id, lower(name))
  where status = 'active';

create index if not exists qualitative_themes_study_idx
  on public.qualitative_themes
  (owner_user_id, study_id, position, created_at);

create table if not exists public.qualitative_theme_codes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  theme_id uuid not null references public.qualitative_themes(id) on delete cascade,
  code_id uuid not null references public.qualitative_codes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (theme_id, code_id)
);

create index if not exists qualitative_theme_codes_study_idx
  on public.qualitative_theme_codes
  (owner_user_id, study_id, theme_id, code_id);

create table if not exists public.qualitative_framework_summaries (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  case_id uuid not null references public.qualitative_cases(id) on delete cascade,
  theme_id uuid references public.qualitative_themes(id) on delete cascade,
  code_id uuid references public.qualitative_codes(id) on delete cascade,
  summary text not null default '',
  evidence_coding_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qualitative_framework_one_column_check
    check (
      (theme_id is not null and code_id is null)
      or
      (theme_id is null and code_id is not null)
    )
);

create unique index if not exists qualitative_framework_case_theme_idx
  on public.qualitative_framework_summaries (study_id, case_id, theme_id)
  where theme_id is not null;

create unique index if not exists qualitative_framework_case_code_idx
  on public.qualitative_framework_summaries (study_id, case_id, code_id)
  where code_id is not null;

create index if not exists qualitative_framework_study_idx
  on public.qualitative_framework_summaries
  (owner_user_id, study_id, case_id, updated_at desc);

create table if not exists public.qualitative_code_merge_history (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  source_code_id uuid not null references public.qualitative_codes(id) on delete restrict,
  target_code_id uuid not null references public.qualitative_codes(id) on delete restrict,
  source_name text not null,
  target_name text not null,
  moved_coding_count integer not null default 0 check (moved_coding_count >= 0),
  merged_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists qualitative_code_merge_history_study_idx
  on public.qualitative_code_merge_history
  (owner_user_id, study_id, created_at desc);

drop trigger if exists qualitative_themes_touch_updated_at
  on public.qualitative_themes;
create trigger qualitative_themes_touch_updated_at
before update on public.qualitative_themes
for each row execute function public.psylattice_touch_qualitative_updated_at();

drop trigger if exists qualitative_framework_summaries_touch_updated_at
  on public.qualitative_framework_summaries;
create trigger qualitative_framework_summaries_touch_updated_at
before update on public.qualitative_framework_summaries
for each row execute function public.psylattice_touch_qualitative_updated_at();

create or replace function public.psylattice_validate_qualitative_theme()
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
    raise exception 'Qualitative themes must belong to a study owned by the same researcher.'
      using errcode = '23514';
  end if;

  if new.parent_theme_id is not null and not exists (
    select 1
    from public.qualitative_themes parent
    where parent.id = new.parent_theme_id
      and parent.study_id = new.study_id
      and parent.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Parent and child themes must belong to the same qualitative study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_themes_validate_links
  on public.qualitative_themes;
create trigger qualitative_themes_validate_links
before insert or update of owner_user_id, study_id, parent_theme_id
on public.qualitative_themes
for each row execute function public.psylattice_validate_qualitative_theme();

create or replace function public.psylattice_validate_qualitative_theme_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.qualitative_themes t
    join public.qualitative_codes c
      on c.study_id = t.study_id
     and c.owner_user_id = t.owner_user_id
    where t.id = new.theme_id
      and c.id = new.code_id
      and t.study_id = new.study_id
      and t.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Theme mappings must connect a theme and code from the same qualitative study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_theme_codes_validate_links
  on public.qualitative_theme_codes;
create trigger qualitative_theme_codes_validate_links
before insert or update of owner_user_id, study_id, theme_id, code_id
on public.qualitative_theme_codes
for each row execute function public.psylattice_validate_qualitative_theme_code();

create or replace function public.psylattice_validate_qualitative_framework_summary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.qualitative_cases qc
    where qc.id = new.case_id
      and qc.study_id = new.study_id
      and qc.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Framework matrix cases must belong to the same qualitative study.'
      using errcode = '23514';
  end if;

  if new.theme_id is not null and not exists (
    select 1
    from public.qualitative_themes t
    where t.id = new.theme_id
      and t.study_id = new.study_id
      and t.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Framework matrix theme must belong to the same qualitative study.'
      using errcode = '23514';
  end if;

  if new.code_id is not null and not exists (
    select 1
    from public.qualitative_codes c
    where c.id = new.code_id
      and c.study_id = new.study_id
      and c.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Framework matrix code must belong to the same qualitative study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_framework_summaries_validate_links
  on public.qualitative_framework_summaries;
create trigger qualitative_framework_summaries_validate_links
before insert or update of
  owner_user_id,
  study_id,
  case_id,
  theme_id,
  code_id
on public.qualitative_framework_summaries
for each row execute function public.psylattice_validate_qualitative_framework_summary();

alter table public.qualitative_themes enable row level security;
alter table public.qualitative_theme_codes enable row level security;
alter table public.qualitative_framework_summaries enable row level security;
alter table public.qualitative_code_merge_history enable row level security;

drop policy if exists qualitative_themes_owner_all
  on public.qualitative_themes;
create policy qualitative_themes_owner_all
on public.qualitative_themes
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_theme_codes_owner_all
  on public.qualitative_theme_codes;
create policy qualitative_theme_codes_owner_all
on public.qualitative_theme_codes
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_framework_summaries_owner_all
  on public.qualitative_framework_summaries;
create policy qualitative_framework_summaries_owner_all
on public.qualitative_framework_summaries
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_code_merge_history_owner_select
  on public.qualitative_code_merge_history;
create policy qualitative_code_merge_history_owner_select
on public.qualitative_code_merge_history
for select to authenticated
using (owner_user_id = auth.uid());

grant select, insert, update, delete
on table
  public.qualitative_themes,
  public.qualitative_theme_codes,
  public.qualitative_framework_summaries
to authenticated, service_role;

grant select, insert
on table public.qualitative_code_merge_history
to authenticated, service_role;

commit;
