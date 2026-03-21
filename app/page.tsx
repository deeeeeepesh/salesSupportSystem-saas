'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Zap, Search, Building2, Bell, Users, BarChart2, Shield,
  MapPin, Tag, RefreshCw, Package, FileText, Smartphone,
  ShoppingCart, Briefcase, Crown, Sun, Moon, Store, Globe,
  CheckCircle2, ChevronDown, ChevronUp,
} from 'lucide-react';

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

function BoltIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" fill="currentColor" />
    </svg>
  );
}

function LogoMark({ isDark = true }: { isDark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500 text-black flex-shrink-0">
        <BoltIcon size={16} />
      </div>
      <span className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
        SalesSync
      </span>
    </div>
  );
}

const PAIN_POINTS = [
  {
    Icon: FileText,
    title: 'Printed price lists go stale overnight',
    desc: "You print copies on Monday. By Tuesday, three models have new offers and your staff is quoting yesterday's prices to today's customers.",
  },
  {
    Icon: Smartphone,
    title: 'Staff guess prices during peak hours',
    desc: "During busy hours, staff can't interrupt a sale to call the manager. They quote the price they remember — which may be wrong. A wrong quote = a lost customer or a margin hit.",
  },
  {
    Icon: Store,
    title: 'Multi-branch consistency is a nightmare',
    desc: "You run multiple stores across the city. Each manager maintains their own list. The same Samsung A55 has three different prices across your branches on the same day.",
  },
  {
    Icon: Tag,
    title: 'Bank offers and exchange deals change weekly',
    desc: "HDFC has ₹3,000 cashback this weekend. ICICI has EMI offers. Exchange values change. Your staff either doesn't know or takes 5 minutes to find out — the customer walks.",
  },
  {
    Icon: RefreshCw,
    title: 'POS price update is a slow operational task',
    desc: 'Updating the POS with the new price list takes your manager 2–3 hours every week — on launch days, the entire system needs an update while the store is open.',
  },
  {
    Icon: Package,
    title: 'New launches create chaos on day one',
    desc: "A new flagship launches today. Specs, prices, colours, and offers aren't in your system yet. Your staff is googling pricing on their personal phone while the customer waits.",
  },
];

const FEATURES = [
  {
    Icon: Zap,
    title: 'Live Price Sync from Google Sheets',
    desc: "You already manage your price list in Google Sheets. SalesSync reads it every 2 minutes and pushes updates to every device in every branch instantly. No app update. No manual entry.",
    highlight: 'Works with your existing workflow',
  },
  {
    Icon: Search,
    title: 'Instant Fuzzy Search Catalogue',
    desc: 'Staff type "samng a5" and see Samsung A55 instantly. Smart search handles typos, partial names, RAM/ROM specs, and offer keywords. Find any product in under 3 seconds.',
    highlight: 'Faster than any POS',
  },
  {
    Icon: Building2,
    title: 'Multi-Branch, One Platform',
    desc: 'Each branch gets its own secure login portal. All branches share the same live price list. One update from HQ, reflected everywhere in 2 minutes.',
    highlight: 'Scales to any number of branches',
  },
  {
    Icon: Bell,
    title: 'Real-Time Price Change Alerts',
    desc: 'When you update prices in your sheet, every staff member\'s screen shows a live notification: "Prices updated — tap to refresh." No one is ever working on stale data.',
    highlight: 'Zero lag, zero excuses',
  },
  {
    Icon: Users,
    title: 'Role-Based Access',
    desc: 'Sales staff see the catalogue. Managers see team analytics. Owners see everything — user management, sync controls, and store-wide performance.',
    highlight: 'No information overload',
  },
  {
    Icon: BarChart2,
    title: 'Staff Activity Analytics',
    desc: 'Know which staff member checked prices the most today. Track active sessions, page views, and engagement per user. Built-in accountability.',
    highlight: 'Built-in accountability',
  },
  {
    Icon: Shield,
    title: 'Secure, Session-Aware Login',
    desc: 'Each staff member has their own login. Sessions are tracked and can be remotely terminated. Logging in on a new device immediately logs out the old one.',
    highlight: 'No shared logins, no data leaks',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Register Your Store',
    desc: 'Create your store in 2 minutes. You get a private URL: yourstore.salessupportapp.dedasystems.com',
  },
  {
    step: '2',
    title: 'Connect Your Google Sheet',
    desc: 'Paste your Google Sheet ID. We connect securely via service account. No edit access needed. Your sheet stays yours.',
    link: { href: '/sheets-setup', text: 'See the full setup guide →' },
  },
  {
    step: '3',
    title: 'Add Your Staff',
    desc: "Create logins for your sales team, managers, and co-admins. Assign roles. Share the store URL. They're live.",
  },
  {
    step: '4',
    title: 'Update Sheet → Everyone Sees It',
    desc: 'Change a price in your Google Sheet. In 2 minutes, every staff member\'s device shows the update. No IT, no app updates.',
  },
];

const FAQS = [
  {
    q: 'Do my staff need to install any app?',
    a: "No. SalesSync is a web app that works in any browser on any device — Android, iPhone, tablet, or desktop. They just open the URL and log in. It also works as a PWA — they can 'Add to Home Screen' for an app-like experience.",
  },
  {
    q: 'What if my internet goes down in the store?',
    a: 'SalesSync requires an active internet connection to display prices. This ensures your staff always see the latest, most accurate data — never an outdated price list. We recommend keeping a mobile data connection as a backup in areas with unstable Wi-Fi.',
  },
  {
    q: 'We have 4 branches. Do we need 4 separate accounts?',
    a: 'You can structure it either way. Each branch can have its own isolated store, or you can run all branches under one store with a shared catalogue. Most multi-branch operators use one store per branch for clean analytics.',
  },
  {
    q: 'How do I update prices?',
    a: 'Just update your existing Google Sheet — the same way you do today. SalesSync reads it every 2 minutes and pushes updates to all connected devices automatically. You can also force-sync instantly from the admin panel.',
  },
  {
    q: 'Is my price data secure? Can competitors see my prices?',
    a: 'Your store is private — only staff you add can log in. Data is isolated per store. No other store or user can see your prices, your staff, or your catalogue. All data is encrypted in transit.',
  },
  {
    q: 'What happens after the 5-day trial?',
    a: "After the trial, you'll be prompted to add a payment method via Razorpay. Each store costs ₹2,000/month and includes 1 Admin, 1 Manager, and 4 Staff seats. Need more? Add extra seats: ₹200/staff, ₹500/manager, ₹700/admin. Additional branches cost ₹2,000/month each and come with 1 Manager and 4 Staff seats included. No long-term contracts. Cancel anytime.",
  },
  {
    q: 'We also sell appliances, not just phones. Does it work?',
    a: 'Yes. SalesSync works for any product catalogue — mobile phones, TVs, ACs, refrigerators, washing machines. As long as your price list is in Google Sheets, SalesSync can serve it.',
  },
  {
    q: 'Can I control what my sales staff sees?',
    a: 'Yes. Sales staff see only the product catalogue and search. Store Managers see team analytics on top. Admins see everything — user management, price sync controls, and full analytics.',
  },
];

function Navbar({
  onRegisterClick,
  isDark,
  onToggleTheme,
}: {
  onRegisterClick: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur border-b px-4 py-3 ${
        isDark ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-gray-200'
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <LogoMark isDark={isDark} />
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a
            href="/sheets-setup"
            className={`text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors hidden sm:inline-flex items-center ${
              isDark
                ? 'border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
            }`}
          >
            Setup Guide
          </a>
          <span className={`text-sm hidden md:block ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
            For mobile &amp; appliance retailers
          </span>
          <Button
            size="sm"
            onClick={onRegisterClick}
            className="bg-orange-500 hover:bg-orange-400 text-black font-semibold"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </nav>
  );
}

function LandingPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';

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

  const inputCls = isDark
    ? 'h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500'
    : 'h-11';
  const labelCls = `font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`;
  const cardBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-gray-600';
  const textMuted = isDark ? 'text-zinc-500' : 'text-gray-500';
  const iconBox = isDark
    ? 'bg-orange-500/10 border border-orange-500/20'
    : 'bg-orange-50 border border-orange-200';
  const sectionAlt = isDark ? 'bg-zinc-900' : 'bg-gray-50';
  const sectionBase = isDark ? 'bg-zinc-950' : 'bg-white';
  const borderColor = isDark ? 'border-zinc-800' : 'border-gray-200';
  const tagCls = isDark
    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
    : 'bg-orange-50 text-orange-600 border border-orange-200';

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${sectionBase}`}>
        <div className={`w-full max-w-lg rounded-2xl border p-8 text-center ${cardBg}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${iconBox}`}>
            <CheckCircle2 className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className={`text-2xl font-black mb-1 ${textPrimary}`}>Your Store is Live!</h2>
          <p className={`mb-6 ${textMuted}`}>5-day free trial has started. No credit card needed.</p>
          <div className={`rounded-xl p-4 mb-4 text-left border ${cardBg}`}>
            <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide mb-1">Your Store URL</p>
            <a href={success.url} className="text-orange-400 font-mono text-sm break-all hover:underline font-bold">
              {success.url}
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Trial Ends', value: new Date(success.trialEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'Next Step', value: 'Add your Google Sheet' },
            ].map(({ label, value }) => (
              <div key={label} className={`rounded-lg p-3 text-left border ${cardBg}`}>
                <p className={`text-xs mb-1 ${textMuted}`}>{label}</p>
                <p className={`font-semibold text-sm ${textPrimary}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className={`rounded-xl p-3 mb-6 text-sm text-left border ${isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-200' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
            <strong>What to do now:</strong> Click the link above, log in, then go to Admin → Settings to connect your Google Sheets price list.
          </div>
          <Button
            className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black text-base py-6"
            onClick={() => { window.location.href = success.url; }}
          >
            Open My Store →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDark ? 'bg-zinc-950 text-white' : 'bg-white text-gray-900'}`}>
      <Navbar
        onRegisterClick={scrollToForm}
        isDark={isDark}
        onToggleTheme={() => setTheme(isDark ? 'light' : 'dark')}
      />

      {/* HERO */}
      <section className={`relative py-24 px-4 overflow-hidden ${sectionBase}`}>
        {isDark && (
          <>
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(249,115,22,0.10), transparent 70%)' }} />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          </>
        )}
        <div className="relative max-w-5xl mx-auto text-center">
          <span className={`inline-block mb-5 text-sm px-4 py-1.5 font-semibold rounded-full border ${tagCls}`}>
            Built for Indian Mobile Phone &amp; Appliance Retailers
          </span>
          <h1 className={`text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight ${textPrimary}`}>
            Your staff will never quote<br />
            <span style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              a wrong price again.
            </span>
          </h1>
          <p className={`text-xl md:text-2xl mb-4 max-w-3xl mx-auto leading-relaxed ${textSecondary}`}>
            SalesSync gives every salesperson in every branch a live, searchable price catalogue
            — synced automatically from your Google Sheet, updated in real time, accessible on any phone.
          </p>
          <p className={`mb-10 text-lg ${textMuted}`}>
            No more printed price lists. No more WhatsApp price updates. No more customers walking because your staff didn&apos;t know today&apos;s offer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={scrollToForm}
              className="bg-orange-500 hover:bg-orange-400 text-black font-black text-lg px-10 py-6 rounded-xl shadow-lg"
            >
              Start Free Trial — 5 Days Free
            </Button>
            <span className={`text-sm ${textMuted}`}>No credit card · Setup in 2 minutes · Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* PROOF BAR */}
      <section className={`py-4 px-4 border-y ${sectionAlt} ${borderColor}`}>
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 text-sm">
          {[
            { Icon: MapPin, text: 'Works across all your branches' },
            { Icon: Zap, text: 'Prices update in under 2 minutes' },
            { Icon: Shield, text: 'Private & secure per store' },
            { Icon: BarChart2, text: 'Staff analytics built-in' },
          ].map(({ Icon, text }) => (
            <span key={text} className={`flex items-center gap-2 ${textMuted}`}>
              <Icon className="w-4 h-4 text-orange-500" />
              {text}
            </span>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section className={`py-20 px-4 ${sectionBase}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">The Problem</p>
            <h2 className={`text-3xl md:text-4xl font-black mb-4 ${textPrimary}`}>
              If you run a mobile phone or appliance store,<br />
              <span className="text-orange-500">you know this pain.</span>
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${textSecondary}`}>
              Prices change daily. Offers expire overnight. New models launch every week.
              Your team is doing their best — but the tools aren&apos;t keeping up.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PAIN_POINTS.map((point) => (
              <div
                key={point.title}
                className={`rounded-xl p-6 border transition-colors ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-800 hover:border-orange-500/30'
                    : 'bg-gray-50 border-gray-200 hover:border-orange-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${iconBox}`}>
                  <point.Icon className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className={`font-bold mb-2 text-sm ${textPrimary}`}>{point.title}</h3>
                <p className={`text-sm leading-relaxed ${textSecondary}`}>{point.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <div className={`inline-block rounded-xl px-8 py-5 max-w-2xl border ${isDark ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50 border-orange-200'}`}>
              <p className={`font-semibold text-lg ${isDark ? 'text-orange-200' : 'text-orange-800'}`}>
                Every wrong price quoted is either a lost sale or a lost margin.<br />
                <span className="font-black">Across a 5-person team, this happens 10–20 times a week.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={`py-20 px-4 ${sectionAlt}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className={`text-3xl md:text-4xl font-black mb-3 ${textPrimary}`}>Setup in under 10 minutes</h2>
            <p className={`text-lg ${textMuted}`}>No IT team required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="text-center relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className={`hidden lg:block absolute top-6 left-[60%] right-[-40%] h-px ${isDark ? 'bg-zinc-700' : 'bg-gray-300'}`} />
                )}
                <div className="w-12 h-12 bg-orange-500 text-black rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4 relative z-10">
                  {item.step}
                </div>
                <h3 className={`font-bold mb-2 text-sm ${textPrimary}`}>{item.title}</h3>
                <p className={`text-sm leading-relaxed ${textSecondary}`}>{item.desc}</p>
                {'link' in item && item.link && (
                  <a
                    href={item.link.href}
                    className="text-orange-500 hover:text-orange-400 text-sm font-semibold underline mt-1 inline-block"
                  >
                    {item.link.text}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className={`py-20 px-4 ${sectionBase}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Features</p>
            <h2 className={`text-3xl md:text-4xl font-black mb-3 ${textPrimary}`}>
              Everything your team needs to sell confidently
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${textSecondary}`}>
              Not just a price list. A complete sales support tool designed for the floor.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className={`rounded-xl border p-6 flex gap-4 transition-colors ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-800 hover:border-orange-500/30'
                    : 'bg-gray-50 border-gray-200 hover:border-orange-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${iconBox}`}>
                  <feature.Icon className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`font-bold text-sm ${textPrimary}`}>{feature.title}</h3>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${tagCls}`}>{feature.highlight}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${textSecondary}`}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IS IT FOR */}
      <section className={`py-20 px-4 ${sectionAlt}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Who It&apos;s For</p>
            <h2 className={`text-3xl font-black ${textPrimary}`}>Built for retail, at every scale</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                Icon: Store,
                title: 'Single-Store Retailers',
                desc: "You have one shop and a team of sales staff. Prices change every week and you're tired of printing new sheets or sending WhatsApp messages. SalesSync puts the latest catalogue on every salesperson's phone, always.",
                tag: 'Most popular',
              },
              {
                Icon: Building2,
                title: 'Multi-Branch Operators',
                desc: "You run multiple branches across a city or region. Maintaining price consistency is a daily headache. SalesSync gives every branch the same live catalogue — with branch-level analytics so you know how each store performs.",
                tag: 'Great for chains',
              },
              {
                Icon: Globe,
                title: 'Franchise & Distributor Networks',
                desc: 'You manage a network of dealer stores or franchise outlets. Each store needs the same authorised price list. SalesSync lets you push a single source of truth to all outlets at once.',
                tag: 'Enterprise-ready',
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`relative rounded-2xl border-2 p-6 transition-colors ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-800 hover:border-orange-500/30'
                    : 'bg-white border-gray-200 hover:border-orange-200'
                }`}
              >
                <div className="absolute top-4 right-4">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${tagCls}`}>{item.tag}</span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconBox}`}>
                  <item.Icon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className={`font-bold mb-2 ${textPrimary}`}>{item.title}</h3>
                <p className={`text-sm leading-relaxed ${textSecondary}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className={`py-20 px-4 ${sectionBase}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className={`text-3xl md:text-4xl font-black mb-3 ${textPrimary}`}>Simple, store-based pricing</h2>
            <p className={`text-lg mb-2 ${textSecondary}`}>One flat price per store. Everything included. Scale as you grow.</p>
            <p className="text-orange-500 font-semibold">5-day free trial — no credit card required</p>
          </div>

          {/* Main plan card */}
          <div className={`rounded-2xl border-2 border-orange-500 p-8 mb-6 bg-orange-500/5 text-center`}>
            <span className="bg-orange-500 text-black text-xs font-black px-3 py-1 rounded-full">Per Store / Branch</span>
            <div className="mt-6 mb-2">
              <span className={`text-6xl font-black ${textPrimary}`}>₹2,000</span>
              <span className={`text-lg ${textMuted}`}> / store / month</span>
            </div>
            <p className={`mb-8 ${textSecondary}`}>Everything your store needs, out of the box.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
              {[
                { Icon: Crown, label: '1 Admin seat', sub: 'Full control panel' },
                { Icon: Briefcase, label: '1 Manager seat', sub: 'Team analytics' },
                { Icon: ShoppingCart, label: '4 Staff seats', sub: 'Live price catalogue' },
              ].map(({ Icon, label, sub }) => (
                <div key={label} className={`rounded-xl p-4 border ${cardBg}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${iconBox}`}>
                    <Icon className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className={`font-bold text-sm ${textPrimary}`}>{label}</p>
                  <p className={`text-xs ${textMuted}`}>{sub}</p>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              onClick={scrollToForm}
              className="bg-orange-500 hover:bg-orange-400 text-black font-black px-12 py-6 text-lg"
            >
              Start Free Trial
            </Button>
          </div>

          {/* Add-ons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className={`rounded-xl border p-6 ${cardBg}`}>
              <h4 className={`font-bold mb-4 ${textPrimary}`}>Extra Seats</h4>
              <ul className={`space-y-3 text-sm ${textSecondary}`}>
                <li className="flex justify-between"><span>Additional Staff seat</span><span className={`font-bold ${textPrimary}`}>₹200/month</span></li>
                <li className="flex justify-between"><span>Additional Manager seat</span><span className={`font-bold ${textPrimary}`}>₹500/month</span></li>
                <li className="flex justify-between"><span>Additional Admin seat</span><span className={`font-bold ${textPrimary}`}>₹700/month</span></li>
              </ul>
            </div>
            <div className={`rounded-xl border p-6 ${cardBg}`}>
              <h4 className={`font-bold mb-4 ${textPrimary}`}>Additional Branches</h4>
              <div className="flex justify-between items-start mb-3">
                <span className={`text-sm ${textSecondary}`}>Each extra branch</span>
                <span className={`font-bold ${textPrimary}`}>₹2,000/month</span>
              </div>
              <p className={`text-xs ${textMuted}`}>Includes 1 Manager + 4 Staff seats per branch. Add as many branches as you need.</p>
            </div>
          </div>

          <div className={`rounded-xl p-5 text-center border ${cardBg}`}>
            <p className={`text-sm ${textSecondary}`}>
              <strong className={textPrimary}>Example:</strong> 3 branches with default seats = ₹6,000/month. Add 2 extra staff across all branches = ₹6,400/month total. No long-term contracts.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={`py-20 px-4 ${sectionAlt}`}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className={`text-3xl font-black ${textPrimary}`}>Frequently asked questions</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`rounded-xl border overflow-hidden ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'
                }`}
              >
                <button
                  className={`w-full text-left px-6 py-4 flex items-center justify-between gap-4 transition-colors ${
                    isDark ? 'hover:bg-zinc-900' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className={`font-semibold text-sm md:text-base ${textPrimary}`}>{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    : <ChevronDown className={`w-5 h-5 flex-shrink-0 ${textMuted}`} />}
                </button>
                {openFaq === i && (
                  <div className={`px-6 pb-5 border-t ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                    <p className={`text-sm leading-relaxed pt-4 ${textSecondary}`}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REGISTRATION FORM */}
      <section id="register" ref={formRef} className={`py-20 px-4 ${sectionBase}`}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Get Started</p>
            <h2 className={`text-3xl font-black mb-2 ${textPrimary}`}>Start your free trial today</h2>
            <p className={textMuted}>5 days free. No credit card. Your store is live in 2 minutes.</p>
          </div>
          <div className={`rounded-2xl border p-6 ${cardBg}`}>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="storeName" className={labelCls}>
                  Store Name <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="storeName" name="storeName" placeholder="e.g. Sharma Mobile Store"
                  value={formData.storeName} onChange={handleChange} required disabled={loading}
                  className={inputCls}
                />
                <p className={`text-xs ${textMuted}`}>
                  Your store URL: <strong className="text-orange-500 break-all">{storeSlugPreview}.{ROOT_DOMAIN}</strong>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="adminName" className={labelCls}>
                    Your Name <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="adminName" name="adminName" placeholder="Rajesh Sharma"
                    value={formData.adminName} onChange={handleChange} required disabled={loading}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className={labelCls}>Phone</Label>
                  <Input
                    id="phone" name="phone" type="tel" placeholder="+91 98765 43210"
                    value={formData.phone} onChange={handleChange} disabled={loading}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className={labelCls}>
                  Work Email <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="email" name="email" type="email" placeholder="owner@yourstore.com"
                  value={formData.email} onChange={handleChange} required disabled={loading}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className={labelCls}>
                  Password <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="password" name="password" type="password" placeholder="Minimum 8 characters"
                  value={formData.password} onChange={handleChange} required minLength={8} disabled={loading}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="googleSheetId" className={labelCls}>
                  Google Sheet ID{' '}
                  <span className={`font-normal ${textMuted}`}>(optional — add later)</span>
                </Label>
                <Input
                  id="googleSheetId" name="googleSheetId" placeholder="Paste your spreadsheet ID here"
                  value={formData.googleSheetId} onChange={handleChange} disabled={loading}
                  className={inputCls}
                />
                <p className={`text-xs ${textMuted}`}>
                  From the URL: docs.google.com/spreadsheets/d/<strong>[THIS PART]</strong>/edit
                </p>
              </div>
              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black text-base py-6"
                disabled={loading}
              >
                {loading ? 'Creating your store...' : 'Create My Store — Start Free Trial →'}
              </Button>
              <p className={`text-xs text-center ${textMuted}`}>
                By registering you agree to fair-use terms. No credit card for trial. Cancel anytime.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`py-12 px-4 border-t ${sectionAlt} ${borderColor}`}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <LogoMark isDark={isDark} />
              <p className={`text-sm leading-relaxed mt-3 ${textMuted}`}>
                Real-time price catalogue and sales support system for mobile phone and appliance retailers across India.
              </p>
              <a
                href="https://deda.systems"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-orange-500 hover:text-orange-400 mt-3 transition-colors font-medium"
              >
                deda.systems ↗
              </a>
            </div>
            <div>
              <h4 className={`font-semibold mb-3 ${textPrimary}`}>Product</h4>
              <ul className={`space-y-2 text-sm ${textMuted}`}>
                {['Live Price Catalogue', 'Google Sheets Sync', 'Multi-Branch Support', 'Role-Based Access', 'Staff Analytics'].map((item) => (
                  <li key={item}>{item}</li>
                ))}
                <li>
                  <a href="/sheets-setup" className="text-orange-500 hover:text-orange-400 transition-colors">
                    Google Sheets Setup Guide
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className={`font-semibold mb-3 ${textPrimary}`}>Pricing</h4>
              <ul className={`space-y-2 text-sm ${textMuted}`}>
                <li>₹2,000/store/month — includes 1 Admin, 1 Manager, 4 Staff</li>
                <li>Extra staff — ₹200/seat/month</li>
                <li>Extra manager — ₹500/seat/month</li>
                <li>Extra admin — ₹700/seat/month</li>
                <li className="text-orange-500 font-semibold">5-day free trial on all plans</li>
              </ul>
              <div className="mt-4">
                <Button
                  size="sm"
                  onClick={scrollToForm}
                  className="bg-orange-500 hover:bg-orange-400 text-black font-semibold"
                >
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
          <div className={`border-t pt-6 text-center text-xs ${isDark ? 'border-zinc-800 text-zinc-600' : 'border-gray-200 text-gray-400'}`}>
            <p>
              © {new Date().getFullYear()}{' '}
              <a
                href="https://deda.systems"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-400"
              >
                Deda Systems
              </a>
              . SalesSync is designed for mobile phone and appliance retailers in India.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500 text-black">
              <BoltIcon size={20} />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">SalesSync</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-zinc-400 text-sm">
            Sign in to <strong className="text-orange-500">{tenantSlug}</strong>
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="font-semibold text-white">Email</Label>
              <Input
                id="email" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading}
                className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="font-semibold text-white">Password</Label>
              <Input
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading}
                className="h-11 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500 focus-visible:border-orange-500"
              />
            </div>
            {error && (
              <div className={`p-3 text-sm rounded-lg border ${
                error.includes('trial has ended')
                  ? 'text-orange-300 bg-orange-500/10 border-orange-500/20'
                  : 'text-red-400 bg-red-500/10 border-red-500/20'
              }`}>
                {error}
                {error.includes('trial has ended') && (
                  <div className="mt-2">
                    <a href="/" className="text-orange-400 underline font-semibold text-xs">Subscribe to continue →</a>
                  </div>
                )}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black py-6 text-base"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>
        <p className="text-center text-xs text-zinc-600 mt-6">
          <a href="/" className="text-orange-500 hover:text-orange-400 transition-colors">← Back to SalesSync</a>
        </p>
      </div>
    </div>
  );
}

export default function RootPage() {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    setTenantSlug(getTenantSlug());
  }, []);

  if (tenantSlug === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (tenantSlug) return <LoginPage tenantSlug={tenantSlug} />;
  return <LandingPage />;
}
