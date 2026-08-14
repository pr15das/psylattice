CREATE OR REPLACE FUNCTION "public"."psylattice_save_demographics"("p_session_token" "text", "p_responses" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_session public.participant_sessions%rowtype;
  v_study public.research_studies%rowtype;
  v_consent_method text := null;
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

  -- PsyLattice-managed consent must exist before participant data is changed.
  select cv.consent_method
  into v_consent_method
  from public.study_consent_versions cv
  where cv.study_id = v_session.study_id
    and cv.is_current = true
  order by cv.updated_at desc
  limit 1;

  if
    coalesce((v_study.components ->> 'consent')::boolean, false)
    and v_consent_method = 'psylattice'
    and not exists (
      select 1
      from public.participant_consents pc
      join public.study_consent_versions recorded_cv
        on recorded_cv.id = pc.consent_version_id
      where pc.participant_id = v_session.participant_id
        and pc.participant_session_id = v_session.id
        and pc.study_id = v_session.study_id
        and pc.consented = true
        and pc.consent_version_id is not null
        and recorded_cv.study_id = v_session.study_id
    )
  then
    return jsonb_build_object(
      'ok', false,
      'error', 'Consent must be completed before participant data can be saved.',
      'stage', 'consent_check'
    );
  end if;

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

CREATE OR REPLACE FUNCTION "public"."psylattice_save_measure"("p_session_token" "text", "p_study_measure_id" "uuid", "p_answers" "jsonb", "p_scores" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_session public.participant_sessions%rowtype;
  v_measure public.study_measures%rowtype;
  v_consent_method text := null;
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
  -- PsyLattice-managed consent
  -- ---------------------------------------------------------
  select cv.consent_method
  into v_consent_method
  from public.study_consent_versions cv
  where cv.study_id = v_session.study_id
    and cv.is_current = true
  order by cv.updated_at desc
  limit 1;

  if
    exists (
      select 1
      from public.research_studies rs
      where rs.id = v_session.study_id
        and coalesce((rs.components ->> 'consent')::boolean, false)
    )
    and v_consent_method = 'psylattice'
    and not exists (
      select 1
      from public.participant_consents pc
      join public.study_consent_versions recorded_cv
        on recorded_cv.id = pc.consent_version_id
      where pc.participant_id = v_session.participant_id
        and pc.participant_session_id = v_session.id
        and pc.study_id = v_session.study_id
        and pc.consented = true
        and pc.consent_version_id is not null
        and recorded_cv.study_id = v_session.study_id
    )
  then
    return jsonb_build_object(
      'ok', false,
      'error', 'Consent must be completed before participant data can be saved.',
      'stage', 'consent_check'
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
