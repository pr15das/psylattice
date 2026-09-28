-- PsyLattice qualitative research foundation
-- Participant-linked qualitative cases remain separate from study participants
-- so the same system can also support standalone qualitative cases.

begin;

create table if not exists public.qualitative_cases (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  participant_id uuid references public.study_participants(id) on delete set null,
  case_key text not null,
  name text not null,
  classification text not null default 'Case',
  attributes jsonb not null default '{}'::jsonb,
  notes text,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, study_id, case_key)
);

create unique index if not exists qualitative_cases_one_participant_case_idx
  on public.qualitative_cases (study_id, participant_id)
  where participant_id is not null;

create index if not exists qualitative_cases_owner_study_idx
  on public.qualitative_cases (owner_user_id, study_id, updated_at desc);

create table if not exists public.qualitative_sources (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  case_id uuid not null references public.qualitative_cases(id) on delete cascade,
  source_type text not null default 'transcript'
    check (
      source_type in (
        'interview',
        'transcript',
        'focus_group',
        'diary',
        'field_note',
        'document',
        'audio',
        'video',
        'other'
      )
    ),
  title text not null,
  content_text text not null default '',
  original_filename text,
  mime_type text,
  storage_path text,
  language text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qualitative_sources_owner_study_case_idx
  on public.qualitative_sources (owner_user_id, study_id, case_id, updated_at desc);

create table if not exists public.qualitative_codes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  parent_code_id uuid references public.qualitative_codes(id) on delete set null,
  name text not null,
  description text,
  color text not null default '#06b6d4',
  position integer not null default 0 check (position >= 0),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists qualitative_codes_unique_name_idx
  on public.qualitative_codes (owner_user_id, study_id, lower(name))
  where status = 'active';

create index if not exists qualitative_codes_study_position_idx
  on public.qualitative_codes (owner_user_id, study_id, position, created_at);

create table if not exists public.qualitative_codings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  case_id uuid not null references public.qualitative_cases(id) on delete cascade,
  source_id uuid not null references public.qualitative_sources(id) on delete cascade,
  code_id uuid not null references public.qualitative_codes(id) on delete cascade,
  coder_user_id uuid not null references auth.users(id) on delete restrict,
  method text not null default 'manual'
    check (method in ('manual', 'ai_suggestion_accepted')),
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null check (end_offset > start_offset),
  excerpt text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists qualitative_codings_study_source_idx
  on public.qualitative_codings
  (owner_user_id, study_id, source_id, start_offset, end_offset);

create index if not exists qualitative_codings_code_idx
  on public.qualitative_codings
  (owner_user_id, study_id, code_id, created_at desc);

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

drop trigger if exists qualitative_cases_touch_updated_at
  on public.qualitative_cases;
create trigger qualitative_cases_touch_updated_at
before update on public.qualitative_cases
for each row execute function public.psylattice_touch_qualitative_updated_at();

drop trigger if exists qualitative_sources_touch_updated_at
  on public.qualitative_sources;
create trigger qualitative_sources_touch_updated_at
before update on public.qualitative_sources
for each row execute function public.psylattice_touch_qualitative_updated_at();

drop trigger if exists qualitative_codes_touch_updated_at
  on public.qualitative_codes;
create trigger qualitative_codes_touch_updated_at
before update on public.qualitative_codes
for each row execute function public.psylattice_touch_qualitative_updated_at();

create or replace function public.psylattice_validate_qualitative_case()
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
    raise exception 'Qualitative cases must belong to a study owned by the same researcher.'
      using errcode = '23514';
  end if;

  if new.participant_id is not null and not exists (
    select 1
    from public.study_participants p
    where p.id = new.participant_id
      and p.study_id = new.study_id
      and p.owner_user_id = new.owner_user_id
  ) then
    raise exception 'The linked participant does not belong to this study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_cases_validate_links
  on public.qualitative_cases;
create trigger qualitative_cases_validate_links
before insert or update of owner_user_id, study_id, participant_id
on public.qualitative_cases
for each row execute function public.psylattice_validate_qualitative_case();

create or replace function public.psylattice_validate_qualitative_source()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.qualitative_cases c
    where c.id = new.case_id
      and c.study_id = new.study_id
      and c.owner_user_id = new.owner_user_id
  ) then
    raise exception 'The qualitative source and case must belong to the same study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_sources_validate_links
  on public.qualitative_sources;
create trigger qualitative_sources_validate_links
before insert or update of owner_user_id, study_id, case_id
on public.qualitative_sources
for each row execute function public.psylattice_validate_qualitative_source();

create or replace function public.psylattice_validate_qualitative_code()
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
    raise exception 'Qualitative codes must belong to a study owned by the same researcher.'
      using errcode = '23514';
  end if;

  if new.parent_code_id is not null and not exists (
    select 1
    from public.qualitative_codes parent
    where parent.id = new.parent_code_id
      and parent.study_id = new.study_id
      and parent.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Parent and child codes must belong to the same qualitative study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_codes_validate_links
  on public.qualitative_codes;
create trigger qualitative_codes_validate_links
before insert or update of owner_user_id, study_id, parent_code_id
on public.qualitative_codes
for each row execute function public.psylattice_validate_qualitative_code();

create or replace function public.psylattice_validate_qualitative_coding()
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
    join public.qualitative_codes code on code.id = new.code_id
    where src.id = new.source_id
      and src.study_id = new.study_id
      and src.owner_user_id = new.owner_user_id
      and c.id = new.case_id
      and c.study_id = new.study_id
      and c.owner_user_id = new.owner_user_id
      and code.study_id = new.study_id
      and code.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Qualitative coding references must belong to the same study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_codings_validate_links
  on public.qualitative_codings;
create trigger qualitative_codings_validate_links
before insert or update of owner_user_id, study_id, case_id, source_id, code_id
on public.qualitative_codings
for each row execute function public.psylattice_validate_qualitative_coding();

alter table public.qualitative_cases enable row level security;
alter table public.qualitative_sources enable row level security;
alter table public.qualitative_codes enable row level security;
alter table public.qualitative_codings enable row level security;

drop policy if exists qualitative_cases_owner_all on public.qualitative_cases;
create policy qualitative_cases_owner_all
on public.qualitative_cases
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_sources_owner_all on public.qualitative_sources;
create policy qualitative_sources_owner_all
on public.qualitative_sources
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_codes_owner_all on public.qualitative_codes;
create policy qualitative_codes_owner_all
on public.qualitative_codes
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_codings_owner_all on public.qualitative_codings;
create policy qualitative_codings_owner_all
on public.qualitative_codings
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

grant select, insert, update, delete
on table
  public.qualitative_cases,
  public.qualitative_sources,
  public.qualitative_codes,
  public.qualitative_codings
to authenticated, service_role;

commit;
