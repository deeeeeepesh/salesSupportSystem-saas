import { NextRequest } from 'next/server';
import { subscribeToChannel } from '@/lib/redis';

export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events endpoint for cache refresh notifications
 */
export async function GET(request: NextRequest) {
  // Create a readable stream for SSE
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // Subscribe to cache refresh events
      await subscribeToChannel('cache:refresh', (message) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'cache-refresh', timestamp: message })}\n\n`)
          );
        } catch (error) {
          console.error('Error sending SSE message:', error);
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
