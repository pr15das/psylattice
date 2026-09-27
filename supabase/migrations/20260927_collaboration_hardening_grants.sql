-- PsyLattice Phase 4K — collaboration hardening grants
-- New advanced permissions stay inside existing JSONB permission objects.

begin;

grant select, update
on table public.study_participants,
public.participant_sessions,
public.study_links
to service_role;

grant select, delete
on table public.study_measures
to service_role;

grant select, insert
on table public.study_collaboration_activity
to service_role;

commit;
