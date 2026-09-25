-- PsyLattice Phase 2.5
-- Persistent semantic Research Health audit runs + evidence-backed findings.
--
-- AI findings are intentionally separate from deterministic Study Health
-- readiness checks. They are review prompts and do not alter the deterministic
-- readiness score.

begin;

create table if not exists public.research_health_audit_runs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,

  audit_type text not null,
  status text not null default 'running',

  provider text,
  provider_model text,
  model_key text,

  document_count integer not null default 0,
  candidate_paragraph_count integer not null default 0,
  audited_chars integer not null default 0,
  truncated boolean not null default false,
  finding_count integer not null default 0,

  input_tokens integer,
  output_tokens integer,
  error_code text,
  error_message text,

  coverage_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  completed_at timestamptz,

  constraint research_health_audit_runs_status_check
    check (status in ('running', 'completed', 'failed')),

  constraint research_health_audit_runs_nonnegative_counts_check
    check (
      document_count >= 0
      and candidate_paragraph_count >= 0
      and audited_chars >= 0
      and finding_count >= 0
      and (input_tokens is null or input_tokens >= 0)
      and (output_tokens is null or output_tokens >= 0)
    )
);

create index if not exists research_health_audit_runs_study_idx
  on public.research_health_audit_runs
  (owner_user_id, study_id, audit_type, created_at desc);

create table if not exists public.research_health_ai_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.research_health_audit_runs(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  study_id uuid not null references public.research_studies(id) on delete cascade,

  audit_type text not null,
  finding_key text not null,
  category text not null,
  status text not null default 'active',

  severity text not null default 'low',
  confidence numeric(5,4),

  title text not null,
  detail text not null,
  reason text,
  suggested_action text,

  document_id uuid references public.research_writing_documents(id) on delete set null,
  paragraph_index integer,
  quote_text text,
  source_excerpt text,

  target_screen text not null default 'writing',

  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint research_health_ai_findings_status_check
    check (status in ('active', 'superseded', 'dismissed', 'resolved')),

  constraint research_health_ai_findings_severity_check
    check (severity in ('low', 'medium', 'high')),

  constraint research_health_ai_findings_confidence_check
    check (confidence is null or (confidence >= 0 and confidence <= 1)),

  constraint research_health_ai_findings_paragraph_index_check
    check (paragraph_index is null or paragraph_index >= 0),

  constraint research_health_ai_findings_run_key_unique
    unique (run_id, finding_key)
);

create index if not exists research_health_ai_findings_active_study_idx
  on public.research_health_ai_findings
  (owner_user_id, study_id, audit_type, status, created_at desc);

create or replace function public.psylattice_validate_health_audit_study_owner()
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
      'Research Health audits may only be linked to a study owned by the same researcher.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists research_health_audit_runs_validate_owner
  on public.research_health_audit_runs;
create trigger research_health_audit_runs_validate_owner
before insert or update of study_id, owner_user_id
on public.research_health_audit_runs
for each row
execute function public.psylattice_validate_health_audit_study_owner();

drop trigger if exists research_health_ai_findings_validate_owner
  on public.research_health_ai_findings;
create trigger research_health_ai_findings_validate_owner
before insert or update of study_id, owner_user_id
on public.research_health_ai_findings
for each row
execute function public.psylattice_validate_health_audit_study_owner();

alter table public.research_health_audit_runs enable row level security;
alter table public.research_health_ai_findings enable row level security;

drop policy if exists "research_health_audit_runs_select_own"
  on public.research_health_audit_runs;
create policy "research_health_audit_runs_select_own"
on public.research_health_audit_runs
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "research_health_audit_runs_insert_own"
  on public.research_health_audit_runs;
create policy "research_health_audit_runs_insert_own"
on public.research_health_audit_runs
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

drop policy if exists "research_health_audit_runs_update_own"
  on public.research_health_audit_runs;
create policy "research_health_audit_runs_update_own"
on public.research_health_audit_runs
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "research_health_ai_findings_select_own"
  on public.research_health_ai_findings;
create policy "research_health_ai_findings_select_own"
on public.research_health_ai_findings
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "research_health_ai_findings_insert_own"
  on public.research_health_ai_findings;
create policy "research_health_ai_findings_insert_own"
on public.research_health_ai_findings
for insert
to authenticated
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.research_health_audit_runs r
    where r.id = run_id
      and r.owner_user_id = auth.uid()
      and r.study_id = study_id
  )
);

drop policy if exists "research_health_ai_findings_update_own"
  on public.research_health_ai_findings;
create policy "research_health_ai_findings_update_own"
on public.research_health_ai_findings
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

grant select, insert, update
on table public.research_health_audit_runs
to authenticated;

grant select, insert, update
on table public.research_health_ai_findings
to authenticated;

grant select, insert, update, delete
on table public.research_health_audit_runs
to service_role;

grant select, insert, update, delete
on table public.research_health_ai_findings
to service_role;

commit;
