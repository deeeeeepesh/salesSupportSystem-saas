import { NextRequest } from 'next/server';

export const SSE_HEARTBEAT_INTERVAL_MS = 30000;

export type SSECleanupFn = () => void | Promise<void>;
export type IsClosedFn = () => boolean;

/**
 * Creates an SSE stream with proper cleanup and state tracking
 */
export function createSSEStream(
  request: NextRequest,
  onStart: (
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    isClosed: IsClosedFn
  ) => Promise<SSECleanupFn | void>
) {
  const encoder = new TextEncoder();
  let closed = false;
  let cleanupFn: SSECleanupFn | void;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const isClosed: IsClosedFn = () => closed;

  const stream = new ReadableStream({
    async start(controller) {
      // Set up the stream and get cleanup function
      cleanupFn = await onStart(controller, encoder, isClosed);

      // Heartbeat to keep connection alive
      heartbeatInterval = setInterval(() => {
        if (closed) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          return;
        }
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          // Controller closed, clean up silently
          closed = true;
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, SSE_HEARTBEAT_INTERVAL_MS);

      // Handle connection abort
      request.signal.addEventListener('abort', async () => {
        // Mark as closed FIRST to prevent any more writes
        closed = true;

        // Clear heartbeat
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }

        // Run custom cleanup (e.g., unsubscribe from Redis)
        if (cleanupFn) {
          try {
            await cleanupFn();
          } catch (error) {
            console.error('Error in SSE cleanup:', error);
          }
        }

        // Close controller
        try {
          controller.close();
        } catch {
          // Already closed, ignore
        }
      });
    },
    cancel() {
      // Also handle cancel
      closed = true;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

/**
 * Safely send an SSE message, checking if stream is still open
 */
export function sendSSEMessage(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  data: unknown,
  isClosed?: IsClosedFn
): boolean {
  // Check if closed before attempting to send
  if (isClosed && isClosed()) {
    return false;
  }

  try {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    return true;
  } catch {
    // Controller is closed, return false silently (no error spam)
    return false;
  }
}
