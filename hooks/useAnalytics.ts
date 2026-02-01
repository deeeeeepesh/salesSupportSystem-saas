'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export function useAnalytics() {
  const { data: session, status } = useSession();
  const startTimeRef = useRef<number>(Date.now());
  const lastSentRef = useRef<number>(Date.now());

  // Track visit on session start
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetch('/api/analytics/visit', { method: 'POST' }).catch(console.error);
    }
  }, [status, session]);

  // Track page refreshes
  useEffect(() => {
    if (status === 'authenticated') {
      // Check if this is a page refresh using performance API
      const navigationType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type;
      
      if (navigationType === 'reload') {
        fetch('/api/analytics/refresh', { method: 'POST' }).catch(console.error);
      }
    }
  }, [status]);

  // Track duration with visibility change and periodic heartbeat
  useEffect(() => {
    if (status !== 'authenticated') return;

    const sendDuration = () => {
      const now = Date.now();
      const duration = Math.floor((now - lastSentRef.current) / 1000); // seconds
      
      if (duration > 0) {
        fetch('/api/analytics/duration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration }),
        }).catch(console.error);
        
        lastSentRef.current = now;
      }
    };

    // Send duration every 30 seconds
    const intervalId = setInterval(sendDuration, 30000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendDuration();
      } else {
        lastSentRef.current = Date.now();
      }
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      sendDuration();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      sendDuration(); // Send final duration
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status]);

  return {
    trackPageView: () => {
      if (status === 'authenticated') {
        fetch('/api/analytics/pageview', { method: 'POST' }).catch(console.error);
      }
    },
  };
}
