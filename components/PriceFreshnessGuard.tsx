'use client';

import { PriceFreshnessState } from '@/types';

interface PriceFreshnessGuardProps {
  state: PriceFreshnessState;
  children: React.ReactNode;
}

/**
 * Guard component that wraps price content and blocks/overlays based on freshness state
 */
export function PriceFreshnessGuard({ state, children }: PriceFreshnessGuardProps) {
  // VALID - render normally
  if (state === 'VALID') {
    return <>{children}</>;
  }

  // OFFLINE_VALID - render with small offline badge
  if (state === 'OFFLINE_VALID') {
    return (
      <div className="relative">
        {children}
        <div className="absolute top-1 right-1 bg-gray-500 text-white text-xs px-2 py-0.5 rounded">
          Offline
        </div>
      </div>
    );
  }

  // STALE_REFRESHING - render with opacity and overlay
  if (state === 'STALE_REFRESHING') {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-700 font-medium">Updating prices...</p>
          </div>
        </div>
      </div>
    );
  }

  // EXPIRED_BLOCKED - REPLACE with red blocked state
  if (state === 'EXPIRED_BLOCKED') {
    return (
      <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg border-2 border-red-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-3"></div>
          <p className="text-red-800 font-semibold text-lg">Price expired — updating</p>
          <p className="text-red-600 text-sm mt-1">Please wait while we fetch the latest prices</p>
        </div>
      </div>
    );
  }

  // OFFLINE_EXPIRED - REPLACE with gray blocked state
  if (state === 'OFFLINE_EXPIRED') {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-gray-300">
        <div className="text-center">
          <svg
            className="h-12 w-12 text-gray-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          <p className="text-gray-800 font-semibold text-lg">Price unavailable</p>
          <p className="text-gray-600 text-sm mt-1">Connect to internet to view current prices</p>
        </div>
      </div>
    );
  }

  // Fallback - should never reach here
  return <>{children}</>;
}

interface FreshnessBadgeProps {
  state: PriceFreshnessState;
  className?: string;
}

/**
 * Small badge component showing freshness state
 */
export function FreshnessBadge({ state, className = '' }: FreshnessBadgeProps) {
  if (state === 'VALID') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 ${className}`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Prices Up to Date
      </span>
    );
  }

  if (state === 'OFFLINE_VALID') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 ${className}`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        Offline Mode
      </span>
    );
  }

  if (state === 'STALE_REFRESHING') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 ${className}`}>
        <svg className="w-3 h-3 animate-spin" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
        Updating Prices
      </span>
    );
  }

  if (state === 'EXPIRED_BLOCKED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 ${className}`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        Price Expired
      </span>
    );
  }

  if (state === 'OFFLINE_EXPIRED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 ${className}`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
        Offline - Prices Expired
      </span>
    );
  }

  return null;
}
