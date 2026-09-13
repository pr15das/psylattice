-- FILE ONLY. Review against the actual ambulatory V3 SQL before applying in TEST.
-- Reuses study_measure_sessions. Does not replace either dashboard overload,
-- generate prompt times, or modify the existing email notification queue.
BEGIN;

CREATE TABLE public.mobile_device_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id uuid NOT NULL UNIQUE,
  installation_secret_hash text NOT NULL,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('android', 'ios')),
  fcm_token text UNIQUE CHECK (fcm_token IS NULL OR length(fcm_token) BETWEEN 20 AND 4096),
  timezone text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mobile_devices_owner ON public.mobile_device_registrations(auth_user_id) WHERE active;
ALTER TABLE public.mobile_device_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY mobile_device_owner ON public.mobile_device_registrations
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
REVOKE ALL ON public.mobile_device_registrations FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mobile_device_registrations TO service_role;

CREATE TABLE public.mobile_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.study_participants(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES public.research_studies(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.study_measures(id) ON DELETE CASCADE,
  task_instance_id uuid NOT NULL REFERENCES public.study_measure_sessions(id) ON DELETE CASCADE,
  device_registration_id uuid NOT NULL REFERENCES public.mobile_device_registrations(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('research_task', 'study_reminder')),
  scheduled_for timestamptz NOT NULL,
  expires_at timestamptz NOT NULL CHECK (expires_at > scheduled_for),
  timezone text NOT NULL,
  policy_eligible boolean NOT NULL DEFAULT false,
  delivery_mode text NOT NULL DEFAULT 'remote' CHECK (delivery_mode IN ('remote', 'local')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'accepted', 'failed', 'unknown', 'cancelled')),
  attempted_at timestamptz,
  accepted_at timestamptz,
  opened_at timestamptz,
  failure_code text CHECK (failure_code IS NULL OR failure_code IN ('invalid_token', 'rejected', 'unknown', 'unavailable')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_registration_id, task_instance_id, notification_type, scheduled_for)
);
CREATE INDEX mobile_notification_owner ON public.mobile_notification_deliveries(auth_user_id, scheduled_for);
CREATE INDEX mobile_notification_due ON public.mobile_notification_deliveries(scheduled_for) WHERE status = 'pending' AND delivery_mode = 'remote';
ALTER TABLE public.mobile_notification_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY mobile_notification_owner ON public.mobile_notification_deliveries
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
REVOKE ALL ON public.mobile_notification_deliveries FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mobile_notification_deliveries TO service_role;

CREATE FUNCTION public.psylattice_mobile_register_device(
  p_installation_id uuid, p_installation_secret uuid, p_platform text,
  p_fcm_token text, p_timezone text, p_enabled boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_owner uuid := auth.uid(); v_existing public.mobile_device_registrations%rowtype;
  v_device uuid;
  v_hash text := encode(extensions.digest(p_installation_secret::text, 'sha256'), 'hex');
BEGIN
  IF v_owner IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED'); END IF;
  IF p_installation_id IS NULL OR p_installation_secret IS NULL OR p_enabled IS NULL
    OR p_platform NOT IN ('android','ios') OR p_platform IS NULL
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name = p_timezone)
    OR (p_fcm_token IS NOT NULL AND (length(p_fcm_token) NOT BETWEEN 20 AND 4096 OR p_fcm_token ~ '[[:space:][:cntrl:]]'))
  THEN RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED'); END IF;
  -- Serialize registration/reassociation even for a previously unseen installation.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_installation_id::text, 0));
  SELECT * INTO v_existing FROM public.mobile_device_registrations WHERE installation_id = p_installation_id FOR UPDATE;
  IF FOUND AND v_existing.installation_secret_hash <> v_hash THEN
    RETURN jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  END IF;
  -- A token cannot be moved between installations using only a submitted token.
  IF p_fcm_token IS NOT NULL AND EXISTS (SELECT 1 FROM public.mobile_device_registrations
    WHERE fcm_token = p_fcm_token AND installation_id <> p_installation_id) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
  END IF;
  IF v_existing.auth_user_id IS DISTINCT FROM v_owner THEN
    UPDATE public.mobile_notification_deliveries SET status = 'cancelled', updated_at = now()
      WHERE device_registration_id = v_existing.id AND status IN ('pending','sending');
  END IF;
  INSERT INTO public.mobile_device_registrations(installation_id, installation_secret_hash, auth_user_id, platform, fcm_token, timezone, active)
  VALUES (p_installation_id, v_hash, v_owner, p_platform, CASE WHEN p_enabled THEN p_fcm_token ELSE NULL END, p_timezone, p_enabled)
  ON CONFLICT (installation_id) DO UPDATE SET auth_user_id = excluded.auth_user_id,
    platform = excluded.platform, fcm_token = excluded.fcm_token, timezone = excluded.timezone,
    active = excluded.active, last_seen_at = now(), updated_at = now() RETURNING id INTO v_device;
  -- Restore this owner's future, unattempted transport cancellations on return.
  -- Protocol cancellations set policy_eligible=false and remain cancelled.
  UPDATE public.mobile_notification_deliveries SET status = 'pending', delivery_mode = 'remote', updated_at = now()
    WHERE device_registration_id = v_device AND auth_user_id = v_owner AND p_enabled
      AND status = 'cancelled' AND policy_eligible AND attempted_at IS NULL
      AND scheduled_for > now() AND expires_at > now();
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN unique_violation THEN RETURN jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
END $$;

CREATE FUNCTION public.psylattice_mobile_unregister_device(p_installation_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_device uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED'); END IF;
  UPDATE public.mobile_device_registrations SET active = false, fcm_token = NULL, auth_user_id = NULL, updated_at = now()
    WHERE installation_id = p_installation_id AND auth_user_id = auth.uid() RETURNING id INTO v_device;
  UPDATE public.mobile_notification_deliveries SET status = 'cancelled', updated_at = now()
    WHERE device_registration_id = v_device AND status IN ('pending','sending');
  RETURN jsonb_build_object('ok', true);
END $$;

-- Private source projection: checks the actual instance, current enrollment,
-- current session/phase, active study/link, completion and authoritative window.
CREATE FUNCTION public.psylattice_mobile_notification_metadata(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE d public.mobile_notification_deliveries%rowtype;
  m public.study_measure_sessions%rowtype; p public.study_participants%rowtype;
  s public.participant_sessions%rowtype; v_status text := 'unavailable'; v_valid boolean := false;
BEGIN
  SELECT * INTO d FROM public.mobile_notification_deliveries WHERE id = p_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO m FROM public.study_measure_sessions WHERE id = d.task_instance_id;
  SELECT * INTO p FROM public.study_participants WHERE id = d.participant_id;
  SELECT * INTO s FROM public.participant_sessions WHERE id = m.participant_session_id;
  v_valid := p.auth_user_id = d.auth_user_id AND p.study_id = d.study_id
    AND p.status IN ('active','baseline_complete') AND m.participant_id = p.id AND m.study_id = d.study_id
    AND m.study_measure_id = d.task_id AND s.participant_id = p.id AND s.status = 'in_progress'
    AND p.id = (SELECT id FROM public.study_participants WHERE study_id = d.study_id AND auth_user_id = d.auth_user_id ORDER BY enrolled_at DESC LIMIT 1)
    AND s.id = (SELECT id FROM public.participant_sessions WHERE participant_id = p.id ORDER BY started_at DESC LIMIT 1)
    AND m.id = (SELECT id FROM public.study_measure_sessions WHERE participant_id = p.id AND study_measure_id = d.task_id ORDER BY started_at DESC LIMIT 1)
    AND EXISTS (SELECT 1 FROM public.research_studies WHERE id = d.study_id AND status = 'active')
    AND EXISTS (SELECT 1 FROM public.study_measures WHERE id = d.task_id AND study_id = d.study_id
      AND measurement_point = s.phase AND questionnaire_version_id = m.questionnaire_version_id)
    AND EXISTS (SELECT 1 FROM public.study_links WHERE id = p.study_link_id AND status = 'active'
      AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()))
    AND EXISTS (SELECT 1 FROM public.mobile_device_registrations WHERE id = d.device_registration_id AND auth_user_id = d.auth_user_id AND active);
  IF m.status = 'completed' THEN v_status := 'completed';
  ELSIF d.status = 'cancelled' THEN v_status := 'cancelled';
  ELSIF NOT coalesce(v_valid, false) OR m.status <> 'in_progress' THEN v_status := 'unavailable';
  ELSIF d.expires_at <= now() THEN v_status := 'expired';
  ELSIF d.scheduled_for > now() THEN v_status := 'upcoming';
  ELSE v_status := 'due'; END IF;
  RETURN jsonb_build_object('notification_id',d.id,'participant_id',d.participant_id,'study_id',d.study_id,
    'task_id',d.task_id,'task_instance_id',d.task_instance_id,'task_status',v_status,
    'scheduled_for',d.scheduled_for,'expires_at',d.expires_at,'timezone',d.timezone,
    'notification_type',d.notification_type,'delivery_mode',d.delivery_mode,
    'eligible',coalesce(v_valid,false) AND d.policy_eligible AND v_status IN ('upcoming','due'),
    'version',d.updated_at);
END $$;

-- Only a trusted adapter to the EXISTING scheduler may call this. The adapter
-- must resolve recurrence/randomization, quiet hours and cooldowns first.
-- No such adapter is enabled until the missing ambulatory SQL is supplied.
CREATE FUNCTION public.psylattice_mobile_prepare_notification(
  p_instance_id uuid, p_type text, p_scheduled_for timestamptz, p_expires_at timestamptz,
  p_timezone text, p_policy_eligible boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE m public.study_measure_sessions%rowtype; p public.study_participants%rowtype; v_count integer;
BEGIN
  IF p_scheduled_for IS NULL OR p_expires_at IS NULL OR p_expires_at <= p_scheduled_for
    OR p_type NOT IN ('research_task','study_reminder') OR p_type IS NULL
    OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name = p_timezone)
  THEN RETURN jsonb_build_object('ok',false,'code','VALIDATION_FAILED'); END IF;
  SELECT * INTO m FROM public.study_measure_sessions WHERE id = p_instance_id;
  SELECT * INTO p FROM public.study_participants WHERE id = m.participant_id;
  IF m.id IS NULL OR p.auth_user_id IS NULL THEN RETURN jsonb_build_object('ok',false,'code','TASK_NOT_FOUND'); END IF;
  INSERT INTO public.mobile_notification_deliveries(auth_user_id,participant_id,study_id,task_id,task_instance_id,
    device_registration_id,notification_type,scheduled_for,expires_at,timezone,policy_eligible)
  SELECT p.auth_user_id,p.id,m.study_id,m.study_measure_id,m.id,d.id,p_type,p_scheduled_for,p_expires_at,p_timezone,coalesce(p_policy_eligible,false)
    FROM public.mobile_device_registrations d WHERE d.auth_user_id = p.auth_user_id AND d.active
  ON CONFLICT (device_registration_id,task_instance_id,notification_type,scheduled_for) DO UPDATE
    SET expires_at = excluded.expires_at, timezone = excluded.timezone, policy_eligible = excluded.policy_eligible, updated_at = now()
    WHERE mobile_notification_deliveries.status = 'pending' AND
      (mobile_notification_deliveries.expires_at,mobile_notification_deliveries.timezone,mobile_notification_deliveries.policy_eligible)
      IS DISTINCT FROM (excluded.expires_at,excluded.timezone,excluded.policy_eligible);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('ok',true,'created',v_count);
END $$;

CREATE FUNCTION public.psylattice_mobile_cancel_instance_notifications(p_instance_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.mobile_notification_deliveries SET status = 'cancelled',policy_eligible = false,updated_at = now()
    WHERE task_instance_id = p_instance_id AND status IN ('pending','sending');
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE FUNCTION public.psylattice_mobile_notification_schedule(p_installation_id uuid,p_from timestamptz,p_to timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_items jsonb; v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'code','UNAUTHORIZED'); END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_to <= p_from OR p_to - p_from > interval '14 days'
  THEN RETURN jsonb_build_object('ok',false,'code','VALIDATION_FAILED'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.mobile_device_registrations WHERE installation_id = p_installation_id AND auth_user_id = auth.uid())
  THEN RETURN jsonb_build_object('ok',false,'code','FORBIDDEN'); END IF;
  SELECT coalesce(jsonb_agg(metadata ORDER BY scheduled_for,id),'[]'::jsonb), count(*) INTO v_items,v_count FROM (
    SELECT n.id,n.scheduled_for,public.psylattice_mobile_notification_metadata(n.id) AS metadata
      FROM public.mobile_notification_deliveries n JOIN public.mobile_device_registrations d ON d.id = n.device_registration_id
      WHERE n.auth_user_id = auth.uid() AND d.auth_user_id = auth.uid() AND d.installation_id = p_installation_id
        AND n.expires_at > p_from AND n.scheduled_for < p_to ORDER BY n.scheduled_for,n.id LIMIT 257
  ) bounded;
  RETURN jsonb_build_object('ok',true,'items',CASE WHEN v_count > 256 THEN '[]'::jsonb ELSE v_items END,
    'complete',v_count <= 256,'window_from',p_from,'window_to',p_to,'source','existing_task_instances_delivery_projection');
END $$;

CREATE FUNCTION public.psylattice_mobile_notification_target(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'code','UNAUTHORIZED'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.mobile_notification_deliveries n JOIN public.study_participants p ON p.id = n.participant_id
    WHERE n.id = p_id AND n.auth_user_id = auth.uid() AND p.auth_user_id = auth.uid())
  THEN RETURN jsonb_build_object('ok',false,'code','FORBIDDEN'); END IF;
  RETURN jsonb_build_object('ok',true,'notification',public.psylattice_mobile_notification_metadata(p_id));
END $$;

CREATE FUNCTION public.psylattice_mobile_notified_task(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_target jsonb; v_task jsonb; n public.mobile_notification_deliveries%rowtype;
BEGIN
  v_target := public.psylattice_mobile_notification_target(p_id);
  IF NOT coalesce((v_target->>'ok')::boolean,false) THEN RETURN v_target; END IF;
  IF v_target->'notification'->>'task_status' <> 'due' OR
    NOT coalesce((v_target->'notification'->>'eligible')::boolean,false)
  THEN RETURN jsonb_build_object('ok',false,'code','TASK_NOT_AVAILABLE'); END IF;
  SELECT * INTO n FROM public.mobile_notification_deliveries WHERE id = p_id;
  v_task := public.psylattice_mobile_participant_task(n.task_id);
  IF NOT coalesce((v_task->>'ok')::boolean,false) THEN RETURN v_task; END IF;
  IF v_task->'task'->>'participant_id' <> n.participant_id::text THEN
    RETURN jsonb_build_object('ok',false,'code','TASK_NOT_AVAILABLE'); END IF;
  -- The current web handoff has no exact-instance parameter. Do not route an
  -- instance-bound notification through that definition-only handoff.
  RETURN jsonb_set(v_task,'{task}',(v_task->'task') || jsonb_build_object(
    'notification_id',n.id,'task_instance_id',n.task_instance_id,'web_fallback_available',false));
END $$;

CREATE FUNCTION public.psylattice_mobile_complete_notified_task(
  p_notification_id uuid,p_task_id uuid,p_answers jsonb,p_idempotency_key uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE n public.mobile_notification_deliveries%rowtype; v_target jsonb; v_result jsonb; v_is_retry boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'code','UNAUTHORIZED'); END IF;
  SELECT * INTO n FROM public.mobile_notification_deliveries WHERE id = p_notification_id AND auth_user_id = auth.uid();
  IF NOT FOUND OR n.task_id <> p_task_id OR NOT EXISTS (SELECT 1 FROM public.study_participants
    WHERE id = n.participant_id AND auth_user_id = auth.uid())
  THEN RETURN jsonb_build_object('ok',false,'code','FORBIDDEN'); END IF;
  -- Preserve retries after successful completion if the response was lost.
  SELECT EXISTS (SELECT 1 FROM public.study_measure_sessions WHERE id = n.task_instance_id
    AND mobile_idempotency_key = p_idempotency_key AND status = 'completed') INTO v_is_retry;
  IF NOT v_is_retry THEN
    v_target := public.psylattice_mobile_notification_metadata(n.id);
    IF v_target->>'task_status' <> 'due' OR NOT coalesce((v_target->>'eligible')::boolean,false)
    THEN RETURN jsonb_build_object('ok',false,'code','TASK_NOT_AVAILABLE'); END IF;
  END IF;
  BEGIN
    -- Reuse all existing consent, validation, answer storage and scoring rules.
    v_result := public.psylattice_mobile_complete_task(p_task_id,p_answers,p_idempotency_key);
    IF coalesce((v_result->>'ok')::boolean,false) AND NOT EXISTS (
      SELECT 1 FROM public.study_measure_sessions WHERE id = n.task_instance_id
        AND participant_id = n.participant_id AND mobile_idempotency_key = p_idempotency_key AND status = 'completed'
        AND (v_is_retry OR questionnaire_version_id = (SELECT questionnaire_version_id FROM public.study_measures WHERE id = p_task_id))
    ) THEN
      -- The subtransaction rolls back ALL answer/completion changes if a newer
      -- enrollment/session/instance was selected by the legacy definition RPC.
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'Mobile task instance changed';
    END IF;
    IF coalesce((v_result->>'ok')::boolean,false) THEN
      PERFORM public.psylattice_mobile_cancel_instance_notifications(n.task_instance_id);
    END IF;
    RETURN v_result;
  EXCEPTION WHEN SQLSTATE 'P0001' THEN RETURN jsonb_build_object('ok',false,'code','TASK_NOT_AVAILABLE'); END;
END $$;

CREATE FUNCTION public.psylattice_mobile_notification_mode(p_id uuid,p_installation_id uuid,p_mode text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE n public.mobile_notification_deliveries%rowtype;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'code','UNAUTHORIZED'); END IF;
  IF p_mode NOT IN ('local','remote') OR p_mode IS NULL THEN RETURN jsonb_build_object('ok',false,'code','VALIDATION_FAILED'); END IF;
  SELECT candidate.* INTO n FROM public.mobile_notification_deliveries candidate
    JOIN public.mobile_device_registrations d ON d.id = candidate.device_registration_id
    WHERE candidate.id = p_id AND candidate.auth_user_id = auth.uid() AND d.auth_user_id = auth.uid()
      AND d.installation_id = p_installation_id FOR UPDATE OF candidate;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','FORBIDDEN'); END IF;
  IF n.status <> 'pending' OR n.attempted_at IS NOT NULL OR n.scheduled_for <= now()
    OR (p_mode = 'local' AND NOT coalesce((public.psylattice_mobile_notification_metadata(n.id)->>'eligible')::boolean,false))
  THEN RETURN jsonb_build_object('ok',false,'code','TASK_NOT_AVAILABLE'); END IF;
  -- Mode is intentionally NOT part of the version/signature: claiming does not
  -- change authoritative timing or cause repeated OS scheduling.
  UPDATE public.mobile_notification_deliveries SET delivery_mode = p_mode WHERE id = n.id;
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE FUNCTION public.psylattice_mobile_notification_opened(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'code','UNAUTHORIZED'); END IF;
  UPDATE public.mobile_notification_deliveries n SET opened_at = coalesce(opened_at,now())
    WHERE n.id = p_id AND n.auth_user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.study_participants p WHERE p.id = n.participant_id AND p.auth_user_id = auth.uid());
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','FORBIDDEN'); END IF;
  RETURN jsonb_build_object('ok',true);
END $$;

-- Service-only atomic claim. An uncertain send is never automatically retried.
CREATE FUNCTION public.psylattice_mobile_claim_notification_batch(p_limit integer DEFAULT 100)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_items jsonb;
BEGIN
  WITH candidates AS (
    SELECT n.id FROM public.mobile_notification_deliveries n
      WHERE n.status = 'pending' AND n.delivery_mode = 'remote' AND n.attempted_at IS NULL
        AND n.scheduled_for <= now() AND n.expires_at > now() AND n.policy_eligible
        AND coalesce((public.psylattice_mobile_notification_metadata(n.id)->>'eligible')::boolean,false)
        AND EXISTS (SELECT 1 FROM public.mobile_device_registrations d WHERE d.id = n.device_registration_id AND d.fcm_token IS NOT NULL)
      ORDER BY n.scheduled_for,n.id LIMIT least(greatest(coalesce(p_limit,100),1),100) FOR UPDATE SKIP LOCKED
  ), claimed AS (
    UPDATE public.mobile_notification_deliveries n SET status = 'sending', attempted_at = now()
      FROM candidates c WHERE n.id = c.id RETURNING n.id
  ) SELECT coalesce(jsonb_agg(jsonb_build_object('notification_id',id)),'[]'::jsonb) INTO v_items FROM claimed;
  RETURN jsonb_build_object('ok',true,'items',v_items);
END $$;

CREATE FUNCTION public.psylattice_mobile_notification_send_target(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE n public.mobile_notification_deliveries%rowtype; v_token text; v_metadata jsonb;
BEGIN
  SELECT * INTO n FROM public.mobile_notification_deliveries WHERE id = p_id AND status = 'sending' AND delivery_mode = 'remote';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',true,'notification',NULL); END IF;
  v_metadata := public.psylattice_mobile_notification_metadata(n.id);
  SELECT fcm_token INTO v_token FROM public.mobile_device_registrations WHERE id = n.device_registration_id AND active AND auth_user_id = n.auth_user_id;
  IF NOT coalesce((v_metadata->>'eligible')::boolean,false) OR v_token IS NULL THEN
    UPDATE public.mobile_notification_deliveries SET status = 'cancelled',failure_code = 'unavailable' WHERE id = n.id;
    RETURN jsonb_build_object('ok',true,'notification',NULL);
  END IF;
  -- Internal token never returned by participant endpoints or logged.
  RETURN jsonb_build_object('ok',true,'notification',v_metadata || jsonb_build_object('fcm_token',v_token));
END $$;

CREATE FUNCTION public.psylattice_mobile_finish_notification(p_id uuid,p_outcome text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_outcome NOT IN ('accepted','invalid_token','rejected','unknown') OR p_outcome IS NULL
  THEN RETURN jsonb_build_object('ok',false,'code','VALIDATION_FAILED'); END IF;
  IF p_outcome = 'invalid_token' THEN
    UPDATE public.mobile_device_registrations d SET fcm_token = NULL,updated_at = now()
      FROM public.mobile_notification_deliveries n WHERE n.id = p_id AND n.device_registration_id = d.id
        AND n.status = 'sending' AND d.updated_at <= n.attempted_at;
  END IF;
  UPDATE public.mobile_notification_deliveries SET status = CASE WHEN p_outcome = 'accepted' THEN 'accepted'
    WHEN p_outcome = 'unknown' THEN 'unknown' ELSE 'failed' END,
    accepted_at = CASE WHEN p_outcome = 'accepted' THEN now() ELSE NULL END,
    failure_code = CASE WHEN p_outcome = 'accepted' THEN NULL ELSE p_outcome END
    WHERE id = p_id AND status = 'sending';
  RETURN jsonb_build_object('ok',true);
END $$;

REVOKE ALL ON FUNCTION public.psylattice_mobile_register_device(uuid,uuid,text,text,text,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_unregister_device(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_notification_metadata(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_prepare_notification(uuid,text,timestamptz,timestamptz,text,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_cancel_instance_notifications(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_notification_schedule(uuid,timestamptz,timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_notification_target(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_notified_task(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_complete_notified_task(uuid,uuid,jsonb,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_notification_mode(uuid,uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_notification_opened(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_claim_notification_batch(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_notification_send_target(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylattice_mobile_finish_notification(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_register_device(uuid,uuid,text,text,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_unregister_device(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_notification_schedule(uuid,timestamptz,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_notification_target(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_notified_task(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_complete_notified_task(uuid,uuid,jsonb,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_notification_mode(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_notification_opened(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_prepare_notification(uuid,text,timestamptz,timestamptz,text,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_cancel_instance_notifications(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_claim_notification_batch(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_notification_send_target(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.psylattice_mobile_finish_notification(uuid,text) TO service_role;
COMMENT ON TABLE public.mobile_notification_deliveries IS 'Per-device delivery receipts for existing task instances. No parallel schedule definitions. FCM acceptance is not proof of device delivery.';
COMMENT ON COLUMN public.mobile_notification_deliveries.policy_eligible IS 'Trusted existing scheduler adapter must verify quiet hours/cooldowns/recurrence; defaults false. Never supplied by participant.';
COMMIT;
