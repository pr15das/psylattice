-- PsyLattice Phase 2.3
-- Persistent, study-linked Analysis Lab records.
--
-- This table stores reproducible analysis snapshots (configuration,
-- provenance and formatted result tables). It does NOT store raw participant
-- rows. The full saved Analysis Lab record is retained as JSONB so future
-- Study Health / reporting audits can inspect exactly what PsyLattice saved.

begin;

create table if not exists public.research_analysis_records (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,

  client_record_id text not null,
  schema_version integer not null default 1,

  analysis_type text not null,
  analysis_label text not null,
  title text not null,

  dataset_key text,
  dataset_label text,
  data_fingerprint text,

  source_rows integer,
  working_rows integer,
  after_filters_rows integer,
  explicitly_excluded_rows integer,
  complete_across_setup_rows integer,
  incomplete_across_setup_rows integer,

  record_json jsonb not null,

  analysis_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint research_analysis_records_client_record_id_check
    check (char_length(client_record_id) between 1 and 180),

  constraint research_analysis_records_schema_version_check
    check (schema_version >= 1),

  constraint research_analysis_records_nonnegative_counts_check
    check (
      (source_rows is null or source_rows >= 0)
      and (working_rows is null or working_rows >= 0)
      and (after_filters_rows is null or after_filters_rows >= 0)
      and (explicitly_excluded_rows is null or explicitly_excluded_rows >= 0)
      and (complete_across_setup_rows is null or complete_across_setup_rows >= 0)
      and (incomplete_across_setup_rows is null or incomplete_across_setup_rows >= 0)
    )
);

create unique index if not exists research_analysis_records_owner_client_uidx
  on public.research_analysis_records (owner_user_id, client_record_id);

create index if not exists research_analysis_records_study_created_idx
  on public.research_analysis_records
  (owner_user_id, study_id, analysis_created_at desc);

create index if not exists research_analysis_records_study_type_idx
  on public.research_analysis_records
  (study_id, analysis_type, analysis_created_at desc);

create or replace function public.psylattice_validate_analysis_record_study_owner()
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
    raise exception
      'Analysis records may only be linked to a study owned by the same researcher.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists research_analysis_records_validate_study_owner
  on public.research_analysis_records;

create trigger research_analysis_records_validate_study_owner
before insert or update of study_id, owner_user_id
on public.research_analysis_records
for each row
execute function public.psylattice_validate_analysis_record_study_owner();

alter table public.research_analysis_records enable row level security;

drop policy if exists "research_analysis_records_select_own"
  on public.research_analysis_records;
create policy "research_analysis_records_select_own"
on public.research_analysis_records
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "research_analysis_records_insert_own"
  on public.research_analysis_records;
create policy "research_analysis_records_insert_own"
on public.research_analysis_records
for insert
to authenticated
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.research_studies s
    where s.id = study_id
      and s.owner_user_id = auth.uid()
  )
);

drop policy if exists "research_analysis_records_update_own"
  on public.research_analysis_records;
create policy "research_analysis_records_update_own"
on public.research_analysis_records
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.research_studies s
    where s.id = study_id
      and s.owner_user_id = auth.uid()
  )
);

drop policy if exists "research_analysis_records_delete_own"
  on public.research_analysis_records;
create policy "research_analysis_records_delete_own"
on public.research_analysis_records
for delete
to authenticated
using (auth.uid() = owner_user_id);

grant select, insert, update, delete
on table public.research_analysis_records
to authenticated;

-- Service-role access is useful for future background audit jobs, while RLS
-- remains the normal path used by the current Study Health request.
grant select, insert, update, delete
on table public.research_analysis_records
to service_role;

commit;
