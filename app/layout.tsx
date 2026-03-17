'use client';

import localFont from "next/font/local";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, Suspense, useEffect } from "react";
import { SessionMonitor } from "@/components/SessionMonitor";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const FAQ_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do my staff need to install any app to use SalesSync?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No installation needed. SalesSync is a web application that works in any browser on any device — Android phone, iPhone, tablet, or desktop. Staff open the store URL and log in. It also supports Add to Home Screen via PWA for an app-like experience.",
      },
    },
    {
      "@type": "Question",
      name: "How does SalesSync sync prices from Google Sheets?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SalesSync connects to your Google Sheet using a secure read-only service account. It syncs automatically every 2 minutes. When prices change in your Sheet, all connected devices across all branches receive the update within 2 minutes automatically.",
      },
    },
    {
      "@type": "Question",
      name: "What is the stale price blocker feature?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If price data on a device is more than 5 minutes old without a successful sync, SalesSync automatically blocks the catalogue with a clear red warning. Staff cannot quote prices from stale data — preventing wrong quotes that cost sales or margin.",
      },
    },
    {
      "@type": "Question",
      name: "Does SalesSync support multiple branches?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. SalesSync is built for multi-branch mobile phone and appliance retailers in India. Each branch has its own secure login portal while sharing the same live price list. Admin manages all branches from one central dashboard.",
      },
    },
    {
      "@type": "Question",
      name: "What is the pricing for SalesSync?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SalesSync charges per user per month: Sales staff at ₹300, Store Managers at ₹500, and Admins/Owners at ₹700. All plans include a 5-day free trial with no credit card required.",
      },
    },
    {
      "@type": "Question",
      name: "Does SalesSync work for appliance stores — not just mobile phones?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. SalesSync works for any product catalogue in Google Sheets — mobile phones, tablets, accessories, TVs, ACs, refrigerators, washing machines. Any Indian retailer with a dynamic price list benefits from SalesSync.",
      },
    },
  ],
});

const SOFTWARE_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SalesSync",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Android, iOS",
  inLanguage: "en-IN",
  description:
    "SalesSync by Deda Systems is a real-time price management and sales support system for multi-branch mobile phone and appliance retailers in India. Syncs prices from Google Sheets to every branch and device in under 2 minutes.",
  offers: {
    "@type": "Offer",
    price: "300",
    priceCurrency: "INR",
    priceValidUntil: "2027-12-31",
    description: "Starting at ₹300 per user per month. 5-day free trial, no credit card.",
  },
  provider: {
    "@type": "Organization",
    name: "Deda Systems",
    url: "https://deda.systems",
  },
  audience: {
    "@type": "BusinessAudience",
    audienceType: "Mobile phone retailers, appliance store chains, multi-branch electronics retailers in India",
  },
  areaServed: { "@type": "Country", name: "India" },
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
        },
      })
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }
  }, []);

  return (
    <html lang="en">
      <head>
        {/* ── Primary SEO ──────────────────────────────────────────────────── */}
        <title>SalesSync – Real-Time Price Management for Multi-Branch Mobile Phone &amp; Appliance Stores India | by Deda Systems</title>
        <meta
          name="description"
          content="Stop losing sales to wrong prices. SalesSync by Deda Systems syncs your mobile phone and appliance price list from Google Sheets to every branch in real time. Staff always quote accurate prices — stale data is automatically blocked. 5-day free trial, no credit card."
        />
        <meta
          name="keywords"
          content="SalesSync, Deda Systems, mobile phone store price management software India, multi-branch retail price management, dynamic pricing solution mobile retailers India, phone store digital price catalogue, appliance store price update software India, retail sales support system, Google Sheets price sync retail, real-time price update for mobile stores, price list app for mobile shops India, Samsung Apple Vivo Oppo store price management, wrong price quote prevention, stale price blocker"
        />
        <meta name="author" content="Deda Systems" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <meta name="language" content="en-IN" />
        <meta name="geo.region" content="IN" />
        <link rel="canonical" href="https://salessupportapp.dedasystems.com" />

        {/* ── Open Graph ───────────────────────────────────────────────────── */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://salessupportapp.dedasystems.com" />
        <meta property="og:title" content="SalesSync – Your Staff Will Never Quote a Wrong Price Again" />
        <meta property="og:description" content="Real-time price catalogue synced from Google Sheets to every branch in under 2 minutes. Stale prices automatically blocked. Built for Indian mobile phone and appliance retailers by Deda Systems." />
        <meta property="og:site_name" content="SalesSync by Deda Systems" />
        <meta property="og:locale" content="en_IN" />

        {/* ── Twitter Card ─────────────────────────────────────────────────── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SalesSync – Live Price Catalogue for Mobile &amp; Appliance Retailers India" />
        <meta name="twitter:description" content="Stop using printed price lists that go stale overnight. SalesSync by Deda Systems syncs your Google Sheet to every branch in real time. 5-day free trial." />

        {/* ── Structured Data ──────────────────────────────────────────────── */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SOFTWARE_SCHEMA }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_SCHEMA }} />

        {/* ── Favicon — SVG (all modern browsers) ─────────────────────────── */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.svg" sizes="any" />

        {/* ── PWA ──────────────────────────────────────────────────────────── */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#F97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SalesSync" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <OfflineIndicator />
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={null}>
              <SessionMonitor />
              <AnalyticsTracker />
            </Suspense>
            {children}
            <InstallPrompt />
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
