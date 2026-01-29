'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to listen for cache refresh events and invalidate queries
 * Also provides ability to trigger custom callbacks
 */
export function useCacheRefresh(onRefresh?: () => void) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const onRefreshRef = useRef(onRefresh);

  // Update ref when callback changes
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    // Create EventSource connection to SSE endpoint
    const eventSource = new EventSource('/api/cache/events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('Connected to cache refresh events');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'cache-refresh') {
          console.log('Cache refresh event received:', data.timestamp);
          
          // Invalidate only product-related queries to avoid unnecessary refetching
          queryClient.invalidateQueries({ queryKey: ['products'] });
          
          // Call custom refresh callback if provided
          if (onRefreshRef.current) {
            onRefreshRef.current();
          }
          
          // Show a notification (optional)
          if (typeof window !== 'undefined') {
            console.log('Product data refreshed automatically');
          }
        } else if (data.type === 'connected') {
          console.log('Successfully connected to cache events stream');
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      
      // Reconnect after 5 seconds
      setTimeout(() => {
        console.log('Reconnecting to cache events...');
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        // The effect will recreate the connection
      }, 5000);
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [queryClient]);
}
