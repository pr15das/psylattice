import { authenticateMobileRequest, isResponse, mobileError, mobileRpcResponse, readJsonObject, type MobileAuthContext } from './participantApi';
import { consumeMobileRateLimit } from './rateLimit';
import { parseDeviceRegistration, parseScheduleWindow, validNotificationUuid } from './notificationValidation';

type Authenticate = (request: Request) => Promise<MobileAuthContext | Response>;
export function notificationHandlers(authenticate: Authenticate = authenticateMobileRequest) {
  async function context(request: Request, scope: 'devices' | 'notifications') {
    const auth = await authenticate(request);
    if (isResponse(auth)) return auth;
    return consumeMobileRateLimit(scope, auth.userId) ? auth : mobileError('RATE_LIMITED', 429);
  }
  async function rpc(auth: MobileAuthContext, name: string, args: Record<string, unknown>) {
    try { const { data, error } = await auth.supabase.rpc(name, args); return mobileRpcResponse(data, error); }
    catch { return mobileError('SERVER_ERROR'); }
  }
  return {
    async register(request: Request) {
      const auth = await context(request,'devices'); if (isResponse(auth)) return auth;
      const body = await readJsonObject(request); if (isResponse(body)) return body;
      const value = parseDeviceRegistration(body); if (!value) return mobileError('VALIDATION_FAILED');
      return rpc(auth,'psylattice_mobile_register_device', {
        p_installation_id: value.installation_id, p_installation_secret: value.installation_secret,
        p_platform: value.platform, p_fcm_token: value.fcm_token, p_timezone: value.timezone, p_enabled: value.notifications_enabled,
      });
    },
    async unregister(request: Request) {
      const auth = await context(request,'devices'); if (isResponse(auth)) return auth;
      const body = await readJsonObject(request); if (isResponse(body)) return body;
      if (Object.keys(body).length !== 1 || !validNotificationUuid(body.installation_id)) return mobileError('VALIDATION_FAILED');
      return rpc(auth,'psylattice_mobile_unregister_device',{p_installation_id:body.installation_id});
    },
    async schedule(request: Request) {
      const auth = await context(request,'notifications'); if (isResponse(auth)) return auth;
      const args = parseScheduleWindow(new URL(request.url)); if (!args) return mobileError('VALIDATION_FAILED');
      return rpc(auth,'psylattice_mobile_notification_schedule',args);
    },
    async target(request: Request, id: string) {
      const auth = await context(request,'notifications'); if (isResponse(auth)) return auth;
      if (!validNotificationUuid(id)) return mobileError('VALIDATION_FAILED');
      return rpc(auth,'psylattice_mobile_notification_target',{p_id:id});
    },
    async mode(request: Request, id: string) {
      const auth = await context(request,'notifications'); if (isResponse(auth)) return auth;
      const body = await readJsonObject(request); if (isResponse(body)) return body;
      if (!validNotificationUuid(id) || !validNotificationUuid(body.installation_id) ||
          !['local','remote'].includes(String(body.mode)) || Object.keys(body).some(k => !['installation_id','mode'].includes(k))) return mobileError('VALIDATION_FAILED');
      return rpc(auth,'psylattice_mobile_notification_mode',{p_id:id,p_installation_id:body.installation_id,p_mode:body.mode});
    },
    async task(request: Request, id: string) {
      const auth = await context(request,'notifications'); if (isResponse(auth)) return auth;
      if (!validNotificationUuid(id)) return mobileError('VALIDATION_FAILED');
      return rpc(auth,'psylattice_mobile_notified_task',{p_id:id});
    },
    async opened(request: Request, id: string) {
      const auth = await context(request,'notifications'); if (isResponse(auth)) return auth;
      if (!validNotificationUuid(id)) return mobileError('VALIDATION_FAILED');
      return rpc(auth,'psylattice_mobile_notification_opened',{p_id:id});
    },
  };
}
export const mobileNotificationHandlers = notificationHandlers();
