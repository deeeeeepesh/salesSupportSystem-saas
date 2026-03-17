import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscribeToChannel, unsubscribeFromChannel } from '@/lib/redis';
import { createSSEStream, sendSSEMessage } from '@/lib/sse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Server-Sent Events endpoint for cache refresh notifications
 * Scoped per-tenant so only the correct tenant receives refresh events
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const tenantId = session.user.tenantId;

  return createSSEStream(request, async (controller, encoder, isClosed) => {
    // Send initial connection message
    sendSSEMessage(controller, encoder, { type: 'connected' }, isClosed);

    // Subscribe to tenant-scoped cache refresh events
    const subscriptionId = await subscribeToChannel(`cache:refresh:${tenantId}`, (message) => {
      // Check if closed before sending
      if (!isClosed()) {
        sendSSEMessage(controller, encoder, {
          type: 'cache-refresh',
          timestamp: message,
        }, isClosed);
      }
    });

    // Return cleanup function that properly unsubscribes
    return async () => {
      if (subscriptionId) {
        await unsubscribeFromChannel(subscriptionId);
      }
      console.log('Cache events SSE connection closed and cleaned up');
    };
  });
}
