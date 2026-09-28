-- PsyLattice qualitative workspace v2
-- Adds typed case metadata, memos and source annotations.

begin;

create table if not exists public.qualitative_case_classifications (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  name text not null,
  description text,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists qualitative_case_classifications_unique_name_idx
  on public.qualitative_case_classifications (owner_user_id, study_id, lower(name));

create index if not exists qualitative_case_classifications_study_idx
  on public.qualitative_case_classifications (owner_user_id, study_id, position, created_at);

create table if not exists public.qualitative_attribute_definitions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  classification_id uuid not null references public.qualitative_case_classifications(id) on delete cascade,
  field_key text not null,
  name text not null,
  data_type text not null default 'text'
    check (data_type in ('text', 'number', 'boolean', 'date', 'select')),
  options jsonb not null default '[]'::jsonb,
  required boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists qualitative_attribute_definitions_unique_key_idx
  on public.qualitative_attribute_definitions (classification_id, field_key);

create index if not exists qualitative_attribute_definitions_study_idx
  on public.qualitative_attribute_definitions
  (owner_user_id, study_id, classification_id, position, created_at);

create table if not exists public.qualitative_memos (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  case_id uuid references public.qualitative_cases(id) on delete cascade,
  source_id uuid references public.qualitative_sources(id) on delete cascade,
  code_id uuid references public.qualitative_codes(id) on delete set null,
  memo_type text not null default 'analytic'
    check (memo_type in ('analytic', 'methodological', 'reflexive', 'case', 'source', 'code', 'other')),
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qualitative_memos_study_idx
  on public.qualitative_memos (owner_user_id, study_id, updated_at desc);

create index if not exists qualitative_memos_case_source_idx
  on public.qualitative_memos (case_id, source_id, updated_at desc);

create table if not exists public.qualitative_annotations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  case_id uuid not null references public.qualitative_cases(id) on delete cascade,
  source_id uuid not null references public.qualitative_sources(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null check (end_offset > start_offset),
  excerpt text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qualitative_annotations_source_idx
  on public.qualitative_annotations
  (owner_user_id, study_id, source_id, start_offset, end_offset, created_at);

create or replace function public.psylattice_touch_qualitative_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists qualitative_case_classifications_touch_updated_at
  on public.qualitative_case_classifications;
create trigger qualitative_case_classifications_touch_updated_at
before update on public.qualitative_case_classifications
for each row execute function public.psylattice_touch_qualitative_updated_at();

drop trigger if exists qualitative_attribute_definitions_touch_updated_at
  on public.qualitative_attribute_definitions;
create trigger qualitative_attribute_definitions_touch_updated_at
before update on public.qualitative_attribute_definitions
for each row execute function public.psylattice_touch_qualitative_updated_at();

drop trigger if exists qualitative_memos_touch_updated_at
  on public.qualitative_memos;
create trigger qualitative_memos_touch_updated_at
before update on public.qualitative_memos
for each row execute function public.psylattice_touch_qualitative_updated_at();

drop trigger if exists qualitative_annotations_touch_updated_at
  on public.qualitative_annotations;
create trigger qualitative_annotations_touch_updated_at
before update on public.qualitative_annotations
for each row execute function public.psylattice_touch_qualitative_updated_at();

create or replace function public.psylattice_validate_qualitative_classification()
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
    raise exception 'Qualitative classification must belong to the same researcher and study.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists qualitative_case_classifications_validate_links
  on public.qualitative_case_classifications;
create trigger qualitative_case_classifications_validate_links
before insert or update of owner_user_id, study_id
on public.qualitative_case_classifications
for each row execute function public.psylattice_validate_qualitative_classification();

create or replace function public.psylattice_validate_qualitative_attribute_definition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.qualitative_case_classifications c
    where c.id = new.classification_id
      and c.study_id = new.study_id
      and c.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Qualitative attribute definition must belong to the selected classification.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists qualitative_attribute_definitions_validate_links
  on public.qualitative_attribute_definitions;
create trigger qualitative_attribute_definitions_validate_links
before insert or update of owner_user_id, study_id, classification_id
on public.qualitative_attribute_definitions
for each row execute function public.psylattice_validate_qualitative_attribute_definition();

create or replace function public.psylattice_validate_qualitative_memo()
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
    raise exception 'Qualitative memo must belong to the same researcher and study.'
      using errcode = '23514';
  end if;

  if new.case_id is not null and not exists (
    select 1
    from public.qualitative_cases c
    where c.id = new.case_id
      and c.study_id = new.study_id
      and c.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Memo case must belong to the same qualitative study.'
      using errcode = '23514';
  end if;

  if new.source_id is not null and not exists (
    select 1
    from public.qualitative_sources s
    where s.id = new.source_id
      and s.study_id = new.study_id
      and s.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Memo source must belong to the same qualitative study.'
      using errcode = '23514';
  end if;

  if new.code_id is not null and not exists (
    select 1
    from public.qualitative_codes c
    where c.id = new.code_id
      and c.study_id = new.study_id
      and c.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Memo code must belong to the same qualitative study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_memos_validate_links
  on public.qualitative_memos;
create trigger qualitative_memos_validate_links
before insert or update of owner_user_id, study_id, case_id, source_id, code_id
on public.qualitative_memos
for each row execute function public.psylattice_validate_qualitative_memo();

create or replace function public.psylattice_validate_qualitative_annotation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.qualitative_sources s
    join public.qualitative_cases c on c.id = s.case_id
    where s.id = new.source_id
      and s.study_id = new.study_id
      and s.owner_user_id = new.owner_user_id
      and c.id = new.case_id
      and c.study_id = new.study_id
      and c.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Annotation source and case must belong to the same qualitative study.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists qualitative_annotations_validate_links
  on public.qualitative_annotations;
create trigger qualitative_annotations_validate_links
before insert or update of owner_user_id, study_id, case_id, source_id
on public.qualitative_annotations
for each row execute function public.psylattice_validate_qualitative_annotation();

alter table public.qualitative_case_classifications enable row level security;
alter table public.qualitative_attribute_definitions enable row level security;
alter table public.qualitative_memos enable row level security;
alter table public.qualitative_annotations enable row level security;

drop policy if exists qualitative_case_classifications_owner_all
  on public.qualitative_case_classifications;
create policy qualitative_case_classifications_owner_all
on public.qualitative_case_classifications
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_attribute_definitions_owner_all
  on public.qualitative_attribute_definitions;
create policy qualitative_attribute_definitions_owner_all
on public.qualitative_attribute_definitions
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_memos_owner_all
  on public.qualitative_memos;
create policy qualitative_memos_owner_all
on public.qualitative_memos
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_annotations_owner_all
  on public.qualitative_annotations;
create policy qualitative_annotations_owner_all
on public.qualitative_annotations
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

grant select, insert, update, delete
on table
  public.qualitative_case_classifications,
  public.qualitative_attribute_definitions,
  public.qualitative_memos,
  public.qualitative_annotations
to authenticated, service_role;

commit;
