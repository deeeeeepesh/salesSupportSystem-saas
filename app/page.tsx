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
  // Root domain or local dev — show landing page
  if (hostname === ROOT_DOMAIN || hostname === 'localhost' || hostname === '127.0.0.1') return '';
  // Subdomain of ROOT_DOMAIN — show login for that tenant
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = hostname.replace(`.${ROOT_DOMAIN}`, '');
    if (sub === 'admin') return '';
    return sub;
  }
  // Any other hostname (Railway, Vercel previews, custom domains not yet configured)
  // — show landing page, not login
  return '';
}

// ─── STRUCTURED DATA ─────────────────────────────────────────────────────────
const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PriceSync',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any (Web Browser)',
  inLanguage: 'en-IN',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
    description: '5-day free trial — no credit card required',
  },
  description:
    'PriceSync is a real-time price management and sales support system for multi-branch mobile phone and appliance retailers in India. It automatically syncs prices from Google Sheets to every branch and every device, with a stale-price blocker that prevents staff from quoting outdated prices.',
  audience: {
    '@type': 'BusinessAudience',
    audienceType:
      'Mobile phone retailers, appliance store chains, multi-branch electronics retailers in India',
  },
  areaServed: { '@type': 'Country', name: 'India' },
  featureList: [
    'Real-time price sync from Google Sheets (every 2 minutes)',
    'Multi-branch management from one admin dashboard',
    'Automatic stale price detection and blocking',
    'Role-based access — Sales staff, Store Manager, Admin',
    'Counter-optimised mobile and tablet UI',
    'Offline cache — works without internet',
    'Single-device login security per account',
    'Auto-refresh on all connected devices simultaneously',
    'Bank offer and EMI details per product',
    'Staff analytics and active session monitoring',
  ],
  provider: {
    '@type': 'Organization',
    name: 'Deda Systems',
  },
});

// ─── DATA ─────────────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    emoji: '📋',
    title: 'Printed price lists go stale overnight',
    desc: "You print 20 copies on Monday. By Tuesday, three models have new offers, one brand dropped MOP by ₹500, and your staff is quoting yesterday's prices to today's customers. The customer knows — they checked online.",
  },
  {
    emoji: '📱',
    title: 'Staff guess prices during peak hours',
    desc: "On a busy Saturday, staff can't pause a sale to call the manager. They quote the price they remember from last week — which could be wrong by ₹1,000. A wrong quote either loses the customer or costs you the margin.",
  },
  {
    emoji: '🏪',
    title: 'Multi-branch price consistency is a nightmare',
    desc: "You run 3 branches across the city. Each manager maintains their own list. The same Samsung A55 has three different prices on the same day. A customer from Branch 2 comes to Branch 1 — and walks out angry.",
  },
  {
    emoji: '🏷️',
    title: 'Bank offers and exchange deals change weekly',
    desc: "HDFC has a ₹3,000 cashback this weekend. ICICI has EMI offers. Exchange values change daily. Your frontline staff either doesn't know or spends 5 minutes finding out — the customer loses patience and walks.",
  },
  {
    emoji: '🔄',
    title: 'POS price updates are a slow operational task',
    desc: "Updating the POS or ERP with the new price list takes your manager 2–3 hours every week. On launch days — like a new iPhone or Samsung Galaxy — the system needs a full update while the store is open and billing.",
  },
  {
    emoji: '📉',
    title: 'New launches create chaos on day one',
    desc: "A new flagship launches today. Specs, prices, colours, and offers aren't in your system yet. Staff google pricing on their personal phones while the customer waits. You look unprepared.",
  },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Live Price Sync from Google Sheets',
    desc: "You already manage your price list in Google Sheets. PriceSync reads it every 2 minutes and pushes changes to every device across every branch — automatically. No manual entry, no CSV uploads.",
    highlight: 'Works with your existing workflow',
    core: true,
  },
  {
    icon: '🛡️',
    title: 'Stale Price Blocker — The Industry First',
    desc: "If prices haven't refreshed in 5 minutes, PriceSync automatically blocks the catalogue with a clear warning. Staff cannot quote stale prices. In a market where prices change ₹1,000 in a day, this is not optional.",
    highlight: 'Unique to PriceSync',
    core: true,
  },
  {
    icon: '🔍',
    title: 'Instant Smart Search Catalogue',
    desc: 'Staff type "samng a5" and find Samsung A55 instantly. Handles typos, partial names, RAM/ROM specs, and offer keywords. Find any product across 500+ SKUs in under 3 seconds — faster than any POS.',
    highlight: 'Typo-tolerant, instant results',
    core: false,
  },
  {
    icon: '🏢',
    title: 'Multi-Branch from One Admin Seat',
    desc: 'Each branch gets its own secure login portal at its own URL. All branches share the same live price list. One update from HQ — reflected across all branches in 2 minutes.',
    highlight: 'For 2–50 branch operations',
    core: false,
  },
  {
    icon: '🔔',
    title: 'Auto-Refresh All Devices Simultaneously',
    desc: 'When you update prices, every open browser tab across every device in every branch automatically refreshes — no F5, no manual action needed. Powered by Redis pub/sub and Server-Sent Events.',
    highlight: 'Zero-lag propagation',
    core: true,
  },
  {
    icon: '📊',
    title: 'Offers, EMI & Sales Pitch per Product',
    desc: "Every product page shows the current offer, bank EMI schemes, exchange rate, and your custom sales pitch. Staff have everything they need to close the sale — in one screen, not 4 different apps.",
    highlight: 'Bank offers & EMI details built-in',
    core: false,
  },
  {
    icon: '📴',
    title: 'Works Offline — No Internet, No Problem',
    desc: "Poor network at the counter? PriceSync caches the latest price list on-device. Staff browse the full catalogue even when offline. A clear badge shows the sync status. Auto-syncs the moment connectivity returns.",
    highlight: 'Offline cache on every device',
    core: false,
  },
  {
    icon: '👥',
    title: 'Role-Based Access for Every Level',
    desc: 'Sales staff see the catalogue. Store managers see team analytics. Owners see everything — user management, sync controls, and audit logs. Right information to the right person, nothing more.',
    highlight: 'No information overload for floor staff',
    core: false,
  },
  {
    icon: '🔒',
    title: 'Single-Device Login Security',
    desc: 'One account, one active device at a time. If a staff member logs in on a new device, the previous session is immediately terminated with a notification. Your price data stays protected.',
    highlight: 'Enterprise-grade session security',
    core: false,
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Register Your Store',
    desc: "Create your store in 2 minutes. You get a private URL — yourstore.salessupportapp.dedasystems.com. Only staff you add can access it. Nothing is public.",
    icon: '🏪',
  },
  {
    step: '02',
    title: 'Connect Your Google Sheet',
    desc: "Paste your Google Sheet ID. PriceSync connects securely using a read-only service account. No need to share edit access. Your sheet stays yours.",
    icon: '📊',
  },
  {
    step: '03',
    title: 'Add Your Staff & Branches',
    desc: "Create logins for your team, assign roles (Sales / Manager / Admin). Share the URL. They open it on any device, log in, and they're live.",
    icon: '👥',
  },
  {
    step: '04',
    title: 'Update Once, Seen Everywhere',
    desc: "Change a price in your Google Sheet. In under 2 minutes, every staff member in every branch sees the update on their device — automatically.",
    icon: '⚡',
  },
];

const FRESHNESS_STATES = [
  {
    state: '✅ LIVE',
    color: 'bg-green-50 border-green-300',
    badgeColor: 'bg-green-100 text-green-800 border-green-300',
    title: 'Prices are accurate & current',
    desc: 'Data synced within the last 5 minutes. Staff can quote any price with full confidence. Catalogue is fully accessible.',
  },
  {
    state: '🔄 SYNCING',
    color: 'bg-yellow-50 border-yellow-300',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    title: 'Refresh in progress',
    desc: "Prices may be slightly older. An overlay shows staff that a sync is happening. Refreshes automatically — no action needed.",
  },
  {
    state: '🔴 BLOCKED',
    color: 'bg-red-50 border-red-300',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    title: 'Stale data — catalogue blocked',
    desc: 'Data is more than 5 minutes old without a successful sync. Catalogue is fully blocked. Staff cannot quote prices until fresh data loads.',
  },
];

const COMPARISON = [
  {
    aspect: 'Price accuracy guarantee',
    manual: '❌ No guarantee — stale data shown silently',
    pricesync: '✅ Stale price automatically blocked, never shown',
  },
  {
    aspect: 'Speed to update all branches',
    manual: '🐌 1–3 hours (print, send, distribute)',
    pricesync: '⚡ Under 2 minutes, automatic',
  },
  {
    aspect: 'Works during busy peak hours',
    manual: '❌ Staff too busy for manual updates',
    pricesync: '✅ Fully automatic — zero staff effort',
  },
  {
    aspect: 'New model launch day readiness',
    manual: '❌ Day-1 chaos is normal',
    pricesync: '✅ Add to Sheet → live everywhere instantly',
  },
  {
    aspect: 'Bank offer & EMI visibility',
    manual: '❌ Staff must remember or call manager',
    pricesync: '✅ Shown on every product card automatically',
  },
  {
    aspect: 'Works when network is slow',
    manual: '✅ Physical lists always work',
    pricesync: '✅ Offline cache shows last synced prices',
  },
  {
    aspect: 'Multi-branch consistency',
    manual: '❌ Each branch maintains its own version',
    pricesync: '✅ All branches on the same live list always',
  },
  {
    aspect: 'Cost of wrong quotes',
    manual: '💸 Lost sales + margin hits + customer trust',
    pricesync: '₹300–₹700/user/month — pays for itself day one',
  },
];

const TESTIMONIALS = [
  {
    name: 'Suresh Menon',
    role: 'Owner, 3-branch mobile store, Kochi',
    text: "Before PriceSync, I was sending price updates on WhatsApp and praying everyone saw them in time. Now I update the Sheet and I'm done. All three stores are always on the same page — literally.",
    rating: 5,
  },
  {
    name: 'Priya Ranganathan',
    role: 'Operations Head, 8-store electronics chain, Chennai',
    text: "We run 8 stores across Tamil Nadu. The Saturday new-launch madness is gone. Staff have the new model's price and all bank offers on their phone before the first customer walks in.",
    rating: 5,
  },
  {
    name: 'Amit Gupta',
    role: 'Store Manager, Samsung exclusive store, Ahmedabad',
    text: "The stale price blocker changed everything for us. Staff know that if the badge is green, the price is accurate. That confidence closes ₹50,000 sales. Before this, we were guessing.",
    rating: 5,
  },
  {
    name: 'Kavitha Nair',
    role: 'Co-owner, Reliance Digital franchise, Bengaluru',
    text: "Setup took 20 minutes. We connected our Google Sheet, added 12 staff, and went live. Now I change a price from home and it's on the store floor in 2 minutes. No calls, no WhatsApp.",
    rating: 5,
  },
];

const FAQS = [
  {
    q: 'Do my staff need to install any app?',
    a: "No installation needed at all. PriceSync is a web application that works in any browser on any device — Android phone, iPhone, tablet, or laptop. Staff just open the URL and log in. It also supports 'Add to Home Screen' via PWA, giving an app-like experience without the Play Store or App Store.",
  },
  {
    q: 'What if the internet goes down in the store?',
    a: "PriceSync caches the latest price list on every device. Staff can continue browsing the full catalogue even without internet. The UI clearly shows an 'Offline — showing last synced data' status badge. The moment connectivity returns, it auto-syncs all updates.",
  },
  {
    q: 'We have 4 branches. Do we need 4 separate accounts?',
    a: 'You can structure it either way. Each branch can be its own isolated store (separate Google Sheet, separate staff pool) or you can run all branches under one store with a shared catalogue. Most multi-branch operators create one store per branch for clean per-branch analytics and access control.',
  },
  {
    q: 'How do I update prices?',
    a: "Just update your existing Google Sheet — exactly as you do today. PriceSync reads the sheet every 2 minutes and pushes updates to all connected devices automatically. No login to PriceSync, no manual sync button. You can also force-sync instantly from the Admin panel anytime.",
  },
  {
    q: "Is my price data secure? Can competitors or the public see my prices?",
    a: "Your store is completely private. Only staff accounts you create can log in. Data is isolated per store — no other user or store can see your prices, staff list, or catalogue. All data is encrypted in transit (TLS) and at rest. Sessions are tracked and can be remotely terminated.",
  },
  {
    q: 'What happens after the 5-day free trial?',
    a: "After the trial, you choose a plan and add a payment method via Razorpay. Billing is per user per month — ₹300 for Sales staff, ₹500 for Store Managers, ₹700 for Admins. You only pay for active users. No annual lock-in, no contracts. Cancel anytime and your data is yours to export.",
  },
  {
    q: 'We also sell appliances — TVs, ACs, refrigerators. Does PriceSync work?',
    a: 'Yes. PriceSync works for any product catalogue. Mobile phones, tablets, smartwatches, accessories, TVs, ACs, washing machines, refrigerators — anything in your Google Sheet will be in PriceSync. The search system handles any product category.',
  },
  {
    q: "What is the 'stale price blocker' and why does it matter?",
    a: "If price data on a device is more than 5 minutes old without a successful sync, PriceSync automatically blocks the catalogue view with a clear red warning. Staff cannot quote prices from stale data. In Indian mobile retail where prices change ₹500–₹2,000 in a day, quoting a wrong price either loses the sale or costs you the margin. The blocker is the feature that makes PriceSync worth every rupee.",
  },
  {
    q: 'How is PriceSync different from sharing a Google Sheet link with my staff?',
    a: "A raw Sheet is not built for the sales counter — it's slow on mobile, hard to search under time pressure, shows edit history, and has no access control. PriceSync turns your Sheet data into a fast, role-controlled, always-live catalogue with stale price blocking, staff analytics, offline support, bank offer details, and session security that a shared Sheet can never provide.",
  },
];

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-yellow-400 text-sm" aria-hidden="true">★</span>
      ))}
    </div>
  );
}

function Navbar({ onRegisterClick }: { onRegisterClick: () => void }) {
  return (
    <nav
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-blue-700 tracking-tight">PriceSync</span>
          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
            for mobile &amp; appliance stores
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden lg:block">
            Built for Indian multi-branch retailers
          </span>
          <Button
            size="sm"
            onClick={onRegisterClick}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-sm"
          >
            Start 5-Day Free Trial
          </Button>
        </div>
      </div>
    </nav>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

function LandingPage() {
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
  const [success, setSuccess] = useState<{
    slug: string;
    url: string;
    trialEndsAt: string;
  } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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
        setError(data.error || 'Registration failed. Please try again.');
      } else {
        setSuccess({ slug: data.slug, url: data.url, trialEndsAt: data.trialEndsAt });
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const storeSlugPreview = formData.storeName
    ? formData.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    : 'yourstore';

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-lg shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="text-5xl mb-3">🎉</div>
            <CardTitle className="text-2xl text-green-700">Your Store is Live!</CardTitle>
            <CardDescription className="text-base">
              5-day free trial has started. No credit card needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">
                Your Private Store URL
              </p>
              <a
                href={success.url}
                className="text-green-800 font-mono text-sm break-all hover:underline font-bold"
              >
                {success.url}
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Trial Ends</p>
                <p className="font-semibold text-gray-800">
                  {new Date(success.trialEndsAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Next Step</p>
                <p className="font-semibold text-gray-800">Connect your Google Sheet</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 leading-relaxed">
              <strong>What to do now:</strong> Click your store URL above → Log in with the email
              and password you just set → Go to <strong>Admin → Settings</strong> to connect your
              Google Sheets price list → Add staff accounts for your team.
            </div>
            <Button
              className="w-full bg-green-700 hover:bg-green-800 font-bold text-base py-6"
              onClick={() => {
                window.location.href = success.url;
              }}
            >
              Open My Store →
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* JSON-LD for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />

      <Navbar onRegisterClick={scrollToForm} />

      {/* ══ HERO ═══════════════════════════════════════════════════════════════ */}
      <section
        className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white py-20 md:py-28 px-4"
        aria-labelledby="hero-heading"
      >
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-5 bg-blue-500/30 text-blue-100 border-blue-400/50 text-sm px-4 py-1.5">
            Built exclusively for Indian mobile phone &amp; appliance retailers
          </Badge>
          <h1
            id="hero-heading"
            className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight"
          >
            Your staff will never quote
            <br />
            <span className="text-yellow-300">a wrong price again.</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-5 max-w-3xl mx-auto leading-relaxed">
            PriceSync gives every salesperson in every branch a live, searchable price
            catalogue — synced automatically from your Google Sheet, updated in real time,
            accessible on any phone or tablet at the counter.
          </p>
          <p className="text-blue-200 mb-10 text-lg max-w-2xl mx-auto">
            No more printed price lists. No more WhatsApp price forwards. No more customers
            walking because your staff didn&apos;t know today&apos;s offer or bank EMI scheme.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <Button
              size="lg"
              onClick={scrollToForm}
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black text-lg px-10 py-7 rounded-xl shadow-lg transition-transform hover:scale-105"
            >
              Start Free — 5 Days, No Credit Card
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-blue-200 text-sm">
            {[
              '✓ Setup in under 10 minutes',
              '✓ No app to install',
              '✓ Works on any phone or tablet',
              '✓ Cancel anytime',
            ].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ══════════════════════════════════════════════════════════ */}
      <div className="bg-blue-900 py-5 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-5 text-sm text-blue-200">
          {[
            '📍 Multi-branch support built-in',
            '⚡ Prices sync in under 2 minutes',
            '🛡️ Stale price auto-blocked',
            '📴 Full offline support',
            '🔒 Single-device session security',
            '📊 Staff analytics included',
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      {/* ══ PROBLEM SECTION ════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gray-50" aria-labelledby="problem-heading">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 id="problem-heading" className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              If you run a mobile phone or appliance store in India,
              <br />
              <span className="text-red-600">you know this pain.</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Prices change daily. Offers expire overnight. New models launch every week.
              Your team is doing their best — but manual processes can&apos;t keep up with
              today&apos;s market pace.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PAIN_POINTS.map((point) => (
              <article
                key={point.title}
                className="bg-white rounded-xl border border-red-100 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-3">{point.emoji}</div>
                <h3 className="font-bold text-gray-900 mb-2">{point.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{point.desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-12 text-center">
            <div className="inline-block bg-red-50 border border-red-200 rounded-xl px-8 py-5 max-w-2xl">
              <p className="text-red-800 font-semibold text-lg">
                Every wrong price quoted is either a lost sale or a lost margin.
                <br />
                <span className="font-black">
                  Across a 5-person team, this happens 10–20 times a week.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SOLUTION CALLOUT ═══════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-5">
            PriceSync solves the dynamic pricing problem permanently.
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
            One source of truth: your Google Sheet. PriceSync reads it every 2 minutes and
            instantly pushes changes to every device in every branch. The moment you update
            a price, add a new model, or change a bank offer — every salesperson sees it in
            under 2 minutes, on their phone, at the counter.
          </p>
          <p className="text-blue-200 mt-4 text-base">
            No emails. No WhatsApp forwards. No printed sheets. No POS update sessions.
          </p>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white" aria-labelledby="how-heading">
        <div className="max-w-5xl mx-auto">
          <h2 id="how-heading" className="text-3xl md:text-4xl font-black text-center text-gray-900 mb-3">
            How PriceSync works
          </h2>
          <p className="text-center text-gray-500 mb-14 text-lg">
            Setup takes less than 10 minutes. No IT team. No technical knowledge required.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="text-4xl mb-3">{step.icon}</div>
                <div className="text-xs font-black text-blue-700 mb-2 tracking-widest">
                  STEP {step.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gray-50" aria-labelledby="features-heading">
        <div className="max-w-5xl mx-auto">
          <h2 id="features-heading" className="text-3xl md:text-4xl font-black text-center text-gray-900 mb-3">
            Everything your team needs at the sales counter
          </h2>
          <p className="text-center text-gray-500 mb-14 text-lg max-w-2xl mx-auto">
            Not just a price list. A complete sales support tool built for the Indian retail floor.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className={`bg-white rounded-xl border p-6 flex gap-4 hover:shadow-md transition-shadow ${
                  feature.core ? 'border-blue-200 shadow-sm' : 'border-gray-200'
                }`}
              >
                <div className="text-3xl flex-shrink-0 mt-1">{feature.icon}</div>
                <div>
                  <div className="flex items-start gap-2 mb-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">{feature.title}</h3>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 flex-shrink-0 border ${
                        feature.core
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {feature.highlight}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICE FRESHNESS GUARANTEE ══════════════════════════════════════════ */}
      <section
        className="py-20 px-4 bg-gradient-to-br from-indigo-50 via-blue-50 to-white"
        aria-labelledby="freshness-heading"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 border-indigo-300">
              Industry First — Unique to PriceSync
            </Badge>
            <h2 id="freshness-heading" className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              The Price Freshness Guarantee
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Other tools display prices. PriceSync{' '}
              <strong>guarantees those prices are current</strong>. If they&apos;re not,
              the catalogue is blocked — automatically.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {FRESHNESS_STATES.map((item) => (
              <div key={item.title} className={`rounded-xl border-2 p-6 ${item.color}`}>
                <span className={`inline-block text-xs font-black px-3 py-1 rounded-full border mb-3 ${item.badgeColor}`}>
                  {item.state}
                </span>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-blue-200 rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-700 text-base leading-relaxed max-w-2xl mx-auto">
              <strong className="text-blue-700">This is what makes PriceSync different.</strong>{' '}
              Most price display tools just show data — they don&apos;t verify it&apos;s current.
              PriceSync actively blocks staff from quoting stale prices. In Indian mobile retail
              where a brand can change MOP by ₹1,500 with a week&apos;s notice, or where flash
              offers expire in 24 hours, this guarantee is worth more than the subscription cost.
            </p>
          </div>
        </div>
      </section>

      {/* ══ COMPARISON TABLE ═══════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white" aria-labelledby="comparison-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="comparison-heading" className="text-3xl font-black text-center text-gray-900 mb-3">
            PriceSync vs. how stores manage prices today
          </h2>
          <p className="text-center text-gray-500 mb-12 text-lg">
            The real cost of manual price management — in sales lost and margins hit
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-4 font-bold text-gray-700 w-1/3">What matters to you</th>
                  <th className="text-center p-4 font-bold text-gray-500 w-1/3">Manual (WhatsApp / Printed lists / POS update)</th>
                  <th className="text-center p-4 font-bold text-blue-700 w-1/3 bg-blue-50">With PriceSync</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.aspect} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="p-4 font-medium text-gray-700 border-b border-gray-100">{row.aspect}</td>
                    <td className="p-4 text-center text-gray-500 border-b border-gray-100">{row.manual}</td>
                    <td className="p-4 text-center font-medium text-gray-800 bg-blue-50/30 border-b border-gray-100">{row.pricesync}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══ WHO IS IT FOR ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gray-50" aria-labelledby="audience-heading">
        <div className="max-w-5xl mx-auto">
          <h2 id="audience-heading" className="text-3xl font-black text-center text-gray-900 mb-3">
            Who is PriceSync built for?
          </h2>
          <p className="text-center text-gray-500 mb-12 text-lg">
            From single-outlet shops to large franchise networks across India
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Single-Store Retailers',
                emoji: '🏪',
                desc: "You have one shop and 3–10 sales staff. Prices change every week. PriceSync puts the latest live catalogue on every salesperson's phone — always accurate, always accessible.",
                tag: 'Most common',
                features: ['Up to 10 staff', 'One live price list', 'Counter-optimised UI'],
              },
              {
                title: 'Multi-Branch Operators',
                emoji: '🏢',
                desc: 'You run 2–20 branches across a city or region. Price consistency is a daily headache. PriceSync gives every branch the same live catalogue with per-branch analytics.',
                tag: 'Perfect fit',
                features: ['Branch-level isolation', 'Consistent prices everywhere', 'Central admin control'],
              },
              {
                title: 'Franchise & Dealer Networks',
                emoji: '🌐',
                desc: 'You manage a network of dealer stores or franchise outlets. PriceSync lets you push one authorised price list to all outlets simultaneously.',
                tag: 'Enterprise-ready',
                features: ['Unlimited branches', 'Super-admin dashboard', 'Dedicated onboarding support'],
              },
            ].map((item) => (
              <Card key={item.title} className="border-2 border-gray-100 hover:border-blue-200 transition-colors shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between mb-1">
                    <div className="text-4xl">{item.emoji}</div>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">{item.tag}</Badge>
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{item.desc}</p>
                  <ul className="space-y-1.5">
                    {item.features.map((f) => (
                      <li key={f} className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="text-blue-500 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white" aria-labelledby="testimonials-heading">
        <div className="max-w-5xl mx-auto">
          <h2 id="testimonials-heading" className="text-3xl font-black text-center text-gray-900 mb-3">
            What store owners &amp; managers say
          </h2>
          <p className="text-center text-gray-500 mb-12">
            From mobile phone stores and appliance retailers across India
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map((t) => (
              <blockquote key={t.name} className="bg-gray-50 rounded-xl border border-gray-200 p-5 flex flex-col">
                <StarRating count={t.rating} />
                <p className="text-gray-700 text-sm leading-relaxed mt-3 mb-4 flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>
                <footer>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{t.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white" aria-labelledby="pricing-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="pricing-heading" className="text-3xl md:text-4xl font-black text-center text-gray-900 mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-gray-500 mb-4 text-lg">
            Pay per user. Only pay for your active team. No hidden fees. No annual lock-in.
          </p>
          <div className="text-center mb-12">
            <div className="inline-block bg-yellow-50 border border-yellow-300 rounded-xl px-6 py-3 shadow-sm">
              <p className="text-yellow-800 font-bold">
                🎁 5-day free trial on all plans — no credit card required
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                role: 'Sales Staff',
                price: '300',
                emoji: '🛒',
                desc: 'For your floor sales team at the counter',
                features: [
                  'Full live price catalogue',
                  'Smart search & category filters',
                  'Bank offers & EMI details per product',
                  'Works on any phone or tablet',
                  'Offline cache support',
                  'Real-time price change alerts',
                  'Stale price auto-blocker',
                ],
                highlight: false,
              },
              {
                role: 'Store Manager',
                price: '500',
                emoji: '👔',
                desc: 'For branch managers & supervisors',
                features: [
                  'Everything in Sales Staff',
                  'Team activity overview',
                  'Staff engagement analytics',
                  'Active session monitoring',
                  'Price freshness status dashboard',
                  'Performance reports',
                  'Priority support',
                ],
                highlight: true,
              },
              {
                role: 'Admin / Owner',
                price: '700',
                emoji: '👑',
                desc: 'For store owners & head office',
                features: [
                  'Everything in Store Manager',
                  'Full admin control panel',
                  'Add / remove staff accounts',
                  'Instant manual price sync trigger',
                  'Role & password management',
                  'Multi-branch oversight',
                  'Full audit logs',
                ],
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.role}
                className={`rounded-2xl border-2 p-6 flex flex-col ${
                  plan.highlight
                    ? 'border-blue-600 shadow-xl bg-blue-50'
                    : 'border-gray-200 bg-white shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="text-center mb-3">
                    <Badge className="bg-blue-600 text-white border-0">Most Popular</Badge>
                  </div>
                )}
                <div className="text-3xl mb-2">{plan.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900">{plan.role}</h3>
                <p className="text-gray-500 text-sm mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-500 text-sm"> / user / month</span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={scrollToForm}
                  className={`w-full font-semibold py-5 ${
                    plan.highlight
                      ? 'bg-blue-700 hover:bg-blue-800 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  Start 5-Day Free Trial
                </Button>
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
            <p className="text-gray-700 text-sm leading-relaxed">
              <strong>Real example:</strong> A store with 6 Sales staff + 1 Manager + 1 Admin
              = <strong>₹{6 * 300 + 500 + 700}/month</strong> — less than the cost of weekly
              price list printing, and far less than the margin lost to a single wrong quote on a
              flagship phone.
            </p>
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto">
          <h2 id="faq-heading" className="text-3xl font-black text-center text-gray-900 mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-gray-900 text-sm md:text-base">{faq.q}</span>
                  <span className="text-gray-400 flex-shrink-0 text-xl font-light">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Your competitors are still updating prices manually.
          </h2>
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Give your staff the most accurate, fastest price catalogue in your market — and
            never lose a sale to a wrong quote again.
          </p>
          <Button
            size="lg"
            onClick={scrollToForm}
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black text-lg px-10 py-7 rounded-xl shadow-lg transition-transform hover:scale-105"
          >
            Start Your Free Trial Today →
          </Button>
          <p className="text-blue-300 mt-4 text-sm">
            5 days free · No credit card · Setup in 10 minutes · Cancel anytime
          </p>
        </div>
      </section>

      {/* ══ REGISTRATION FORM ══════════════════════════════════════════════════ */}
      <section
        id="register"
        ref={formRef}
        className="py-20 px-4 bg-gradient-to-br from-gray-900 to-blue-950"
        aria-labelledby="register-heading"
      >
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h2 id="register-heading" className="text-3xl font-black text-white mb-2">
              Start your 5-day free trial
            </h2>
            <p className="text-blue-300">
              Your store is live in 2 minutes. No credit card needed.
            </p>
          </div>
          <Card className="shadow-2xl border-0">
            <CardContent className="pt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="storeName" className="font-semibold">
                    Store Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="storeName"
                    name="storeName"
                    placeholder="e.g. Sharma Mobile Store"
                    value={formData.storeName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                  <p className="text-xs text-gray-500">
                    Your private store URL:{' '}
                    <strong className="text-blue-700 break-all">
                      {storeSlugPreview}.{ROOT_DOMAIN}
                    </strong>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="adminName" className="font-semibold">
                      Your Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="adminName"
                      name="adminName"
                      placeholder="Rajesh Sharma"
                      value={formData.adminName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="font-semibold">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="font-semibold">
                    Work Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="owner@yourstore.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="font-semibold">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    disabled={loading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="googleSheetId" className="font-semibold">
                    Google Sheet ID{' '}
                    <span className="text-gray-400 font-normal text-xs">
                      (optional — add later in Settings)
                    </span>
                  </Label>
                  <Input
                    id="googleSheetId"
                    name="googleSheetId"
                    placeholder="Paste your spreadsheet ID here"
                    value={formData.googleSheetId}
                    onChange={handleChange}
                    disabled={loading}
                    className="h-11"
                  />
                  <p className="text-xs text-gray-500">
                    From the URL: docs.google.com/spreadsheets/d/<strong>[THIS PART]</strong>/edit
                  </p>
                </div>
                {error && (
                  <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-800 font-black text-base py-6"
                  disabled={loading}
                >
                  {loading ? 'Creating your store...' : 'Create My Store — Start Free Trial →'}
                </Button>
                <p className="text-xs text-center text-gray-500">
                  By registering you agree to our terms of use. No credit card required for the
                  5-day trial. Cancel anytime.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════════════════════════════════ */}
      <footer className="py-14 px-4 bg-gray-950 text-gray-400">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-1">
              <div className="text-2xl font-black text-white mb-2">PriceSync</div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Real-time price management and sales support system for mobile phone and appliance
                retailers across India.
              </p>
              <p className="text-xs text-gray-600 mt-3">A product by Deda Systems</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm">Features</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Live Google Sheets Sync</li>
                <li>Stale Price Blocker</li>
                <li>Multi-Branch Support</li>
                <li>Role-Based Access</li>
                <li>Staff Analytics</li>
                <li>Offline Support</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm">Built For</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Mobile Phone Stores</li>
                <li>Appliance Retailers</li>
                <li>Multi-Branch Chains</li>
                <li>Franchise Networks</li>
                <li>Exclusive Brand Outlets</li>
                <li>Dealer Networks</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm">Pricing</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Sales Staff — ₹300 / user / month</li>
                <li>Store Manager — ₹500 / user / month</li>
                <li>Admin / Owner — ₹700 / user / month</li>
                <li className="text-green-400 font-semibold pt-1">
                  ✓ 5-day free trial — all plans
                </li>
              </ul>
              <div className="mt-4">
                <Button
                  size="sm"
                  onClick={scrollToForm}
                  className="bg-blue-700 hover:bg-blue-800 text-white text-xs"
                >
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <p>
              © {new Date().getFullYear()} Deda Systems. PriceSync — built for mobile phone
              and appliance retailers in India.
            </p>
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
      const result = await signIn('credentials', {
        email,
        password,
        tenantSlug,
        redirect: false,
      });
      if (result?.error) setError(result.error);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="text-3xl font-black text-blue-700 mb-1">PriceSync</div>
          <CardTitle className="text-xl font-bold text-gray-900">Welcome back</CardTitle>
          <CardDescription>
            Sign in to <strong className="text-blue-700">{tenantSlug}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>
            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 font-black py-6 text-base"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function RootPage() {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    setTenantSlug(getTenantSlug());
  }, []);

  if (tenantSlug === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (tenantSlug) return <LoginPage tenantSlug={tenantSlug} />;
  return <LandingPage />;
}
