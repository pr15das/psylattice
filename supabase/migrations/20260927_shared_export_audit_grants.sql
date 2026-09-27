-- PsyLattice Phase 4J: Shared export audit access
-- Collaborators do NOT receive direct table privileges.
-- The server route verifies active study access + exports permission before
-- service_role writes/reads the audit event.

begin;

grant select, insert
on table public.study_collaboration_activity
 to service_role;

commit;
