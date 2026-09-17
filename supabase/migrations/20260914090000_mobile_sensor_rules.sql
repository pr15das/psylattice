BEGIN;

CREATE TABLE public.mobile_sensor_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  study_id uuid NOT NULL REFERENCES public.research_studies(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  metric text NOT NULL CHECK (metric IN ('heart_rate', 'steps')),
  operator text NOT NULL CHECK (operator IN ('greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal')),
  threshold numeric NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds BETWEEN 0 AND 86400),
  max_sample_age_seconds integer NOT NULL DEFAULT 3600 CHECK (max_sample_age_seconds BETWEEN 1 AND 604800),
  active_start_minute integer CHECK (active_start_minute IS NULL OR active_start_minute BETWEEN 0 AND 1439),
  active_end_minute integer CHECK (active_end_minute IS NULL OR active_end_minute BETWEEN 0 AND 1439),
  timezone text NOT NULL DEFAULT 'UTC',
  cooldown_seconds integer NOT NULL DEFAULT 0 CHECK (cooldown_seconds BETWEEN 0 AND 604800),
  max_triggers_per_day integer NOT NULL DEFAULT 1 CHECK (max_triggers_per_day BETWEEN 1 AND 100),
  target_measure_id uuid REFERENCES public.study_measures(id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mobile_sensor_rules_study_enabled_idx ON public.mobile_sensor_rules(study_id, enabled);
CREATE INDEX mobile_sensor_rules_expiry_idx ON public.mobile_sensor_rules(expires_at);
ALTER TABLE public.mobile_sensor_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobile_sensor_rules FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mobile_sensor_rules TO service_role;

CREATE TABLE public.mobile_sensor_trigger_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE CHECK (length(event_id) BETWEEN 8 AND 256),
  rule_id uuid NOT NULL REFERENCES public.mobile_sensor_rules(id) ON DELETE CASCADE,
  rule_version integer NOT NULL CHECK (rule_version > 0),
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.study_participants(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES public.research_studies(id) ON DELETE CASCADE,
  installation_id uuid NOT NULL,
  triggered_at timestamptz NOT NULL,
  metric text NOT NULL CHECK (metric IN ('heart_rate', 'steps')),
  target_measure_id uuid REFERENCES public.study_measures(id) ON DELETE SET NULL,
  delivery_state text NOT NULL DEFAULT 'pending' CHECK (delivery_state IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mobile_sensor_events_participant_idx ON public.mobile_sensor_trigger_events(participant_id, triggered_at DESC);
CREATE INDEX mobile_sensor_events_rule_idx ON public.mobile_sensor_trigger_events(rule_id, triggered_at DESC);
ALTER TABLE public.mobile_sensor_trigger_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobile_sensor_trigger_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mobile_sensor_trigger_events TO service_role;

CREATE OR REPLACE FUNCTION public.psylattice_mobile_participant_sensor_rules(p_study_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid := auth.uid(); v_rules jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED'); END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'version', r.version, 'study_id', r.study_id, 'enabled', r.enabled,
    'metric', r.metric, 'operator', r.operator, 'threshold', r.threshold,
    'duration_seconds', r.duration_seconds, 'max_sample_age_seconds', r.max_sample_age_seconds,
    'active_start_minute', r.active_start_minute, 'active_end_minute', r.active_end_minute,
    'timezone', r.timezone, 'cooldown_seconds', r.cooldown_seconds,
    'max_triggers_per_day', r.max_triggers_per_day, 'target_measure_id', r.target_measure_id,
    'expires_at', r.expires_at
  ) ORDER BY r.created_at), '[]'::jsonb) INTO v_rules
  FROM public.mobile_sensor_rules r
  JOIN public.study_participants p ON p.study_id = r.study_id
    AND p.auth_user_id = v_user AND p.status <> 'withdrawn'
  WHERE r.enabled AND (r.expires_at IS NULL OR r.expires_at > now())
    AND (p_study_id IS NULL OR r.study_id = p_study_id);
  RETURN jsonb_build_object('ok', true, 'rules', v_rules, 'server_time', now());
END $$;

CREATE OR REPLACE FUNCTION public.psylattice_mobile_submit_sensor_trigger_event(
  p_event_id text, p_rule_id uuid, p_rule_version integer,
  p_installation_id uuid, p_triggered_at timestamptz
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid := auth.uid(); v_rule public.mobile_sensor_rules%rowtype;
  v_participant public.study_participants%rowtype; v_device public.mobile_device_registrations%rowtype;
  v_count integer;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED'); END IF;
  IF p_event_id IS NULL OR length(p_event_id) NOT BETWEEN 8 AND 256 OR p_rule_id IS NULL OR
     p_rule_version IS NULL OR p_installation_id IS NULL OR p_triggered_at IS NULL
  THEN RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED'); END IF;
  SELECT * INTO v_device FROM public.mobile_device_registrations
    WHERE installation_id = p_installation_id AND auth_user_id = v_user AND active;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'FORBIDDEN'); END IF;
  SELECT * INTO v_rule FROM public.mobile_sensor_rules WHERE id = p_rule_id;
  IF NOT FOUND OR NOT v_rule.enabled OR v_rule.version <> p_rule_version OR
     (v_rule.expires_at IS NOT NULL AND v_rule.expires_at <= now())
  THEN RETURN jsonb_build_object('ok', false, 'code', 'RULE_UNAUTHORIZED'); END IF;
  IF v_rule.target_measure_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.study_measures m
    WHERE m.id = v_rule.target_measure_id AND m.study_id = v_rule.study_id
  ) THEN RETURN jsonb_build_object('ok', false, 'code', 'RULE_UNAUTHORIZED'); END IF;
  SELECT * INTO v_participant FROM public.study_participants
    WHERE study_id = v_rule.study_id AND auth_user_id = v_user AND status <> 'withdrawn'
    ORDER BY enrolled_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'code', 'FORBIDDEN'); END IF;
  INSERT INTO public.mobile_sensor_trigger_events(
    event_id, rule_id, rule_version, auth_user_id, participant_id, study_id,
    installation_id, triggered_at, metric, target_measure_id
  ) VALUES (
    p_event_id, v_rule.id, v_rule.version, v_user, v_participant.id, v_rule.study_id,
    p_installation_id, p_triggered_at, v_rule.metric, v_rule.target_measure_id
  ) ON CONFLICT (event_id) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count = 0 AND NOT EXISTS (
    SELECT 1 FROM public.mobile_sensor_trigger_events e
    WHERE e.event_id = p_event_id
      AND e.auth_user_id = v_user
      AND e.rule_id = v_rule.id
      AND e.rule_version = v_rule.version
      AND e.installation_id = p_installation_id
      AND e.triggered_at = p_triggered_at
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'CONFLICT');
  END IF;
  RETURN jsonb_build_object('ok', true, 'idempotent', v_count = 0);
END $$;

REVOKE ALL ON FUNCTION public.psylattice_mobile_participant_sensor_rules(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_submit_sensor_trigger_event(text,uuid,integer,uuid,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_participant_sensor_rules(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_submit_sensor_trigger_event(text,uuid,integer,uuid,timestamptz) TO authenticated;

COMMENT ON TABLE public.mobile_sensor_trigger_events IS
  'Idempotent authorized sensor-rule events. Raw health measurements are intentionally not accepted or stored.';

COMMIT;
