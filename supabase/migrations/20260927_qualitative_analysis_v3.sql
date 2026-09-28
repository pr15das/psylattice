-- PsyLattice qualitative analysis + AI coding visualization foundation
-- Adds saved qualitative analysis setups and a separate pending-suggestion layer.
-- Pending AI suggestions never become human coding automatically.

begin;

create table if not exists public.qualitative_saved_queries (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  name text not null,
  query_type text not null
    check (query_type in ('word_frequency', 'coding_query', 'matrix', 'cooccurrence')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists qualitative_saved_queries_unique_name_idx
  on public.qualitative_saved_queries (owner_user_id, study_id, lower(name));

create index if not exists qualitative_saved_queries_study_idx
  on public.qualitative_saved_queries (owner_user_id, study_id, updated_at desc);

create table if not exists public.qualitative_coding_suggestions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  case_id uuid not null references public.qualitative_cases(id) on delete cascade,
  source_id uuid not null references public.qualitative_sources(id) on delete cascade,
  suggested_code_id uuid references public.qualitative_codes(id) on delete set null,
  suggested_code_name text not null,
  suggested_color text not null default '#8b5cf6',
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null check (end_offset > start_offset),
  excerpt text not null,
  rationale text,
  confidence double precision
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  model text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  accepted_coding_id uuid references public.qualitative_codings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qualitative_coding_suggestions_source_idx
  on public.qualitative_coding_suggestions
  (owner_user_id, study_id, source_id, status, start_offset, end_offset);

create index if not exists qualitative_coding_suggestions_status_idx
  on public.qualitative_coding_suggestions
  (owner_user_id, study_id, status, updated_at desc);

drop trigger if exists qualitative_saved_queries_touch_updated_at
  on public.qualitative_saved_queries;
create trigger qualitative_saved_queries_touch_updated_at
before update on public.qualitative_saved_queries
for each row execute function public.psylattice_touch_qualitative_updated_at();

drop trigger if exists qualitative_coding_suggestions_touch_updated_at
  on public.qualitative_coding_suggestions;
create trigger qualitative_coding_suggestions_touch_updated_at
before update on public.qualitative_coding_suggestions
for each row execute function public.psylattice_touch_qualitative_updated_at();

create or replace function public.psylattice_validate_qualitative_saved_query()
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
    raise exception 'Saved qualitative analyses must belong to the same researcher and study.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists qualitative_saved_queries_validate_links
  on public.qualitative_saved_queries;
create trigger qualitative_saved_queries_validate_links
before insert or update of owner_user_id, study_id
on public.qualitative_saved_queries
for each row execute function public.psylattice_validate_qualitative_saved_query();

create or replace function public.psylattice_validate_qualitative_coding_suggestion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.qualitative_sources src
    join public.qualitative_cases c on c.id = src.case_id
    where src.id = new.source_id
      and src.study_id = new.study_id
      and src.owner_user_id = new.owner_user_id
      and c.id = new.case_id
      and c.study_id = new.study_id
      and c.owner_user_id = new.owner_user_id
  ) then
    raise exception 'AI coding suggestions must reference a source and case from the same qualitative study.'
      using errcode = '23514';
  end if;

  if new.suggested_code_id is not null and not exists (
    select 1
    from public.qualitative_codes code
    where code.id = new.suggested_code_id
      and code.study_id = new.study_id
      and code.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Suggested qualitative code must belong to the same study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_coding_suggestions_validate_links
  on public.qualitative_coding_suggestions;
create trigger qualitative_coding_suggestions_validate_links
before insert or update of
  owner_user_id,
  study_id,
  case_id,
  source_id,
  suggested_code_id
on public.qualitative_coding_suggestions
for each row execute function public.psylattice_validate_qualitative_coding_suggestion();

alter table public.qualitative_saved_queries enable row level security;
alter table public.qualitative_coding_suggestions enable row level security;

drop policy if exists qualitative_saved_queries_owner_all
  on public.qualitative_saved_queries;
create policy qualitative_saved_queries_owner_all
on public.qualitative_saved_queries
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_coding_suggestions_owner_all
  on public.qualitative_coding_suggestions;
create policy qualitative_coding_suggestions_owner_all
on public.qualitative_coding_suggestions
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

grant select, insert, update, delete
on table
  public.qualitative_saved_queries,
  public.qualitative_coding_suggestions
to authenticated, service_role;

commit;
