-- PsyLattice Phase 4F hotfix: allow the server-only service role
-- to read owner Thesis documents after collaboration access has been verified.
--
-- This does NOT grant authenticated collaborators direct table access.
-- The shared-thesis API remains the only path used by collaborators.

begin;

grant select
on table public.research_writing_documents
to service_role;

commit;
