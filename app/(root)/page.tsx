'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'salessupportapp.dedasystems.com';

function PricingCard({
  title,
  price,
  description,
  features,
}: {
  title: string;
  price: string;
  description: string;
  features: string[];
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="text-3xl font-bold mt-2">
          {price}
          <span className="text-sm font-normal text-gray-500">/user/month</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <span className="text-green-500 font-bold">+</span>
              {f}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function LandingPage() {
  const [formData, setFormData] = useState({
    storeName: '',
    email: '',
    password: '',
    adminName: '',
    phone: '',
    googleSheetId: '',
  });
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
            <p className="text-sm text-gray-700">
              Your store is available at:
            </p>
            <a
              href={success.url}
              className="block p-3 bg-green-50 border border-green-200 rounded text-green-800 font-mono text-sm break-all hover:underline"
            >
              {success.url}
            </a>
            <p className="text-xs text-gray-500">
              Trial ends: {new Date(success.trialEndsAt).toLocaleDateString()}
            </p>
            <Button className="w-full" onClick={() => window.location.href = success.url}>
              Go to My Store
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Sales Support System
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-2">
            for Mobile Phone &amp; Appliance Retail Stores
          </p>
          <p className="text-blue-200 mb-8 max-w-2xl mx-auto">
            Real-time product catalogue, price sync from Google Sheets, analytics dashboard,
            and multi-user management. Built for modern retail.
          </p>
          <a href="#register">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 py-3">
              Start 14-Day Free Trial
            </Button>
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">Everything your team needs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Live Product Catalogue',
                desc: 'Search, filter by brand, price, RAM/ROM. Fuzzy search support. Always up to date.',
              },
              {
                title: 'Google Sheets Sync',
                desc: 'Connect your price list Google Sheet. Prices auto-sync every 2 minutes with change detection.',
              },
              {
                title: 'Role-Based Access',
                desc: 'Sales staff, Store Managers, and Admins each see the right information at the right time.',
              },
              {
                title: 'Analytics Dashboard',
                desc: 'Track visits, page views, session duration, and refreshes per user.',
              },
              {
                title: 'Price Freshness Alerts',
                desc: 'Clients are notified instantly when prices change via Server-Sent Events.',
              },
              {
                title: 'Multi-Store SaaS',
                desc: 'Each store gets its own subdomain. Fully isolated data. No cross-store leakage.',
              },
            ].map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Simple Per-Seat Pricing</h2>
          <p className="text-center text-gray-500 mb-10">
            Pay only for what you use. 14-day free trial, no credit card required.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PricingCard
              title="Sales"
              price="300"
              description="For sales staff on the floor"
              features={['Product catalogue access', 'Search & filter', 'Price freshness alerts', 'Session tracking']}
            />
            <PricingCard
              title="Store Manager"
              price="500"
              description="For store supervisors"
              features={['Everything in Sales', 'Team visibility', 'Basic analytics', 'Performance insights']}
            />
            <PricingCard
              title="Admin"
              price="700"
              description="For store owners"
              features={['Full admin panel', 'User management', 'Price sync control', 'Full analytics']}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            Prices in INR. Billed monthly via Razorpay. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="py-16 px-4 bg-gray-50">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Create Your Store</h2>
          <p className="text-center text-gray-500 mb-8">
            Get started in under 2 minutes. Free for 14 days.
          </p>
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name *</Label>
                  <Input
                    id="storeName"
                    name="storeName"
                    placeholder="e.g. Sharma Mobile Store"
                    value={formData.storeName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">
                    Your store URL will be: <strong>{formData.storeName
                      ? formData.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                      : 'storename'}.{ROOT_DOMAIN}</strong>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminName">Your Name *</Label>
                  <Input
                    id="adminName"
                    name="adminName"
                    placeholder="Rajesh Sharma"
                    value={formData.adminName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="owner@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleSheetId">Google Sheet ID (optional)</Label>
                  <Input
                    id="googleSheetId"
                    name="googleSheetId"
                    placeholder="Your price list spreadsheet ID"
                    value={formData.googleSheetId}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">
                    Found in your Google Sheets URL. You can configure this later.
                  </p>
                </div>
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating your store...' : 'Start Free Trial'}
                </Button>
                <p className="text-xs text-center text-gray-500">
                  By registering you agree to our terms. No credit card required for the trial.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-800 text-gray-400 text-center text-sm">
        <p>Sales Support System - by Deda Systems</p>
        <p className="mt-1">{ROOT_DOMAIN}</p>
      </footer>
    </div>
  );
}
