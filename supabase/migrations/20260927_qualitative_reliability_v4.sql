-- PsyLattice qualitative inter-coder reliability + reconciliation
-- Adds explicit coder identities, source assignments, sentence-unit reconciliation,
-- and preserves the original individual coding decisions.

begin;

create table if not exists public.qualitative_coder_identities (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  linked_user_id uuid references auth.users(id) on delete set null,
  label text not null,
  email text,
  identity_type text not null default 'external'
    check (identity_type in ('owner', 'collaborator', 'external')),
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists qualitative_coder_identities_owner_identity_idx
  on public.qualitative_coder_identities (study_id)
  where identity_type = 'owner' and status = 'active';

create unique index if not exists qualitative_coder_identities_linked_user_idx
  on public.qualitative_coder_identities (study_id, linked_user_id)
  where linked_user_id is not null and status = 'active';

create index if not exists qualitative_coder_identities_study_idx
  on public.qualitative_coder_identities
  (owner_user_id, study_id, status, created_at);

alter table public.qualitative_codings
  add column if not exists coder_identity_id uuid
    references public.qualitative_coder_identities(id)
    on delete set null;

create index if not exists qualitative_codings_coder_identity_idx
  on public.qualitative_codings
  (owner_user_id, study_id, coder_identity_id, source_id, created_at);

create table if not exists public.qualitative_coder_assignments (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  source_id uuid not null references public.qualitative_sources(id) on delete cascade,
  coder_identity_id uuid not null
    references public.qualitative_coder_identities(id)
    on delete cascade,
  blind_coding boolean not null default false,
  status text not null default 'assigned'
    check (status in ('assigned', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, coder_identity_id)
);

create index if not exists qualitative_coder_assignments_study_idx
  on public.qualitative_coder_assignments
  (owner_user_id, study_id, source_id, status);

create table if not exists public.qualitative_reconciliations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,
  source_id uuid not null references public.qualitative_sources(id) on delete cascade,
  case_id uuid not null references public.qualitative_cases(id) on delete cascade,
  code_id uuid not null references public.qualitative_codes(id) on delete cascade,
  coder_a_identity_id uuid not null
    references public.qualitative_coder_identities(id)
    on delete cascade,
  coder_b_identity_id uuid not null
    references public.qualitative_coder_identities(id)
    on delete cascade,
  unit_key text not null,
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null check (end_offset > start_offset),
  excerpt text not null,
  coder_a_present boolean not null,
  coder_b_present boolean not null,
  final_present boolean not null,
  resolved_by_user_id uuid not null references auth.users(id) on delete restrict,
  rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    study_id,
    source_id,
    code_id,
    coder_a_identity_id,
    coder_b_identity_id,
    unit_key
  )
);

create index if not exists qualitative_reconciliations_pair_idx
  on public.qualitative_reconciliations
  (
    owner_user_id,
    study_id,
    coder_a_identity_id,
    coder_b_identity_id,
    updated_at desc
  );

drop trigger if exists qualitative_coder_identities_touch_updated_at
  on public.qualitative_coder_identities;
create trigger qualitative_coder_identities_touch_updated_at
before update on public.qualitative_coder_identities
for each row execute function public.psylattice_touch_qualitative_updated_at();

drop trigger if exists qualitative_coder_assignments_touch_updated_at
  on public.qualitative_coder_assignments;
create trigger qualitative_coder_assignments_touch_updated_at
before update on public.qualitative_coder_assignments
for each row execute function public.psylattice_touch_qualitative_updated_at();

drop trigger if exists qualitative_reconciliations_touch_updated_at
  on public.qualitative_reconciliations;
create trigger qualitative_reconciliations_touch_updated_at
before update on public.qualitative_reconciliations
for each row execute function public.psylattice_touch_qualitative_updated_at();

create or replace function public.psylattice_validate_qualitative_coder_identity()
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
    raise exception 'Qualitative coder identities must belong to a study owned by the same researcher.'
      using errcode = '23514';
  end if;

  if new.identity_type = 'owner' and new.linked_user_id is distinct from new.owner_user_id then
    raise exception 'The owner coder identity must link to the study owner.'
      using errcode = '23514';
  end if;

  if new.identity_type = 'collaborator' then
    if new.linked_user_id is null or not exists (
      select 1
      from public.study_collaborators c
      where c.study_id = new.study_id
        and c.user_id = new.linked_user_id
        and c.status = 'active'
    ) then
      raise exception 'Collaborator coder identities must link to an active study collaborator.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_coder_identities_validate_links
  on public.qualitative_coder_identities;
create trigger qualitative_coder_identities_validate_links
before insert or update of owner_user_id, study_id, linked_user_id, identity_type
on public.qualitative_coder_identities
for each row execute function public.psylattice_validate_qualitative_coder_identity();

create or replace function public.psylattice_validate_qualitative_coder_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.qualitative_sources src
    where src.id = new.source_id
      and src.study_id = new.study_id
      and src.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Coder assignment source must belong to the same qualitative study.'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.qualitative_coder_identities ci
    where ci.id = new.coder_identity_id
      and ci.study_id = new.study_id
      and ci.owner_user_id = new.owner_user_id
      and ci.status = 'active'
  ) then
    raise exception 'Coder assignment identity must belong to the same qualitative study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_coder_assignments_validate_links
  on public.qualitative_coder_assignments;
create trigger qualitative_coder_assignments_validate_links
before insert or update of owner_user_id, study_id, source_id, coder_identity_id
on public.qualitative_coder_assignments
for each row execute function public.psylattice_validate_qualitative_coder_assignment();

create or replace function public.psylattice_validate_qualitative_reconciliation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.coder_a_identity_id = new.coder_b_identity_id then
    raise exception 'Reconciliation requires two different coder identities.'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.qualitative_sources src
    join public.qualitative_cases qc on qc.id = src.case_id
    join public.qualitative_codes code on code.id = new.code_id
    where src.id = new.source_id
      and src.study_id = new.study_id
      and src.owner_user_id = new.owner_user_id
      and qc.id = new.case_id
      and qc.study_id = new.study_id
      and qc.owner_user_id = new.owner_user_id
      and code.study_id = new.study_id
      and code.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Reconciliation evidence must belong to the same qualitative study.'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.qualitative_coder_identities a
    join public.qualitative_coder_identities b
      on b.study_id = a.study_id
     and b.owner_user_id = a.owner_user_id
    where a.id = new.coder_a_identity_id
      and b.id = new.coder_b_identity_id
      and a.study_id = new.study_id
      and a.owner_user_id = new.owner_user_id
  ) then
    raise exception 'Reconciliation coders must belong to the same qualitative study.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists qualitative_reconciliations_validate_links
  on public.qualitative_reconciliations;
create trigger qualitative_reconciliations_validate_links
before insert or update of
  owner_user_id,
  study_id,
  source_id,
  case_id,
  code_id,
  coder_a_identity_id,
  coder_b_identity_id
on public.qualitative_reconciliations
for each row execute function public.psylattice_validate_qualitative_reconciliation();

-- Backfill one owner coding identity for studies that already have qualitative data.
insert into public.qualitative_coder_identities (
  owner_user_id,
  study_id,
  linked_user_id,
  label,
  email,
  identity_type,
  status
)
select distinct
  q.owner_user_id,
  q.study_id,
  q.owner_user_id,
  coalesce(nullif(trim(p.full_name), ''), 'Study owner'),
  null,
  'owner',
  'active'
from (
  select owner_user_id, study_id from public.qualitative_cases
  union
  select owner_user_id, study_id from public.qualitative_codings
) q
left join public.profiles p on p.id = q.owner_user_id
where not exists (
  select 1
  from public.qualitative_coder_identities ci
  where ci.study_id = q.study_id
    and ci.identity_type = 'owner'
    and ci.status = 'active'
);

update public.qualitative_codings coding
set coder_identity_id = identity.id
from public.qualitative_coder_identities identity
where coding.coder_identity_id is null
  and identity.study_id = coding.study_id
  and identity.owner_user_id = coding.owner_user_id
  and identity.identity_type = 'owner'
  and identity.status = 'active';

alter table public.qualitative_coder_identities enable row level security;
alter table public.qualitative_coder_assignments enable row level security;
alter table public.qualitative_reconciliations enable row level security;

drop policy if exists qualitative_coder_identities_owner_all
  on public.qualitative_coder_identities;
create policy qualitative_coder_identities_owner_all
on public.qualitative_coder_identities
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_coder_assignments_owner_all
  on public.qualitative_coder_assignments;
create policy qualitative_coder_assignments_owner_all
on public.qualitative_coder_assignments
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists qualitative_reconciliations_owner_all
  on public.qualitative_reconciliations;
create policy qualitative_reconciliations_owner_all
on public.qualitative_reconciliations
for all to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

grant select, insert, update, delete
on table
  public.qualitative_coder_identities,
  public.qualitative_coder_assignments,
  public.qualitative_reconciliations
to authenticated, service_role;

commit;
