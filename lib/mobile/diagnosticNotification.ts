import { createClient } from '@supabase/supabase-js';
import { FcmHttpSender } from './fcmSender';
import { authenticateMobileRequest, isResponse, mobileData, mobileError, readJsonObject, type MobileAuthContext } from './participantApi';
import { consumeMobileRateLimit } from './rateLimit';
import { validNotificationUuid } from './notificationValidation';

type Authenticate = (request: Request) => Promise<MobileAuthContext | Response>;
type DeviceLookup = (userId: string, installationId?: string) => Promise<string | null>;
type Sender = { sendDiagnostic(token: string): Promise<'accepted' | 'invalid_token' | 'rejected' | 'unknown'> };
type SenderFactory = () => Sender | null;
type Environment = { NODE_ENV?: string; VERCEL_ENV?: string };

export function isDiagnosticPushEnabled(environment: Environment = process.env) {
  if (environment.VERCEL_ENV === 'production') return false;
  if (environment.VERCEL_ENV === 'preview') return true;
  return environment.NODE_ENV === 'development';
}

export async function lookupOwnedDiagnosticDevice(userId: string, installationId?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server configuration unavailable.');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  let query = client.from('mobile_device_registrations').select('fcm_token')
    .eq('auth_user_id', userId).eq('active', true).not('fcm_token', 'is', null);
  if (installationId) query = query.eq('installation_id', installationId);
  const { data, error } = await query.order('last_seen_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error('Device lookup unavailable.');
  return typeof data?.fcm_token === 'string' ? data.fcm_token : null;
}

function parseRequest(body: Record<string, unknown>) {
  if (Object.keys(body).some((key) => key !== 'installation_id')) return null;
  if (body.installation_id !== undefined && !validNotificationUuid(body.installation_id)) return null;
  return body.installation_id as string | undefined;
}

export function diagnosticNotificationHandler({
  authenticate = authenticateMobileRequest,
  lookupDevice = lookupOwnedDiagnosticDevice,
  createSender = FcmHttpSender.fromEnvironment,
  enabled = isDiagnosticPushEnabled,
}: {
  authenticate?: Authenticate;
  lookupDevice?: DeviceLookup;
  createSender?: SenderFactory;
  enabled?: () => boolean;
} = {}) {
  return async function post(request: Request) {
    if (!enabled()) return mobileError('NOT_FOUND', 404);
    const auth = await authenticate(request);
    if (isResponse(auth)) return auth;
    if (!consumeMobileRateLimit('diagnosticPush', auth.userId)) return mobileError('RATE_LIMITED', 429);
    const body = await readJsonObject(request);
    if (isResponse(body)) return body;
    const installationId = parseRequest(body);
    if (installationId === null) return mobileError('VALIDATION_FAILED', 400);
    const sender = createSender();
    if (!sender) return mobileError('SERVER_ERROR');
    try {
      const token = await lookupDevice(auth.userId, installationId);
      if (!token) return mobileError('DIAGNOSTIC_DEVICE_UNAVAILABLE', 409);
      if (await sender.sendDiagnostic(token) !== 'accepted') return mobileError('SERVER_ERROR');
      return mobileData({ sent: true });
    } catch {
      return mobileError('SERVER_ERROR');
    }
  };
}

export const mobileDiagnosticNotificationHandler = diagnosticNotificationHandler();
