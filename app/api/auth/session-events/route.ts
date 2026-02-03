import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscribeToChannel, unsubscribeFromChannel } from '@/lib/redis';
import { createSSEStream, sendSSEMessage } from '@/lib/sse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Server-Sent Events endpoint for session invalidation notifications
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  
  return createSSEStream(request, async (controller, encoder, isClosed) => {
    // Send initial connection message
    sendSSEMessage(controller, encoder, { type: 'connected' }, isClosed);

    // Subscribe to session invalidation events for this user
    const subscriptionId = await subscribeToChannel(
      `session:invalidate:${userId}`,
      (newSessionId) => {
        // Check if closed before sending
        if (!isClosed()) {
          sendSSEMessage(controller, encoder, { 
            type: 'session-invalidated', 
            userId,
            newSessionId 
          }, isClosed);
        }
      }
    );

    // Return cleanup function that properly unsubscribes
    return async () => {
      if (subscriptionId) {
        await unsubscribeFromChannel(subscriptionId);
      }
      console.log(`Session events SSE closed for user ${userId}`);
    };
  });
}
