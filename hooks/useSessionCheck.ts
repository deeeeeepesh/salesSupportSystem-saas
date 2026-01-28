'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

/**
 * Hook to monitor session validity and handle logout on session invalidation
 */
export function useSessionCheck() {
  const { data: session, status } = useSession();
  const [isInvalidated, setIsInvalidated] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastValidatedRef = useRef<number>(Date.now());

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    const userId = session.user.id;
    const currentSessionId = session.user.sessionId;

    // Subscribe to session invalidation events
    const eventSource = new EventSource('/api/auth/session-events');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'session-invalidated' && data.userId === userId) {
          if (data.newSessionId !== currentSessionId) {
            console.log('Session invalidated due to login on another device');
            setIsInvalidated(true);
            
            // Sign out after a short delay to show the message
            setTimeout(() => {
              signOut({ callbackUrl: '/?message=logged-out-another-device' });
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error parsing session event:', error);
      }
    };

    eventSource.onerror = () => {
      console.log('Session event connection closed, will reconnect...');
      eventSource.close();
    };

    // Periodic session validation (every 30 seconds)
    const validationInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/auth/validate-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentSessionId }),
        });

        if (!response.ok) {
          const data = await response.json();
          if (data.valid === false) {
            console.log('Session validation failed');
            setIsInvalidated(true);
            signOut({ callbackUrl: '/?message=logged-out-another-device' });
          }
        }
        
        lastValidatedRef.current = Date.now();
      } catch (error) {
        console.error('Error validating session:', error);
      }
    }, 30000); // 30 seconds

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      clearInterval(validationInterval);
    };
  }, [status, session]);

  return { isInvalidated };
}
