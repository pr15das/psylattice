export type SendOutcome = 'accepted' | 'invalid_token' | 'rejected' | 'unknown';
export type SendTarget = {
  notification_id: string; study_id: string; task_id: string; task_instance_id: string;
  fcm_token: string; notification_type: 'research_task' | 'study_reminder'; eligible: boolean;
  task_status: string; expires_at: string;
};
export interface PushSender { send(target: SendTarget): Promise<SendOutcome>; }
export interface DeliveryQueue {
  claim(): Promise<string[]>;
  target(id: string): Promise<SendTarget | null>;
  finish(id: string, outcome: SendOutcome): Promise<void>;
}
export async function dispatchNotifications(queue: DeliveryQueue, sender: PushSender, now = () => Date.now()) {
  const result = { claimed: 0, accepted: 0, skipped: 0, failed: 0 };
  const ids = await queue.claim(); result.claimed = ids.length;
  for (const id of ids.slice(0,100)) {
    let target: SendTarget | null;
    try { target = await queue.target(id); } catch { result.failed++; continue; }
    const expiry = target ? Date.parse(target.expires_at) : NaN;
    if (!target || !target.eligible || target.task_status !== 'due' || !Number.isFinite(expiry) || expiry <= now()) {
      result.skipped++; continue;
    }
    let outcome: SendOutcome;
    try { outcome = await sender.send(target); } catch { outcome = 'unknown'; }
    try { await queue.finish(id,outcome); } catch { /* Leave the claim terminal: never resend after an uncertain outcome. */ }
    if (outcome === 'accepted') result.accepted++; else result.failed++;
  }
  return result;
}
