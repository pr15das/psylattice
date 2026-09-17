import { mobileNotificationHandlers } from '@/lib/mobile/notificationApi';
export async function GET(request: Request, context: { params: Promise<{ notificationId: string }> }) {
  return mobileNotificationHandlers.target(request, (await context.params).notificationId);
}
