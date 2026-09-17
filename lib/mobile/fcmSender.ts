import { createSign } from 'node:crypto';
import type { PushSender, SendOutcome, SendTarget } from './notificationDispatcher';
type ServiceAccount = { project_id: string; client_email: string; private_key: string };
type FcmRequest = { message: { token: string; notification: { title: string; body: string }; data: Record<string, string>; android: { priority: string; ttl: string; notification: { channel_id: string; icon: string; tag: string; visibility: string } } } };
export function fcmMessage(target: SendTarget): FcmRequest {
  const channel = target.notification_type === 'study_reminder' ? 'psylattice_study_reminders' : 'psylattice_research_tasks';
  return { message: {
    token: target.fcm_token,
    notification: { title: 'PsyLattice', body: 'Your PsyLattice task is ready.' },
    data: { action_type: 'open_task', notification_id: target.notification_id, study_id: target.study_id,
      task_id: target.task_id, task_instance_id: target.task_instance_id },
    android: { priority: 'normal', ttl: `${Math.max(0,Math.min(86400,Math.floor((Date.parse(target.expires_at)-Date.now())/1000)))}s`,
      notification: { channel_id: channel, icon: 'ic_stat_psylattice', tag: target.notification_id, visibility: 'PRIVATE' } },
  } };
}
export function diagnosticFcmMessage(token: string): FcmRequest {
  return { message: {
    token,
    notification: { title: 'PsyLattice', body: 'Notifications are working on this device.' },
    data: { type: 'diagnostic_test' },
    android: { priority: 'normal', ttl: '60s',
      notification: { channel_id: 'psylattice_research_tasks', icon: 'ic_stat_psylattice', tag: 'psylattice-diagnostic', visibility: 'PRIVATE' } },
  } };
}
// HTTP v1 sender; credentials are server-only. Fixed Google OAuth audience/URL,
// no credentials/payloads in errors. Tests inject a sender without real FCM.
export class FcmHttpSender implements PushSender {
  private accessToken?: string;
  private tokenExpiry = 0;
  private account: ServiceAccount;
  private http: typeof fetch;
  constructor(account: ServiceAccount, http: typeof fetch = fetch) { this.account = account; this.http = http; }
  static fromEnvironment() {
    try {
      const value = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON || '') as ServiceAccount;
      if (!/^[a-z][a-z0-9-]{4,62}$/.test(value.project_id) || typeof value.client_email !== 'string' ||
          !value.client_email.endsWith('.iam.gserviceaccount.com') || typeof value.private_key !== 'string' ||
          !value.private_key.includes('BEGIN PRIVATE KEY')) return null;
      return new FcmHttpSender(value);
    } catch { return null; }
  }
  private async token() {
    if (this.accessToken && Date.now() < this.tokenExpiry) return this.accessToken;
    const seconds = Math.floor(Date.now()/1000);
    const header = Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT'})).toString('base64url');
    const payload = Buffer.from(JSON.stringify({iss:this.account.client_email,
      scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:seconds,exp:seconds+3600})).toString('base64url');
    const unsigned = `${header}.${payload}`;
    const signature = createSign('RSA-SHA256').update(unsigned).sign(this.account.private_key,'base64url');
    const response = await this.http('https://oauth2.googleapis.com/token', {
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${unsigned}.${signature}`}),
      signal:AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Push credentials unavailable.');
    const body = await response.json();
    if (typeof body.access_token !== 'string') throw new Error('Push credentials unavailable.');
    this.accessToken = body.access_token; this.tokenExpiry = Date.now()+3300000;
    return this.accessToken!;
  }
  private async sendMessage(message: ReturnType<typeof fcmMessage>): Promise<SendOutcome> {
    try {
      const response = await this.http(`https://fcm.googleapis.com/v1/projects/${this.account.project_id}/messages:send`, {
        method:'POST', headers:{Authorization:`Bearer ${await this.token()}`,'Content-Type':'application/json'},
        body:JSON.stringify(message),signal:AbortSignal.timeout(10000),
      });
      if (response.ok) return 'accepted';
      if (response.status >= 500) return 'unknown';
      const body = await response.json().catch(() => null);
      if (body?.error?.details?.some((d: {errorCode?: string}) => d.errorCode === 'UNREGISTERED')) return 'invalid_token';
      return 'rejected';
    } catch { return 'unknown'; }
  }
  async send(target: SendTarget): Promise<SendOutcome> { return this.sendMessage(fcmMessage(target)); }
  async sendDiagnostic(token: string): Promise<SendOutcome> { return this.sendMessage(diagnosticFcmMessage(token)); }
}
