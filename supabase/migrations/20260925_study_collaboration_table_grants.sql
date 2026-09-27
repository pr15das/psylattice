-- PsyLattice Phase 4A hotfix: authenticated table privileges
-- RLS policies were created in the collaboration foundation migration,
-- but Postgres table privileges must also be granted for authenticated
-- requests to reach those policies.

begin;

grant select, insert, update, delete
on table public.study_collaborators
to authenticated;

grant select, insert, update, delete
on table public.study_collaboration_invites
to authenticated;

grant select, insert
on table public.study_collaboration_activity
to authenticated;

commit;
