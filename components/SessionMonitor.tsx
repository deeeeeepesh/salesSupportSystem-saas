'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCacheRefresh } from '@/hooks/useCacheRefresh';
import { useSessionCheck } from '@/hooks/useSessionCheck';

/**
 * Component to monitor cache refresh and session invalidation events
 */
export function SessionMonitor() {
  const searchParams = useSearchParams();
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);
  
  // Initialize cache refresh listener
  useCacheRefresh();
  
  // Initialize session check
  const { isInvalidated } = useSessionCheck();

  useEffect(() => {
    // Check if user was logged out due to another device login
    const message = searchParams.get('message');
    if (message === 'logged-out-another-device') {
      setShowLogoutMessage(true);
      
      // Hide message after 10 seconds
      const timer = setTimeout(() => {
        setShowLogoutMessage(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!showLogoutMessage && !isInvalidated) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {(showLogoutMessage || isInvalidated) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Session Expired
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You&apos;ve been logged out because you logged in on another device.
                  Please log in again to continue.
                </p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowLogoutMessage(false)}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
