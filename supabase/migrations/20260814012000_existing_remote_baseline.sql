


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  requested_name text;
begin
  requested_name := nullif(
    trim(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        ''
      )
    ),
    ''
  );

  insert into public.profiles (
    id,
    full_name,
    role,
    workspace_access,
    last_workspace,
    created_at,
    updated_at
  )
  values (
    new.id,
    requested_name,
    'self',
    array[
      'self',
      'researcher',
      'clinician'
    ]::text[],
    null,
    now(),
    now()
  )
  on conflict (id)
  do update set
    full_name = coalesce(
      excluded.full_name,
      public.profiles.full_name
    ),
    role = 'self',
    workspace_access = array[
      'self',
      'researcher',
      'clinician'
    ]::text[],
    last_workspace = null,
    updated_at = now();

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."psylattice_complete_participation"("p_session_token" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_session public.participant_sessions%rowtype;
  v_study public.research_studies%rowtype;
  v_has_followup boolean := false;
begin
  select *
  into v_session
  from public.participant_sessions
  where session_token = p_session_token
    and status = 'in_progress'
  limit 1;

  if not found then
    raise exception 'This participant session is not active.';
  end if;

  select *
  into v_study
  from public.research_studies
  where id = v_session.study_id;

  if
    coalesce((v_study.components ->> 'consent')::boolean, false)
    and exists (
      select 1
      from public.study_consent_versions cv
      where cv.study_id = v_study.id
        and cv.is_current = true
        and cv.consent_method = 'psylattice'
    )
    and not exists (
      select 1
      from public.participant_consents pc
      where pc.participant_session_id = v_session.id
        and pc.consented = true
    )
  then
    raise exception 'Consent must be completed before the study can be submitted.';
  end if;

  if
    coalesce((v_study.components ->> 'demographics')::boolean, false)
    and exists (
      select 1
      from public.study_demographic_questions dq
      where dq.study_id = v_study.id
    )
    and not exists (
      select 1
      from public.participant_demographic_submissions ds
      where ds.participant_session_id = v_session.id
    )
  then
    raise exception 'Demographic questions must be submitted before the study can be completed.';
  end if;

  if exists (
    select 1
    from public.study_measures sm
    where sm.study_id = v_study.id
      and sm.measurement_point = v_session.phase
      and sm.required = true
      and not exists (
        select 1
        from public.study_measure_sessions sms
        where sms.participant_session_id = v_session.id
          and sms.study_measure_id = sm.id
          and sms.status = 'completed'
      )
  ) then
    raise exception 'Please complete every required questionnaire before submitting.';
  end if;

  update public.participant_sessions
  set
    status = 'completed',
    completed_at = now(),
    last_seen_at = now()
  where id = v_session.id;

  select exists (
    select 1
    from public.study_measures sm
    where sm.study_id = v_study.id
      and sm.measurement_point = 'followup'
  )
  into v_has_followup;

  update public.study_participants
  set
    status = case
      when v_has_followup then 'baseline_complete'
      else 'completed'
    end,
    completed_at = case
      when v_has_followup then null
      else now()
    end
  where id = v_session.participant_id;

  return jsonb_build_object(
    'ok', true,
    'followup_configured', v_has_followup
  );
end;
$$;


ALTER FUNCTION "public"."psylattice_complete_participation"("p_session_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."psylattice_public_study"("p_token" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_link public.study_links%rowtype;
  v_study public.research_studies%rowtype;
  v_consent jsonb := null;
  v_demographics jsonb := '[]'::jsonb;
  v_measures jsonb := '[]'::jsonb;
  v_participant_count integer := 0;
begin
  select *
  into v_link
  from public.study_links
  where token = p_token
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'This study link is not valid.');
  end if;

  if v_link.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'This study link is not currently active.');
  end if;

  if v_link.starts_at is not null and now() < v_link.starts_at then
    return jsonb_build_object('ok', false, 'error', 'This study has not opened yet.');
  end if;

  if v_link.ends_at is not null and now() > v_link.ends_at then
    return jsonb_build_object('ok', false, 'error', 'This study link has closed.');
  end if;

  select *
  into v_study
  from public.research_studies
  where id = v_link.study_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'The study could not be found.');
  end if;

  if not v_link.is_test_link and v_study.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'This study is not currently open for live participation.');
  end if;

  select count(*)
  into v_participant_count
  from public.study_participants p
  where p.study_link_id = v_link.id
    and p.is_test = false
    and p.status <> 'withdrawn';

  if
    not v_link.is_test_link
    and v_link.max_participants is not null
    and v_participant_count >= v_link.max_participants
  then
    return jsonb_build_object('ok', false, 'error', 'This recruitment link has reached its participant limit.');
  end if;

  if coalesce((v_study.components ->> 'consent')::boolean, false) then
    select jsonb_build_object(
      'id', cv.id,
      'version_label', cv.version_label,
      'consent_method', cv.consent_method,
      'participant_information', cv.participant_information,
      'external_consent_note', cv.external_consent_note,
      'items', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', ci.id,
              'position', ci.position,
              'prompt', ci.prompt,
              'response_type', ci.response_type,
              'required', ci.required,
              'response_config', ci.response_config,
              'validation_config', ci.validation_config
            )
            order by ci.position
          )
          from public.study_consent_items ci
          where ci.consent_version_id = cv.id
        ),
        '[]'::jsonb
      )
    )
    into v_consent
    from public.study_consent_versions cv
    where cv.study_id = v_study.id
      and cv.is_current = true
    order by cv.updated_at desc
    limit 1;
  end if;

  if coalesce((v_study.components ->> 'demographics')::boolean, false) then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', dq.id,
          'position', dq.position,
          'field_key', dq.field_key,
          'label', dq.label,
          'description', dq.description,
          'question_type', dq.question_type,
          'required', dq.required,
          'direct_identifier', dq.direct_identifier,
          'response_config', dq.response_config,
          'validation_config', dq.validation_config
        )
        order by dq.position
      ),
      '[]'::jsonb
    )
    into v_demographics
    from public.study_demographic_questions dq
    where dq.study_id = v_study.id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'study_measure_id', sm.id,
        'measurement_point', sm.measurement_point,
        'position', sm.position,
        'required', sm.required,
        'config', sm.config,

        'questionnaire', jsonb_build_object(
          'id', q.id,
          'slug', q.slug,
          'name', q.name,
          'acronym', q.acronym,
          'category', q.category,
          'description', q.description,
          'item_count', q.item_count,
          'estimated_minutes', q.estimated_minutes,
          'administration_mode', q.administration_mode,
          'recall_period', q.recall_period
        ),

        'version', jsonb_build_object(
          'id', qv.id,
          'version_label', qv.version_label,
          'participant_instructions', qv.participant_instructions,
          'response_scale_description', qv.response_scale_description,
          'score_multiplier', qv.score_multiplier,
          'scoring_method', qv.scoring_method,
          'scoring_config', qv.scoring_config,
          'missing_data_config', qv.missing_data_config,
          'randomization_config', qv.randomization_config,
          'display_config', qv.display_config
        ),

        'blocks', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', b.id,
                'block_key', b.block_key,
                'position', b.position,
                'title', b.title,
                'instructions', b.instructions,
                'randomize_items', b.randomize_items,
                'page_break_after', b.page_break_after,
                'display_logic', b.display_logic
              )
              order by b.position
            )
            from public.questionnaire_blocks b
            where b.version_id = qv.id
          ),
          '[]'::jsonb
        ),

        'items', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', qi.id,
                'block_id', qi.block_id,
                'item_key', qi.item_key,
                'position', qi.position,
                'prompt', qi.prompt,
                'help_text', qi.help_text,
                'subscale', qi.subscale,
                'reverse_scored', qi.reverse_scored,
                'response_type', qi.response_type,
                'response_options', qi.response_options,
                'required', qi.required,
                'response_config', qi.response_config,
                'validation_config', qi.validation_config,
                'scoring_config', qi.scoring_config,
                'display_logic', qi.display_logic,
                'randomization_config', qi.randomization_config,
                'media_config', qi.media_config,
                'is_content_only', qi.is_content_only
              )
              order by qi.position
            )
            from public.questionnaire_items qi
            where qi.version_id = qv.id
          ),
          '[]'::jsonb
        )
      )
      order by
        case when sm.measurement_point = 'baseline' then 0 else 1 end,
        sm.position
    ),
    '[]'::jsonb
  )
  into v_measures
  from public.study_measures sm
  join public.questionnaires q on q.id = sm.questionnaire_id
  join public.questionnaire_versions qv on qv.id = sm.questionnaire_version_id
  where sm.study_id = v_study.id
    and sm.measurement_point in ('baseline', 'followup');

  return jsonb_build_object(
    'ok', true,
    'study', jsonb_build_object(
      'id', v_study.id,
      'title', v_study.title,
      'participant_description', v_study.participant_description,
      'design', v_study.design,
      'components', v_study.components
    ),
    'link', jsonb_build_object(
      'id', v_link.id,
      'name', v_link.name,
      'access_mode', v_link.access_mode,
      'max_participants', v_link.max_participants,
      'allow_multiple_submissions', v_link.allow_multiple_submissions,
      'is_test_link', v_link.is_test_link
    ),
    'consent', v_consent,
    'demographics', v_demographics,
    'measures', v_measures
  );
end;
$$;


ALTER FUNCTION "public"."psylattice_public_study"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."psylattice_resume_participation"("p_token" "text", "p_session_token" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_session public.participant_sessions%rowtype;
  v_participant public.study_participants%rowtype;
  v_link public.study_links%rowtype;
  v_completed_measures jsonb := '[]'::jsonb;
  v_consent_saved boolean := false;
  v_demographics_saved boolean := false;
begin
  select ps.*
  into v_session
  from public.participant_sessions ps
  where ps.session_token = p_session_token
  limit 1;

  if not found then
    return jsonb_build_object('ok', false);
  end if;

  select *
  into v_link
  from public.study_links
  where id = v_session.study_link_id
    and token = p_token;

  if not found then
    return jsonb_build_object('ok', false);
  end if;

  select *
  into v_participant
  from public.study_participants
  where id = v_session.participant_id;

  select exists(
    select 1
    from public.participant_consents pc
    where pc.participant_session_id = v_session.id
      and pc.consented = true
  )
  into v_consent_saved;

  select exists(
    select 1
    from public.participant_demographic_submissions ds
    where ds.participant_session_id = v_session.id
  )
  into v_demographics_saved;

  select coalesce(jsonb_agg(sms.study_measure_id), '[]'::jsonb)
  into v_completed_measures
  from public.study_measure_sessions sms
  where sms.participant_session_id = v_session.id
    and sms.status = 'completed';

  update public.participant_sessions
  set last_seen_at = now()
  where id = v_session.id;

  return jsonb_build_object(
    'ok', true,
    'public_id', v_participant.public_id,
    'session_status', v_session.status,
    'participant_status', v_participant.status,
    'consent_saved', v_consent_saved,
    'demographics_saved', v_demographics_saved,
    'completed_measure_ids', v_completed_measures,
    'is_test', v_session.is_test
  );
end;
$$;


ALTER FUNCTION "public"."psylattice_resume_participation"("p_token" "text", "p_session_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."psylattice_save_consent"("p_session_token" "text", "p_responses" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_session public.participant_sessions%rowtype;
  v_participant public.study_participants%rowtype;
  v_consent public.study_consent_versions%rowtype;
  v_item record;
  v_answer jsonb;
  v_correct text;
  v_answer_text text;
  v_snapshot jsonb;
begin
  select *
  into v_session
  from public.participant_sessions
  where session_token = p_session_token
    and status = 'in_progress'
  limit 1;

  if not found then
    raise exception 'This participant session is not active.';
  end if;

  select *
  into v_participant
  from public.study_participants
  where id = v_session.participant_id;

  select *
  into v_consent
  from public.study_consent_versions
  where study_id = v_session.study_id
    and is_current = true
  order by updated_at desc
  limit 1;

  if not found then
    return jsonb_build_object('ok', true, 'consent_required', false);
  end if;

  if v_consent.consent_method <> 'psylattice' then
    return jsonb_build_object(
      'ok', true,
      'consent_required', false,
      'consent_method', v_consent.consent_method
    );
  end if;

  for v_item in
    select *
    from public.study_consent_items
    where consent_version_id = v_consent.id
    order by position
  loop
    v_answer := p_responses -> v_item.id::text;

    if v_item.required then
      if v_answer is null or v_answer = 'null'::jsonb then
        raise exception 'Please complete every required consent item.';
      end if;

      if
        v_item.response_type = 'checkbox'
        and v_answer <> 'true'::jsonb
      then
        raise exception 'Please acknowledge every required consent statement.';
      end if;

      if v_item.response_type = 'yes_no' then
        v_answer_text := lower(trim(both '"' from v_answer::text));

        if v_answer_text not in ('yes', 'true', '1') then
          raise exception 'Required consent statements must be agreed to in order to continue.';
        end if;
      end if;

      if v_item.response_type in ('initials', 'typed_name', 'date') then
        v_answer_text := trim(both '"' from v_answer::text);

        if v_answer_text = '' then
          raise exception 'Please complete every required consent item.';
        end if;
      end if;
    end if;

    if
      v_item.response_type = 'comprehension'
      and coalesce((v_item.validation_config ->> 'must_be_correct')::boolean, false)
    then
      v_correct := v_item.response_config ->> 'correct_option';
      v_answer_text := trim(both '"' from coalesce(v_answer, 'null'::jsonb)::text);

      if v_correct is not null and v_answer_text is distinct from v_correct then
        raise exception 'Please review the participant information and answer the comprehension question correctly.';
      end if;
    end if;
  end loop;

  select jsonb_build_object(
    'version_id', v_consent.id,
    'version_label', v_consent.version_label,
    'participant_information', v_consent.participant_information,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ci.id,
            'position', ci.position,
            'prompt', ci.prompt,
            'response_type', ci.response_type,
            'required', ci.required,
            'response_config', ci.response_config,
            'validation_config', ci.validation_config
          )
          order by ci.position
        )
        from public.study_consent_items ci
        where ci.consent_version_id = v_consent.id
      ),
      '[]'::jsonb
    )
  )
  into v_snapshot;

  insert into public.participant_consents (
    participant_id,
    participant_session_id,
    study_id,
    consent_version_id,
    owner_user_id,
    consented,
    responses,
    consent_snapshot,
    consented_at
  )
  values (
    v_participant.id,
    v_session.id,
    v_session.study_id,
    v_consent.id,
    v_session.owner_user_id,
    true,
    coalesce(p_responses, '{}'::jsonb),
    v_snapshot,
    now()
  )
  on conflict (participant_session_id)
  do update set
    consent_version_id = excluded.consent_version_id,
    consented = excluded.consented,
    responses = excluded.responses,
    consent_snapshot = excluded.consent_snapshot,
    consented_at = excluded.consented_at;

  return jsonb_build_object('ok', true, 'consent_required', true);
end;
$$;


ALTER FUNCTION "public"."psylattice_save_consent"("p_session_token" "text", "p_responses" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."psylattice_save_demographics"("p_session_token" "text", "p_responses" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_session public.participant_sessions%rowtype;
  v_study public.research_studies%rowtype;
  v_submission_id uuid;
  v_question record;
  v_answer jsonb;
  v_text text;
  v_numeric numeric;
begin
  select *
  into v_session
  from public.participant_sessions
  where session_token = p_session_token
    and status = 'in_progress'
  limit 1;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error', 'This participant session is not active.'
    );
  end if;

  select *
  into v_study
  from public.research_studies
  where id = v_session.study_id;

  if not coalesce((v_study.components ->> 'demographics')::boolean, false) then
    return jsonb_build_object('ok', true, 'demographics_required', false);
  end if;

  if p_responses is null or jsonb_typeof(p_responses) <> 'object' then
    return jsonb_build_object(
      'ok', false,
      'error', 'Demographic responses were not supplied in the expected format.'
    );
  end if;

  -- Validate required questions before writing anything.
  for v_question in
    select *
    from public.study_demographic_questions
    where study_id = v_session.study_id
    order by position
  loop
    v_answer := p_responses -> v_question.id::text;

    if v_question.required then
      if
        v_answer is null
        or v_answer = 'null'::jsonb
        or (jsonb_typeof(v_answer) = 'string' and trim(both '"' from v_answer::text) = '')
        or (jsonb_typeof(v_answer) = 'array' and jsonb_array_length(v_answer) = 0)
      then
        return jsonb_build_object(
          'ok', false,
          'error', 'Please complete every required demographic question.'
        );
      end if;
    end if;
  end loop;

  insert into public.participant_demographic_submissions (
    participant_session_id,
    participant_id,
    study_id,
    owner_user_id,
    submitted_at
  )
  values (
    v_session.id,
    v_session.participant_id,
    v_session.study_id,
    v_session.owner_user_id,
    now()
  )
  on conflict (participant_session_id)
  do update set submitted_at = excluded.submitted_at
  returning id into v_submission_id;

  delete from public.participant_demographic_responses
  where submission_id = v_submission_id;

  for v_question in
    select *
    from public.study_demographic_questions
    where study_id = v_session.study_id
    order by position
  loop
    v_answer := p_responses -> v_question.id::text;

    if v_answer is null or v_answer = 'null'::jsonb then
      continue;
    end if;

    v_text := null;
    v_numeric := null;

    if jsonb_typeof(v_answer) = 'string' then
      v_text := trim(both '"' from v_answer::text);
    elsif jsonb_typeof(v_answer) = 'number' then
      v_numeric := (v_answer::text)::numeric;
    end if;

    insert into public.participant_demographic_responses (
      submission_id,
      participant_session_id,
      participant_id,
      study_id,
      question_id,
      owner_user_id,
      response,
      text_value,
      numeric_value,
      question_snapshot,
      answered_at
    )
    values (
      v_submission_id,
      v_session.id,
      v_session.participant_id,
      v_session.study_id,
      v_question.id,
      v_session.owner_user_id,
      v_answer,
      v_text,
      v_numeric,
      jsonb_build_object(
        'field_key', v_question.field_key,
        'label', v_question.label,
        'description', v_question.description,
        'question_type', v_question.question_type,
        'required', v_question.required,
        'direct_identifier', v_question.direct_identifier,
        'response_config', v_question.response_config,
        'validation_config', v_question.validation_config
      ),
      now()
    );
  end loop;

  update public.participant_sessions
  set last_seen_at = now()
  where id = v_session.id;

  return jsonb_build_object(
    'ok', true,
    'submission_id', v_submission_id
  );
end;
$$;


ALTER FUNCTION "public"."psylattice_save_demographics"("p_session_token" "text", "p_responses" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."psylattice_save_measure"("p_session_token" "text", "p_study_measure_id" "uuid", "p_answers" "jsonb", "p_scores" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_session public.participant_sessions%rowtype;
  v_measure public.study_measures%rowtype;
  v_measure_session_id uuid;

  v_answer jsonb;
  v_item_id uuid;
  v_numeric numeric;
  v_score numeric;
  v_text text;
begin
  -- ---------------------------------------------------------
  -- Active participant session
  -- ---------------------------------------------------------
  select ps.*
  into v_session
  from public.participant_sessions ps
  where ps.session_token = p_session_token
  limit 1;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error', 'The participant session could not be found.',
      'stage', 'session_lookup'
    );
  end if;

  if v_session.status <> 'in_progress' then
    return jsonb_build_object(
      'ok', false,
      'error', 'This participant session is no longer active.',
      'stage', 'session_status',
      'session_status', v_session.status
    );
  end if;

  -- ---------------------------------------------------------
  -- Study measure
  -- ---------------------------------------------------------
  select sm.*
  into v_measure
  from public.study_measures sm
  where sm.id = p_study_measure_id
    and sm.study_id = v_session.study_id
  limit 1;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error', 'This questionnaire is no longer attached to this study.',
      'stage', 'study_measure_lookup'
    );
  end if;

  if v_measure.measurement_point <> v_session.phase then
    return jsonb_build_object(
      'ok', false,
      'error',
        'This questionnaire belongs to the ' ||
        v_measure.measurement_point ||
        ' phase, but the participant session is currently in the ' ||
        v_session.phase ||
        ' phase.',
      'stage', 'phase_check',
      'measure_phase', v_measure.measurement_point,
      'session_phase', v_session.phase
    );
  end if;

  -- ---------------------------------------------------------
  -- Input shape
  -- ---------------------------------------------------------
  if p_answers is null then
    p_answers := '[]'::jsonb;
  end if;

  if jsonb_typeof(p_answers) <> 'array' then
    return jsonb_build_object(
      'ok', false,
      'error', 'Questionnaire answers were not supplied in the expected array format.',
      'stage', 'answers_shape'
    );
  end if;

  -- ---------------------------------------------------------
  -- Create / reuse the measure session
  -- ---------------------------------------------------------
  insert into public.study_measure_sessions (
    participant_session_id,
    participant_id,
    study_id,
    study_measure_id,
    questionnaire_version_id,
    owner_user_id,
    status,
    scores,
    started_at,
    completed_at
  )
  values (
    v_session.id,
    v_session.participant_id,
    v_session.study_id,
    v_measure.id,
    v_measure.questionnaire_version_id,
    v_session.owner_user_id,
    'in_progress',
    '{}'::jsonb,
    now(),
    null
  )
  on conflict (participant_session_id, study_measure_id)
  do update set
    questionnaire_version_id = excluded.questionnaire_version_id,
    owner_user_id = excluded.owner_user_id,
    status = 'in_progress',
    scores = '{}'::jsonb,
    completed_at = null
  returning id into v_measure_session_id;

  -- Re-saving a questionnaire replaces only this measure session's
  -- previously stored item responses.
  delete from public.research_responses rr
  where rr.measure_session_id = v_measure_session_id;

  -- ---------------------------------------------------------
  -- Store each response
  -- ---------------------------------------------------------
  for v_answer in
    select value
    from jsonb_array_elements(p_answers)
  loop
    if jsonb_typeof(v_answer) <> 'object' then
      continue;
    end if;

    begin
      v_item_id := nullif(v_answer ->> 'item_id', '')::uuid;
    exception when others then
      return jsonb_build_object(
        'ok', false,
        'error', 'A questionnaire answer contained an invalid item identifier.',
        'stage', 'item_id'
      );
    end;

    if v_item_id is null then
      continue;
    end if;

    if not exists (
      select 1
      from public.questionnaire_items qi
      where qi.id = v_item_id
        and qi.version_id = v_measure.questionnaire_version_id
    ) then
      return jsonb_build_object(
        'ok', false,
        'error', 'One response refers to an item outside the questionnaire version attached to this study.',
        'stage', 'item_version_check',
        'item_id', v_item_id,
        'questionnaire_version_id', v_measure.questionnaire_version_id
      );
    end if;

    v_numeric := null;
    v_score := null;
    v_text := null;

    if
      v_answer ? 'numeric_value'
      and v_answer -> 'numeric_value' is not null
      and jsonb_typeof(v_answer -> 'numeric_value') = 'number'
    then
      v_numeric := (v_answer ->> 'numeric_value')::numeric;
    end if;

    if
      v_answer ? 'score_value'
      and v_answer -> 'score_value' is not null
      and jsonb_typeof(v_answer -> 'score_value') = 'number'
    then
      v_score := (v_answer ->> 'score_value')::numeric;
    end if;

    if
      v_answer ? 'text_value'
      and jsonb_typeof(v_answer -> 'text_value') = 'string'
    then
      v_text := v_answer ->> 'text_value';
    end if;

    insert into public.research_responses (
      measure_session_id,
      participant_session_id,
      participant_id,
      study_id,
      study_measure_id,
      questionnaire_version_id,
      item_id,
      owner_user_id,
      response,
      numeric_value,
      text_value,
      score_value,
      answered_at
    )
    values (
      v_measure_session_id,
      v_session.id,
      v_session.participant_id,
      v_session.study_id,
      v_measure.id,
      v_measure.questionnaire_version_id,
      v_item_id,
      v_session.owner_user_id,
      case
        when v_answer ? 'response'
          then coalesce(v_answer -> 'response', 'null'::jsonb)
        else 'null'::jsonb
      end,
      v_numeric,
      v_text,
      v_score,
      now()
    );
  end loop;

  -- ---------------------------------------------------------
  -- Finish measure session
  -- ---------------------------------------------------------
  update public.study_measure_sessions
  set
    status = 'completed',
    scores = coalesce(p_scores, '{}'::jsonb),
    completed_at = now()
  where id = v_measure_session_id;

  update public.participant_sessions
  set last_seen_at = now()
  where id = v_session.id;

  return jsonb_build_object(
    'ok', true,
    'measure_session_id', v_measure_session_id,
    'stored_responses', jsonb_array_length(p_answers)
  );

exception
  when others then
    return jsonb_build_object(
      'ok', false,
      'error', sqlerrm,
      'code', sqlstate,
      'stage', 'database_exception'
    );
end;
$$;


ALTER FUNCTION "public"."psylattice_save_measure"("p_session_token" "text", "p_study_measure_id" "uuid", "p_answers" "jsonb", "p_scores" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."psylattice_set_last_workspace"("p_workspace" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  normalized text;
begin
  normalized := lower(trim(coalesce(p_workspace, '')));

  if normalized not in ('self','researcher','clinician') then
    raise exception 'Invalid PsyLattice workspace.';
  end if;

  update public.profiles
  set
    last_workspace = normalized,
    updated_at = now()
  where id = auth.uid();
end;
$$;


ALTER FUNCTION "public"."psylattice_set_last_workspace"("p_workspace" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."psylattice_start_participation"("p_token" "text", "p_participant_code" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_link public.study_links%rowtype;
  v_study public.research_studies%rowtype;
  v_code public.study_link_codes%rowtype;
  v_participant_id uuid;
  v_public_id text;
  v_session_id uuid;
  v_session_token text;
  v_count integer := 0;
begin
  select *
  into v_link
  from public.study_links
  where token = p_token
  limit 1;

  if not found or v_link.status <> 'active' then
    raise exception 'This study link is not active.';
  end if;

  if v_link.starts_at is not null and now() < v_link.starts_at then
    raise exception 'This study has not opened yet.';
  end if;

  if v_link.ends_at is not null and now() > v_link.ends_at then
    raise exception 'This study link has closed.';
  end if;

  select *
  into v_study
  from public.research_studies
  where id = v_link.study_id;

  if not found then
    raise exception 'The study could not be found.';
  end if;

  if not v_link.is_test_link and v_study.status <> 'active' then
    raise exception 'This study is not open for live participation.';
  end if;

  if not v_link.is_test_link and v_link.max_participants is not null then
    select count(*)
    into v_count
    from public.study_participants p
    where p.study_link_id = v_link.id
      and p.is_test = false
      and p.status <> 'withdrawn';

    if v_count >= v_link.max_participants then
      raise exception 'This recruitment link has reached its participant limit.';
    end if;
  end if;

  if v_link.access_mode = 'participant_code' then
    if nullif(trim(coalesce(p_participant_code, '')), '') is null then
      raise exception 'A participant code is required for this study link.';
    end if;

    select *
    into v_code
    from public.study_link_codes c
    where c.study_link_id = v_link.id
      and lower(c.code) = lower(trim(p_participant_code))
      and c.is_active = true
      and c.use_count < c.max_uses
    for update
    limit 1;

    if not found then
      raise exception 'That participant code is not valid or has already been used.';
    end if;
  end if;

  v_public_id :=
    'PL-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.study_participants (
    study_id,
    study_link_id,
    owner_user_id,
    public_id,
    participant_code,
    is_test,
    status
  )
  values (
    v_study.id,
    v_link.id,
    v_study.owner_user_id,
    v_public_id,
    case
      when v_link.access_mode = 'participant_code'
        then trim(p_participant_code)
      else null
    end,
    v_link.is_test_link,
    'active'
  )
  returning id into v_participant_id;

  insert into public.participant_sessions (
    participant_id,
    study_id,
    study_link_id,
    owner_user_id,
    phase,
    status,
    is_test
  )
  values (
    v_participant_id,
    v_study.id,
    v_link.id,
    v_study.owner_user_id,
    'baseline',
    'in_progress',
    v_link.is_test_link
  )
  returning id, session_token
  into v_session_id, v_session_token;

  if v_link.access_mode = 'participant_code' then
    update public.study_link_codes
    set use_count = use_count + 1
    where id = v_code.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'participant_id', v_participant_id,
    'public_id', v_public_id,
    'session_id', v_session_id,
    'session_token', v_session_token,
    'is_test', v_link.is_test_link
  );
end;
$$;


ALTER FUNCTION "public"."psylattice_start_participation"("p_token" "text", "p_participant_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."assessment_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "response_value" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."assessment_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "questionnaire_id" "uuid" NOT NULL,
    "version_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "scores" "jsonb",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "assessment_sessions_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "public"."assessment_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoring_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "entry_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "stress" integer NOT NULL,
    "activity" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "monitoring_entries_note_check" CHECK ((("note" IS NULL) OR ("char_length"("note") <= 2000))),
    CONSTRAINT "monitoring_entries_stress_check" CHECK ((("stress" >= 0) AND ("stress" <= 10)))
);


ALTER TABLE "public"."monitoring_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoring_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text" DEFAULT 'Stress Monitoring'::"text" NOT NULL,
    "construct" "text" DEFAULT 'Stress'::"text" NOT NULL,
    "duration_days" integer DEFAULT 7 NOT NULL,
    "prompts_per_day" integer DEFAULT 3 NOT NULL,
    "start_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "monitoring_plans_duration_days_check" CHECK ((("duration_days" >= 1) AND ("duration_days" <= 365))),
    CONSTRAINT "monitoring_plans_prompts_per_day_check" CHECK ((("prompts_per_day" >= 1) AND ("prompts_per_day" <= 12))),
    CONSTRAINT "monitoring_plans_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."monitoring_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoring_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "label" "text" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."monitoring_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."participant_consents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "participant_session_id" "uuid" NOT NULL,
    "study_id" "uuid" NOT NULL,
    "consent_version_id" "uuid",
    "owner_user_id" "uuid" NOT NULL,
    "consented" boolean DEFAULT false NOT NULL,
    "responses" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "consent_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "consented_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."participant_consents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."participant_demographic_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "participant_session_id" "uuid" NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "study_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "response" "jsonb" DEFAULT 'null'::"jsonb" NOT NULL,
    "text_value" "text",
    "numeric_value" numeric,
    "question_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "answered_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."participant_demographic_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."participant_demographic_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "participant_session_id" "uuid" NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "study_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."participant_demographic_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."participant_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "study_id" "uuid" NOT NULL,
    "study_link_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "session_token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(32), 'hex'::"text") NOT NULL,
    "phase" "text" DEFAULT 'baseline'::"text" NOT NULL,
    "status" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "is_test" boolean DEFAULT false NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "participant_sessions_phase_check" CHECK (("phase" = ANY (ARRAY['baseline'::"text", 'followup'::"text", 'ambulatory'::"text"]))),
    CONSTRAINT "participant_sessions_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "public"."participant_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "workspace_role" "text" DEFAULT 'self'::"text" NOT NULL,
    "verification_status" "text" DEFAULT 'not_required'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "text" DEFAULT 'self'::"text" NOT NULL,
    "workspace_access" "text"[] DEFAULT ARRAY['self'::"text", 'researcher'::"text", 'clinician'::"text"] NOT NULL,
    "last_workspace" "text",
    CONSTRAINT "profiles_last_workspace_check" CHECK ((("last_workspace" IS NULL) OR ("lower"("last_workspace") = ANY (ARRAY['self'::"text", 'researcher'::"text", 'clinician'::"text"])))),
    CONSTRAINT "profiles_role_check" CHECK (("lower"("role") = ANY (ARRAY['self'::"text", 'researcher'::"text", 'clinician'::"text"]))),
    CONSTRAINT "profiles_verification_status_check" CHECK (("verification_status" = ANY (ARRAY['not_required'::"text", 'pending'::"text", 'verified'::"text", 'rejected'::"text"]))),
    CONSTRAINT "profiles_workspace_access_check" CHECK (("workspace_access" @> ARRAY['self'::"text", 'researcher'::"text", 'clinician'::"text"])),
    CONSTRAINT "profiles_workspace_role_check" CHECK (("workspace_role" = ANY (ARRAY['self'::"text", 'researcher'::"text", 'clinician'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaire_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "version_id" "uuid" NOT NULL,
    "block_key" "text" NOT NULL,
    "position" integer NOT NULL,
    "title" "text",
    "instructions" "text",
    "randomize_items" boolean DEFAULT false NOT NULL,
    "page_break_after" boolean DEFAULT true NOT NULL,
    "display_logic" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "questionnaire_blocks_position_check" CHECK (("position" > 0))
);


ALTER TABLE "public"."questionnaire_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaire_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "version_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "prompt" "text" NOT NULL,
    "subscale" "text",
    "reverse_scored" boolean DEFAULT false NOT NULL,
    "response_type" "text" DEFAULT 'single_choice'::"text" NOT NULL,
    "response_options" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "required" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "block_id" "uuid",
    "item_key" "text",
    "help_text" "text",
    "response_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "validation_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "scoring_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "display_logic" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "randomization_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "media_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_content_only" boolean DEFAULT false NOT NULL,
    CONSTRAINT "questionnaire_items_position_check" CHECK (("position" > 0))
);


ALTER TABLE "public"."questionnaire_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaire_references" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "questionnaire_id" "uuid" NOT NULL,
    "citation" "text" NOT NULL,
    "url" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."questionnaire_references" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaire_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "questionnaire_id" "uuid" NOT NULL,
    "resource_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "url" "text" NOT NULL,
    "source_name" "text",
    "is_official" boolean DEFAULT false NOT NULL,
    "download_allowed" boolean DEFAULT false NOT NULL,
    "access_note" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."questionnaire_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaire_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "questionnaire_id" "uuid" NOT NULL,
    "version_label" "text" NOT NULL,
    "participant_instructions" "text" NOT NULL,
    "researcher_instructions" "text",
    "response_scale_description" "text",
    "scoring_summary" "text",
    "score_multiplier" numeric DEFAULT 1 NOT NULL,
    "is_current" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "scoring_method" "text" DEFAULT 'legacy_guidance'::"text" NOT NULL,
    "scoring_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "missing_data_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "randomization_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "display_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."questionnaire_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaires" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "acronym" "text",
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "constructs" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "population" "text",
    "item_count" integer DEFAULT 0 NOT NULL,
    "estimated_minutes" integer,
    "languages" "text"[] DEFAULT ARRAY['English'::"text"] NOT NULL,
    "administration_mode" "text",
    "recall_period" "text",
    "self_available" boolean DEFAULT false NOT NULL,
    "researcher_available" boolean DEFAULT true NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "license_status" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "license_summary" "text",
    "license_source_url" "text",
    "commercial_use_note" "text",
    "modification_note" "text",
    "redistribution_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "owner_user_id" "uuid",
    "source_type" "text" DEFAULT 'system'::"text" NOT NULL,
    CONSTRAINT "questionnaires_estimated_minutes_check" CHECK ((("estimated_minutes" IS NULL) OR ("estimated_minutes" > 0))),
    CONSTRAINT "questionnaires_item_count_check" CHECK (("item_count" >= 0)),
    CONSTRAINT "questionnaires_license_status_check" CHECK (("license_status" = ANY (ARRAY['public_domain'::"text", 'permitted'::"text", 'restricted'::"text", 'unknown'::"text", 'researcher_owned'::"text"]))),
    CONSTRAINT "questionnaires_source_type_check" CHECK (("source_type" = ANY (ARRAY['system'::"text", 'researcher_created'::"text", 'imported'::"text"]))),
    CONSTRAINT "questionnaires_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."questionnaires" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."regulation_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "preferred_time" time without time zone,
    "time_label" "text" DEFAULT 'Any time'::"text" NOT NULL,
    "target_per_day" integer DEFAULT 1 NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "regulation_activities_target_per_day_check" CHECK ((("target_per_day" >= 1) AND ("target_per_day" <= 12)))
);


ALTER TABLE "public"."regulation_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."regulation_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "completion_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "occurrence" integer DEFAULT 1 NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "regulation_completions_occurrence_check" CHECK ((("occurrence" >= 1) AND ("occurrence" <= 12)))
);


ALTER TABLE "public"."regulation_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."regulation_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text" NOT NULL,
    "duration_days" integer DEFAULT 14 NOT NULL,
    "start_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "regulation_plans_duration_days_check" CHECK ((("duration_days" >= 1) AND ("duration_days" <= 365))),
    CONSTRAINT "regulation_plans_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."regulation_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."research_export_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "study_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "dataset_type" "text" NOT NULL,
    "export_format" "text" NOT NULL,
    "identity_mode" "text" DEFAULT 'pseudonymous'::"text" NOT NULL,
    "include_test_data" boolean DEFAULT false NOT NULL,
    "include_direct_identifiers" boolean DEFAULT false NOT NULL,
    "row_count" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "research_export_logs_export_format_check" CHECK (("export_format" = ANY (ARRAY['csv'::"text", 'json'::"text"]))),
    CONSTRAINT "research_export_logs_identity_mode_check" CHECK (("identity_mode" = ANY (ARRAY['pseudonymous'::"text", 'anonymous'::"text"]))),
    CONSTRAINT "research_export_logs_row_count_check" CHECK (("row_count" >= 0))
);


ALTER TABLE "public"."research_export_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."research_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "measure_session_id" "uuid" NOT NULL,
    "participant_session_id" "uuid" NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "study_id" "uuid" NOT NULL,
    "study_measure_id" "uuid" NOT NULL,
    "questionnaire_version_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "response" "jsonb" DEFAULT 'null'::"jsonb" NOT NULL,
    "numeric_value" numeric,
    "text_value" "text",
    "score_value" numeric,
    "answered_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."research_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."research_studies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text" NOT NULL,
    "participant_description" "text",
    "design" "text",
    "target_sample_size" integer,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "components" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "recruitment_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "study_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "research_studies_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'ready_for_review'::"text", 'active'::"text", 'paused'::"text", 'completed'::"text", 'archived'::"text"]))),
    CONSTRAINT "research_studies_target_sample_size_check" CHECK ((("target_sample_size" IS NULL) OR ("target_sample_size" > 0)))
);


ALTER TABLE "public"."research_studies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_ambulatory_protocols" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "study_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text" NOT NULL,
    "duration_mode" "text" DEFAULT 'relative_days'::"text" NOT NULL,
    "duration_days" integer,
    "start_date" "date",
    "end_date" "date",
    "sampling_modes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "scheduling_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "reminder_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "timezone_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "event_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "study_ambulatory_protocols_duration_days_check" CHECK ((("duration_days" IS NULL) OR (("duration_days" >= 1) AND ("duration_days" <= 730)))),
    CONSTRAINT "study_ambulatory_protocols_duration_mode_check" CHECK (("duration_mode" = ANY (ARRAY['relative_days'::"text", 'fixed_dates'::"text", 'participant_defined'::"text"])))
);


ALTER TABLE "public"."study_ambulatory_protocols" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_ambulatory_windows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protocol_id" "uuid" NOT NULL,
    "study_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "position" integer NOT NULL,
    "label" "text" NOT NULL,
    "sampling_type" "text" DEFAULT 'random_window'::"text" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "fixed_time" time without time zone,
    "response_window_minutes" integer,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "study_ambulatory_windows_position_check" CHECK (("position" > 0)),
    CONSTRAINT "study_ambulatory_windows_response_window_minutes_check" CHECK ((("response_window_minutes" IS NULL) OR ("response_window_minutes" > 0)))
);


ALTER TABLE "public"."study_ambulatory_windows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_consent_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "consent_version_id" "uuid" NOT NULL,
    "study_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "position" integer NOT NULL,
    "prompt" "text" NOT NULL,
    "response_type" "text" DEFAULT 'checkbox'::"text" NOT NULL,
    "required" boolean DEFAULT true NOT NULL,
    "response_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "validation_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "study_consent_items_position_check" CHECK (("position" > 0))
);


ALTER TABLE "public"."study_consent_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_consent_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "study_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "version_label" "text" DEFAULT 'Draft consent'::"text" NOT NULL,
    "consent_method" "text" DEFAULT 'psylattice'::"text" NOT NULL,
    "participant_information" "text",
    "external_consent_note" "text",
    "is_current" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "study_consent_versions_consent_method_check" CHECK (("consent_method" = ANY (ARRAY['psylattice'::"text", 'external'::"text", 'none'::"text"])))
);


ALTER TABLE "public"."study_consent_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_demographic_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "study_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "position" integer DEFAULT 1 NOT NULL,
    "field_key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "question_type" "text" DEFAULT 'short_text'::"text" NOT NULL,
    "required" boolean DEFAULT false NOT NULL,
    "direct_identifier" boolean DEFAULT false NOT NULL,
    "response_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "validation_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "study_demographic_questions_position_check" CHECK (("position" > 0)),
    CONSTRAINT "study_demographic_questions_question_type_check" CHECK (("question_type" = ANY (ARRAY['short_text'::"text", 'long_text'::"text", 'number'::"text", 'single_choice'::"text", 'multiple_choice'::"text", 'dropdown'::"text", 'yes_no'::"text", 'date'::"text", 'email'::"text"])))
);


ALTER TABLE "public"."study_demographic_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_link_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "study_link_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "code" "text" NOT NULL,
    "max_uses" integer DEFAULT 1 NOT NULL,
    "use_count" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "study_link_codes_max_uses_check" CHECK (("max_uses" > 0)),
    CONSTRAINT "study_link_codes_use_count_check" CHECK (("use_count" >= 0))
);


ALTER TABLE "public"."study_link_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "study_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text" DEFAULT 'Main study link'::"text" NOT NULL,
    "token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(24), 'hex'::"text") NOT NULL,
    "access_mode" "text" DEFAULT 'open'::"text" NOT NULL,
    "max_participants" integer,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "allow_multiple_submissions" boolean DEFAULT false NOT NULL,
    "is_test_link" boolean DEFAULT true NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "study_links_access_mode_check" CHECK (("access_mode" = ANY (ARRAY['open'::"text", 'participant_code'::"text"]))),
    CONSTRAINT "study_links_max_participants_check" CHECK ((("max_participants" IS NULL) OR ("max_participants" > 0))),
    CONSTRAINT "study_links_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."study_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_measure_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "participant_session_id" "uuid" NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "study_id" "uuid" NOT NULL,
    "study_measure_id" "uuid" NOT NULL,
    "questionnaire_version_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "scores" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "study_measure_sessions_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."study_measure_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_measures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "study_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "questionnaire_id" "uuid" NOT NULL,
    "questionnaire_version_id" "uuid" NOT NULL,
    "measurement_point" "text" DEFAULT 'baseline'::"text" NOT NULL,
    "position" integer DEFAULT 1 NOT NULL,
    "required" boolean DEFAULT true NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "study_measures_position_check" CHECK (("position" > 0))
);


ALTER TABLE "public"."study_measures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "study_id" "uuid" NOT NULL,
    "study_link_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "public_id" "text" NOT NULL,
    "participant_code" "text",
    "is_test" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "enrolled_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "study_participants_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'baseline_complete'::"text", 'completed'::"text", 'withdrawn'::"text"])))
);


ALTER TABLE "public"."study_participants" OWNER TO "postgres";


ALTER TABLE ONLY "public"."assessment_answers"
    ADD CONSTRAINT "assessment_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_answers"
    ADD CONSTRAINT "assessment_answers_session_id_item_id_key" UNIQUE ("session_id", "item_id");



ALTER TABLE ONLY "public"."assessment_sessions"
    ADD CONSTRAINT "assessment_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monitoring_entries"
    ADD CONSTRAINT "monitoring_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monitoring_entries"
    ADD CONSTRAINT "monitoring_entries_user_id_schedule_id_entry_date_key" UNIQUE ("user_id", "schedule_id", "entry_date");



ALTER TABLE ONLY "public"."monitoring_plans"
    ADD CONSTRAINT "monitoring_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monitoring_schedules"
    ADD CONSTRAINT "monitoring_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."participant_consents"
    ADD CONSTRAINT "participant_consents_participant_session_id_key" UNIQUE ("participant_session_id");



ALTER TABLE ONLY "public"."participant_consents"
    ADD CONSTRAINT "participant_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."participant_demographic_responses"
    ADD CONSTRAINT "participant_demographic_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."participant_demographic_responses"
    ADD CONSTRAINT "participant_demographic_responses_submission_id_question_id_key" UNIQUE ("submission_id", "question_id");



ALTER TABLE ONLY "public"."participant_demographic_submissions"
    ADD CONSTRAINT "participant_demographic_submissions_participant_session_id_key" UNIQUE ("participant_session_id");



ALTER TABLE ONLY "public"."participant_demographic_submissions"
    ADD CONSTRAINT "participant_demographic_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."participant_sessions"
    ADD CONSTRAINT "participant_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."participant_sessions"
    ADD CONSTRAINT "participant_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_blocks"
    ADD CONSTRAINT "questionnaire_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_blocks"
    ADD CONSTRAINT "questionnaire_blocks_version_id_block_key_key" UNIQUE ("version_id", "block_key");



ALTER TABLE ONLY "public"."questionnaire_blocks"
    ADD CONSTRAINT "questionnaire_blocks_version_id_position_key" UNIQUE ("version_id", "position");



ALTER TABLE ONLY "public"."questionnaire_items"
    ADD CONSTRAINT "questionnaire_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_items"
    ADD CONSTRAINT "questionnaire_items_version_id_position_key" UNIQUE ("version_id", "position");



ALTER TABLE ONLY "public"."questionnaire_references"
    ADD CONSTRAINT "questionnaire_references_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_references"
    ADD CONSTRAINT "questionnaire_references_questionnaire_id_citation_key" UNIQUE ("questionnaire_id", "citation");



ALTER TABLE ONLY "public"."questionnaire_resources"
    ADD CONSTRAINT "questionnaire_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_resources"
    ADD CONSTRAINT "questionnaire_resources_questionnaire_id_resource_type_url_key" UNIQUE ("questionnaire_id", "resource_type", "url");



ALTER TABLE ONLY "public"."questionnaire_versions"
    ADD CONSTRAINT "questionnaire_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_versions"
    ADD CONSTRAINT "questionnaire_versions_questionnaire_id_version_label_key" UNIQUE ("questionnaire_id", "version_label");



ALTER TABLE ONLY "public"."questionnaires"
    ADD CONSTRAINT "questionnaires_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaires"
    ADD CONSTRAINT "questionnaires_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."regulation_activities"
    ADD CONSTRAINT "regulation_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."regulation_completions"
    ADD CONSTRAINT "regulation_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."regulation_completions"
    ADD CONSTRAINT "regulation_completions_user_id_activity_id_completion_date__key" UNIQUE ("user_id", "activity_id", "completion_date", "occurrence");



ALTER TABLE ONLY "public"."regulation_plans"
    ADD CONSTRAINT "regulation_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."research_export_logs"
    ADD CONSTRAINT "research_export_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."research_responses"
    ADD CONSTRAINT "research_responses_measure_session_id_item_id_key" UNIQUE ("measure_session_id", "item_id");



ALTER TABLE ONLY "public"."research_responses"
    ADD CONSTRAINT "research_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."research_studies"
    ADD CONSTRAINT "research_studies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_ambulatory_protocols"
    ADD CONSTRAINT "study_ambulatory_protocols_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_ambulatory_protocols"
    ADD CONSTRAINT "study_ambulatory_protocols_study_id_key" UNIQUE ("study_id");



ALTER TABLE ONLY "public"."study_ambulatory_windows"
    ADD CONSTRAINT "study_ambulatory_windows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_ambulatory_windows"
    ADD CONSTRAINT "study_ambulatory_windows_protocol_id_position_key" UNIQUE ("protocol_id", "position");



ALTER TABLE ONLY "public"."study_consent_items"
    ADD CONSTRAINT "study_consent_items_consent_version_id_position_key" UNIQUE ("consent_version_id", "position");



ALTER TABLE ONLY "public"."study_consent_items"
    ADD CONSTRAINT "study_consent_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_consent_versions"
    ADD CONSTRAINT "study_consent_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_demographic_questions"
    ADD CONSTRAINT "study_demographic_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_demographic_questions"
    ADD CONSTRAINT "study_demographic_questions_study_id_field_key_key" UNIQUE ("study_id", "field_key");



ALTER TABLE ONLY "public"."study_link_codes"
    ADD CONSTRAINT "study_link_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_links"
    ADD CONSTRAINT "study_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_links"
    ADD CONSTRAINT "study_links_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."study_measure_sessions"
    ADD CONSTRAINT "study_measure_sessions_participant_session_id_study_measure_key" UNIQUE ("participant_session_id", "study_measure_id");



ALTER TABLE ONLY "public"."study_measure_sessions"
    ADD CONSTRAINT "study_measure_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_measures"
    ADD CONSTRAINT "study_measures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_participants"
    ADD CONSTRAINT "study_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_participants"
    ADD CONSTRAINT "study_participants_public_id_key" UNIQUE ("public_id");



CREATE INDEX "assessment_answers_session_idx" ON "public"."assessment_answers" USING "btree" ("session_id");



CREATE INDEX "assessment_sessions_user_idx" ON "public"."assessment_sessions" USING "btree" ("user_id", "completed_at" DESC);



CREATE INDEX "monitoring_entries_plan_id_idx" ON "public"."monitoring_entries" USING "btree" ("plan_id");



CREATE INDEX "monitoring_entries_user_date_idx" ON "public"."monitoring_entries" USING "btree" ("user_id", "entry_date");



CREATE INDEX "monitoring_plans_user_id_idx" ON "public"."monitoring_plans" USING "btree" ("user_id");



CREATE INDEX "monitoring_schedules_plan_id_idx" ON "public"."monitoring_schedules" USING "btree" ("plan_id");



CREATE INDEX "participant_consents_study_idx" ON "public"."participant_consents" USING "btree" ("study_id", "consented_at" DESC);



CREATE INDEX "participant_demographic_responses_participant_idx" ON "public"."participant_demographic_responses" USING "btree" ("participant_id", "answered_at" DESC);



CREATE INDEX "participant_demographic_responses_study_idx" ON "public"."participant_demographic_responses" USING "btree" ("study_id", "answered_at" DESC);



CREATE INDEX "participant_demographic_submissions_study_idx" ON "public"."participant_demographic_submissions" USING "btree" ("study_id", "submitted_at" DESC);



CREATE INDEX "participant_sessions_participant_idx" ON "public"."participant_sessions" USING "btree" ("participant_id", "started_at" DESC);



CREATE INDEX "participant_sessions_study_idx" ON "public"."participant_sessions" USING "btree" ("study_id", "started_at" DESC);



CREATE INDEX "profiles_role_idx" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "questionnaire_blocks_version_idx" ON "public"."questionnaire_blocks" USING "btree" ("version_id", "position");



CREATE INDEX "questionnaire_items_block_idx" ON "public"."questionnaire_items" USING "btree" ("block_id", "position");



CREATE INDEX "questionnaire_items_version_idx" ON "public"."questionnaire_items" USING "btree" ("version_id", "position");



CREATE UNIQUE INDEX "questionnaire_items_version_item_key_unique" ON "public"."questionnaire_items" USING "btree" ("version_id", "item_key") WHERE ("item_key" IS NOT NULL);



CREATE INDEX "questionnaire_resources_questionnaire_idx" ON "public"."questionnaire_resources" USING "btree" ("questionnaire_id", "sort_order");



CREATE INDEX "questionnaire_versions_questionnaire_idx" ON "public"."questionnaire_versions" USING "btree" ("questionnaire_id", "is_current");



CREATE INDEX "questionnaires_owner_idx" ON "public"."questionnaires" USING "btree" ("owner_user_id", "source_type");



CREATE INDEX "questionnaires_self_idx" ON "public"."questionnaires" USING "btree" ("self_available", "status");



CREATE INDEX "regulation_activities_plan_id_idx" ON "public"."regulation_activities" USING "btree" ("plan_id");



CREATE INDEX "regulation_completions_plan_id_idx" ON "public"."regulation_completions" USING "btree" ("plan_id");



CREATE INDEX "regulation_completions_user_date_idx" ON "public"."regulation_completions" USING "btree" ("user_id", "completion_date");



CREATE INDEX "regulation_plans_user_id_idx" ON "public"."regulation_plans" USING "btree" ("user_id");



CREATE INDEX "research_export_logs_owner_idx" ON "public"."research_export_logs" USING "btree" ("owner_user_id", "created_at" DESC);



CREATE INDEX "research_export_logs_study_idx" ON "public"."research_export_logs" USING "btree" ("study_id", "created_at" DESC);



CREATE INDEX "research_responses_participant_idx" ON "public"."research_responses" USING "btree" ("participant_id", "answered_at" DESC);



CREATE INDEX "research_responses_study_idx" ON "public"."research_responses" USING "btree" ("study_id", "answered_at" DESC);



CREATE INDEX "research_studies_owner_idx" ON "public"."research_studies" USING "btree" ("owner_user_id", "updated_at" DESC);



CREATE INDEX "study_ambulatory_windows_protocol_idx" ON "public"."study_ambulatory_windows" USING "btree" ("protocol_id", "position");



CREATE INDEX "study_consent_items_version_idx" ON "public"."study_consent_items" USING "btree" ("consent_version_id", "position");



CREATE INDEX "study_consent_versions_study_idx" ON "public"."study_consent_versions" USING "btree" ("study_id", "is_current");



CREATE INDEX "study_demographic_questions_study_idx" ON "public"."study_demographic_questions" USING "btree" ("study_id", "position");



CREATE INDEX "study_link_codes_link_idx" ON "public"."study_link_codes" USING "btree" ("study_link_id", "is_active");



CREATE UNIQUE INDEX "study_link_codes_unique_ci" ON "public"."study_link_codes" USING "btree" ("study_link_id", "lower"("code"));



CREATE INDEX "study_links_owner_idx" ON "public"."study_links" USING "btree" ("owner_user_id", "created_at" DESC);



CREATE INDEX "study_links_study_idx" ON "public"."study_links" USING "btree" ("study_id", "created_at" DESC);



CREATE INDEX "study_measure_sessions_study_idx" ON "public"."study_measure_sessions" USING "btree" ("study_id", "completed_at" DESC);



CREATE INDEX "study_measures_questionnaire_idx" ON "public"."study_measures" USING "btree" ("questionnaire_id", "questionnaire_version_id");



CREATE INDEX "study_measures_study_idx" ON "public"."study_measures" USING "btree" ("study_id", "measurement_point", "position");



CREATE INDEX "study_participants_link_idx" ON "public"."study_participants" USING "btree" ("study_link_id", "enrolled_at" DESC);



CREATE INDEX "study_participants_study_idx" ON "public"."study_participants" USING "btree" ("study_id", "enrolled_at" DESC);



ALTER TABLE ONLY "public"."assessment_answers"
    ADD CONSTRAINT "assessment_answers_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."questionnaire_items"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."assessment_answers"
    ADD CONSTRAINT "assessment_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."assessment_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_answers"
    ADD CONSTRAINT "assessment_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_sessions"
    ADD CONSTRAINT "assessment_sessions_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."assessment_sessions"
    ADD CONSTRAINT "assessment_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_sessions"
    ADD CONSTRAINT "assessment_sessions_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."questionnaire_versions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."monitoring_entries"
    ADD CONSTRAINT "monitoring_entries_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."monitoring_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monitoring_entries"
    ADD CONSTRAINT "monitoring_entries_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."monitoring_schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monitoring_entries"
    ADD CONSTRAINT "monitoring_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monitoring_plans"
    ADD CONSTRAINT "monitoring_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monitoring_schedules"
    ADD CONSTRAINT "monitoring_schedules_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."monitoring_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monitoring_schedules"
    ADD CONSTRAINT "monitoring_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_consents"
    ADD CONSTRAINT "participant_consents_consent_version_id_fkey" FOREIGN KEY ("consent_version_id") REFERENCES "public"."study_consent_versions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."participant_consents"
    ADD CONSTRAINT "participant_consents_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_consents"
    ADD CONSTRAINT "participant_consents_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."study_participants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_consents"
    ADD CONSTRAINT "participant_consents_participant_session_id_fkey" FOREIGN KEY ("participant_session_id") REFERENCES "public"."participant_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_consents"
    ADD CONSTRAINT "participant_consents_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_demographic_responses"
    ADD CONSTRAINT "participant_demographic_responses_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_demographic_responses"
    ADD CONSTRAINT "participant_demographic_responses_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."study_participants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_demographic_responses"
    ADD CONSTRAINT "participant_demographic_responses_participant_session_id_fkey" FOREIGN KEY ("participant_session_id") REFERENCES "public"."participant_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_demographic_responses"
    ADD CONSTRAINT "participant_demographic_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."study_demographic_questions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."participant_demographic_responses"
    ADD CONSTRAINT "participant_demographic_responses_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_demographic_responses"
    ADD CONSTRAINT "participant_demographic_responses_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."participant_demographic_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_demographic_submissions"
    ADD CONSTRAINT "participant_demographic_submissions_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_demographic_submissions"
    ADD CONSTRAINT "participant_demographic_submissions_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."study_participants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_demographic_submissions"
    ADD CONSTRAINT "participant_demographic_submissions_participant_session_id_fkey" FOREIGN KEY ("participant_session_id") REFERENCES "public"."participant_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_demographic_submissions"
    ADD CONSTRAINT "participant_demographic_submissions_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_sessions"
    ADD CONSTRAINT "participant_sessions_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_sessions"
    ADD CONSTRAINT "participant_sessions_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."study_participants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_sessions"
    ADD CONSTRAINT "participant_sessions_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."participant_sessions"
    ADD CONSTRAINT "participant_sessions_study_link_id_fkey" FOREIGN KEY ("study_link_id") REFERENCES "public"."study_links"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_blocks"
    ADD CONSTRAINT "questionnaire_blocks_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."questionnaire_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_items"
    ADD CONSTRAINT "questionnaire_items_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "public"."questionnaire_blocks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."questionnaire_items"
    ADD CONSTRAINT "questionnaire_items_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."questionnaire_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_references"
    ADD CONSTRAINT "questionnaire_references_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_resources"
    ADD CONSTRAINT "questionnaire_resources_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_versions"
    ADD CONSTRAINT "questionnaire_versions_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaires"
    ADD CONSTRAINT "questionnaires_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."regulation_activities"
    ADD CONSTRAINT "regulation_activities_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."regulation_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."regulation_activities"
    ADD CONSTRAINT "regulation_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."regulation_completions"
    ADD CONSTRAINT "regulation_completions_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."regulation_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."regulation_completions"
    ADD CONSTRAINT "regulation_completions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."regulation_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."regulation_completions"
    ADD CONSTRAINT "regulation_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."regulation_plans"
    ADD CONSTRAINT "regulation_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."research_export_logs"
    ADD CONSTRAINT "research_export_logs_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."research_export_logs"
    ADD CONSTRAINT "research_export_logs_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."research_responses"
    ADD CONSTRAINT "research_responses_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."questionnaire_items"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_responses"
    ADD CONSTRAINT "research_responses_measure_session_id_fkey" FOREIGN KEY ("measure_session_id") REFERENCES "public"."study_measure_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."research_responses"
    ADD CONSTRAINT "research_responses_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."research_responses"
    ADD CONSTRAINT "research_responses_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."study_participants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."research_responses"
    ADD CONSTRAINT "research_responses_participant_session_id_fkey" FOREIGN KEY ("participant_session_id") REFERENCES "public"."participant_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."research_responses"
    ADD CONSTRAINT "research_responses_questionnaire_version_id_fkey" FOREIGN KEY ("questionnaire_version_id") REFERENCES "public"."questionnaire_versions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_responses"
    ADD CONSTRAINT "research_responses_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."research_responses"
    ADD CONSTRAINT "research_responses_study_measure_id_fkey" FOREIGN KEY ("study_measure_id") REFERENCES "public"."study_measures"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."research_studies"
    ADD CONSTRAINT "research_studies_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_ambulatory_protocols"
    ADD CONSTRAINT "study_ambulatory_protocols_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_ambulatory_protocols"
    ADD CONSTRAINT "study_ambulatory_protocols_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_ambulatory_windows"
    ADD CONSTRAINT "study_ambulatory_windows_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_ambulatory_windows"
    ADD CONSTRAINT "study_ambulatory_windows_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."study_ambulatory_protocols"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_ambulatory_windows"
    ADD CONSTRAINT "study_ambulatory_windows_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_consent_items"
    ADD CONSTRAINT "study_consent_items_consent_version_id_fkey" FOREIGN KEY ("consent_version_id") REFERENCES "public"."study_consent_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_consent_items"
    ADD CONSTRAINT "study_consent_items_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_consent_items"
    ADD CONSTRAINT "study_consent_items_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_consent_versions"
    ADD CONSTRAINT "study_consent_versions_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_consent_versions"
    ADD CONSTRAINT "study_consent_versions_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_demographic_questions"
    ADD CONSTRAINT "study_demographic_questions_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_demographic_questions"
    ADD CONSTRAINT "study_demographic_questions_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_link_codes"
    ADD CONSTRAINT "study_link_codes_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_link_codes"
    ADD CONSTRAINT "study_link_codes_study_link_id_fkey" FOREIGN KEY ("study_link_id") REFERENCES "public"."study_links"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_links"
    ADD CONSTRAINT "study_links_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_links"
    ADD CONSTRAINT "study_links_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_measure_sessions"
    ADD CONSTRAINT "study_measure_sessions_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_measure_sessions"
    ADD CONSTRAINT "study_measure_sessions_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."study_participants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_measure_sessions"
    ADD CONSTRAINT "study_measure_sessions_participant_session_id_fkey" FOREIGN KEY ("participant_session_id") REFERENCES "public"."participant_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_measure_sessions"
    ADD CONSTRAINT "study_measure_sessions_questionnaire_version_id_fkey" FOREIGN KEY ("questionnaire_version_id") REFERENCES "public"."questionnaire_versions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."study_measure_sessions"
    ADD CONSTRAINT "study_measure_sessions_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_measure_sessions"
    ADD CONSTRAINT "study_measure_sessions_study_measure_id_fkey" FOREIGN KEY ("study_measure_id") REFERENCES "public"."study_measures"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."study_measures"
    ADD CONSTRAINT "study_measures_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_measures"
    ADD CONSTRAINT "study_measures_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."study_measures"
    ADD CONSTRAINT "study_measures_questionnaire_version_id_fkey" FOREIGN KEY ("questionnaire_version_id") REFERENCES "public"."questionnaire_versions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."study_measures"
    ADD CONSTRAINT "study_measures_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_participants"
    ADD CONSTRAINT "study_participants_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_participants"
    ADD CONSTRAINT "study_participants_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."research_studies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_participants"
    ADD CONSTRAINT "study_participants_study_link_id_fkey" FOREIGN KEY ("study_link_id") REFERENCES "public"."study_links"("id") ON DELETE RESTRICT;



CREATE POLICY "Researchers can delete own export logs" ON "public"."research_export_logs" FOR DELETE TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Researchers can insert own export logs" ON "public"."research_export_logs" FOR INSERT TO "authenticated" WITH CHECK ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."research_studies" "s"
  WHERE (("s"."id" = "research_export_logs"."study_id") AND ("s"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Researchers can manage own demographic questions" ON "public"."study_demographic_questions" TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."research_studies" "s"
  WHERE (("s"."id" = "study_demographic_questions"."study_id") AND ("s"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Researchers can manage own study link codes" ON "public"."study_link_codes" TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."study_links" "l"
  WHERE (("l"."id" = "study_link_codes"."study_link_id") AND ("l"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Researchers can manage own study links" ON "public"."study_links" TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."research_studies" "s"
  WHERE (("s"."id" = "study_links"."study_id") AND ("s"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Researchers can update own participants" ON "public"."study_participants" FOR UPDATE TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Researchers can view own demographic responses" ON "public"."participant_demographic_responses" FOR SELECT TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Researchers can view own demographic submissions" ON "public"."participant_demographic_submissions" FOR SELECT TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Researchers can view own export logs" ON "public"."research_export_logs" FOR SELECT TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Researchers can view own measure sessions" ON "public"."study_measure_sessions" FOR SELECT TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Researchers can view own participant consents" ON "public"."participant_consents" FOR SELECT TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Researchers can view own participant sessions" ON "public"."participant_sessions" FOR SELECT TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Researchers can view own participants" ON "public"."study_participants" FOR SELECT TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Researchers can view own research responses" ON "public"."research_responses" FOR SELECT TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can create blocks for own questionnaires" ON "public"."questionnaire_blocks" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."questionnaire_versions" "v"
     JOIN "public"."questionnaires" "q" ON (("q"."id" = "v"."questionnaire_id")))
  WHERE (("v"."id" = "questionnaire_blocks"."version_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can create items for own questionnaires" ON "public"."questionnaire_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."questionnaire_versions" "v"
     JOIN "public"."questionnaires" "q" ON (("q"."id" = "v"."questionnaire_id")))
  WHERE (("v"."id" = "questionnaire_items"."version_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can create own assessment answers" ON "public"."assessment_answers" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."assessment_sessions" "s"
  WHERE (("s"."id" = "assessment_answers"."session_id") AND ("s"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can create own assessment sessions" ON "public"."assessment_sessions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can create own monitoring entries" ON "public"."monitoring_entries" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."monitoring_plans"
  WHERE (("monitoring_plans"."id" = "monitoring_entries"."plan_id") AND ("monitoring_plans"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND (EXISTS ( SELECT 1
   FROM "public"."monitoring_schedules"
  WHERE (("monitoring_schedules"."id" = "monitoring_entries"."schedule_id") AND ("monitoring_schedules"."plan_id" = "monitoring_entries"."plan_id") AND ("monitoring_schedules"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can create own monitoring plans" ON "public"."monitoring_plans" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can create own monitoring schedules" ON "public"."monitoring_schedules" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."monitoring_plans"
  WHERE (("monitoring_plans"."id" = "monitoring_schedules"."plan_id") AND ("monitoring_plans"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can create own regulation activities" ON "public"."regulation_activities" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."regulation_plans"
  WHERE (("regulation_plans"."id" = "regulation_activities"."plan_id") AND ("regulation_plans"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can create own regulation completions" ON "public"."regulation_completions" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."regulation_plans"
  WHERE (("regulation_plans"."id" = "regulation_completions"."plan_id") AND ("regulation_plans"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND (EXISTS ( SELECT 1
   FROM "public"."regulation_activities"
  WHERE (("regulation_activities"."id" = "regulation_completions"."activity_id") AND ("regulation_activities"."plan_id" = "regulation_completions"."plan_id") AND ("regulation_activities"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can create own regulation plans" ON "public"."regulation_plans" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can create own research studies" ON "public"."research_studies" FOR INSERT TO "authenticated" WITH CHECK (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can create own researcher questionnaires" ON "public"."questionnaires" FOR INSERT TO "authenticated" WITH CHECK ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"])) AND ("researcher_available" = true) AND ("self_available" = false)));



CREATE POLICY "Users can create references for own questionnaires" ON "public"."questionnaire_references" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_references"."questionnaire_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can create resources for own questionnaires" ON "public"."questionnaire_resources" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_resources"."questionnaire_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can create versions for own questionnaires" ON "public"."questionnaire_versions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_versions"."questionnaire_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can delete blocks for own questionnaires" ON "public"."questionnaire_blocks" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."questionnaire_versions" "v"
     JOIN "public"."questionnaires" "q" ON (("q"."id" = "v"."questionnaire_id")))
  WHERE (("v"."id" = "questionnaire_blocks"."version_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can delete items for own questionnaires" ON "public"."questionnaire_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."questionnaire_versions" "v"
     JOIN "public"."questionnaires" "q" ON (("q"."id" = "v"."questionnaire_id")))
  WHERE (("v"."id" = "questionnaire_items"."version_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can delete own assessment answers" ON "public"."assessment_answers" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own assessment sessions" ON "public"."assessment_sessions" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own monitoring entries" ON "public"."monitoring_entries" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own monitoring plans" ON "public"."monitoring_plans" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own monitoring schedules" ON "public"."monitoring_schedules" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own regulation activities" ON "public"."regulation_activities" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own regulation completions" ON "public"."regulation_completions" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own regulation plans" ON "public"."regulation_plans" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own research studies" ON "public"."research_studies" FOR DELETE TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own researcher questionnaires" ON "public"."questionnaires" FOR DELETE TO "authenticated" USING ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))));



CREATE POLICY "Users can delete own study measures" ON "public"."study_measures" FOR DELETE TO "authenticated" USING (("owner_user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete references for own questionnaires" ON "public"."questionnaire_references" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_references"."questionnaire_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can delete resources for own questionnaires" ON "public"."questionnaire_resources" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_resources"."questionnaire_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can delete versions for own questionnaires" ON "public"."questionnaire_versions" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_versions"."questionnaire_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can insert own study measures" ON "public"."study_measures" FOR INSERT TO "authenticated" WITH CHECK ((("owner_user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."research_studies" "s"
  WHERE (("s"."id" = "study_measures"."study_id") AND ("s"."owner_user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can manage own ambulatory protocols" ON "public"."study_ambulatory_protocols" TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."research_studies" "s"
  WHERE (("s"."id" = "study_ambulatory_protocols"."study_id") AND ("s"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can manage own ambulatory windows" ON "public"."study_ambulatory_windows" TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."study_ambulatory_protocols" "p"
  WHERE (("p"."id" = "study_ambulatory_windows"."protocol_id") AND ("p"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can manage own consent items" ON "public"."study_consent_items" TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."study_consent_versions" "cv"
  WHERE (("cv"."id" = "study_consent_items"."consent_version_id") AND ("cv"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can manage own consent versions" ON "public"."study_consent_versions" TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."research_studies" "s"
  WHERE (("s"."id" = "study_consent_versions"."study_id") AND ("s"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can update blocks for own questionnaires" ON "public"."questionnaire_blocks" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."questionnaire_versions" "v"
     JOIN "public"."questionnaires" "q" ON (("q"."id" = "v"."questionnaire_id")))
  WHERE (("v"."id" = "questionnaire_blocks"."version_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."questionnaire_versions" "v"
     JOIN "public"."questionnaires" "q" ON (("q"."id" = "v"."questionnaire_id")))
  WHERE (("v"."id" = "questionnaire_blocks"."version_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update items for own questionnaires" ON "public"."questionnaire_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."questionnaire_versions" "v"
     JOIN "public"."questionnaires" "q" ON (("q"."id" = "v"."questionnaire_id")))
  WHERE (("v"."id" = "questionnaire_items"."version_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."questionnaire_versions" "v"
     JOIN "public"."questionnaires" "q" ON (("q"."id" = "v"."questionnaire_id")))
  WHERE (("v"."id" = "questionnaire_items"."version_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can update own assessment answers" ON "public"."assessment_answers" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own assessment sessions" ON "public"."assessment_sessions" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own monitoring entries" ON "public"."monitoring_entries" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own monitoring plans" ON "public"."monitoring_plans" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own monitoring schedules" ON "public"."monitoring_schedules" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."monitoring_plans"
  WHERE (("monitoring_plans"."id" = "monitoring_schedules"."plan_id") AND ("monitoring_plans"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own regulation activities" ON "public"."regulation_activities" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own regulation completions" ON "public"."regulation_completions" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own regulation plans" ON "public"."regulation_plans" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own research studies" ON "public"."research_studies" FOR UPDATE TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own researcher questionnaires" ON "public"."questionnaires" FOR UPDATE TO "authenticated" USING ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"])))) WITH CHECK ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"])) AND ("researcher_available" = true) AND ("self_available" = false)));



CREATE POLICY "Users can update own study measures" ON "public"."study_measures" FOR UPDATE TO "authenticated" USING (("owner_user_id" = "auth"."uid"())) WITH CHECK ((("owner_user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."research_studies" "s"
  WHERE (("s"."id" = "study_measures"."study_id") AND ("s"."owner_user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update references for own questionnaires" ON "public"."questionnaire_references" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_references"."questionnaire_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_references"."questionnaire_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can update resources for own questionnaires" ON "public"."questionnaire_resources" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_resources"."questionnaire_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_resources"."questionnaire_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update versions for own questionnaires" ON "public"."questionnaire_versions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_versions"."questionnaire_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_versions"."questionnaire_id") AND ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("q"."source_type" = ANY (ARRAY['researcher_created'::"text", 'imported'::"text"]))))));



CREATE POLICY "Users can view accessible questionnaire blocks" ON "public"."questionnaire_blocks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."questionnaire_versions" "v"
     JOIN "public"."questionnaires" "q" ON (("q"."id" = "v"."questionnaire_id")))
  WHERE (("v"."id" = "questionnaire_blocks"."version_id") AND ((("q"."owner_user_id" IS NULL) AND ("q"."status" = 'active'::"text")) OR ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view accessible questionnaire items" ON "public"."questionnaire_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."questionnaire_versions" "v"
     JOIN "public"."questionnaires" "q" ON (("q"."id" = "v"."questionnaire_id")))
  WHERE (("v"."id" = "questionnaire_items"."version_id") AND ((("q"."owner_user_id" IS NULL) AND ("q"."status" = 'active'::"text")) OR ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view accessible questionnaire references" ON "public"."questionnaire_references" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_references"."questionnaire_id") AND ((("q"."owner_user_id" IS NULL) AND ("q"."status" = 'active'::"text")) OR ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view accessible questionnaire resources" ON "public"."questionnaire_resources" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_resources"."questionnaire_id") AND ((("q"."owner_user_id" IS NULL) AND ("q"."status" = 'active'::"text")) OR ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view accessible questionnaire versions" ON "public"."questionnaire_versions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."questionnaires" "q"
  WHERE (("q"."id" = "questionnaire_versions"."questionnaire_id") AND ((("q"."owner_user_id" IS NULL) AND ("q"."status" = 'active'::"text")) OR ("q"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can view accessible questionnaires" ON "public"."questionnaires" FOR SELECT TO "authenticated" USING (((("owner_user_id" IS NULL) AND ("status" = 'active'::"text")) OR ("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can view own assessment answers" ON "public"."assessment_answers" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own assessment sessions" ON "public"."assessment_sessions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own monitoring entries" ON "public"."monitoring_entries" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own monitoring plans" ON "public"."monitoring_plans" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own monitoring schedules" ON "public"."monitoring_schedules" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own regulation activities" ON "public"."regulation_activities" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own regulation completions" ON "public"."regulation_completions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own regulation plans" ON "public"."regulation_plans" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own research studies" ON "public"."research_studies" FOR SELECT TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own study measures" ON "public"."study_measures" FOR SELECT TO "authenticated" USING (("owner_user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."assessment_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monitoring_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monitoring_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monitoring_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."participant_consents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."participant_demographic_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."participant_demographic_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."participant_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questionnaire_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questionnaire_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questionnaire_references" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questionnaire_resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questionnaire_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questionnaires" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."regulation_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."regulation_completions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."regulation_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."research_export_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."research_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."research_studies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_ambulatory_protocols" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_ambulatory_windows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_consent_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_consent_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_demographic_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_link_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_measure_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_measures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_participants" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."psylattice_complete_participation"("p_session_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."psylattice_complete_participation"("p_session_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."psylattice_complete_participation"("p_session_token" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."psylattice_public_study"("p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."psylattice_public_study"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."psylattice_public_study"("p_token" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."psylattice_resume_participation"("p_token" "text", "p_session_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."psylattice_resume_participation"("p_token" "text", "p_session_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."psylattice_resume_participation"("p_token" "text", "p_session_token" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."psylattice_save_consent"("p_session_token" "text", "p_responses" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."psylattice_save_consent"("p_session_token" "text", "p_responses" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."psylattice_save_consent"("p_session_token" "text", "p_responses" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."psylattice_save_demographics"("p_session_token" "text", "p_responses" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."psylattice_save_demographics"("p_session_token" "text", "p_responses" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."psylattice_save_demographics"("p_session_token" "text", "p_responses" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."psylattice_save_measure"("p_session_token" "text", "p_study_measure_id" "uuid", "p_answers" "jsonb", "p_scores" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."psylattice_save_measure"("p_session_token" "text", "p_study_measure_id" "uuid", "p_answers" "jsonb", "p_scores" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."psylattice_save_measure"("p_session_token" "text", "p_study_measure_id" "uuid", "p_answers" "jsonb", "p_scores" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."psylattice_set_last_workspace"("p_workspace" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."psylattice_set_last_workspace"("p_workspace" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."psylattice_start_participation"("p_token" "text", "p_participant_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."psylattice_start_participation"("p_token" "text", "p_participant_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."psylattice_start_participation"("p_token" "text", "p_participant_code" "text") TO "authenticated";


















GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."assessment_answers" TO "anon";
GRANT ALL ON TABLE "public"."assessment_answers" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."assessment_answers" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."assessment_sessions" TO "anon";
GRANT ALL ON TABLE "public"."assessment_sessions" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."assessment_sessions" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."monitoring_entries" TO "anon";
GRANT ALL ON TABLE "public"."monitoring_entries" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."monitoring_entries" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."monitoring_plans" TO "anon";
GRANT ALL ON TABLE "public"."monitoring_plans" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."monitoring_plans" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."monitoring_schedules" TO "anon";
GRANT ALL ON TABLE "public"."monitoring_schedules" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."monitoring_schedules" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."participant_consents" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."participant_consents" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."participant_consents" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."participant_demographic_responses" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."participant_demographic_responses" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."participant_demographic_responses" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."participant_demographic_submissions" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."participant_demographic_submissions" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."participant_demographic_submissions" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."participant_sessions" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."participant_sessions" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."participant_sessions" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "service_role";



GRANT UPDATE("full_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."questionnaire_blocks" TO "anon";
GRANT ALL ON TABLE "public"."questionnaire_blocks" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."questionnaire_blocks" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."questionnaire_items" TO "anon";
GRANT ALL ON TABLE "public"."questionnaire_items" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."questionnaire_items" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."questionnaire_references" TO "anon";
GRANT ALL ON TABLE "public"."questionnaire_references" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."questionnaire_references" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."questionnaire_resources" TO "anon";
GRANT ALL ON TABLE "public"."questionnaire_resources" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."questionnaire_resources" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."questionnaire_versions" TO "anon";
GRANT ALL ON TABLE "public"."questionnaire_versions" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."questionnaire_versions" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."questionnaires" TO "anon";
GRANT ALL ON TABLE "public"."questionnaires" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."questionnaires" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."regulation_activities" TO "anon";
GRANT ALL ON TABLE "public"."regulation_activities" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."regulation_activities" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."regulation_completions" TO "anon";
GRANT ALL ON TABLE "public"."regulation_completions" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."regulation_completions" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."regulation_plans" TO "anon";
GRANT ALL ON TABLE "public"."regulation_plans" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."regulation_plans" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."research_export_logs" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."research_export_logs" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."research_export_logs" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."research_responses" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."research_responses" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."research_responses" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."research_studies" TO "anon";
GRANT ALL ON TABLE "public"."research_studies" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."research_studies" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_ambulatory_protocols" TO "anon";
GRANT ALL ON TABLE "public"."study_ambulatory_protocols" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_ambulatory_protocols" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_ambulatory_windows" TO "anon";
GRANT ALL ON TABLE "public"."study_ambulatory_windows" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_ambulatory_windows" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_consent_items" TO "anon";
GRANT ALL ON TABLE "public"."study_consent_items" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_consent_items" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_consent_versions" TO "anon";
GRANT ALL ON TABLE "public"."study_consent_versions" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_consent_versions" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_demographic_questions" TO "anon";
GRANT ALL ON TABLE "public"."study_demographic_questions" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_demographic_questions" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_link_codes" TO "anon";
GRANT ALL ON TABLE "public"."study_link_codes" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_link_codes" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_links" TO "anon";
GRANT ALL ON TABLE "public"."study_links" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_links" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_measure_sessions" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_measure_sessions" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_measure_sessions" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_measures" TO "anon";
GRANT ALL ON TABLE "public"."study_measures" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_measures" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_participants" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."study_participants" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."study_participants" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";


-- Trigger bindings confirmed from remote system catalog metadata.
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE EVENT TRIGGER ensure_rls
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
EXECUTE FUNCTION public.rls_auto_enable();


































