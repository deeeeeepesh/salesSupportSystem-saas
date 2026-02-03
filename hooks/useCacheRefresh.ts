'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseCacheRefreshOptions {
  onRefresh?: () => void;
}

/**
 * Hook to subscribe to cache refresh events via SSE
 * Automatically reconnects on connection loss
 */
export function useCacheRefresh(options: UseCacheRefreshOptions = {}) {
  const { onRefresh } = options;
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);
  const mountedRef = useRef(true);

  // Update ref when callback changes
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    mountedRef.current = true;
    
    const connect = () => {
      // Don't connect if unmounted
      if (!mountedRef.current) return;
      
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/cache/events');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('Connected to cache refresh events');
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'cache-refresh') {
            console.log('Cache refresh event received');
            
            // Invalidate product queries
            queryClient.invalidateQueries({ queryKey: ['products'] });
            
            // Call custom callback
            if (onRefreshRef.current) {
              onRefreshRef.current();
            }
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = () => {
        console.log('SSE connection error, will reconnect...');
        eventSource.close();
        
        // Reconnect after delay if still mounted
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [queryClient]);
}
