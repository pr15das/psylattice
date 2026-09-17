-- Authenticated mobile participation reuses the existing study participant,
-- session, consent, questionnaire, and response records. This migration adds
-- only account binding and durable idempotency fields plus a short-lived web
-- runner handoff.

ALTER TABLE public.study_participants
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mobile_enrollment_idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS study_participants_mobile_account_study_unique
  ON public.study_participants (auth_user_id, study_id, is_test)
  WHERE auth_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS study_participants_mobile_enrollment_key_unique
  ON public.study_participants (mobile_enrollment_idempotency_key)
  WHERE mobile_enrollment_idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS study_participants_mobile_account_idx
  ON public.study_participants (auth_user_id, enrolled_at DESC)
  WHERE auth_user_id IS NOT NULL;

ALTER TABLE public.study_measure_sessions
  ADD COLUMN IF NOT EXISTS mobile_idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS study_measure_sessions_mobile_idempotency_unique
  ON public.study_measure_sessions (mobile_idempotency_key)
  WHERE mobile_idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.mobile_participant_web_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_session_id uuid NOT NULL REFERENCES public.participant_sessions(id) ON DELETE CASCADE,
  study_link_id uuid NOT NULL REFERENCES public.study_links(id) ON DELETE CASCADE,
  study_measure_id uuid REFERENCES public.study_measures(id) ON DELETE CASCADE,
  token_hash bytea NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mobile_participant_web_handoffs_expiry_check
    CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS mobile_participant_web_handoffs_expiry_idx
  ON public.mobile_participant_web_handoffs (expires_at)
  WHERE consumed_at IS NULL;

ALTER TABLE public.mobile_participant_web_handoffs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mobile_participant_web_handoffs FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.psylattice_mobile_resolve_join(
  p_kind text,
  p_value text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_value text := trim(coalesce(p_value, ''));
  v_link public.study_links%rowtype;
  v_study public.research_studies%rowtype;
  v_code_matches integer := 0;
  v_participant_count integer := 0;
  v_consent jsonb := null;
  v_existing public.study_participants%rowtype;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  END IF;

  IF v_value = '' OR p_kind NOT IN ('token', 'code') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
  END IF;

  IF p_kind = 'token' THEN
    SELECT * INTO v_link
    FROM public.study_links
    WHERE token = v_value
    LIMIT 1;
  ELSE
    SELECT count(*) INTO v_code_matches
    FROM public.study_link_codes c
    JOIN public.study_links l ON l.id = c.study_link_id
    WHERE lower(c.code) = lower(v_value)
      AND c.is_active = true
      AND c.use_count < c.max_uses
      AND l.status = 'active';

    IF v_code_matches > 1 THEN
      RETURN jsonb_build_object('ok', false, 'code', 'AMBIGUOUS_CODE');
    END IF;

    SELECT l.* INTO v_link
    FROM public.study_link_codes c
    JOIN public.study_links l ON l.id = c.study_link_id
    WHERE lower(c.code) = lower(v_value)
      AND c.is_active = true
      AND c.use_count < c.max_uses
      AND l.status = 'active'
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', CASE WHEN p_kind = 'code' THEN 'INVALID_CODE' ELSE 'INVALID_LINK' END
    );
  END IF;

  IF v_link.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'LINK_PAUSED');
  END IF;
  IF v_link.starts_at IS NOT NULL AND now() < v_link.starts_at THEN
    RETURN jsonb_build_object('ok', false, 'code', 'LINK_NOT_OPEN');
  END IF;
  IF v_link.ends_at IS NOT NULL AND now() > v_link.ends_at THEN
    RETURN jsonb_build_object('ok', false, 'code', 'LINK_EXPIRED');
  END IF;

  SELECT * INTO v_study
  FROM public.research_studies
  WHERE id = v_link.study_id;

  IF NOT FOUND OR (NOT v_link.is_test_link AND v_study.status <> 'active') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'STUDY_UNAVAILABLE');
  END IF;

  SELECT * INTO v_existing
  FROM public.study_participants p
  WHERE p.auth_user_id = v_user_id
    AND p.study_id = v_study.id
    AND p.is_test = v_link.is_test_link
  LIMIT 1;

  SELECT count(*) INTO v_participant_count
  FROM public.study_participants p
  WHERE p.study_link_id = v_link.id
    AND p.is_test = false
    AND p.status <> 'withdrawn';

  IF v_existing.id IS NULL
    AND NOT v_link.is_test_link
    AND v_link.max_participants IS NOT NULL
    AND v_participant_count >= v_link.max_participants
  THEN
    RETURN jsonb_build_object('ok', false, 'code', 'CAPACITY_REACHED');
  END IF;

  IF coalesce((v_study.components ->> 'consent')::boolean, false) THEN
    SELECT jsonb_build_object(
      'id', cv.id,
      'version_label', cv.version_label,
      'consent_method', cv.consent_method,
      'participant_information', cv.participant_information,
      'external_consent_note', cv.external_consent_note,
      'items', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', ci.id,
          'position', ci.position,
          'prompt', ci.prompt,
          'response_type', ci.response_type,
          'required', ci.required,
          'response_config', ci.response_config,
          'validation_config', ci.validation_config
        ) ORDER BY ci.position)
        FROM public.study_consent_items ci
        WHERE ci.consent_version_id = cv.id
      ), '[]'::jsonb)
    ) INTO v_consent
    FROM public.study_consent_versions cv
    WHERE cv.study_id = v_study.id
      AND cv.is_current = true
    ORDER BY cv.updated_at DESC
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'study', jsonb_build_object(
      'id', v_study.id,
      'title', v_study.title,
      'participant_description', v_study.participant_description,
      'design', v_study.design
    ),
    'link', jsonb_build_object(
      'access_mode', v_link.access_mode,
      'is_test_link', v_link.is_test_link,
      'requires_participant_code', v_link.access_mode = 'participant_code' AND p_kind = 'token'
    ),
    'consent', v_consent,
    'already_enrolled', v_existing.id IS NOT NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.psylattice_mobile_participant_studies()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_studies jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'study_id', s.id,
    'participant_id', p.id,
    'title', s.title,
    'participant_description', s.participant_description,
    'enrollment_status', p.status,
    'is_test', p.is_test,
    'enrolled_at', p.enrolled_at,
    'completed_at', p.completed_at
  ) ORDER BY p.enrolled_at DESC), '[]'::jsonb)
  INTO v_studies
  FROM public.study_participants p
  JOIN public.research_studies s ON s.id = p.study_id
  WHERE p.auth_user_id = v_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'studies', v_studies,
    'server_time', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.psylattice_mobile_participant_dashboard(
  p_study_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_participant public.study_participants%rowtype;
  v_study public.research_studies%rowtype;
  v_session public.participant_sessions%rowtype;
  v_today jsonb := '[]'::jsonb;
  v_upcoming jsonb := '[]'::jsonb;
  v_completed jsonb := '[]'::jsonb;
  v_missed jsonb := '[]'::jsonb;
  v_required integer := 0;
  v_completed_count integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  END IF;

  SELECT * INTO v_participant
  FROM public.study_participants
  WHERE auth_user_id = v_user_id AND study_id = p_study_id
  ORDER BY enrolled_at DESC
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  END IF;

  SELECT * INTO v_study FROM public.research_studies WHERE id = p_study_id;
  SELECT * INTO v_session
  FROM public.participant_sessions
  WHERE participant_id = v_participant.id
  ORDER BY started_at DESC
  LIMIT 1;

  WITH task_rows AS (
    SELECT
      sm.id,
      sm.measurement_point,
      sm.position,
      sm.required,
      q.name AS title,
      q.estimated_minutes,
      sms.completed_at,
      CASE
        WHEN sms.status = 'completed' THEN 'completed'
        WHEN v_participant.status = 'withdrawn' THEN 'unavailable'
        WHEN v_session.status = 'in_progress' AND sm.measurement_point = v_session.phase THEN 'due'
        ELSE 'upcoming'
      END AS mobile_status
    FROM public.study_measures sm
    JOIN public.questionnaires q ON q.id = sm.questionnaire_id
    LEFT JOIN LATERAL (
      SELECT candidate.status, candidate.completed_at
      FROM public.study_measure_sessions candidate
      JOIN public.participant_sessions session_row
        ON session_row.id = candidate.participant_session_id
      WHERE session_row.participant_id = v_participant.id
        AND candidate.study_measure_id = sm.id
      ORDER BY candidate.started_at DESC
      LIMIT 1
    ) sms ON true
    WHERE sm.study_id = p_study_id
  ), task_json AS (
    SELECT *, jsonb_build_object(
      'task_id', id,
      'study_id', p_study_id,
      'task_type', 'questionnaire',
      'title', title,
      'status', mobile_status,
      'measurement_point', measurement_point,
      'required', required,
      'estimated_minutes', estimated_minutes,
      'opens_at', CASE WHEN mobile_status = 'due' THEN v_session.started_at ELSE null END,
      'due_at', null,
      'completed_at', completed_at
    ) AS payload
    FROM task_rows
  )
  SELECT
    coalesce(jsonb_agg(payload ORDER BY position) FILTER (WHERE mobile_status = 'due'), '[]'::jsonb),
    coalesce(jsonb_agg(payload ORDER BY measurement_point, position) FILTER (WHERE mobile_status = 'upcoming'), '[]'::jsonb),
    coalesce(jsonb_agg(payload ORDER BY completed_at DESC) FILTER (WHERE mobile_status = 'completed'), '[]'::jsonb),
    coalesce(jsonb_agg(payload ORDER BY position) FILTER (WHERE mobile_status = 'missed'), '[]'::jsonb),
    count(*) FILTER (WHERE required),
    count(*) FILTER (WHERE required AND mobile_status = 'completed')
  INTO v_today, v_upcoming, v_completed, v_missed, v_required, v_completed_count
  FROM task_json;

  RETURN jsonb_build_object(
    'ok', true,
    'study', jsonb_build_object(
      'study_id', v_study.id,
      'participant_id', v_participant.id,
      'title', v_study.title,
      'participant_description', v_study.participant_description,
      'enrollment_status', v_participant.status,
      'is_test', v_participant.is_test,
      'enrolled_at', v_participant.enrolled_at,
      'completed_at', v_participant.completed_at
    ),
    'today', v_today,
    'upcoming', v_upcoming,
    'completed', v_completed,
    'missed', v_missed,
    'progress', jsonb_build_object(
      'completed_required', v_completed_count,
      'total_required', v_required
    ),
    'last_synced_at', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.psylattice_mobile_participant_task(
  p_task_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_participant public.study_participants%rowtype;
  v_session public.participant_sessions%rowtype;
  v_measure public.study_measures%rowtype;
  v_questionnaire public.questionnaires%rowtype;
  v_version public.questionnaire_versions%rowtype;
  v_measure_session public.study_measure_sessions%rowtype;
  v_items jsonb := '[]'::jsonb;
  v_native_supported boolean := false;
  v_status text := 'upcoming';
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  END IF;

  SELECT * INTO v_measure FROM public.study_measures WHERE id = p_task_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TASK_NOT_FOUND');
  END IF;

  SELECT * INTO v_participant
  FROM public.study_participants
  WHERE auth_user_id = v_user_id AND study_id = v_measure.study_id
  ORDER BY enrolled_at DESC
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  END IF;

  SELECT * INTO v_session FROM public.participant_sessions
  WHERE participant_id = v_participant.id
  ORDER BY started_at DESC LIMIT 1;
  SELECT * INTO v_questionnaire FROM public.questionnaires WHERE id = v_measure.questionnaire_id;
  SELECT * INTO v_version FROM public.questionnaire_versions WHERE id = v_measure.questionnaire_version_id;
  SELECT candidate.* INTO v_measure_session
  FROM public.study_measure_sessions candidate
  JOIN public.participant_sessions session_row ON session_row.id = candidate.participant_session_id
  WHERE session_row.participant_id = v_participant.id
    AND candidate.study_measure_id = v_measure.id
  ORDER BY candidate.started_at DESC LIMIT 1;

  IF v_measure_session.status = 'completed' THEN
    v_status := 'completed';
  ELSIF v_participant.status = 'withdrawn' THEN
    v_status := 'unavailable';
  ELSIF v_session.status = 'in_progress' AND v_measure.measurement_point = v_session.phase THEN
    v_status := 'due';
  END IF;

  SELECT NOT EXISTS(
    SELECT 1 FROM public.questionnaire_items qi
    WHERE qi.version_id = v_version.id
      AND (
        qi.response_type NOT IN (
          'likert', 'frequency', 'intensity', 'yes_no', 'true_false',
          'single_choice', 'dropdown', 'multiple_choice', 'checklist',
          'numeric_rating', 'slider', 'visual_analogue', 'star_rating',
          'semantic_differential', 'integer', 'decimal', 'percentage',
          'duration', 'short_text', 'long_text', 'email', 'phone',
          'location', 'date', 'time', 'datetime'
        )
        OR qi.is_content_only
        OR (
          qi.response_type IN (
            'likert', 'frequency', 'intensity', 'yes_no', 'true_false',
            'single_choice', 'dropdown', 'multiple_choice', 'checklist'
          )
          AND CASE
            WHEN jsonb_typeof(qi.response_options) = 'array' THEN
              jsonb_array_length(qi.response_options) = 0 OR EXISTS (
                SELECT 1 FROM jsonb_array_elements(qi.response_options) option_row
                WHERE nullif(trim(option_row ->> 'label'), '') IS NULL
                  OR coalesce(jsonb_typeof(option_row -> 'value'), 'null')
                    NOT IN ('string', 'number', 'boolean')
              )
            ELSE true
          END
        )
        OR coalesce(qi.media_config, '{}'::jsonb) <> '{}'::jsonb
        OR coalesce(qi.display_logic -> 'rules', '[]'::jsonb) <> '[]'::jsonb
        OR coalesce((qi.randomization_config ->> 'randomize_options')::boolean, false)
      )
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.questionnaire_blocks qb
    WHERE qb.version_id = v_version.id
      AND (qb.randomize_items OR coalesce(qb.display_logic -> 'rules', '[]'::jsonb) <> '[]'::jsonb)
  )
  AND NOT coalesce((v_version.randomization_config ->> 'randomize_all_items')::boolean, false)
  AND v_version.scoring_method = 'none'
  INTO v_native_supported;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', qi.id,
    'position', qi.position,
    'prompt', qi.prompt,
    'help_text', qi.help_text,
    'response_type', qi.response_type,
    'required', qi.required,
    'response_options', coalesce((
      SELECT jsonb_agg(jsonb_build_object('label', option_row ->> 'label', 'value', option_row -> 'value'))
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(qi.response_options) = 'array' THEN qi.response_options
          ELSE '[]'::jsonb
        END
      ) option_row
    ), '[]'::jsonb),
    'response_config', jsonb_build_object(
      'min', qi.response_config -> 'min',
      'max', qi.response_config -> 'max',
      'step', qi.response_config -> 'step',
      'left_anchor', qi.response_config -> 'left_anchor',
      'right_anchor', qi.response_config -> 'right_anchor',
      'min_selections', qi.response_config -> 'min_selections',
      'max_selections', qi.response_config -> 'max_selections',
      'max_characters', qi.response_config -> 'max_characters'
    )
  ) ORDER BY qi.position), '[]'::jsonb)
  INTO v_items
  FROM public.questionnaire_items qi
  WHERE qi.version_id = v_version.id
    AND NOT qi.is_content_only
    AND v_status IN ('due', 'completed');

  RETURN jsonb_build_object(
    'ok', true,
    'task', jsonb_build_object(
      'task_id', v_measure.id,
      'study_id', v_measure.study_id,
      'participant_id', v_participant.id,
      'task_type', 'questionnaire',
      'title', v_questionnaire.name,
      'instructions', CASE
        WHEN v_status IN ('due', 'completed') THEN v_version.participant_instructions
        ELSE null
      END,
      'estimated_minutes', v_questionnaire.estimated_minutes,
      'measurement_point', v_measure.measurement_point,
      'status', v_status,
      'native_supported', v_native_supported,
      'web_fallback_available', true,
      'items', v_items
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.psylattice_mobile_join(
  p_kind text,
  p_value text,
  p_participant_code text,
  p_consent_version_id uuid,
  p_consent_responses jsonb,
  p_idempotency_key uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_value text := trim(coalesce(p_value, ''));
  v_code_value text := nullif(trim(coalesce(p_participant_code, '')), '');
  v_link public.study_links%rowtype;
  v_study public.research_studies%rowtype;
  v_code public.study_link_codes%rowtype;
  v_existing public.study_participants%rowtype;
  v_existing_session public.participant_sessions%rowtype;
  v_consent public.study_consent_versions%rowtype;
  v_consent_item record;
  v_answer jsonb;
  v_answer_text text;
  v_correct text;
  v_consent_snapshot jsonb := '{}'::jsonb;
  v_participant_id uuid;
  v_session_id uuid;
  v_public_id text;
  v_count integer := 0;
  v_code_matches integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  END IF;
  IF v_value = '' OR p_kind NOT IN ('token', 'code') OR p_idempotency_key IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
  END IF;

  SELECT * INTO v_existing
  FROM public.study_participants
  WHERE auth_user_id = v_user_id
    AND mobile_enrollment_idempotency_key = p_idempotency_key
  LIMIT 1;

  IF FOUND THEN
    SELECT * INTO v_existing_session
    FROM public.participant_sessions
    WHERE participant_id = v_existing.id
    ORDER BY started_at DESC
    LIMIT 1;
    RETURN jsonb_build_object(
      'ok', true,
      'already_enrolled', true,
      'participant_id', v_existing.id,
      'study_id', v_existing.study_id,
      'enrollment_status', v_existing.status,
      'participant_session_id', v_existing_session.id
    );
  END IF;

  IF p_kind = 'token' THEN
    SELECT * INTO v_link
    FROM public.study_links
    WHERE token = v_value
    FOR UPDATE;
  ELSE
    SELECT count(*) INTO v_code_matches
    FROM public.study_link_codes c
    JOIN public.study_links l ON l.id = c.study_link_id
    WHERE lower(c.code) = lower(v_value)
      AND c.is_active = true
      AND c.use_count < c.max_uses
      AND l.status = 'active';
    IF v_code_matches > 1 THEN
      RETURN jsonb_build_object('ok', false, 'code', 'AMBIGUOUS_CODE');
    END IF;
    SELECT l.* INTO v_link
    FROM public.study_link_codes c
    JOIN public.study_links l ON l.id = c.study_link_id
    WHERE lower(c.code) = lower(v_value)
      AND c.is_active = true
      AND c.use_count < c.max_uses
      AND l.status = 'active'
    LIMIT 1
    FOR UPDATE OF l, c;

    IF FOUND THEN
      SELECT * INTO v_code
      FROM public.study_link_codes c
      WHERE c.study_link_id = v_link.id
        AND lower(c.code) = lower(v_value)
        AND c.is_active = true
        AND c.use_count < c.max_uses
      FOR UPDATE
      LIMIT 1;

      v_code_value := v_code.code;
    END IF;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', CASE WHEN p_kind = 'code' THEN 'INVALID_CODE' ELSE 'INVALID_LINK' END
    );
  END IF;
  IF v_link.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'LINK_PAUSED');
  END IF;
  IF v_link.starts_at IS NOT NULL AND now() < v_link.starts_at THEN
    RETURN jsonb_build_object('ok', false, 'code', 'LINK_NOT_OPEN');
  END IF;
  IF v_link.ends_at IS NOT NULL AND now() > v_link.ends_at THEN
    RETURN jsonb_build_object('ok', false, 'code', 'LINK_EXPIRED');
  END IF;

  SELECT * INTO v_study
  FROM public.research_studies
  WHERE id = v_link.study_id;
  IF NOT FOUND OR (NOT v_link.is_test_link AND v_study.status <> 'active') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'STUDY_UNAVAILABLE');
  END IF;

  SELECT * INTO v_existing
  FROM public.study_participants p
  WHERE p.auth_user_id = v_user_id
    AND p.study_id = v_study.id
    AND p.is_test = v_link.is_test_link
  LIMIT 1;
  IF FOUND THEN
    SELECT * INTO v_existing_session
    FROM public.participant_sessions
    WHERE participant_id = v_existing.id
    ORDER BY started_at DESC
    LIMIT 1;
    RETURN jsonb_build_object(
      'ok', true,
      'already_enrolled', true,
      'participant_id', v_existing.id,
      'study_id', v_existing.study_id,
      'enrollment_status', v_existing.status,
      'participant_session_id', v_existing_session.id
    );
  END IF;

  IF v_link.access_mode = 'participant_code' THEN
    IF v_code_value IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'code', 'INVALID_CODE');
    END IF;
    SELECT * INTO v_code
    FROM public.study_link_codes c
    WHERE c.study_link_id = v_link.id
      AND lower(c.code) = lower(v_code_value)
      AND c.is_active = true
      AND c.use_count < c.max_uses
    FOR UPDATE
    LIMIT 1;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'code', 'INVALID_CODE');
    END IF;
  END IF;

  IF NOT v_link.is_test_link AND v_link.max_participants IS NOT NULL THEN
    SELECT count(*) INTO v_count
    FROM public.study_participants p
    WHERE p.study_link_id = v_link.id
      AND p.is_test = false
      AND p.status <> 'withdrawn';
    IF v_count >= v_link.max_participants THEN
      RETURN jsonb_build_object('ok', false, 'code', 'CAPACITY_REACHED');
    END IF;
  END IF;

  IF coalesce((v_study.components ->> 'consent')::boolean, false) THEN
    SELECT * INTO v_consent
    FROM public.study_consent_versions
    WHERE study_id = v_study.id AND is_current = true
    ORDER BY updated_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED');
    END IF;
    IF v_consent.consent_method = 'external' THEN
      RETURN jsonb_build_object('ok', false, 'code', 'CONSENT_EXTERNAL_REQUIRED');
    END IF;
    IF v_consent.consent_method = 'psylattice' THEN
      IF p_consent_version_id IS DISTINCT FROM v_consent.id THEN
        RETURN jsonb_build_object('ok', false, 'code', 'CONSENT_VERSION_CHANGED');
      END IF;
      IF p_consent_responses IS NULL OR jsonb_typeof(p_consent_responses) <> 'object' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
      END IF;

      FOR v_consent_item IN
        SELECT * FROM public.study_consent_items
        WHERE consent_version_id = v_consent.id
        ORDER BY position
      LOOP
        v_answer := p_consent_responses -> v_consent_item.id::text;
        IF v_consent_item.required THEN
          IF v_answer IS NULL OR v_answer = 'null'::jsonb THEN
            RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
          END IF;
          IF v_consent_item.response_type = 'checkbox' AND v_answer <> 'true'::jsonb THEN
            RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
          END IF;
          IF v_consent_item.response_type = 'yes_no' THEN
            v_answer_text := lower(trim(both '"' from v_answer::text));
            IF v_answer_text NOT IN ('yes', 'true', '1') THEN
              RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
            END IF;
          END IF;
          IF v_consent_item.response_type IN ('initials', 'typed_name', 'date') THEN
            IF jsonb_typeof(v_answer) <> 'string' OR trim(both '"' from v_answer::text) = '' THEN
              RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
            END IF;
          END IF;
        END IF;
        IF v_consent_item.response_type = 'comprehension'
          AND coalesce((v_consent_item.validation_config ->> 'must_be_correct')::boolean, false)
        THEN
          v_correct := v_consent_item.response_config ->> 'correct_option';
          v_answer_text := trim(both '"' from coalesce(v_answer, 'null'::jsonb)::text);
          IF v_correct IS NOT NULL AND v_answer_text IS DISTINCT FROM v_correct THEN
            RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
          END IF;
        END IF;
      END LOOP;

      SELECT jsonb_build_object(
        'consent_version_id', v_consent.id,
        'version_label', v_consent.version_label,
        'consent_method', v_consent.consent_method,
        'participant_information', v_consent.participant_information,
        'items', coalesce(jsonb_agg(jsonb_build_object(
          'id', ci.id,
          'position', ci.position,
          'prompt', ci.prompt,
          'response_type', ci.response_type,
          'required', ci.required,
          'response_config', ci.response_config,
          'validation_config', ci.validation_config
        ) ORDER BY ci.position), '[]'::jsonb)
      ) INTO v_consent_snapshot
      FROM public.study_consent_items ci
      WHERE ci.consent_version_id = v_consent.id;
    END IF;
  END IF;

  v_public_id := 'PL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  INSERT INTO public.study_participants (
    study_id, study_link_id, owner_user_id, public_id, participant_code,
    is_test, status, auth_user_id, mobile_enrollment_idempotency_key
  ) VALUES (
    v_study.id, v_link.id, v_study.owner_user_id, v_public_id,
    v_code_value, v_link.is_test_link, 'active', v_user_id, p_idempotency_key
  ) RETURNING id INTO v_participant_id;

  INSERT INTO public.participant_sessions (
    participant_id, study_id, study_link_id, owner_user_id, phase, status, is_test
  ) VALUES (
    v_participant_id, v_study.id, v_link.id, v_study.owner_user_id,
    'baseline', 'in_progress', v_link.is_test_link
  ) RETURNING id INTO v_session_id;

  IF v_link.access_mode = 'participant_code' THEN
    UPDATE public.study_link_codes SET use_count = use_count + 1 WHERE id = v_code.id;
  END IF;

  IF v_consent.id IS NOT NULL AND v_consent.consent_method = 'psylattice' THEN
    INSERT INTO public.participant_consents (
      participant_id, participant_session_id, study_id, consent_version_id,
      owner_user_id, consented, responses, consent_snapshot, consented_at
    ) VALUES (
      v_participant_id, v_session_id, v_study.id, v_consent.id,
      v_study.owner_user_id, true, p_consent_responses, v_consent_snapshot, now()
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'already_enrolled', false,
    'participant_id', v_participant_id,
    'study_id', v_study.id,
    'enrollment_status', 'active',
    'participant_session_id', v_session_id
  );
EXCEPTION
  WHEN unique_violation THEN
    SELECT * INTO v_existing
    FROM public.study_participants p
    WHERE p.auth_user_id = v_user_id
      AND (p.mobile_enrollment_idempotency_key = p_idempotency_key OR p.study_id = v_study.id)
    ORDER BY p.enrolled_at DESC
    LIMIT 1;
    IF FOUND THEN
      SELECT * INTO v_existing_session FROM public.participant_sessions
      WHERE participant_id = v_existing.id ORDER BY started_at DESC LIMIT 1;
      RETURN jsonb_build_object(
        'ok', true,
        'already_enrolled', true,
        'participant_id', v_existing.id,
        'study_id', v_existing.study_id,
        'enrollment_status', v_existing.status,
        'participant_session_id', v_existing_session.id
      );
    END IF;
    RETURN jsonb_build_object('ok', false, 'code', 'ENROLLMENT_UNAVAILABLE');
END;
$$;

CREATE OR REPLACE FUNCTION public.psylattice_mobile_complete_task(
  p_task_id uuid,
  p_answers jsonb,
  p_idempotency_key uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_participant public.study_participants%rowtype;
  v_session public.participant_sessions%rowtype;
  v_measure public.study_measures%rowtype;
  v_version public.questionnaire_versions%rowtype;
  v_existing public.study_measure_sessions%rowtype;
  v_item record;
  v_answer jsonb;
  v_option jsonb;
  v_valid_option boolean;
  v_selected_count integer;
  v_min numeric;
  v_max numeric;
  v_numeric numeric;
  v_max_characters integer;
  v_answer_rows jsonb := '[]'::jsonb;
  v_result jsonb;
  v_native_supported boolean := false;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  END IF;
  IF p_idempotency_key IS NULL OR p_answers IS NULL OR jsonb_typeof(p_answers) <> 'object' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
  END IF;

  SELECT * INTO v_existing
  FROM public.study_measure_sessions
  WHERE mobile_idempotency_key = p_idempotency_key
  LIMIT 1;
  IF FOUND THEN
    IF EXISTS (
      SELECT 1 FROM public.participant_sessions ps
      JOIN public.study_participants participant ON participant.id = ps.participant_id
      WHERE ps.id = v_existing.participant_session_id
        AND participant.auth_user_id = v_user_id
        AND v_existing.study_measure_id = p_task_id
    ) THEN
      RETURN jsonb_build_object(
        'ok', true,
        'already_completed', true,
        'task_id', p_task_id,
        'completed_at', v_existing.completed_at
      );
    END IF;
    RETURN jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  END IF;

  SELECT * INTO v_measure FROM public.study_measures WHERE id = p_task_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TASK_NOT_FOUND');
  END IF;
  SELECT * INTO v_participant
  FROM public.study_participants
  WHERE auth_user_id = v_user_id AND study_id = v_measure.study_id
  ORDER BY enrolled_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  END IF;
  SELECT * INTO v_session
  FROM public.participant_sessions
  WHERE participant_id = v_participant.id
  ORDER BY started_at DESC LIMIT 1;
  IF NOT FOUND OR v_session.status <> 'in_progress'
    OR v_measure.measurement_point <> v_session.phase
    OR v_participant.status = 'withdrawn'
  THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TASK_NOT_AVAILABLE');
  END IF;

  SELECT candidate.* INTO v_existing
  FROM public.study_measure_sessions candidate
  WHERE candidate.participant_session_id = v_session.id
    AND candidate.study_measure_id = v_measure.id
  LIMIT 1;
  IF FOUND AND v_existing.status = 'completed' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TASK_ALREADY_COMPLETED');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.research_studies rs
    JOIN public.study_consent_versions cv ON cv.study_id = rs.id AND cv.is_current = true
    WHERE rs.id = v_measure.study_id
      AND coalesce((rs.components ->> 'consent')::boolean, false)
      AND cv.consent_method = 'psylattice'
      AND NOT EXISTS (
        SELECT 1 FROM public.participant_consents pc
        WHERE pc.participant_id = v_participant.id
          AND pc.participant_session_id = v_session.id
          AND pc.consent_version_id = cv.id
          AND pc.consented = true
      )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED');
  END IF;

  SELECT * INTO v_version
  FROM public.questionnaire_versions
  WHERE id = v_measure.questionnaire_version_id;

  SELECT NOT EXISTS(
    SELECT 1 FROM public.questionnaire_items qi
    WHERE qi.version_id = v_version.id
      AND (
        qi.response_type NOT IN (
          'likert', 'frequency', 'intensity', 'yes_no', 'true_false',
          'single_choice', 'dropdown', 'multiple_choice', 'checklist',
          'numeric_rating', 'slider', 'visual_analogue', 'star_rating',
          'semantic_differential', 'integer', 'decimal', 'percentage',
          'duration', 'short_text', 'long_text', 'email', 'phone',
          'location', 'date', 'time', 'datetime'
        )
        OR qi.is_content_only
        OR (
          qi.response_type IN (
            'likert', 'frequency', 'intensity', 'yes_no', 'true_false',
            'single_choice', 'dropdown', 'multiple_choice', 'checklist'
          )
          AND CASE
            WHEN jsonb_typeof(qi.response_options) = 'array' THEN
              jsonb_array_length(qi.response_options) = 0 OR EXISTS (
                SELECT 1 FROM jsonb_array_elements(qi.response_options) option_row
                WHERE nullif(trim(option_row ->> 'label'), '') IS NULL
                  OR coalesce(jsonb_typeof(option_row -> 'value'), 'null')
                    NOT IN ('string', 'number', 'boolean')
              )
            ELSE true
          END
        )
        OR coalesce(qi.media_config, '{}'::jsonb) <> '{}'::jsonb
        OR coalesce(qi.display_logic -> 'rules', '[]'::jsonb) <> '[]'::jsonb
        OR coalesce((qi.randomization_config ->> 'randomize_options')::boolean, false)
      )
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.questionnaire_blocks qb
    WHERE qb.version_id = v_version.id
      AND (qb.randomize_items OR coalesce(qb.display_logic -> 'rules', '[]'::jsonb) <> '[]'::jsonb)
  )
  AND NOT coalesce((v_version.randomization_config ->> 'randomize_all_items')::boolean, false)
  AND v_version.scoring_method = 'none'
  INTO v_native_supported;

  IF NOT v_native_supported THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TASK_REQUIRES_WEB');
  END IF;

  FOR v_item IN
    SELECT * FROM public.questionnaire_items
    WHERE version_id = v_version.id AND NOT is_content_only
    ORDER BY position
  LOOP
    v_answer := p_answers -> v_item.id::text;
    IF v_item.required AND (
      v_answer IS NULL OR v_answer = 'null'::jsonb
      OR (jsonb_typeof(v_answer) = 'string' AND trim(both '"' from v_answer::text) = '')
      OR (jsonb_typeof(v_answer) = 'array' AND jsonb_array_length(v_answer) = 0)
    ) THEN
      RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
    END IF;
    IF v_answer IS NULL OR v_answer = 'null'::jsonb THEN
      CONTINUE;
    END IF;

    IF v_item.response_type IN (
      'likert', 'frequency', 'intensity', 'yes_no', 'true_false',
      'single_choice', 'dropdown'
    ) THEN
      SELECT exists(
        SELECT 1 FROM jsonb_array_elements(v_item.response_options) option_row
        WHERE option_row -> 'value' = v_answer
      ) INTO v_valid_option;
      IF NOT v_valid_option THEN
        RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
      END IF;
    ELSIF v_item.response_type IN ('multiple_choice', 'checklist') THEN
      IF jsonb_typeof(v_answer) <> 'array' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
      END IF;
      v_selected_count := jsonb_array_length(v_answer);
      v_min := coalesce(nullif(v_item.response_config ->> 'min_selections', '')::numeric, 0);
      v_max := coalesce(nullif(v_item.response_config ->> 'max_selections', '')::numeric, 0);
      IF (v_min > 0 AND v_selected_count < v_min) OR (v_max > 0 AND v_selected_count > v_max) THEN
        RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
      END IF;
      FOR v_option IN SELECT value FROM jsonb_array_elements(v_answer)
      LOOP
        SELECT exists(
          SELECT 1 FROM jsonb_array_elements(v_item.response_options) option_row
          WHERE option_row -> 'value' = v_option
        ) INTO v_valid_option;
        IF NOT v_valid_option THEN
          RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
        END IF;
      END LOOP;
    ELSIF v_item.response_type IN (
      'numeric_rating', 'slider', 'visual_analogue', 'star_rating',
      'semantic_differential', 'integer', 'decimal', 'percentage', 'duration'
    ) THEN
      IF jsonb_typeof(v_answer) <> 'number' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
      END IF;
      v_numeric := (v_answer::text)::numeric;
      v_min := nullif(v_item.response_config ->> 'min', '')::numeric;
      v_max := nullif(v_item.response_config ->> 'max', '')::numeric;
      IF (v_min IS NOT NULL AND v_numeric < v_min) OR (v_max IS NOT NULL AND v_numeric > v_max) THEN
        RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
      END IF;
      IF v_item.response_type = 'integer' AND trunc(v_numeric) <> v_numeric THEN
        RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
      END IF;
    ELSE
      IF jsonb_typeof(v_answer) <> 'string' THEN
        RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
      END IF;
      v_max_characters := nullif(v_item.response_config ->> 'max_characters', '')::integer;
      IF v_max_characters IS NOT NULL
        AND char_length(trim(both '"' from v_answer::text)) > v_max_characters
      THEN
        RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
      END IF;
    END IF;

    v_answer_rows := v_answer_rows || jsonb_build_array(jsonb_build_object(
      'item_id', v_item.id,
      'response', v_answer,
      'numeric_value', CASE WHEN jsonb_typeof(v_answer) = 'number' THEN v_answer ELSE null END,
      'text_value', CASE WHEN jsonb_typeof(v_answer) = 'string' THEN trim(both '"' from v_answer::text) ELSE null END,
      'score_value', null
    ));
  END LOOP;

  v_result := public.psylattice_save_measure(
    v_session.session_token,
    v_measure.id,
    v_answer_rows,
    '{}'::jsonb
  );
  IF NOT coalesce((v_result ->> 'ok')::boolean, false) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TASK_NOT_AVAILABLE');
  END IF;

  UPDATE public.study_measure_sessions
  SET mobile_idempotency_key = p_idempotency_key
  WHERE participant_session_id = v_session.id
    AND study_measure_id = v_measure.id
  RETURNING * INTO v_existing;

  RETURN jsonb_build_object(
    'ok', true,
    'already_completed', false,
    'task_id', p_task_id,
    'completed_at', v_existing.completed_at
  );
EXCEPTION
  WHEN unique_violation THEN
    SELECT * INTO v_existing FROM public.study_measure_sessions
    WHERE mobile_idempotency_key = p_idempotency_key LIMIT 1;
    IF FOUND AND EXISTS (
      SELECT 1
      FROM public.participant_sessions ps
      JOIN public.study_participants participant ON participant.id = ps.participant_id
      WHERE ps.id = v_existing.participant_session_id
        AND participant.auth_user_id = v_user_id
        AND v_existing.study_measure_id = p_task_id
    ) THEN
      RETURN jsonb_build_object(
        'ok', true,
        'already_completed', true,
        'task_id', p_task_id,
        'completed_at', v_existing.completed_at
      );
    END IF;
    RETURN jsonb_build_object('ok', false, 'code', 'TASK_ALREADY_COMPLETED');
END;
$$;

CREATE OR REPLACE FUNCTION public.psylattice_mobile_create_web_handoff(
  p_task_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_participant public.study_participants%rowtype;
  v_session public.participant_sessions%rowtype;
  v_measure public.study_measures%rowtype;
  v_raw_token text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  END IF;
  SELECT * INTO v_measure FROM public.study_measures WHERE id = p_task_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TASK_NOT_FOUND');
  END IF;
  SELECT * INTO v_participant FROM public.study_participants
  WHERE auth_user_id = v_user_id AND study_id = v_measure.study_id
  ORDER BY enrolled_at DESC LIMIT 1;
  IF NOT FOUND OR v_participant.status = 'withdrawn' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  END IF;
  SELECT * INTO v_session FROM public.participant_sessions
  WHERE participant_id = v_participant.id
  ORDER BY started_at DESC LIMIT 1;
  IF NOT FOUND
    OR v_session.status <> 'in_progress'
    OR v_measure.measurement_point <> v_session.phase
  THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TASK_NOT_AVAILABLE');
  END IF;

  v_raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.mobile_participant_web_handoffs (
    auth_user_id, participant_session_id, study_link_id, study_measure_id,
    token_hash, expires_at
  ) VALUES (
    v_user_id, v_session.id, v_session.study_link_id, p_task_id,
    extensions.digest(v_raw_token, 'sha256'), now() + interval '5 minutes'
  );
  RETURN jsonb_build_object('ok', true, 'handoff_token', v_raw_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.psylattice_exchange_mobile_web_handoff(
  p_handoff_token text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_handoff public.mobile_participant_web_handoffs%rowtype;
  v_session public.participant_sessions%rowtype;
  v_link public.study_links%rowtype;
BEGIN
  IF nullif(trim(coalesce(p_handoff_token, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
  END IF;
  SELECT * INTO v_handoff
  FROM public.mobile_participant_web_handoffs
  WHERE token_hash = extensions.digest(trim(p_handoff_token), 'sha256')
    AND consumed_at IS NULL
    AND expires_at > now()
  FOR UPDATE
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TASK_NOT_AVAILABLE');
  END IF;
  SELECT * INTO v_session FROM public.participant_sessions
  WHERE id = v_handoff.participant_session_id AND status = 'in_progress';
  SELECT * INTO v_link FROM public.study_links WHERE id = v_handoff.study_link_id;
  IF v_session.id IS NULL OR v_link.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TASK_NOT_AVAILABLE');
  END IF;
  UPDATE public.mobile_participant_web_handoffs
  SET consumed_at = now()
  WHERE id = v_handoff.id;
  RETURN jsonb_build_object(
    'ok', true,
    'link_token', v_link.token,
    'session_token', v_session.session_token,
    'task_id', v_handoff.study_measure_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.psylattice_mobile_resolve_join(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_join(text, text, text, uuid, jsonb, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_participant_studies() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_participant_dashboard(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_participant_task(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_complete_task(uuid, jsonb, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_create_web_handoff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_exchange_mobile_web_handoff(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.psylattice_mobile_resolve_join(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_join(text, text, text, uuid, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_participant_studies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_participant_dashboard(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_participant_task(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_complete_task(uuid, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_create_web_handoff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_exchange_mobile_web_handoff(text) TO anon, authenticated;

COMMENT ON COLUMN public.study_participants.auth_user_id IS
  'Optional Supabase account binding for authenticated mobile participation; legacy public web participants remain null.';
COMMENT ON COLUMN public.study_measure_sessions.mobile_idempotency_key IS
  'Stable key for exactly-once logical mobile questionnaire completion.';
COMMENT ON TABLE public.mobile_participant_web_handoffs IS
  'Single-use, five-minute bridge into the existing public study runner. Only token hashes are stored.';
