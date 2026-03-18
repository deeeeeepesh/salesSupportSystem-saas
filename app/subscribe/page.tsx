'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Crown, Briefcase, ShoppingCart, Zap } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscribePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
    if (session?.user?.role !== 'ADMIN') {
      router.replace('/catalogue');
    }
  }, [status, session, router]);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    fetch('/api/tenant/subscription')
      .then(r => r.json())
      .then(data => setSubscriptionData(data))
      .catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tenant/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      const options = {
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: 'SalesSync',
        description: 'Monthly subscription',
        order_id: data.orderId,
        customer_id: data.razorpayCustomerId,
        prefill: { name: data.tenantName, email: data.tenantEmail },
        theme: { color: '#f97316' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/tenant/payment-verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');
            setSuccess(true);
            setTimeout(() => router.replace('/catalogue'), 2000);
          } catch (err: any) {
            setError(err.message || 'Payment verification failed');
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">Subscription Activated!</h1>
          <p className="text-zinc-400">Redirecting to your catalogue...</p>
        </div>
      </div>
    );
  }

  const sub = subscriptionData?.subscription;
  const adminSeats = sub?.adminSeats ?? 1;
  const managerSeats = sub?.managerSeats ?? 1;
  const salesSeats = sub?.salesSeats ?? 4;
  const monthlyAmount = sub?.monthlyAmount ?? 200000;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="text-2xl font-black text-white">SalesSync</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Activate Your Subscription</h1>
          <p className="text-zinc-400">Your trial has ended. Subscribe to continue.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
          <div className="text-center mb-6">
            <div className="text-5xl font-black text-white mb-1">
              ₹{(monthlyAmount / 100).toLocaleString('en-IN')}
            </div>
            <div className="text-zinc-400">per month</div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { Icon: Crown, label: `${adminSeats} Admin seat${adminSeats > 1 ? 's' : ''}` },
              { Icon: Briefcase, label: `${managerSeats} Manager seat${managerSeats > 1 ? 's' : ''}` },
              { Icon: ShoppingCart, label: `${salesSeats} Staff seat${salesSeats > 1 ? 's' : ''}` },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                {label}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black text-base py-6"
          >
            {loading ? 'Processing...' : `Pay ₹${(monthlyAmount / 100).toLocaleString('en-IN')} & Activate`}
          </Button>

          <p className="text-center text-xs text-zinc-500 mt-3">
            Secured by Razorpay · Cancel anytime · No hidden charges
          </p>
        </div>

        <p className="text-center text-xs text-zinc-600">
          Need help? Contact <a href="mailto:support@dedasystems.com" className="text-orange-500">support@dedasystems.com</a>
        </p>
      </div>
    </div>
  );
}
