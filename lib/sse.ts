import { NextRequest } from 'next/server';

// Configuration constants
export const SSE_HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds - keeps connection alive

/**
 * Creates an SSE (Server-Sent Events) response stream with built-in heartbeat and cleanup
 * 
 * @param request - The Next.js request object
 * @param onStart - Callback to set up the stream (e.g., subscribe to events)
 * @returns Response object configured for SSE
 */
export function createSSEStream(
  request: NextRequest,
  onStart: (controller: ReadableStreamDefaultController, encoder: TextEncoder) => Promise<() => void>
) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Call the setup callback and get cleanup function
      const cleanup = await onStart(controller, encoder);

      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (error) {
          console.error('Error sending heartbeat:', error);
          clearInterval(heartbeatInterval);
        }
      }, SSE_HEARTBEAT_INTERVAL_MS);

      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        
        // Call custom cleanup
        if (cleanup) {
          cleanup();
        }
        
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

/**
 * Helper to send an SSE message
 */
export function sendSSEMessage(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  data: unknown
) {
  try {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  } catch (error) {
    console.error('Error sending SSE message:', error);
  }
}
