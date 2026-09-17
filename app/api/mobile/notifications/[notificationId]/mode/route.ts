import { mobileNotificationHandlers } from '@/lib/mobile/notificationApi';
export async function POST(request: Request, context: { params: Promise<{ notificationId: string }> }) {
  return mobileNotificationHandlers.mode(request, (await context.params).notificationId);
}
