'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'salessync.dedasystems.com';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isTenantSite, setIsTenantSite] = useState(false);

  useEffect(() => {
    const host = window.location.hostname.replace(/:\d+$/, '');

    // Only show on tenant subdomains (e.g. perumal.salessync.dedasystems.com)
    // Not on the root domain or non-matching hosts
    const onTenant = host !== ROOT_DOMAIN && host.endsWith(`.${ROOT_DOMAIN}`);
    setIsTenantSite(onTenant);
    if (!onTenant) return;

    // Check if app is already installed
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ||
      document.referrer.includes('android-app://');

    setIsStandalone(isInStandaloneMode);
    if (isInStandaloneMode) return;

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Check localStorage for visit count and dismissed state
    const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0');
    const dismissedUntil = localStorage.getItem('pwa-dismissed-until');

    localStorage.setItem('pwa-visit-count', String(visitCount + 1));

    if (dismissedUntil && new Date() < new Date(dismissedUntil)) return;

    if (visitCount >= 1) setShowPrompt(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + 7);
    localStorage.setItem('pwa-dismissed-until', dismissUntil.toISOString());
    setShowPrompt(false);
  };

  if (!isTenantSite || !showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg animate-in slide-in-from-bottom">
      <div className="container mx-auto flex items-center justify-between gap-4 max-w-4xl">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-lg bg-[#e65100] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">SS</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install Sales Support System</h3>
            {isIOS ? (
              <p className="text-xs text-muted-foreground">
                Tap <span className="inline-block mx-1" aria-label="the Share button">⬆️</span> then &ldquo;Add to Home Screen&rdquo;
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Install the app for quick access from your home screen
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isIOS && deferredPrompt && (
            <Button onClick={handleInstall} size="sm" className="bg-[#e65100] hover:bg-[#d84e00]">
              <Download className="mr-2 h-4 w-4" />
              Install
            </Button>
          )}
          <Button onClick={handleDismiss} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
