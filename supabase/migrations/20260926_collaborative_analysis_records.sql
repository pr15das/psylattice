-- PsyLattice Phase 4H hotfix:
-- collaborative Analysis Lab record access + creator attribution.
--
-- Existing research_analysis_records remain owned by the study owner.
-- Collaborator-created records are also study-owned, but retain the identity
-- and collaboration role of the account that created/updated the record.
--
-- The API verifies the collaborator's current Analysis Lab permission before
-- using service-role access. This migration does NOT broaden direct table RLS
-- access for collaborators.

begin;

alter table public.research_analysis_records
  add column if not exists created_by_user_id uuid
    references auth.users(id) on delete set null,
  add column if not exists created_by_role text,
  add column if not exists created_by_access_type text;

update public.research_analysis_records
set
  created_by_user_id = coalesce(created_by_user_id, owner_user_id),
  created_by_role = coalesce(created_by_role, 'owner'),
  created_by_access_type = coalesce(created_by_access_type, 'owner')
where
  created_by_user_id is null
  or created_by_role is null
  or created_by_access_type is null;

create index if not exists research_analysis_records_creator_idx
  on public.research_analysis_records
  (study_id, created_by_user_id, analysis_created_at desc);

-- The shared analysis-record API uses service-role reads/writes only after
-- authenticated study-access verification.
grant select, insert, update, delete
on table public.research_analysis_records
to service_role;

commit;
