'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PriceFreshnessState, FreshnessMetadata, VersionCheckResponse, Product } from '@/types';

interface UsePriceFreshnessOptions {
  onVersionMismatch?: () => void;
  checkInterval?: number; // Default 30s
}

interface UsePriceFreshnessReturn {
  state: PriceFreshnessState;
  freshness: FreshnessMetadata | null;
  isPriceUsable: boolean;
  isBlocked: boolean;
  updateFreshness: (freshness: FreshnessMetadata) => void;
  checkVersion: () => Promise<void>;
  saveProductsSnapshot: (products: Product[]) => void;
  loadLocalSnapshot: () => { products: Product[]; freshness: FreshnessMetadata } | null;
}

const STORAGE_KEY = 'price_freshness_snapshot';
const DEFAULT_CHECK_INTERVAL = 30000; // 30 seconds

export function usePriceFreshness(
  options: UsePriceFreshnessOptions = {}
): UsePriceFreshnessReturn {
  const { onVersionMismatch, checkInterval = DEFAULT_CHECK_INTERVAL } = options;

  const [state, setState] = useState<PriceFreshnessState>('VALID');
  const [freshness, setFreshness] = useState<FreshnessMetadata | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const receivedAtRef = useRef<number>(Date.now());

  // Check if prices are usable (not blocked)
  const isPriceUsable = state === 'VALID' || state === 'OFFLINE_VALID' || state === 'STALE_REFRESHING';
  const isBlocked = state === 'EXPIRED_BLOCKED' || state === 'OFFLINE_EXPIRED';

  // Save products and freshness to localStorage for fast start
  const saveProductsSnapshot = useCallback((products: Product[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      const snapshot = {
        products,
        freshness,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.error('[PriceFreshness] Failed to save snapshot:', error);
    }
  }, [freshness]);

  // Load products and freshness from localStorage
  const loadLocalSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const snapshot = JSON.parse(stored);
      return {
        products: snapshot.products,
        freshness: snapshot.freshness,
      };
    } catch (error) {
      console.error('[PriceFreshness] Failed to load snapshot:', error);
      return null;
    }
  }, []);

  // Compute freshness state based on metadata and elapsed time
  const computeFreshnessState = useCallback((
    meta: FreshnessMetadata,
    receivedAt: number,
    online: boolean
  ): PriceFreshnessState => {
    const now = Date.now();
    const age = now - receivedAt;

    if (!online) {
      // Offline - check if data is still within validity window
      if (age < meta.max_valid_duration_ms) {
        return 'OFFLINE_VALID';
      } else {
        return 'OFFLINE_EXPIRED';
      }
    }

    // Online
    if (age < meta.max_valid_duration_ms) {
      return 'VALID';
    } else {
      // Hard expired
      return 'EXPIRED_BLOCKED';
    }
  }, []);

  // Update freshness metadata and start expiry timer
  const updateFreshness = useCallback((newFreshness: FreshnessMetadata) => {
    const now = Date.now();
    receivedAtRef.current = now;
    setFreshness(newFreshness);

    // Clear existing expiry timer
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
    }

    // Set hard expiry timer
    const timeUntilExpiry = newFreshness.max_valid_duration_ms;
    expiryTimerRef.current = setTimeout(() => {
      console.log('[PriceFreshness] Data expired - blocking prices');
      setState('EXPIRED_BLOCKED');
    }, timeUntilExpiry);

    // Update state immediately
    const newState = computeFreshnessState(newFreshness, now, isOnline);
    setState(newState);
  }, [isOnline, computeFreshnessState]);

  // Check version from server
  const checkVersion = useCallback(async () => {
    if (!freshness) return;

    try {
      const response = await fetch('/api/price-version');
      if (!response.ok) {
        console.error('[PriceFreshness] Version check failed:', response.status);
        return;
      }

      const serverVersion: VersionCheckResponse = await response.json();

      // Check if version has changed
      if (serverVersion.price_list_version !== freshness.price_list_version) {
        console.log('[PriceFreshness] Version mismatch detected:', {
          local: freshness.price_list_version,
          server: serverVersion.price_list_version,
        });

        // IMMEDIATELY gray out old prices before triggering refetch
        setState('STALE_REFRESHING');

        // Trigger refetch callback
        if (onVersionMismatch) {
          onVersionMismatch();
        }
      }
    } catch (error) {
      console.error('[PriceFreshness] Version check error:', error);
    }
  }, [freshness, onVersionMismatch]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[PriceFreshness] Back online');
      setIsOnline(true);
      checkVersion();
    };

    const handleOffline = () => {
      console.log('[PriceFreshness] Gone offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkVersion]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[PriceFreshness] App became visible - checking version');
        checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkVersion]);

  // Heartbeat polling
  useEffect(() => {
    if (!freshness) return;

    heartbeatIntervalRef.current = setInterval(() => {
      checkVersion();
    }, checkInterval);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [freshness, checkInterval, checkVersion]);

  // Update state when online status changes
  useEffect(() => {
    if (freshness) {
      const newState = computeFreshnessState(freshness, receivedAtRef.current, isOnline);
      setState(newState);
    }
  }, [isOnline, freshness, computeFreshnessState]);

  // Load snapshot on mount for fast start
  useEffect(() => {
    let isMounted = true; // Track component mount state
    
    const snapshot = loadLocalSnapshot();
    if (snapshot && snapshot.freshness) {
      // Compute state based on stored freshness
      const serverGeneratedAt = snapshot.freshness.server_generated_timestamp;
      receivedAtRef.current = serverGeneratedAt;
      setFreshness(snapshot.freshness);
      
      const now = Date.now();
      const age = now - serverGeneratedAt;
      
      // Check if snapshot is within validity window
      if (age < snapshot.freshness.max_valid_duration_ms) {
        // Snapshot is within validity - show as STALE_REFRESHING until validated
        console.log('[PriceFreshness] Loading snapshot - validating version');
        setState('STALE_REFRESHING');
        
        // Immediately validate snapshot version against server
        const validateSnapshotVersion = async (snapshotFreshness: FreshnessMetadata) => {
          try {
            const response = await fetch('/api/price-version');
            if (!response.ok) {
              console.error('[PriceFreshness] Snapshot validation failed:', response.status);
              // Network error - keep STALE_REFRESHING, heartbeat will retry
              return;
            }
            
            const serverVersion: VersionCheckResponse = await response.json();
            
            // Only update state if component is still mounted
            if (!isMounted) return;
            
            if (serverVersion.price_list_version === snapshotFreshness.price_list_version) {
              // Snapshot is still current! Update freshness with server timestamp and set VALID
              console.log('[PriceFreshness] Snapshot validated - version matches');
              updateFreshness({
                price_list_version: serverVersion.price_list_version,
                server_generated_timestamp: serverVersion.server_timestamp,
                max_valid_duration_ms: serverVersion.max_valid_duration_ms,
              });
            } else {
              // Version mismatch - trigger refetch (state stays STALE_REFRESHING)
              console.log('[PriceFreshness] Snapshot validation - version mismatch detected:', {
                local: snapshotFreshness.price_list_version,
                server: serverVersion.price_list_version,
              });
              if (onVersionMismatch) {
                onVersionMismatch();
              }
            }
          } catch (error) {
            console.error('[PriceFreshness] Snapshot validation error:', error);
            // Network error - keep STALE_REFRESHING, heartbeat will retry
          }
        };
        
        validateSnapshotVersion(snapshot.freshness);
      } else {
        // Snapshot is expired - compute state normally (will be EXPIRED_BLOCKED or OFFLINE_EXPIRED)
        const initialState = computeFreshnessState(
          snapshot.freshness,
          serverGeneratedAt,
          navigator.onLine
        );
        setState(initialState);
      }
    }
    
    return () => {
      isMounted = false; // Prevent state updates after unmount
    };
  }, [loadLocalSnapshot, computeFreshnessState, onVersionMismatch, updateFreshness]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  return {
    state,
    freshness,
    isPriceUsable,
    isBlocked,
    updateFreshness,
    checkVersion,
    saveProductsSnapshot,
    loadLocalSnapshot,
  };
}
