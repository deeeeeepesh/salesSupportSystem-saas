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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful:', registration.scope);
          },
          (err) => {
            console.log('ServiceWorker registration failed:', err);
          }
        );
      });
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <title>SalesSync – Real-Time Price Management for Multi-Branch Mobile Phone &amp; Appliance Stores India | by Deda Systems</title>
        <meta name="description" content="Stop losing sales to wrong prices. SalesSync gives your entire retail team a live, searchable price catalogue synced from Google Sheets in real time. Built for multi-branch mobile phone and appliance stores across India. 5-day free trial." />
        <meta name="keywords" content="price list app for mobile phone shops, digital price catalogue for retailers India, multi-branch retail price management software, appliance store price list tool, dynamic pricing solution for mobile retailers, price sync software for electronics stores, real-time price catalogue India, mobile phone retailer software, retail catalogue management India, phone shop price management tool, electronic store price list management, price list management software India, SalesSync, Deda Systems" />
        <meta name="author" content="Deda Systems" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://salessupportapp.dedasystems.com" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://salessupportapp.dedasystems.com" />
        <meta property="og:title" content="SalesSync – Live Price Catalogue for Mobile & Appliance Retailers India" />
        <meta property="og:description" content="Your sales staff will never quote a wrong price again. Real-time catalogue synced from Google Sheets, works on any phone. Built for mobile phone and appliance retail stores across India." />
        <meta property="og:site_name" content="SalesSync by Deda Systems" />
        <meta property="og:locale" content="en_IN" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SalesSync – Live Price Catalogue for Mobile & Appliance Retailers" />
        <meta name="twitter:description" content="Stop using printed price lists that are outdated by morning. SalesSync keeps your whole team on the same live prices. 5-day free trial." />

        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.svg" sizes="any" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "SalesSync",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web, Android, iOS",
          "description": "Real-time price catalogue and sales support system for mobile phone and appliance retailers in India.",
          "offers": {
            "@type": "Offer",
            "price": "300",
            "priceCurrency": "INR",
            "priceValidUntil": "2026-12-31",
            "description": "Per user per month, starting at ₹300 for Sales staff"
          },
          "provider": {
            "@type": "Organization",
            "name": "Deda Systems",
            "url": "https://deda.systems"
          }
        })}} />

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
