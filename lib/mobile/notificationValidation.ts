export type DeviceRegistration = {
  installation_id: string; installation_secret: string;
  platform: 'android' | 'ios'; fcm_token: string | null;
  timezone: string; notifications_enabled: boolean;
};
export function validNotificationUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
export function validTimezone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 100 || !/^[A-Za-z_]+(?:\/[A-Za-z_+-]+)+$|^UTC$/.test(value)) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(0); return true; } catch { return false; }
}
export function parseDeviceRegistration(body: Record<string, unknown>): DeviceRegistration | null {
  const allowed = new Set(['installation_id','installation_secret','platform','fcm_token','timezone','notifications_enabled']);
  if (Object.keys(body).some(key => !allowed.has(key)) ||
      !validNotificationUuid(body.installation_id) || !validNotificationUuid(body.installation_secret) ||
      !['android','ios'].includes(String(body.platform)) || !validTimezone(body.timezone) ||
      typeof body.notifications_enabled !== 'boolean' ||
      !(body.fcm_token === null || (typeof body.fcm_token === 'string' && /^[\x21-\x7E]{20,4096}$/.test(body.fcm_token)))) return null;
  return body as DeviceRegistration;
}
export function parseScheduleWindow(url: URL) {
  const allowed = new Set(['installation_id','from','to']);
  if ([...url.searchParams.keys()].some((key) => !allowed.has(key)) ||
      [...allowed].some((key) => url.searchParams.getAll(key).length !== 1)) return null;
  const installation = url.searchParams.get('installation_id');
  const from = url.searchParams.get('from'), to = url.searchParams.get('to');
  if (!validNotificationUuid(installation) || !from || !to ||
      !/(Z|[+-]\d{2}:\d{2})$/.test(from) || !/(Z|[+-]\d{2}:\d{2})$/.test(to)) return null;
  const start = Date.parse(from), end = Date.parse(to);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end-start > 14*86400000) return null;
  return { p_installation_id: installation, p_from: new Date(start).toISOString(), p_to: new Date(end).toISOString() };
}
