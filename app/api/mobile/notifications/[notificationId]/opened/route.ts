import { mobileNotificationHandlers } from '@/lib/mobile/notificationApi';
export async function POST(request: Request, context: { params: Promise<{ notificationId: string }> }) {
  return mobileNotificationHandlers.opened(request, (await context.params).notificationId);
}
