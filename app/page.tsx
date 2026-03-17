'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'salessupportapp.dedasystems.com';

function getTenantSlug(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  const params = new URLSearchParams(window.location.search);
  const tenantParam = params.get('tenant');
  if (tenantParam) return tenantParam;
  if (hostname === ROOT_DOMAIN || hostname === 'localhost' || hostname === '127.0.0.1') return '';
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = hostname.replace(`.${ROOT_DOMAIN}`, '');
    if (sub === 'admin') return ''; // super admin uses its own page
    return sub;
  }
  const parts = hostname.split('.');
  if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    return parts[0];
  }
  return '';
}

// ─── LANDING PAGE ──────────────────────────────────────────────────────────

function PricingCard({ title, price, description, features }: {
  title: string; price: string; description: string; features: string[];
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="text-3xl font-bold mt-2">
          ₹{price}<span className="text-sm font-normal text-gray-500">/user/month</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <span className="text-green-500 font-bold">✓</span> {f}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function LandingPage() {
  const [formData, setFormData] = useState({ storeName: '', email: '', password: '', adminName: '', phone: '', googleSheetId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ slug: string; url: string; trialEndsAt: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/tenant/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        setSuccess({ slug: data.slug, url: data.url, trialEndsAt: data.trialEndsAt });
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-green-700">Store Created!</CardTitle>
            <CardDescription>Your 14-day free trial has started.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">Your store is available at:</p>
            <a href={success.url} className="block p-3 bg-green-50 border border-green-200 rounded text-green-800 font-mono text-sm break-all hover:underline">
              {success.url}
            </a>
            <p className="text-xs text-gray-500">Trial ends: {new Date(success.trialEndsAt).toLocaleDateString()}</p>
            <Button className="w-full" onClick={() => { window.location.href = success.url; }}>
              Go to My Store
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sales Support System</h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-2">for Mobile Phone &amp; Appliance Retail Stores</p>
          <p className="text-blue-200 mb-8 max-w-2xl mx-auto">
            Real-time product catalogue, price sync from Google Sheets, analytics, and multi-user management. Built for modern retail.
          </p>
          <a href="#register">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 py-3">
              Start 14-Day Free Trial
            </Button>
          </a>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">Everything your team needs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Live Product Catalogue', desc: 'Search, filter by brand, price, RAM/ROM. Fuzzy search. Always up to date.' },
              { title: 'Google Sheets Sync', desc: 'Connect your price list sheet. Prices auto-sync every 2 minutes with change detection.' },
              { title: 'Role-Based Access', desc: 'Sales staff, Store Managers, and Admins each see the right information.' },
              { title: 'Analytics Dashboard', desc: 'Track visits, page views, session duration per user.' },
              { title: 'Price Freshness Alerts', desc: 'Staff are notified instantly when prices change via real-time events.' },
              { title: 'Multi-Store SaaS', desc: 'Each store gets its own subdomain. Fully isolated data.' },
            ].map((f) => (
              <Card key={f.title}>
                <CardHeader><CardTitle className="text-base">{f.title}</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-gray-600">{f.desc}</p></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Simple Per-Seat Pricing</h2>
          <p className="text-center text-gray-500 mb-10">Pay only for what you use. 14-day free trial, no credit card required.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingCard title="Sales" price="300" description="For sales staff on the floor"
              features={['Product catalogue access', 'Search & filter', 'Price freshness alerts', 'Session tracking']} />
            <PricingCard title="Store Manager" price="500" description="For store supervisors"
              features={['Everything in Sales', 'Team visibility', 'Basic analytics', 'Performance insights']} />
            <PricingCard title="Admin" price="700" description="For store owners"
              features={['Full admin panel', 'User management', 'Price sync control', 'Full analytics']} />
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">Prices in INR. Billed monthly via Razorpay. Cancel anytime.</p>
        </div>
      </section>

      <section id="register" className="py-16 px-4 bg-gray-50">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Create Your Store</h2>
          <p className="text-center text-gray-500 mb-8">Get started in under 2 minutes. Free for 14 days.</p>
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name *</Label>
                  <Input id="storeName" name="storeName" placeholder="e.g. Sharma Mobile Store" value={formData.storeName} onChange={handleChange} required disabled={loading} />
                  <p className="text-xs text-gray-500">
                    Your store URL: <strong>{(formData.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'storename')}.{ROOT_DOMAIN}</strong>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminName">Your Name *</Label>
                  <Input id="adminName" name="adminName" placeholder="Rajesh Sharma" value={formData.adminName} onChange={handleChange} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" name="email" type="email" placeholder="owner@example.com" value={formData.email} onChange={handleChange} required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" name="password" type="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} required minLength={8} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleSheetId">Google Sheet ID (optional)</Label>
                  <Input id="googleSheetId" name="googleSheetId" placeholder="Your price list spreadsheet ID" value={formData.googleSheetId} onChange={handleChange} disabled={loading} />
                  <p className="text-xs text-gray-500">Found in your Google Sheets URL. You can configure this later.</p>
                </div>
                {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating your store...' : 'Start Free Trial'}
                </Button>
                <p className="text-xs text-center text-gray-500">No credit card required for the trial.</p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="py-8 px-4 bg-gray-800 text-gray-400 text-center text-sm">
        <p>Sales Support System — by Deda Systems</p>
        <p className="mt-1">{ROOT_DOMAIN}</p>
      </footer>
    </div>
  );
}

// ─── LOGIN PAGE ────────────────────────────────────────────────────────────

function LoginPage({ tenantSlug }: { tenantSlug: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/catalogue');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, tenantSlug, redirect: false });
      if (result?.error) setError(result.error);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sales Support System</CardTitle>
          <CardDescription className="text-center">Sign in to {tenantSlug}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
            </div>
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── ROOT COMPONENT ────────────────────────────────────────────────────────

export default function RootPage() {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    setTenantSlug(getTenantSlug());
  }, []);

  // Still determining context
  if (tenantSlug === null) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  }

  // Tenant subdomain → show login
  if (tenantSlug) {
    return <LoginPage tenantSlug={tenantSlug} />;
  }

  // Root domain → show landing page
  return <LandingPage />;
}
