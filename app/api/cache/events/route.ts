import { NextRequest } from 'next/server';
import { subscribeToChannel } from '@/lib/redis';
import { createSSEStream, sendSSEMessage } from '@/lib/sse';

export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events endpoint for cache refresh notifications
 */
export async function GET(request: NextRequest) {
  return createSSEStream(request, async (controller, encoder) => {
    // Send initial connection message
    sendSSEMessage(controller, encoder, { type: 'connected' });

    // Subscribe to cache refresh events
    await subscribeToChannel('cache:refresh', (message) => {
      sendSSEMessage(controller, encoder, { 
        type: 'cache-refresh', 
        timestamp: message 
      });
    });

    // Return cleanup function
    return () => {
      // Redis cleanup would go here if we implement unsubscribe
      console.log('Cache events SSE connection closed');
    };
  });
}
