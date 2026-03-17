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
      name: "Do my staff need to install any app to use PriceSync?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No installation needed. PriceSync is a web application that works in any browser on any device — Android phone, iPhone, tablet, or desktop. Staff open the store URL and log in. It also supports Add to Home Screen via PWA for an app-like experience.",
      },
    },
    {
      "@type": "Question",
      name: "How does PriceSync sync prices from Google Sheets?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PriceSync connects to your Google Sheet using a secure read-only service account. It syncs automatically every 2 minutes. When prices change in your Sheet, all connected devices across all branches receive the update within 2 minutes — automatically, with no manual action required.",
      },
    },
    {
      "@type": "Question",
      name: "What is the stale price blocker feature?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If price data on a device is more than 5 minutes old without a successful sync, PriceSync automatically blocks the catalogue view with a clear red warning. Staff cannot quote prices from stale data. This prevents wrong quotes that cost sales or margin.",
      },
    },
    {
      "@type": "Question",
      name: "Does PriceSync support multiple branches?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. PriceSync is built for multi-branch mobile phone and appliance retailers in India. Each branch can have its own secure login portal while sharing the same live price list from Google Sheets. Admin can manage all branches from one central dashboard.",
      },
    },
    {
      "@type": "Question",
      name: "What is the pricing for PriceSync?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PriceSync charges per user per month: Sales staff at ₹300, Store Managers at ₹500, and Admins/Owners at ₹700. All plans include a 5-day free trial with no credit card required.",
      },
    },
    {
      "@type": "Question",
      name: "Does PriceSync work for appliance stores — not just mobile phones?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. PriceSync works for any product catalogue in Google Sheets — mobile phones, tablets, accessories, TVs, ACs, refrigerators, washing machines. Any Indian retailer with a dynamic price list benefits from PriceSync.",
      },
    },
  ],
});

const SOFTWARE_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PriceSync",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Android, iOS",
  inLanguage: "en-IN",
  description:
    "Real-time price catalogue and sales support system for multi-branch mobile phone and appliance retailers in India. Syncs prices from Google Sheets to every branch and device in under 2 minutes. Includes stale price blocker, staff analytics, offline support, and role-based access.",
  offers: {
    "@type": "Offer",
    price: "300",
    priceCurrency: "INR",
    priceValidUntil: "2027-12-31",
    description:
      "Starting at ₹300 per user per month for Sales staff. 5-day free trial, no credit card required.",
  },
  provider: {
    "@type": "Organization",
    name: "Deda Systems",
  },
  audience: {
    "@type": "BusinessAudience",
    audienceType:
      "Mobile phone retailers, appliance store chains, multi-branch electronics retailers, franchise networks in India",
  },
  areaServed: { "@type": "Country", name: "India" },
  featureList: [
    "Real-time price sync from Google Sheets every 2 minutes",
    "Stale price auto-blocker — prevents wrong quotes",
    "Multi-branch management from one admin dashboard",
    "Role-based access: Sales staff, Store Manager, Admin",
    "Counter-optimised mobile and tablet UI",
    "Full offline support with automatic sync on reconnect",
    "Single-device login security",
    "Auto-refresh all connected devices simultaneously",
    "Bank offer and EMI details per product",
    "Staff activity analytics and session monitoring",
    "PWA — Add to Home Screen, no app store required",
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("ServiceWorker registration successful:", registration.scope);
          },
          (err) => {
            console.log("ServiceWorker registration failed:", err);
          }
        );
      });
    }
  }, []);

  return (
    <html lang="en">
      <head>
        {/* ── Primary SEO ──────────────────────────────────────────────────── */}
        <title>
          PriceSync – Real-Time Price Management for Multi-Branch Mobile Phone &amp; Appliance
          Stores India | 5-Day Free Trial
        </title>
        <meta
          name="description"
          content="Stop losing sales to wrong prices. PriceSync syncs your mobile phone and appliance price list from Google Sheets to every branch in real time. Staff always quote accurate prices — stale data is automatically blocked. Built for Indian multi-branch retailers. 5-day free trial, no credit card."
        />
        <meta
          name="keywords"
          content="mobile phone store price management software India, multi-branch retail price management system, dynamic pricing solution for mobile retailers India, phone store digital price catalogue, appliance store price update software India, POS price list management software, retail sales support system India, Google Sheets price sync for retail stores, smartphone store price management, electronics retailer price catalogue app, price list app for mobile shops India, real-time price update system for stores, mobile store staff price catalogue India, brand price list management software, Samsung Apple Vivo Oppo store price management, multi-outlet mobile retail software India, price freshness system for retailers, wrong price quote prevention software"
        />
        <meta name="author" content="Deda Systems" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <meta name="language" content="en-IN" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <link rel="canonical" href="https://salessupportapp.dedasystems.com" />

        {/* ── Open Graph ───────────────────────────────────────────────────── */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://salessupportapp.dedasystems.com" />
        <meta
          property="og:title"
          content="PriceSync – Your Staff Will Never Quote a Wrong Price Again"
        />
        <meta
          property="og:description"
          content="Real-time price catalogue synced from Google Sheets to every branch in under 2 minutes. Stale prices automatically blocked. Built for Indian mobile phone and appliance retailers. Start your 5-day free trial."
        />
        <meta property="og:site_name" content="PriceSync by Deda Systems" />
        <meta property="og:locale" content="en_IN" />

        {/* ── Twitter Card ─────────────────────────────────────────────────── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="PriceSync – Live Price Catalogue for Mobile &amp; Appliance Retailers India"
        />
        <meta
          name="twitter:description"
          content="Stop using printed price lists that go stale overnight. PriceSync syncs your Google Sheet to every branch in real time and blocks stale prices automatically. 5-day free trial."
        />

        {/* ── Structured Data: SoftwareApplication ─────────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: SOFTWARE_SCHEMA }}
        />

        {/* ── Structured Data: FAQ (rich results in Google) ────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: FAQ_SCHEMA }}
        />

        {/* ── Structured Data: BreadcrumbList ──────────────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "PriceSync Home",
                  item: "https://salessupportapp.dedasystems.com",
                },
              ],
            }),
          }}
        />

        {/* ── PWA ──────────────────────────────────────────────────────────── */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#1d4ed8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PriceSync" />
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
