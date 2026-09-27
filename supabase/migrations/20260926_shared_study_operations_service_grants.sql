-- PsyLattice Phase 4I.1 hotfix
-- Safe to run even if the original Phase 4I grant migration was already run.

begin;

grant select, update
on table public.research_studies
to service_role;

grant select
on table
  public.study_consent_versions,
  public.study_consent_items,
  public.study_demographic_questions,
  public.study_measures,
  public.study_followup_waves,
  public.study_cognitive_tasks,
  public.study_ambulatory_protocols,
  public.questionnaires,
  public.study_participants,
  public.participant_sessions,
  public.participant_consents,
  public.research_responses
to service_role;

grant select, insert, update
on table public.study_links
to service_role;

commit;
