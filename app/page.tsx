'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    if (sub === 'admin') return '';
    return sub;
  }
  return '';
}

// ─── BRAND ────────────────────────────────────────────────────────────────────
function BoltIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" fill="currentColor" />
    </svg>
  );
}

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500 text-black flex-shrink-0">
        <BoltIcon size={16} />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-xl font-black text-white tracking-tight">SalesSync</span>
      </div>
    </div>
  );
}

// ─── STRUCTURED DATA ─────────────────────────────────────────────────────────
const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SalesSync',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any (Web Browser)',
  inLanguage: 'en-IN',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', description: '5-day free trial' },
  description: 'SalesSync by Deda Systems — real-time price management for multi-branch mobile phone and appliance retailers in India.',
  provider: { '@type': 'Organization', name: 'Deda Systems' },
  areaServed: { '@type': 'Country', name: 'India' },
});

// ─── DATA ─────────────────────────────────────────────────────────────────────
const PAIN_POINTS = [
  {
    emoji: '📋',
    title: 'Printed price lists go stale overnight',
    desc: "You print 20 copies on Monday. By Tuesday prices changed. Your staff quotes yesterday's prices to today's customers — who checked online and already know better.",
  },
  {
    emoji: '📱',
    title: 'Staff guess prices during peak hours',
    desc: "On a busy Saturday, staff can't pause a sale to verify prices. They quote from memory — which could be off by ₹1,000. A wrong quote either loses the customer or costs you the margin.",
  },
  {
    emoji: '🏪',
    title: 'Multi-branch consistency is a nightmare',
    desc: "You run 3 branches. Each manager maintains their own list. The same Samsung A55 has three different prices on the same day. A customer notices — and walks.",
  },
  {
    emoji: '🏷️',
    title: 'Bank offers and EMI deals change weekly',
    desc: "HDFC has a ₹3,000 cashback this weekend. ICICI has no-cost EMI. Your frontline staff either don't know or take 5 minutes finding out — the customer loses patience and walks.",
  },
  {
    emoji: '🔄',
    title: 'POS price updates are a slow, manual task',
    desc: "Updating the POS or ERP takes your manager 2–3 hours every week. On a new iPhone launch day, the system needs a full update while the store is open and billing.",
  },
  {
    emoji: '📉',
    title: 'New model launches create day-one chaos',
    desc: "A new flagship is out today. Specs, prices, colours, and offers aren't in your system yet. Staff are googling pricing on their personal phones while the customer waits.",
  },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Live Price Sync from Google Sheets',
    desc: "You already manage your price list in Google Sheets. SalesSync reads it every 2 minutes and pushes changes to every device in every branch — automatically. No manual entry, no CSV uploads.",
    highlight: 'Works with your existing workflow',
    core: true,
  },
  {
    icon: '🛡️',
    title: 'Stale Price Blocker — Industry First',
    desc: "If prices haven't refreshed in 5 minutes, SalesSync blocks the catalogue with a clear warning. Staff cannot quote stale prices. In a market where prices change ₹1,000 in a day, this is essential.",
    highlight: 'Unique to SalesSync',
    core: true,
  },
  {
    icon: '🔍',
    title: 'Instant Smart Search Catalogue',
    desc: "Staff type 'samng a5' and find Samsung A55 instantly. Handles typos, partial names, RAM/ROM specs, and offer keywords. Find any product across 500+ SKUs in under 3 seconds.",
    highlight: 'Typo-tolerant, instant results',
    core: false,
  },
  {
    icon: '🏢',
    title: 'Multi-Branch from One Admin Seat',
    desc: 'Each branch gets its own private login URL. All branches share the same live price list. One update from HQ — reflected across all branches in under 2 minutes.',
    highlight: 'For 2–50 branch operations',
    core: false,
  },
  {
    icon: '🔔',
    title: 'Auto-Refresh All Devices Simultaneously',
    desc: "When prices update, every open browser tab on every device in every branch refreshes automatically — no F5, no manual action. Powered by Redis pub/sub and Server-Sent Events.",
    highlight: 'Zero-lag, zero effort',
    core: true,
  },
  {
    icon: '📊',
    title: 'Offers, EMI & Sales Pitch per Product',
    desc: "Every product card shows the current offer, bank EMI schemes, exchange value, and your custom sales pitch. Staff close sales with full confidence — everything in one screen.",
    highlight: 'Bank offers & EMI built-in',
    core: false,
  },
  {
    icon: '📴',
    title: 'Works Offline — No Internet, No Problem',
    desc: "Poor network at the counter? SalesSync caches the latest price list on-device. Staff browse the full catalogue offline. Auto-syncs the moment connectivity returns.",
    highlight: 'Offline cache on every device',
    core: false,
  },
  {
    icon: '🔒',
    title: 'Single-Device Login Security',
    desc: "One account, one active device at a time. Login on a new device immediately terminates the previous session. Your price data stays protected from shared-login abuse.",
    highlight: 'Enterprise-grade security',
    core: false,
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Register Your Store', desc: "Create your store in 2 minutes. You get a private URL — yourstore.salessupportapp.dedasystems.com — only your staff can access it.", icon: '🏪' },
  { step: '02', title: 'Connect Your Google Sheet', desc: "Paste your Google Sheet ID. SalesSync connects using a read-only service account. No need to share edit access. Your sheet stays yours.", icon: '📊' },
  { step: '03', title: 'Add Your Staff', desc: "Create logins, assign roles (Sales / Manager / Admin). Share the URL. Staff open it on any device, log in — they're live.", icon: '👥' },
  { step: '04', title: 'Update Once, Seen Everywhere', desc: "Change a price in your Sheet. In under 2 minutes every staff member in every branch sees the update on their device — automatically.", icon: '⚡' },
];

const FRESHNESS_STATES = [
  {
    state: '✅ LIVE',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    title: 'Prices are accurate & current',
    desc: 'Data synced within the last 5 minutes. Staff can quote any price with complete confidence.',
  },
  {
    state: '🔄 SYNCING',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    title: 'Refresh in progress',
    desc: "Prices may be slightly older. An overlay tells staff a sync is happening. Refreshes automatically.",
  },
  {
    state: '🔴 BLOCKED',
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    title: 'Stale data — catalogue blocked',
    desc: 'Data is more than 5 minutes old. Catalogue fully blocked. Staff cannot quote any prices until fresh data loads.',
  },
];

const COMPARISON = [
  { aspect: 'Price accuracy guarantee', manual: '❌ Stale data shown silently', pricesync: '✅ Stale price auto-blocked' },
  { aspect: 'Speed to update all branches', manual: '🐌 1–3 hours (print, send)', pricesync: '⚡ Under 2 minutes, automatic' },
  { aspect: 'Works during peak hours', manual: '❌ Staff too busy to update', pricesync: '✅ Fully automatic — zero effort' },
  { aspect: 'New model launch readiness', manual: '❌ Day-1 chaos is normal', pricesync: '✅ Add to Sheet → live instantly' },
  { aspect: 'Bank offer & EMI visibility', manual: '❌ Staff must remember or call', pricesync: '✅ Shown on every product card' },
  { aspect: 'Works when network is slow', manual: '✅ Physical lists work offline', pricesync: '✅ Offline cache always available' },
  { aspect: 'Multi-branch consistency', manual: '❌ Each branch has its own version', pricesync: '✅ All branches on same live list' },
  { aspect: 'Monthly cost', manual: '💸 Printing + lost margins', pricesync: '₹300–₹700 / user / month' },
];

const TESTIMONIALS = [
  {
    name: 'Suresh Menon',
    role: 'Owner, 3-branch mobile store, Kochi',
    text: "Before SalesSync, I was sending price updates on WhatsApp and praying everyone saw them. Now I update the Sheet and I'm done. All three branches are always on the same page.",
  },
  {
    name: 'Priya Ranganathan',
    role: 'Operations Head, 8-store electronics chain, Chennai',
    text: "The Saturday new-launch madness is gone. Staff have the new model's price and all bank offers on their phone before the first customer walks in.",
  },
  {
    name: 'Amit Gupta',
    role: 'Store Manager, Samsung exclusive, Ahmedabad',
    text: "The stale price blocker changed everything. Staff know the orange badge means the price is accurate. That confidence closes ₹50,000 sales. Before this, we were guessing.",
  },
  {
    name: 'Kavitha Nair',
    role: 'Co-owner, Reliance Digital franchise, Bengaluru',
    text: "Setup took 20 minutes. We connected our Sheet, added 12 staff, went live. I change a price from home and it's on the store floor in 2 minutes. No calls, no WhatsApp.",
  },
];

const FAQS = [
  { q: 'Do my staff need to install any app?', a: "No installation needed. SalesSync is a web app that works in any browser on any device — Android, iPhone, tablet, laptop. Staff open the URL and log in. It also supports 'Add to Home Screen' via PWA — no app store required." },
  { q: 'What if the internet goes down in the store?', a: "SalesSync caches the latest price list on every device. Staff continue browsing the full catalogue offline. The UI shows 'Offline — showing last synced data'. Auto-syncs the moment connectivity returns." },
  { q: 'We have 4 branches. Do we need 4 separate accounts?', a: "You can structure it either way — each branch as its own isolated store, or all branches under one store. Most multi-branch operators create one store per branch for clean per-branch analytics." },
  { q: 'How do I update prices?', a: "Just update your Google Sheet — exactly as you do today. SalesSync reads it every 2 minutes and pushes updates to all connected devices automatically. You can also force-sync instantly from the Admin panel." },
  { q: 'Is my price data secure?', a: "Your store is completely private. Only staff accounts you create can log in. Data is isolated per store — no other user can see your prices or catalogue. All data is encrypted in transit and at rest." },
  { q: 'What happens after the 5-day free trial?', a: "After the trial, add a payment method via Razorpay. Billing is per user per month — ₹300 Sales, ₹500 Manager, ₹700 Admin. You only pay for active users. No contracts, cancel anytime." },
  { q: 'We also sell appliances — TVs, ACs, fridges. Does it work?', a: "Yes. SalesSync works for any product catalogue in Google Sheets — phones, tablets, accessories, TVs, ACs, washing machines. Any product with a dynamic price list." },
  { q: "What exactly is the 'stale price blocker'?", a: "If price data is more than 5 minutes old without a successful sync, SalesSync automatically blocks the catalogue with a red warning. Staff cannot quote prices from stale data. In Indian mobile retail where prices change ₹500–₹2,000 in a day, this single feature pays for the subscription." },
  { q: 'How is SalesSync different from sharing a Google Sheet with staff?', a: "A raw Sheet is not built for the sales counter — slow on mobile, hard to search, shows edit history, no access control, no security. SalesSync turns your Sheet into a fast, role-controlled, always-live catalogue with stale price blocking, offline support, bank offer details, and session security." },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-orange-500 text-sm">★</span>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center mb-4">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 border border-orange-500/30 bg-orange-500/5 px-3 py-1 rounded-full uppercase tracking-wider">
        {children}
      </span>
    </div>
  );
}

function Navbar({ onRegisterClick }: { onRegisterClick: () => void }) {
  return (
    <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <LogoMark />
          <span className="text-zinc-600 text-xs hidden md:block">by Deda Systems</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500 hidden lg:block">For Indian mobile &amp; appliance retailers</span>
          <Button
            size="sm"
            onClick={onRegisterClick}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold shadow-lg shadow-orange-500/20"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </nav>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

function LandingPage() {
  const [formData, setFormData] = useState({ storeName: '', email: '', password: '', adminName: '', phone: '', googleSheetId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ slug: string; url: string; trialEndsAt: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

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
      if (!res.ok) setError(data.error || 'Registration failed.');
      else setSuccess({ slug: data.slug, url: data.url, trialEndsAt: data.trialEndsAt });
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const storeSlugPreview = formData.storeName
    ? formData.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : 'yourstore';

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎉</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Your Store is Live!</h2>
            <p className="text-zinc-400 text-sm">5-day free trial has started. No credit card needed.</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-4 mb-4">
            <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide mb-1">Your Private Store URL</p>
            <a href={success.url} className="text-orange-400 font-mono text-sm break-all hover:text-orange-300 font-bold">{success.url}</a>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-zinc-800 rounded-xl p-3">
              <p className="text-zinc-500 text-xs mb-0.5">Trial Ends</p>
              <p className="font-semibold text-white text-sm">
                {new Date(success.trialEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-3">
              <p className="text-zinc-500 text-xs mb-0.5">Next Step</p>
              <p className="font-semibold text-white text-sm">Connect Google Sheet</p>
            </div>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 text-sm text-orange-200 leading-relaxed mb-5">
            <strong className="text-orange-400">What to do now:</strong> Open your store URL → log in with your email and password → go to <strong>Admin → Settings</strong> to connect your Google Sheet → add staff accounts.
          </div>
          <Button className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-6" onClick={() => { window.location.href = success.url; }}>
            Open My Store →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      <Navbar onRegisterClick={scrollToForm} />

      {/* ══ HERO ════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-black py-24 md:py-32 px-4" aria-labelledby="hero-heading">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(249,115,22,0.10), transparent 70%)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm px-4 py-1.5 rounded-full mb-8 font-medium">
            <BoltIcon size={12} />
            Built exclusively for Indian mobile &amp; appliance retailers
          </div>
          <h1 id="hero-heading" className="text-5xl md:text-7xl font-black mb-6 leading-[1.05] tracking-tight">
            Your staff will never<br />
            quote{' '}
            <span style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              a wrong price
            </span>
            <br />again.
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 mb-5 max-w-2xl mx-auto leading-relaxed">
            SalesSync gives every salesperson in every branch a live, searchable price catalogue — synced from your Google Sheet in real time, on any phone or tablet at the counter.
          </p>
          <p className="text-zinc-500 mb-10 max-w-xl mx-auto">
            No printed lists. No WhatsApp price forwards. No customers walking because your staff didn&apos;t know today&apos;s offer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
            <Button
              size="lg"
              onClick={scrollToForm}
              className="bg-orange-500 hover:bg-orange-400 text-black font-black text-lg px-10 py-7 rounded-xl shadow-2xl shadow-orange-500/25 transition-all hover:scale-105"
            >
              Start Free — 5 Days, No Credit Card
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-zinc-500 text-sm">
            {['✓ Setup in 10 minutes', '✓ No app to install', '✓ Any phone or tablet', '✓ Cancel anytime'].map((item) => (
              <span key={item} className="flex items-center gap-1">{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ═══════════════════════════════════════════════════════════ */}
      <div className="border-y border-zinc-800 bg-zinc-950 py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
          {[
            ['⚡', 'Prices sync in under 2 min'],
            ['🛡️', 'Stale price auto-blocked'],
            ['🏢', 'Multi-branch built-in'],
            ['📴', 'Full offline support'],
            ['🔒', 'Single-device security'],
            ['📊', 'Staff analytics included'],
          ].map(([icon, label]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span>{icon}</span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ PAIN SECTION ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-zinc-950" aria-labelledby="problem-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>The Problem</SectionLabel>
            <h2 id="problem-heading" className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
              If you run a mobile phone or
              <br />
              <span className="text-red-400">appliance store in India — you know this pain.</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Prices change daily. Offers expire overnight. New models launch every week. Manual processes can&apos;t keep up.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAIN_POINTS.map((point) => (
              <article
                key={point.title}
                className="bg-zinc-900 rounded-xl border border-zinc-800 hover:border-red-500/30 p-6 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-800 group-hover:bg-red-500/10 flex items-center justify-center text-xl mb-4 transition-colors flex-shrink-0">
                  {point.emoji}
                </div>
                <h3 className="font-bold text-white mb-2 text-base">{point.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{point.desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <div className="inline-block bg-red-500/5 border border-red-500/20 rounded-xl px-8 py-5 max-w-2xl text-center">
              <p className="text-red-400 font-semibold text-lg">
                Every wrong price quoted = a lost sale or a lost margin.
                <br />
                <span className="font-black text-red-300">Across a 5-person team, this happens 10–20× a week.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SOLUTION CALLOUT ════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-orange-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-black mb-4">
            SalesSync solves dynamic pricing permanently.
          </h2>
          <p className="text-orange-950 text-lg max-w-2xl mx-auto leading-relaxed">
            One source of truth: your Google Sheet. SalesSync reads it every 2 minutes and pushes changes to every device in every branch. The moment you update a price or add an offer — every salesperson sees it, on their phone, at the counter.
          </p>
          <p className="text-orange-900 mt-3 font-medium">
            No emails. No WhatsApp. No printed sheets. No POS update sessions.
          </p>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-black" aria-labelledby="how-heading">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>How It Works</SectionLabel>
          <h2 id="how-heading" className="text-3xl md:text-5xl font-black text-center text-white mb-3">
            Live in under 10 minutes
          </h2>
          <p className="text-center text-zinc-500 mb-16 text-lg">No IT team. No technical knowledge. No hardware to buy.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-[calc(100%_-_1rem)] w-8 h-px bg-zinc-800 z-10" />
                )}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">{step.icon}</span>
                  </div>
                  <div className="text-xs font-black text-orange-500 mb-2 tracking-widest">STEP {step.step}</div>
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-zinc-950" aria-labelledby="features-heading">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>Features</SectionLabel>
          <h2 id="features-heading" className="text-3xl md:text-5xl font-black text-center text-white mb-3">
            Everything your team needs at the counter
          </h2>
          <p className="text-center text-zinc-500 mb-16 text-lg max-w-2xl mx-auto">
            Not just a price list. A complete sales support tool built for the Indian retail floor.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className={`rounded-xl border p-6 flex gap-4 transition-colors group ${
                  feature.core
                    ? 'bg-zinc-900 border-orange-500/20 hover:border-orange-500/40'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 mt-0.5 transition-colors ${
                  feature.core ? 'bg-orange-500/10 group-hover:bg-orange-500/15' : 'bg-zinc-800'
                }`}>
                  {feature.icon}
                </div>
                <div>
                  <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-bold text-white">{feature.title}</h3>
                    <span className={`text-xs rounded-full px-2 py-0.5 border flex-shrink-0 ${
                      feature.core
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}>
                      {feature.highlight}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICE FRESHNESS ═════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-black" aria-labelledby="freshness-heading">
        <div className="max-w-4xl mx-auto">
          <SectionLabel>⚡ Industry First</SectionLabel>
          <h2 id="freshness-heading" className="text-3xl md:text-5xl font-black text-center text-white mb-3">
            The Price Freshness Guarantee
          </h2>
          <p className="text-center text-zinc-400 mb-14 text-lg max-w-2xl mx-auto">
            Other tools display prices. SalesSync <strong className="text-white">guarantees they&apos;re current</strong>. If they&apos;re not — the catalogue is blocked, automatically.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {FRESHNESS_STATES.map((item) => (
              <div key={item.title} className={`rounded-xl border p-6 ${item.border} ${item.bg}`}>
                <span className={`inline-block text-xs font-black px-3 py-1 rounded-full border mb-4 ${item.badge}`}>
                  {item.state}
                </span>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-300 text-base leading-relaxed max-w-2xl mx-auto">
              <strong className="text-orange-500">This is what makes SalesSync different.</strong> Most tools just show data — they don&apos;t verify it&apos;s current. SalesSync actively blocks staff from quoting stale prices. In Indian mobile retail where a brand can change MOP by ₹1,500 overnight, or flash offers expire in 24 hours — this guarantee is worth more than the subscription.
            </p>
          </div>
        </div>
      </section>

      {/* ══ COMPARISON ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-zinc-950" aria-labelledby="comparison-heading">
        <div className="max-w-4xl mx-auto">
          <SectionLabel>Why Switch</SectionLabel>
          <h2 id="comparison-heading" className="text-3xl md:text-4xl font-black text-center text-white mb-3">
            SalesSync vs. how stores manage prices today
          </h2>
          <p className="text-center text-zinc-500 mb-12 text-lg">The real cost of manual price management</p>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 font-bold text-zinc-500 bg-zinc-900 w-1/3">What matters</th>
                  <th className="text-center p-4 font-bold text-zinc-500 bg-zinc-900 w-1/3">Manual (WhatsApp / Print / POS)</th>
                  <th className="text-center p-4 font-bold text-orange-400 bg-orange-500/5 w-1/3">With SalesSync</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.aspect} className={`border-b border-zinc-800 ${i % 2 === 0 ? 'bg-black' : 'bg-zinc-950'}`}>
                    <td className="p-4 font-medium text-zinc-300">{row.aspect}</td>
                    <td className="p-4 text-center text-zinc-500">{row.manual}</td>
                    <td className="p-4 text-center text-zinc-200 bg-orange-500/[0.03]">{row.pricesync}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══ WHO IT'S FOR ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-black" aria-labelledby="audience-heading">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>Who It&apos;s For</SectionLabel>
          <h2 id="audience-heading" className="text-3xl md:text-4xl font-black text-center text-white mb-3">
            Built for every scale of Indian retail
          </h2>
          <p className="text-center text-zinc-500 mb-14 text-lg">From a single shop to a national franchise network</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Single-Store Retailers',
                emoji: '🏪',
                desc: "One shop, 3–10 staff. Prices change every week. SalesSync puts the latest live catalogue on every salesperson's phone — always accurate.",
                tag: 'Most common',
                features: ['Up to 10 staff', 'One live price list', 'Counter-optimised UI'],
              },
              {
                title: 'Multi-Branch Operators',
                emoji: '🏢',
                desc: '2–20 branches across a city or region. Price consistency is a daily headache. SalesSync gives every branch the same live catalogue with per-branch analytics.',
                tag: 'Perfect fit',
                features: ['Branch-level isolation', 'Consistent prices everywhere', 'Central admin control'],
              },
              {
                title: 'Franchise & Dealer Networks',
                emoji: '🌐',
                desc: 'A network of dealer stores or franchise outlets. Push one authorised price list to all outlets simultaneously from HQ.',
                tag: 'Enterprise-ready',
                features: ['Unlimited branches', 'Super-admin dashboard', 'Dedicated onboarding'],
              },
            ].map((item) => (
              <div key={item.title} className="bg-zinc-900 rounded-xl border border-zinc-800 hover:border-orange-500/20 p-6 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-xl">{item.emoji}</div>
                  <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">{item.tag}</span>
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">{item.desc}</p>
                <ul className="space-y-1.5">
                  {item.features.map((f) => (
                    <li key={f} className="text-xs text-zinc-500 flex items-center gap-2">
                      <span className="text-orange-500 font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-zinc-950" aria-labelledby="testimonials-heading">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>From Store Owners</SectionLabel>
          <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-black text-center text-white mb-3">
            What retailers across India say
          </h2>
          <p className="text-center text-zinc-500 mb-14">Mobile phone stores and appliance chains</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map((t) => (
              <blockquote key={t.name} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col">
                <Stars />
                <p className="text-zinc-300 text-sm leading-relaxed mt-3 mb-4 flex-1">&ldquo;{t.text}&rdquo;</p>
                <footer>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{t.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ═════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-black" aria-labelledby="pricing-heading">
        <div className="max-w-4xl mx-auto">
          <SectionLabel>Pricing</SectionLabel>
          <h2 id="pricing-heading" className="text-3xl md:text-4xl font-black text-center text-white mb-3">
            Pay per user. No hidden fees.
          </h2>
          <p className="text-center text-zinc-500 mb-4 text-lg">Only pay for your active team. No annual lock-in.</p>
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-6 py-3">
              <span className="text-orange-500 font-bold text-sm">🎁 5-day free trial on all plans — no credit card required</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              {
                role: 'Sales Staff',
                price: '300',
                emoji: '🛒',
                desc: 'For your floor sales team',
                features: ['Full live price catalogue', 'Smart search & filters', 'Bank offers & EMI per product', 'Works on any phone or tablet', 'Offline cache support', 'Real-time price alerts', 'Stale price auto-blocker'],
                highlight: false,
              },
              {
                role: 'Store Manager',
                price: '500',
                emoji: '👔',
                desc: 'For branch managers',
                features: ['Everything in Sales Staff', 'Team activity overview', 'Staff analytics', 'Session monitoring', 'Price freshness dashboard', 'Performance reports', 'Priority support'],
                highlight: true,
              },
              {
                role: 'Admin / Owner',
                price: '700',
                emoji: '👑',
                desc: 'For owners & head office',
                features: ['Everything in Manager', 'Full admin panel', 'Add / remove accounts', 'Instant manual sync', 'Role & password management', 'Multi-branch oversight', 'Full audit logs'],
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.role}
                className={`rounded-2xl border p-6 flex flex-col transition-all ${
                  plan.highlight
                    ? 'border-orange-500 bg-zinc-900 shadow-[0_0_40px_rgba(249,115,22,0.08)]'
                    : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                {plan.highlight && (
                  <div className="text-center mb-3">
                    <span className="text-xs bg-orange-500 text-black font-black px-3 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
                <div className="text-2xl mb-2">{plan.emoji}</div>
                <h3 className="text-xl font-black text-white">{plan.role}</h3>
                <p className="text-zinc-500 text-sm mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">₹{plan.price}</span>
                  <span className="text-zinc-500 text-sm"> / user / month</span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="text-orange-500 font-bold mt-0.5 flex-shrink-0">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={scrollToForm}
                  className={`w-full font-bold py-5 ${
                    plan.highlight
                      ? 'bg-orange-500 hover:bg-orange-400 text-black shadow-lg shadow-orange-500/20'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  Start 5-Day Free Trial
                </Button>
              </div>
            ))}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
            <p className="text-zinc-400 text-sm leading-relaxed">
              <strong className="text-white">Real example:</strong> 6 Sales + 1 Manager + 1 Admin ={' '}
              <strong className="text-orange-400">₹{6 * 300 + 500 + 700}/month</strong> — less than printing weekly price lists, and far less than one wrong quote on a flagship phone.
            </p>
          </div>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-zinc-950" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto">
          <SectionLabel>FAQ</SectionLabel>
          <h2 id="faq-heading" className="text-3xl font-black text-center text-white mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden">
                <button
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-zinc-900 transition-colors bg-zinc-950"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-white text-sm md:text-base">{faq.q}</span>
                  <span className={`flex-shrink-0 text-lg font-light transition-colors ${openFaq === i ? 'text-orange-500' : 'text-zinc-600'}`}>
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 bg-zinc-950">
                    <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-20 px-4 bg-black overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(249,115,22,0.08), transparent 70%)' }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
            Your competitors are still
            <br />
            <span className="text-zinc-500">updating prices manually.</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
            Give your staff the most accurate, fastest price catalogue in your market — and never lose a sale to a wrong quote again.
          </p>
          <Button
            size="lg"
            onClick={scrollToForm}
            className="bg-orange-500 hover:bg-orange-400 text-black font-black text-lg px-10 py-7 rounded-xl shadow-2xl shadow-orange-500/25 transition-all hover:scale-105"
          >
            Start Your Free Trial Today →
          </Button>
          <p className="text-zinc-600 mt-4 text-sm">5 days free · No credit card · Setup in 10 minutes · Cancel anytime</p>
        </div>
      </section>

      {/* ══ REGISTRATION FORM ═══════════════════════════════════════════════════ */}
      <section id="register" ref={formRef} className="py-24 px-4 bg-zinc-950 border-t border-zinc-800" aria-labelledby="register-heading">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <LogoMark className="justify-center mb-4" />
            <h2 id="register-heading" className="text-3xl font-black text-white mb-2">
              Start your 5-day free trial
            </h2>
            <p className="text-zinc-500">Your store is live in 2 minutes. No credit card needed.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="storeName" className="text-zinc-300 font-semibold text-sm">
                  Store Name <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="storeName" name="storeName"
                  placeholder="e.g. Sharma Mobile Store"
                  value={formData.storeName} onChange={handleChange}
                  required disabled={loading}
                  className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
                <p className="text-xs text-zinc-600">
                  Your URL: <strong className="text-orange-500">{storeSlugPreview}.{ROOT_DOMAIN}</strong>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="adminName" className="text-zinc-300 font-semibold text-sm">
                    Your Name <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="adminName" name="adminName"
                    placeholder="Rajesh Sharma"
                    value={formData.adminName} onChange={handleChange}
                    required disabled={loading}
                    className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-zinc-300 font-semibold text-sm">Phone</Label>
                  <Input
                    id="phone" name="phone" type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone} onChange={handleChange}
                    disabled={loading}
                    className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-300 font-semibold text-sm">
                  Work Email <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="email" name="email" type="email"
                  placeholder="owner@yourstore.com"
                  value={formData.email} onChange={handleChange}
                  required disabled={loading}
                  className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-zinc-300 font-semibold text-sm">
                  Password <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="password" name="password" type="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password} onChange={handleChange}
                  required minLength={8} disabled={loading}
                  className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="googleSheetId" className="text-zinc-300 font-semibold text-sm">
                  Google Sheet ID{' '}
                  <span className="text-zinc-600 font-normal text-xs">(optional — add later)</span>
                </Label>
                <Input
                  id="googleSheetId" name="googleSheetId"
                  placeholder="Paste your spreadsheet ID here"
                  value={formData.googleSheetId} onChange={handleChange}
                  disabled={loading}
                  className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                />
                <p className="text-xs text-zinc-600">
                  From the URL: docs.google.com/spreadsheets/d/<strong className="text-zinc-500">[THIS PART]</strong>/edit
                </p>
              </div>
              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black text-base py-6 shadow-lg shadow-orange-500/20"
                disabled={loading}
              >
                {loading ? 'Creating your store...' : 'Create My Store — Start Free Trial →'}
              </Button>
              <p className="text-xs text-center text-zinc-600">
                By registering you agree to our terms. No credit card for the 5-day trial. Cancel anytime.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════════ */}
      <footer className="py-14 px-4 bg-black border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-1">
              <LogoMark className="mb-3" />
              <p className="text-sm text-zinc-600 leading-relaxed">
                Real-time price management for mobile phone and appliance retailers across India.
              </p>
              <p className="text-xs text-zinc-700 mt-3">
                A product by{' '}
                <a href="https://deda.systems" className="text-zinc-500 hover:text-orange-500 transition-colors">
                  Deda Systems
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-zinc-300 font-semibold mb-3 text-sm">Product</h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                {['Live Google Sheets Sync', 'Stale Price Blocker', 'Multi-Branch Support', 'Role-Based Access', 'Staff Analytics', 'Offline Support'].map(f => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-zinc-300 font-semibold mb-3 text-sm">Built For</h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                {['Mobile Phone Stores', 'Appliance Retailers', 'Multi-Branch Chains', 'Franchise Networks', 'Exclusive Brand Outlets', 'Dealer Networks'].map(f => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-zinc-300 font-semibold mb-3 text-sm">Pricing</h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                <li>Sales Staff — ₹300 / user / mo</li>
                <li>Store Manager — ₹500 / user / mo</li>
                <li>Admin / Owner — ₹700 / user / mo</li>
                <li className="text-orange-500 font-semibold pt-1">✓ 5-day free trial</li>
              </ul>
              <Button size="sm" onClick={scrollToForm} className="mt-4 bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs">
                Start Free Trial
              </Button>
            </div>
          </div>
          <div className="border-t border-zinc-900 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-zinc-700">
            <p>© {new Date().getFullYear()} Deda Systems. SalesSync — built for mobile phone and appliance retailers in India.</p>
            <p>Billing via Razorpay · Hosted on Railway · Data stored in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────

function LoginPage({ tenantSlug }: { tenantSlug: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/catalogue');
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-4">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(249,115,22,0.06), transparent 60%)' }} />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <LogoMark className="justify-center mb-3" />
          <p className="text-zinc-500 text-sm">
            Signing in to{' '}
            <span className="text-orange-500 font-semibold">{tenantSlug}</span>
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-300 font-semibold text-sm">Email</Label>
              <Input
                id="email" type="email"
                placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required disabled={loading}
                className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-zinc-300 font-semibold text-sm">Password</Label>
              <Input
                id="password" type="password"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required disabled={loading}
                className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500"
              />
            </div>
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-6 text-base shadow-lg shadow-orange-500/20"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>
        <p className="text-center text-xs text-zinc-700 mt-4">
          Powered by{' '}
          <a href="https://deda.systems" className="text-zinc-600 hover:text-orange-500 transition-colors">
            Deda Systems
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function RootPage() {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  useEffect(() => { setTenantSlug(getTenantSlug()); }, []);

  if (tenantSlug === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (tenantSlug) return <LoginPage tenantSlug={tenantSlug} />;
  return <LandingPage />;
}
