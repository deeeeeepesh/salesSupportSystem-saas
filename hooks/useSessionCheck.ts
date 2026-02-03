'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

/**
 * Hook to check session validity via SSE and periodic validation
 */
export function useSessionCheck() {
  const { data: session, status } = useSession();
  const [isInvalidated, setIsInvalidated] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    mountedRef.current = true;
    const userId = session.user.id;
    const currentSessionId = session.user.sessionId;

    const connect = () => {
      if (!mountedRef.current) return;
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/auth/session-events');
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'session-invalidated' && data.userId === userId) {
            if (data.newSessionId !== currentSessionId) {
              console.log('Session invalidated by another device');
              setIsInvalidated(true);
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
        console.log('Session SSE error, will reconnect...');
        eventSource.close();
        
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    // Periodic validation as fallback (every 5 minutes)
    validationIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      
      try {
        const response = await fetch('/api/auth/validate-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentSessionId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.valid === false && mountedRef.current) {
            setIsInvalidated(true);
            signOut({ callbackUrl: '/?message=logged-out-another-device' });
          }
        }
      } catch (error) {
        console.error('Error validating session:', error);
      }
    }, 5 * 60 * 1000);

    return () => {
      mountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [status, session]);

  return { isInvalidated };
}
