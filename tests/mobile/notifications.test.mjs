import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
registerHooks({ resolve(specifier, context, nextResolve) {
  try { return nextResolve(specifier, context); }
  catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) return nextResolve(`${specifier}.ts`,context);
    throw error;
  }
} });
const { notificationHandlers } = await import('../../lib/mobile/notificationApi.ts');
const { parseDeviceRegistration, parseScheduleWindow } = await import('../../lib/mobile/notificationValidation.ts');
const { dispatchNotifications } = await import('../../lib/mobile/notificationDispatcher.ts');
const { fcmMessage, FcmHttpSender } = await import('../../lib/mobile/fcmSender.ts');
const id = '10000000-0000-4000-8000-000000000001';
const body = {installation_id:id,installation_secret:'10000000-0000-4000-8000-000000000002',platform:'android',fcm_token:'mock-token-123456789012345',timezone:'Asia/Kolkata',notifications_enabled:true};
function request(value = body) { return new Request('https://example.invalid/api/mobile/devices/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)}); }
test('unauthenticated device registration is rejected before RPC',async () => {
  assert.equal((await notificationHandlers().register(request())).status,401);
});
test('authenticated handlers never forward an arbitrary owner; token rotation uses stable installation',async () => {
  const calls = [];
  const handler = notificationHandlers(async () => ({userId:'unit-notification-user',supabase:{rpc:async(name,args) => {calls.push({name,args});return {data:{ok:true},error:null};}}}));
  assert.equal((await handler.register(request())).status,200);
  assert.equal((await handler.register(request({...body,fcm_token:'mock-rotated-1234567890123'}))).status,200);
  assert.equal(calls[0].args.p_installation_id,calls[1].args.p_installation_id);
  assert.notEqual(calls[0].args.p_fcm_token,calls[1].args.p_fcm_token);
  assert.equal('p_auth_user_id' in calls[0].args,false);
  assert.equal((await handler.register(request({...body,auth_user_id:id}))).status,400);
  assert.equal(calls.length,2);
});
test('cross-owner schedule/target/open denial from the ownership RPC is preserved',async () => {
  const calls = [];
  const handler = notificationHandlers(async () => ({userId:'denied-test-user',supabase:{rpc:async(name,args) => {calls.push({name,args});return {data:{ok:false,code:'FORBIDDEN'},error:null};}}}));
  assert.equal((await handler.target(new Request('https://example.invalid'),id)).status,403);
  assert.equal((await handler.opened(new Request('https://example.invalid',{method:'POST'}),id)).status,403);
  const url = new URL('https://example.invalid/api/mobile/participant/notification-schedule');
  url.search = new URLSearchParams({installation_id:id,from:'2026-09-13T00:00:00Z',to:'2026-09-20T00:00:00Z'}).toString();
  assert.equal((await handler.schedule(new Request(url))).status,403);
  assert.equal(calls[2].args.p_installation_id,id);
});
test('registration validates IDs, timezone, token, platform and rejects extra fields',() => {
  assert.ok(parseDeviceRegistration(body));
  for (const invalid of [{...body,timezone:'Invalid/Zone'},{...body,fcm_token:'has spaces'},{...body,installation_id:'hardware-id'},{...body,platform:'browser'},{...body,auth_user_id:id}]) assert.equal(parseDeviceRegistration(invalid),null);
  const url = new URL('https://example.invalid');
  url.search = new URLSearchParams({installation_id:id,from:'2026-09-13T00:00:00',to:'2026-10-20T00:00:00Z'}).toString();
  assert.equal(parseScheduleWindow(url),null);
});
test('concurrent/repeated dispatcher runs cannot send a claimed receipt again',async () => {
  let pending = true, sends = 0, finished;
  const queue = {claim:async() => {if (!pending) return [];pending=false;return [id];},
    target:async() => ({notification_id:id,eligible:true,task_status:'due',expires_at:'2099-01-01T00:00:00Z'}),finish:async(_,outcome) => {finished=outcome;}};
  const sender = {send:async() => {sends++;return 'accepted';}};
  await Promise.all([dispatchNotifications(queue,sender),dispatchNotifications(queue,sender)]);
  await dispatchNotifications(queue,sender);
  assert.equal(sends,1);assert.equal(finished,'accepted');
});
test('completed, withdrawn/unavailable, cancelled, expired and ineligible tasks are not sent',async () => {
  let sends = 0;
  for (const target of [null,{eligible:false,task_status:'due'},{eligible:true,task_status:'completed'},{eligible:true,task_status:'unavailable'},{eligible:true,task_status:'cancelled'},{eligible:true,task_status:'due',expires_at:'2000-01-01T00:00:00Z'}]) {
    await dispatchNotifications({claim:async() => [id],target:async() => ({expires_at:'2099-01-01T00:00:00Z',...target}),finish:async() => {}},{send:async() => {sends++;return 'accepted';}});
  }
  assert.equal(sends,0);
});
test('ambiguous sender errors are terminal and never auto-retried',async () => {
  let finish;
  const result = await dispatchNotifications({claim:async() => [id],target:async() => ({notification_id:id,eligible:true,task_status:'due',expires_at:'2099-01-01T00:00:00Z'}),finish:async(_,outcome) => {finish=outcome;}},{send:async() => {throw new Error('Simulated transport failure');}});
  assert.equal(finish,'unknown');assert.equal(result.failed,1);
});
test('FCM payload only contains generic text and routing IDs; missing config fails safely',() => {
  const target = {notification_id:id,study_id:id,task_id:id,task_instance_id:id,fcm_token:'mock-token',notification_type:'research_task',expires_at:'2099-01-01T00:00:00Z'};
  const message = fcmMessage(target).message;
  assert.deepEqual(Object.keys(message.data).sort(),['action_type','notification_id','study_id','task_id','task_instance_id'].sort());
  assert.equal(message.notification.body,'Your PsyLattice task is ready.');
  assert.equal(message.android.notification.tag,id);
  const previous = process.env.FCM_SERVICE_ACCOUNT_JSON; delete process.env.FCM_SERVICE_ACCOUNT_JSON;
  assert.equal(FcmHttpSender.fromEnvironment(),null);
  if (previous !== undefined) process.env.FCM_SERVICE_ACCOUNT_JSON = previous;
});
test('HTTP v1 sender classifies invalid tokens and uncertain failures with fake HTTP only',async () => {
  const {privateKey} = generateKeyPairSync('rsa',{modulusLength:2048});
  const account = {project_id:'unit-test-project',client_email:'sender@unit-test-project.iam.gserviceaccount.com',private_key:privateKey.export({format:'pem',type:'pkcs8'}).toString()};
  const target = {notification_id:id,study_id:id,task_id:id,task_instance_id:id,fcm_token:'mock-token',notification_type:'research_task',expires_at:'2099-01-01T00:00:00Z'};
  for (const [response,expected] of [[Response.json({}, {status:200}),'accepted'],[Response.json({error:{details:[{errorCode:'UNREGISTERED'}]}},{status:404}),'invalid_token'],[Response.json({}, {status:500}),'unknown']]) {
    let oauth = 0, fcm = 0;
    const sender = new FcmHttpSender(account,async(url,options) => {
      if (url === 'https://oauth2.googleapis.com/token') {oauth++;return Response.json({access_token:'mock-oauth-access'});}
      assert.equal(url,'https://fcm.googleapis.com/v1/projects/unit-test-project/messages:send');fcm++;
      assert.equal(JSON.parse(options.body).message.android.notification.channel_id,'psylattice_research_tasks');
      return response;
    });
    assert.equal(await sender.send(target),expected);assert.equal(oauth,1);assert.equal(fcm,1);
  }
});

const sql = readFileSync(new URL('../../supabase/migrations/20260913090000_mobile_notification_delivery.sql',import.meta.url),'utf8');
test('notified completion checks the actual stored instance and rolls back mismatched answer writes',() => {
  assert.match(sql,/psylattice_mobile_complete_task\(p_task_id,p_answers,p_idempotency_key\)/);
  assert.match(sql,/id = n.task_instance_id[\s\S]*mobile_idempotency_key = p_idempotency_key/);
  assert.match(sql,/RAISE EXCEPTION USING ERRCODE = 'P0001'/);
  assert.match(sql,/EXCEPTION WHEN SQLSTATE 'P0001'/);
  assert.match(sql,/questionnaire_version_id = m.questionnaire_version_id/);
  assert.match(sql,/'notification_id',n.id,'task_instance_id',n.task_instance_id,'web_fallback_available',false/);
});
test('notification source uses the checked-in study-link availability columns',() => {
  const baseline = readFileSync(new URL('../../supabase/migrations/20260814012000_existing_remote_baseline.sql',import.meta.url),'utf8');
  assert.match(baseline,/"starts_at" timestamp with time zone/);assert.match(baseline,/"ends_at" timestamp with time zone/);
  assert.match(sql,/starts_at IS NULL OR starts_at <= now\(\)/);assert.match(sql,/ends_at IS NULL OR ends_at > now\(\)/);
  assert.doesNotMatch(sql,/start_date|end_date/);
});
test('migration is additive, reuses instances, has durable dedupe and installation uniqueness',() => {
  assert.match(sql,/installation_id uuid NOT NULL UNIQUE/);
  assert.match(sql,/fcm_token text UNIQUE/);
  assert.match(sql,/REFERENCES public.study_measure_sessions\(id\)/);
  assert.match(sql,/UNIQUE \(device_registration_id, task_instance_id, notification_type, scheduled_for\)/);
  assert.match(sql,/ON CONFLICT \(installation_id\) DO UPDATE/);
  assert.doesNotMatch(sql,/CREATE TABLE public\.(mobile_schedules|mobile_tasks|participant_task_instances)|DROP TABLE|psylattice_mobile_participant_dashboard\(/);
});
test('migration scopes participant/device reads and open writes with auth.uid(), uses proof for reassociation',() => {
  assert.match(sql,/v_existing.installation_secret_hash <> v_hash/);
  assert.match(sql,/device_registration_id = v_device AND auth_user_id = v_owner AND p_enabled\s+AND status = 'cancelled' AND policy_eligible AND attempted_at IS NULL\s+AND scheduled_for > now\(\) AND expires_at > now\(\)/);
  assert.match(sql,/n.auth_user_id = auth.uid\(\) AND d.auth_user_id = auth.uid\(\)/);
  assert.match(sql,/opened_at = coalesce\(opened_at,now\(\)\)/);
  assert.match(sql,/p.auth_user_id = auth.uid\(\)/);
  assert.equal((sql.match(/ENABLE ROW LEVEL SECURITY/g)||[]).length,2);
  assert.match(sql,/REVOKE ALL ON public.mobile_device_registrations FROM anon, authenticated/);
  for (const [,name] of sql.matchAll(/CREATE FUNCTION public\.([a-z_]+)\(/g)) assert.match(sql,new RegExp(`REVOKE ALL ON FUNCTION public\\.${name}\\([^;]+FROM PUBLIC`));
  assert.equal((sql.match(/SECURITY DEFINER SET search_path = ''/g)||[]).length,(sql.match(/CREATE FUNCTION/g)||[]).length);
});
test('migration enforces source eligibility and atomic at-most-once claims with service-only sending',() => {
  assert.match(sql,/p.status IN \('active','baseline_complete'\)/);
  assert.match(sql,/research_studies WHERE id = d.study_id AND status = 'active'/);
  assert.match(sql,/m.status = 'completed'/);assert.match(sql,/d.expires_at <= now\(\)/);
  assert.match(sql,/FOR UPDATE SKIP LOCKED/);assert.match(sql,/n.attempted_at IS NULL/);
  assert.match(sql,/policy_eligible boolean NOT NULL DEFAULT false/);
  assert.match(sql,/psylattice_mobile_claim_notification_batch\(integer\) TO service_role/);
  assert.doesNotMatch(sql,/GRANT EXECUTE ON FUNCTION public.psylattice_mobile_(prepare_notification|notification_metadata|notification_send_target|claim_notification_batch)[^;]+TO authenticated/);
});
