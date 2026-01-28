import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subscribeToChannel } from '@/lib/redis';

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
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // Subscribe to session invalidation events for this user
      await subscribeToChannel(`session:invalidate:${userId}`, (newSessionId) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'session-invalidated', 
              userId,
              newSessionId 
            })}\n\n`)
          );
        } catch (error) {
          console.error('Error sending session event:', error);
        }
      });

      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (error) {
          console.error('Error sending heartbeat:', error);
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 30 seconds

      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch (error) {
          console.error('Error closing controller:', error);
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
