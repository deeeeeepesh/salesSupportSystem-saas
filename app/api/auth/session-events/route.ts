import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscribeToChannel } from '@/lib/redis';
import { createSSEStream, sendSSEMessage } from '@/lib/sse';

export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events endpoint for session invalidation notifications
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  
  return createSSEStream(request, async (controller, encoder) => {
    // Send initial connection message
    sendSSEMessage(controller, encoder, { type: 'connected' });

    // Subscribe to session invalidation events for this user
    await subscribeToChannel(`session:invalidate:${userId}`, (newSessionId) => {
      sendSSEMessage(controller, encoder, { 
        type: 'session-invalidated', 
        userId,
        newSessionId 
      });
    });

    // Return cleanup function
    return () => {
      // Redis cleanup would go here if we implement unsubscribe
      console.log(`Session events SSE connection closed for user ${userId}`);
    };
  });
}
