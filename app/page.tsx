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
  const parts = hostname.split('.');
  if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost') return parts[0];
  return '';
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    emoji: '📋',
    title: 'Printed price lists go stale overnight',
    desc: 'You print 20 copies on Monday. By Tuesday, three models have new offers, one brand dropped MOP by ₹500, and your staff is quoting yesterday\'s prices to today\'s customers.',
  },
  {
    emoji: '📱',
    title: 'Your sales staff guess prices during peak hours',
    desc: 'During busy weekend hours, staff can\'t interrupt a sale to call the manager. They quote the price they remember — which may be wrong. A wrong quote = a lost customer or a margin hit.',
  },
  {
    emoji: '🏪',
    title: 'Multi-branch consistency is a nightmare',
    desc: 'You run 3 stores across the city. Each store manager maintains their own list. The same Samsung A55 has three different prices across your branches on the same day.',
  },
  {
    emoji: '🏷️',
    title: 'Bank offers and exchange deals change weekly',
    desc: 'HDFC has a ₹3,000 cashback this weekend. ICICI has EMI offers. Exchange values change. Your frontline staff either doesn\'t know or takes 5 minutes to find out — the customer walks.',
  },
  {
    emoji: '🔄',
    title: 'POS price update is a slow operational task',
    desc: 'Updating the POS or ERP with the new price list takes your manager 2-3 hours every week. On launch days, the entire system needs an update while the store is open and billing.',
  },
  {
    emoji: '📉',
    title: 'New launches create chaos on day one',
    desc: 'A new flagship launches today. Specs, prices, colours, and offers aren\'t in your system yet. Your staff is googling pricing on their personal phone while the customer waits.',
  },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Live Price Sync from Google Sheets',
    desc: 'You already manage your price list in Google Sheets. PriceSync reads it every 2 minutes and pushes updates to every device in every branch instantly. No app update. No manual entry.',
    highlight: 'Works with your existing workflow',
  },
  {
    icon: '🔍',
    title: 'Instant Fuzzy Search Catalogue',
    desc: 'Staff type "samng a5" and see Samsung A55 instantly. Smart search handles typos, partial names, RAM/ROM specs, and offer keywords. Find any product in under 3 seconds.',
    highlight: 'Faster than any POS system',
  },
  {
    icon: '🏢',
    title: 'Multi-Branch, One Platform',
    desc: 'Each branch gets its own secure login portal. All branches share the same live price list. One update from HQ, reflected everywhere in 2 minutes.',
    highlight: 'Perfect for 2-50 branch operations',
  },
  {
    icon: '🔔',
    title: 'Real-Time Price Change Alerts',
    desc: 'When you update prices in your sheet, every staff member\'s screen shows a live notification: "Prices updated – tap to refresh." No one is ever working on stale data.',
    highlight: 'Zero lag, zero excuses',
  },
  {
    icon: '👥',
    title: 'Role-Based Access for Every Level',
    desc: 'Sales staff see the catalogue. Store managers see team analytics. Owners see everything — user management, sync controls, and store-wide performance. Each role sees only what they need.',
    highlight: 'No information overload for floor staff',
  },
  {
    icon: '📊',
    title: 'Staff Activity Analytics',
    desc: 'Know which staff member checked prices the most today. Track active sessions, page views, and engagement per user. Understand who is using the system and who needs a nudge.',
    highlight: 'Built-in accountability',
  },
  {
    icon: '📴',
    title: 'Works Offline Too',
    desc: 'Poor network in your store? PriceSync caches the latest price list on device. Staff can still browse the full catalogue offline. Auto-syncs the moment connectivity returns.',
    highlight: 'No internet = no problem',
  },
  {
    icon: '🔒',
    title: 'Secure, Session-Aware Login',
    desc: 'Each staff member has their own login. Sessions are tracked and can be remotely terminated. Logging in on a new device immediately logs out the old one. Your data stays in your hands.',
    highlight: 'No shared logins, no data leaks',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Register Your Store',
    desc: 'Create your store in 2 minutes. You get a private URL: yourstore.salessupportapp.dedasystems.com — only your staff can access it.',
  },
  {
    step: '2',
    title: 'Connect Your Google Sheet',
    desc: 'Paste your Google Sheet ID. We connect to it securely using a service account. No need to share edit access. Your sheet stays yours.',
  },
  {
    step: '3',
    title: 'Add Your Staff',
    desc: 'Create logins for your sales team, managers, and co-admins. Assign roles. Share the store URL. They log in, and they\'re live.',
  },
  {
    step: '4',
    title: 'Update Prices in Sheets, Everyone Sees It',
    desc: 'Change a price in your Google Sheet. In 2 minutes, every staff member\'s device shows the update. That\'s it. No IT, no app updates, no manual work.',
  },
];

const FAQS = [
  {
    q: 'Do my staff need to install any app?',
    a: 'No. PriceSync is a web app that works in any browser on any device — Android phone, iPhone, tablet, or desktop. Staff just open the URL and log in. It also works as a PWA — they can "Add to Home Screen" for an app-like experience.',
  },
  {
    q: 'What if my internet goes down in the store?',
    a: 'PriceSync caches the latest price list on-device. Staff can continue browsing the full catalogue even offline. The moment connectivity returns, it auto-syncs any updates from your Google Sheet.',
  },
  {
    q: 'We have 4 branches. Do we need 4 separate accounts?',
    a: 'You can structure it either way. Each branch can have its own isolated store (separate Google Sheet, separate staff), or you can run all branches under one store with a shared catalogue. Most multi-branch operators use one store per branch for clean analytics.',
  },
  {
    q: 'How do I update prices?',
    a: 'Just update your existing Google Sheet — the same way you do today. PriceSync reads the sheet every 2 minutes and pushes updates to all connected devices automatically. No login to the app, no manual sync button required (though you can force-sync instantly from the admin panel).',
  },
  {
    q: 'Is my price data secure? Can competitors see my prices?',
    a: 'Your store is private — only staff you add can log in. Data is isolated per store. No other store or user can see your prices, your staff, or your catalogue. All data is encrypted in transit and stored in a dedicated database partition.',
  },
  {
    q: 'What happens after the 5-day trial?',
    a: 'After the trial, you\'ll be prompted to add a payment method via Razorpay. Billing is per user per month — ₹300 for Sales, ₹500 for Managers, ₹700 for Admins. You only pay for active users. No long-term contracts. Cancel anytime.',
  },
  {
    q: 'We also sell appliances, not just phones. Does it work?',
    a: 'Yes. PriceSync works for any product catalogue — mobile phones, TVs, ACs, refrigerators, washing machines. As long as your price list is in Google Sheets, PriceSync can serve it. The search and filter system handles any product category.',
  },
  {
    q: 'Can I control what my sales staff sees?',
    a: 'Yes. Sales staff see only the product catalogue and search. Store Managers see team analytics on top. Admins see everything — user management, price sync controls, and full analytics. You decide who gets which role.',
  },
];

function Navbar({ onRegisterClick }: { onRegisterClick: () => void }) {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-blue-700 tracking-tight">PriceSync</span>
          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">by Deda Systems</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden md:block">For mobile & appliance retailers</span>
          <Button size="sm" onClick={onRegisterClick} className="bg-blue-700 hover:bg-blue-800 text-white font-semibold">
            Start Free Trial
          </Button>
        </div>
      </div>
    </nav>
  );
}

function LandingPage() {
  const [formData, setFormData] = useState({
    storeName: '', email: '', password: '', adminName: '', phone: '', googleSheetId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ slug: string; url: string; trialEndsAt: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="text-5xl mb-3">🎉</div>
            <CardTitle className="text-2xl text-green-700">Your Store is Live!</CardTitle>
            <CardDescription className="text-base">5-day free trial has started. No credit card needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Your Store URL</p>
              <a href={success.url} className="text-green-800 font-mono text-sm break-all hover:underline font-bold">
                {success.url}
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Trial Ends</p>
                <p className="font-semibold text-gray-800">{new Date(success.trialEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Next Step</p>
                <p className="font-semibold text-gray-800">Add your Google Sheet</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <strong>What to do now:</strong> Click the link above, log in with the email and password you just set, then go to Admin → Settings to connect your Google Sheets price list.
            </div>
            <Button className="w-full bg-green-700 hover:bg-green-800 font-bold text-base py-6" onClick={() => { window.location.href = success.url; }}>
              Open My Store →
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar onRegisterClick={scrollToForm} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-500/30 text-blue-100 border-blue-400 text-sm px-4 py-1">
            Built for Indian Mobile Phone & Appliance Retailers
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-5 leading-tight tracking-tight">
            Your staff will never quote<br />
            <span className="text-yellow-300">a wrong price again.</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto leading-relaxed">
            PriceSync gives every salesperson in every branch a live, searchable price catalogue
            — synced automatically from your Google Sheet, updated in real time, accessible on any phone.
          </p>
          <p className="text-blue-200 mb-10 text-lg">
            No more printed price lists. No more WhatsApp price updates. No more customers walking because your staff didn&apos;t know today&apos;s offer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={scrollToForm} className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black text-lg px-10 py-6 rounded-xl shadow-lg">
              Start Free Trial — 5 Days Free
            </Button>
            <span className="text-blue-300 text-sm">No credit card · Setup in 2 minutes · Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ──────────────────────────────────────────────── */}
      <section className="bg-blue-900 text-white py-5 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 text-sm text-blue-200">
          {[
            '📍 Works across all your branches',
            '⚡ Prices update in under 2 minutes',
            '📵 Works offline too',
            '🔒 Private & secure per store',
            '📊 Staff analytics built-in',
          ].map((item) => (
            <span key={item} className="flex items-center gap-1">{item}</span>
          ))}
        </div>
      </section>

      {/* ── PROBLEM SECTION ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              If you run a mobile phone or appliance store,<br />
              <span className="text-red-600">you know this pain.</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Prices change daily. Offers expire overnight. New models launch every week.
              Your team is doing their best — but the tools aren&apos;t keeping up.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PAIN_POINTS.map((point) => (
              <div key={point.title} className="bg-white rounded-xl border border-red-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{point.emoji}</div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{point.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{point.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <div className="inline-block bg-red-50 border border-red-200 rounded-xl px-8 py-5 max-w-2xl">
              <p className="text-red-800 font-semibold text-lg">
                Every wrong price quoted is either a lost sale or a lost margin.<br />
                <span className="font-black">Across a 5-person team, this happens 10-20 times a week.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTION CALLOUT ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            PriceSync solves the pricing problem for retail stores permanently.
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
            We connect directly to your Google Sheet. The moment you change a price, add a new model,
            or update an offer — every salesperson in every branch sees it within 2 minutes, on their phone.
            No emails. No WhatsApp forwards. No printed sheets.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-900 mb-3">How it works</h2>
          <p className="text-center text-gray-500 mb-14 text-lg">Setup takes less than 10 minutes. No IT team required.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-14 h-14 bg-blue-700 text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 shadow-lg">
                  {step.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-900 mb-3">
            Everything your team needs to sell confidently
          </h2>
          <p className="text-center text-gray-500 mb-14 text-lg max-w-2xl mx-auto">
            Not just a price list. A complete sales support tool designed for the floor.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl border border-gray-200 p-6 flex gap-4 hover:shadow-md transition-shadow">
                <div className="text-3xl flex-shrink-0 mt-1">{feature.icon}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-gray-900">{feature.title}</h3>
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">{feature.highlight}</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-12">Who is PriceSync built for?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Single-Store Retailers',
                emoji: '🏪',
                desc: 'You have one shop and 3-10 sales staff. Prices change every week. You\'re tired of printing new sheets or sending WhatsApp messages. PriceSync puts the latest catalogue on every salesperson\'s phone, always.',
                tag: 'Most popular',
              },
              {
                title: 'Multi-Branch Operators',
                emoji: '🏢',
                desc: 'You run 2-20 branches across a city or region. Maintaining price consistency is a daily headache. PriceSync gives every branch the same live catalogue — with branch-level analytics so you know how each store performs.',
                tag: 'Great for chains',
              },
              {
                title: 'Franchise & Distributor Networks',
                emoji: '🌐',
                desc: 'You manage a network of dealer stores or franchise outlets. Each store needs the same authorised price list. PriceSync lets you push a single source of truth to all outlets at once.',
                tag: 'Enterprise-ready',
              },
            ].map((item) => (
              <Card key={item.title} className="relative overflow-hidden border-2 border-gray-100 hover:border-blue-200 transition-colors">
                {item.tag && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">{item.tag}</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="text-4xl mb-2">{item.emoji}</div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-900 mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-gray-500 mb-3 text-lg">
            Pay per user. Only pay for your active team. No hidden fees.
          </p>
          <p className="text-center text-blue-700 font-semibold mb-12">
            5-day free trial — no credit card required
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                role: 'Sales',
                price: '300',
                emoji: '🛒',
                desc: 'For your floor sales staff',
                features: [
                  'Full live price catalogue',
                  'Search & filter all products',
                  'Bank offers & exchange details',
                  'Works on any phone or tablet',
                  'Works offline',
                  'Real-time price change alerts',
                ],
                highlight: false,
              },
              {
                role: 'Store Manager',
                price: '500',
                emoji: '👔',
                desc: 'For branch managers & supervisors',
                features: [
                  'Everything in Sales',
                  'Team activity overview',
                  'Staff engagement analytics',
                  'Session monitoring',
                  'Price freshness visibility',
                  'Priority support',
                ],
                highlight: true,
              },
              {
                role: 'Admin',
                price: '700',
                emoji: '👑',
                desc: 'For store owners & head office',
                features: [
                  'Everything in Manager',
                  'Full admin control panel',
                  'Add / disable staff accounts',
                  'Manual price sync trigger',
                  'Full user analytics',
                  'Password & role management',
                ],
                highlight: false,
              },
            ].map((plan) => (
              <div key={plan.role} className={`rounded-2xl border-2 p-6 flex flex-col ${plan.highlight ? 'border-blue-600 shadow-xl bg-blue-50' : 'border-gray-200 bg-white'}`}>
                {plan.highlight && <div className="text-center mb-3"><Badge className="bg-blue-600 text-white">Most Popular</Badge></div>}
                <div className="text-3xl mb-2">{plan.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900">{plan.role}</h3>
                <p className="text-gray-500 text-sm mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-500 text-sm"> / user / month</span>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 font-bold mt-0.5">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={scrollToForm} className={`w-full font-semibold ${plan.highlight ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}>
                  Start Free Trial
                </Button>
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
            <p className="text-gray-700 text-sm">
              <strong>Example:</strong> A store with 6 Sales staff + 1 Manager + 1 Admin = ₹{(6 * 300) + 500 + 700}/month.
              That&apos;s less than what you spend on printing price lists and the lost margins from wrong quotes.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-12">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-gray-900 text-sm md:text-base">{faq.q}</span>
                  <span className="text-gray-400 flex-shrink-0 text-xl">{openFaq === i ? '−' : '+'}</span>
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

      {/* ── REGISTRATION FORM ─────────────────────────────────────────────── */}
      <section id="register" ref={formRef} className="py-20 px-4 bg-gradient-to-br from-blue-700 to-indigo-900">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white mb-2">Start your free trial today</h2>
            <p className="text-blue-200">5 days free. No credit card. Your store is live in 2 minutes.</p>
          </div>
          <Card className="shadow-2xl border-0">
            <CardContent className="pt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="storeName" className="font-semibold">Store Name <span className="text-red-500">*</span></Label>
                  <Input id="storeName" name="storeName" placeholder="e.g. Sharma Mobile Store" value={formData.storeName} onChange={handleChange} required disabled={loading} className="h-11" />
                  <p className="text-xs text-gray-500">
                    Your store URL will be:{' '}
                    <strong className="text-blue-700 break-all">{storeSlugPreview}.{ROOT_DOMAIN}</strong>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="adminName" className="font-semibold">Your Name <span className="text-red-500">*</span></Label>
                    <Input id="adminName" name="adminName" placeholder="Rajesh Sharma" value={formData.adminName} onChange={handleChange} required disabled={loading} className="h-11" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="font-semibold">Phone</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} disabled={loading} className="h-11" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="font-semibold">Work Email <span className="text-red-500">*</span></Label>
                  <Input id="email" name="email" type="email" placeholder="owner@yourstore.com" value={formData.email} onChange={handleChange} required disabled={loading} className="h-11" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="font-semibold">Password <span className="text-red-500">*</span></Label>
                  <Input id="password" name="password" type="password" placeholder="Minimum 8 characters" value={formData.password} onChange={handleChange} required minLength={8} disabled={loading} className="h-11" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="googleSheetId" className="font-semibold">Google Sheet ID <span className="text-gray-400 font-normal">(optional – add later)</span></Label>
                  <Input id="googleSheetId" name="googleSheetId" placeholder="Paste your spreadsheet ID here" value={formData.googleSheetId} onChange={handleChange} disabled={loading} className="h-11" />
                  <p className="text-xs text-gray-500">From the URL: docs.google.com/spreadsheets/d/<strong>[THIS PART]</strong>/edit</p>
                </div>
                {error && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
                <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 font-black text-base py-6" disabled={loading}>
                  {loading ? 'Creating your store...' : 'Create My Store — Start Free Trial →'}
                </Button>
                <p className="text-xs text-center text-gray-500">
                  By registering you agree to fair-use terms. No credit card for trial. Cancel anytime.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4 bg-gray-950 text-gray-400">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="text-2xl font-black text-white mb-2">PriceSync</div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Real-time price catalogue and sales support system for mobile phone and appliance retailers across India.
              </p>
              <p className="text-xs text-gray-600 mt-3">A product by Deda Systems · dedasystems.com</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Live Price Catalogue</li>
                <li>Google Sheets Sync</li>
                <li>Multi-Branch Support</li>
                <li>Role-Based Access</li>
                <li>Staff Analytics</li>
                <li>Offline Support</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Pricing</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Sales Staff — ₹300/user/month</li>
                <li>Store Manager — ₹500/user/month</li>
                <li>Admin — ₹700/user/month</li>
                <li className="text-green-500">5-day free trial on all plans</li>
              </ul>
              <div className="mt-4">
                <Button size="sm" onClick={scrollToForm} className="bg-blue-700 hover:bg-blue-800 text-white">
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-600">
            <p>© {new Date().getFullYear()} Deda Systems. PriceSync is designed for mobile phone and appliance retailers in India.</p>
            <p className="mt-1">Billing powered by Razorpay · Hosted on Railway · Data stored in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── LOGIN PAGE ────────────────────────────────────────────────────────────────

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
    return <div className="flex items-center justify-center min-h-screen bg-gray-50"><div className="text-gray-500">Loading…</div></div>;
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
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="h-11" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="font-semibold">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} className="h-11" />
            </div>
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
            <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 font-black py-6 text-base" disabled={loading}>
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
    return <div className="flex items-center justify-center min-h-screen bg-white"><div className="text-gray-400 text-sm">Loading…</div></div>;
  }

  if (tenantSlug) return <LoginPage tenantSlug={tenantSlug} />;
  return <LandingPage />;
}
