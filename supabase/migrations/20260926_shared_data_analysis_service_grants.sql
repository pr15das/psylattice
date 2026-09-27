-- PsyLattice Phase 4H: server-only shared Data Explorer / Analysis Lab reads
-- Collaborators still receive NO direct SELECT grants on owner research tables.
-- The service role is used only after the shared-data API verifies:
--   * active study membership
--   * module permission
--   * owner/study relationship
--
-- Direct identifiers are stripped by the API before any rows are returned.

begin;

grant select on table public.study_participants to service_role;
grant select on table public.study_demographic_questions to service_role;
grant select on table public.participant_demographic_responses to service_role;
grant select on table public.study_measures to service_role;
grant select on table public.study_measure_sessions to service_role;
grant select on table public.research_responses to service_role;
grant select on table public.questionnaires to service_role;
grant select on table public.questionnaire_versions to service_role;
grant select on table public.questionnaire_items to service_role;
grant select on table public.study_followup_waves to service_role;
grant select on table public.study_ambulatory_checkins to service_role;
grant select on table public.study_ambulatory_responses to service_role;
grant select on table public.study_cognitive_tasks to service_role;
grant select on table public.cognitive_tasks to service_role;
grant select on table public.cognitive_task_versions to service_role;
grant select on table public.cognitive_task_sessions to service_role;
grant select on table public.cognitive_trial_results to service_role;

commit;
