import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { FcmHttpSender } from '@/lib/mobile/fcmSender';
import { dispatchNotifications, type SendTarget } from '@/lib/mobile/notificationDispatcher';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const actual = request.headers.get('authorization') || '';
  if (!expected || Buffer.byteLength(actual) !== Buffer.byteLength(`Bearer ${expected}`) ||
      !timingSafeEqual(Buffer.from(actual),Buffer.from(`Bearer ${expected}`))) return Response.json({error:'Unauthorized'},{status:401});
  const sender = FcmHttpSender.fromEnvironment();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Check config BEFORE claiming, so a missing credential cannot consume work.
  if (!sender || !url || !key) return Response.json({error:'Push delivery unavailable'},{status:503});
  const supabase = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  async function rpc(name: string,args: Record<string,unknown> = {}) {
    const {data,error} = await supabase.rpc(name,args);
    if (error || !data?.ok) throw new Error('Notification operation unavailable.');
    return data;
  }
  try {
    const result = await dispatchNotifications({
      claim: async () => (await rpc('psylattice_mobile_claim_notification_batch')).items.map((v: {notification_id: string}) => v.notification_id),
      target: async (id) => (await rpc('psylattice_mobile_notification_send_target',{p_id:id})).notification as SendTarget | null,
      finish: async (id,outcome) => { await rpc('psylattice_mobile_finish_notification',{p_id:id,p_outcome:outcome}); },
    },sender);
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
  } catch { return Response.json({error:'Push delivery unavailable'},{status:503}); }
}
