'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  FileSpreadsheet, CheckSquare, Table2, Share2,
  CheckCircle2, Info, ChevronDown, ChevronUp, Sun, Moon, AlertCircle, ExternalLink,
} from 'lucide-react';

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

const COLUMN_HEADERS = [
  'Brand', 'Model', 'Image', 'Variant', 'MRP', 'MOP', 'Final Price',
  'Sellout MOP', 'Sellout Final', 'Sellout from date', 'Sellout To Date',
  'Last Updated', 'Quick Pitch', 'Bank Offers', 'Upgrade / Exchange Offers',
  'Store Offers and Gifts', 'Weekly Focus', 'All Models', 'New Launch',
];

const COLUMN_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S'];

const COLUMN_REFERENCE = [
  { col: 'A', name: 'Brand', type: 'Text', required: 'Yes', notes: 'Samsung, Apple, Realme' },
  { col: 'B', name: 'Model', type: 'Text', required: 'Yes', notes: 'Galaxy A55 5G' },
  { col: 'C', name: 'Image', type: 'URL', required: 'No', notes: 'https://... (direct image URL)' },
  { col: 'D', name: 'Variant', type: 'Text', required: 'No', notes: '8GB/128GB, Midnight Black' },
  { col: 'E', name: 'MRP', type: 'Number', required: 'Yes', notes: '32999' },
  { col: 'F', name: 'MOP', type: 'Number', required: 'Yes', notes: '30499' },
  { col: 'G', name: 'Final Price', type: 'Number', required: 'Yes', notes: '29999' },
  { col: 'H', name: 'Sellout MOP', type: 'Number', required: 'No', notes: '28000' },
  { col: 'I', name: 'Sellout Final', type: 'Number', required: 'No', notes: '27500' },
  { col: 'J', name: 'Sellout from date', type: 'Date', required: 'No', notes: '01/03/2026' },
  { col: 'K', name: 'Sellout To Date', type: 'Date', required: 'No', notes: '31/03/2026' },
  { col: 'L', name: 'Last Updated', type: 'Date', required: 'No', notes: '21/03/2026' },
  { col: 'M', name: 'Quick Pitch', type: 'Text', required: 'No', notes: 'Best camera phone under 30k, great for reels' },
  { col: 'N', name: 'Bank Offers', type: 'Text', required: 'No', notes: 'HDFC ₹2000 cashback, ICICI 3 month no-cost EMI' },
  { col: 'O', name: 'Upgrade / Exchange Offers', type: 'Text', required: 'No', notes: 'Exchange bonus ₹1500 on any old phone' },
  { col: 'P', name: 'Store Offers and Gifts', type: 'Text', required: 'No', notes: 'Free back cover + screen guard worth ₹799' },
  { col: 'Q', name: 'Weekly Focus', type: 'Checkbox', required: 'No', notes: '✓ (checked = featured this week)' },
  { col: 'R', name: 'All Models', type: 'Checkbox', required: 'No', notes: '✓ (checked = show in All Models section)' },
  { col: 'S', name: 'New Launch', type: 'Checkbox', required: 'No', notes: '✓ (checked = show in New Arrivals)' },
];

const FAQS = [
  {
    q: 'My products aren\'t showing up after I added the Sheet ID',
    a: [
      'Wait up to 2 minutes for the first sync.',
      'Make sure you shared the sheet with the service account email (Step 5).',
      'Make sure the sheet tab is named exactly "Price List".',
      'Check that row 1 has the exact column headers listed in Step 1.',
      'Try clicking "Refresh Cache" in the Admin Panel → Google Sheets card.',
    ],
  },
  {
    q: 'I see an error saying the sheet couldn\'t be accessed',
    a: [
      'The service account email was not added as a Viewer. Go back to Step 5.',
      'Double-check you shared with the correct email (copy it exactly from the Admin Panel).',
    ],
  },
  {
    q: 'The Weekly Focus / New Arrivals sections are empty',
    a: [
      'Columns Q, R, S must be checkboxes (not text). See Step 2.',
      'Check the boxes (✓) for the products you want featured.',
    ],
  },
  {
    q: 'Prices show as 0 or missing',
    a: [
      'Make sure columns E (MRP), F (MOP), G (Final Price) contain only numbers — no ₹ symbol, no commas.',
    ],
  },
  {
    q: 'Can I rename my sheet to something other than "Price List"?',
    a: [
      'No. The sheet tab must be named exactly "Price List". You can have other tabs in the same spreadsheet — SalesSync only reads the one named "Price List".',
    ],
  },
  {
    q: 'Do I need to create a new Google account for this?',
    a: [
      'No. Use your existing Google account. The service account is managed by SalesSync — you just need to share your spreadsheet with its email.',
    ],
  },
];

export default function SheetsSetupPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDark ? 'bg-zinc-950 text-white' : 'bg-white text-gray-900'}`}>
      {/* NAVBAR */}
      <nav
        className={`sticky top-0 z-50 backdrop-blur border-b px-4 py-3 ${
          isDark ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-gray-200'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center">
            <LogoMark isDark={isDark} />
          </a>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Button
              size="sm"
              onClick={() => { window.location.href = '/'; }}
              className="bg-orange-500 hover:bg-orange-400 text-black font-semibold"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className={`py-20 px-4 ${sectionBase}`}>
        <div className="max-w-4xl mx-auto text-center">
          <span className={`inline-block mb-5 text-sm px-4 py-1.5 font-semibold rounded-full border ${tagCls}`}>
            Google Sheets Setup Guide
          </span>
          <h1 className={`text-3xl md:text-5xl font-black mb-5 leading-tight tracking-tight ${textPrimary}`}>
            How to Connect Your Google Sheet<br />to SalesSync
          </h1>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${textSecondary}`}>
            A complete, step-by-step guide. No technical knowledge required. Takes about 10–15 minutes.
          </p>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className={`py-16 px-4 ${sectionAlt}`}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Overview</p>
            <h2 className={`text-2xl md:text-3xl font-black mb-4 ${textPrimary}`}>What We&apos;re Setting Up</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: <FileSpreadsheet className="w-5 h-5 text-orange-500" />,
                title: 'Your Sheet, Your Data',
                desc: 'SalesSync reads your price list directly from a Google Sheet you own. You do NOT give SalesSync edit access — it only reads your data.',
              },
              {
                icon: <Share2 className="w-5 h-5 text-orange-500" />,
                title: 'Service Account Access',
                desc: 'We use a "service account" — a special Google account that can read your sheet on our behalf. You share your sheet with this service account email (we provide it to you).',
              },
              {
                icon: <CheckCircle2 className="w-5 h-5 text-orange-500" />,
                title: 'Automatic Sync',
                desc: 'Every time you update your sheet, SalesSync syncs automatically within 2 minutes. No manual steps needed.',
              },
              {
                icon: <Info className="w-5 h-5 text-orange-500" />,
                title: 'One-Time Setup',
                desc: 'You only need to do this setup once. After that, just update your Google Sheet and SalesSync handles the rest.',
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-xl p-5 border flex gap-4 ${cardBg}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBox}`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className={`font-bold mb-1 text-sm ${textPrimary}`}>{item.title}</h3>
                  <p className={`text-sm leading-relaxed ${textSecondary}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className={`py-16 px-4 ${sectionBase}`}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Step by Step</p>
            <h2 className={`text-2xl md:text-3xl font-black ${textPrimary}`}>Complete Setup Instructions</h2>
          </div>

          <div className="space-y-6">

            {/* Step 1 */}
            <div className={`rounded-xl border p-6 ${cardBg}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-orange-500 text-black rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <div className={`flex items-center gap-2 mb-1.5`}>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md w-fit ${iconBox}`}>
                      <FileSpreadsheet className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-500 text-xs font-semibold">Google Sheets</span>
                    </div>
                  </div>
                  <h3 className={`text-lg font-black ${textPrimary}`}>Create Your Google Sheet</h3>
                </div>
              </div>
              <div className={`space-y-3 text-sm ${textSecondary}`}>
                <p>
                  Go to{' '}
                  <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 underline">
                    Google Sheets
                  </a>{' '}
                  and create a new spreadsheet.
                </p>
                <p>
                  Name the sheet tab <strong className={textPrimary}>&quot;Price List&quot;</strong> — this exact name is required.
                </p>
                <p>On Row 1 (the header row), add these column names <strong className={textPrimary}>in this exact order:</strong></p>
                <div className="overflow-x-auto mt-3">
                  <table className={`text-xs w-full border-collapse rounded-lg overflow-hidden ${isDark ? 'border-zinc-700' : 'border-gray-300'}`}>
                    <thead>
                      <tr className={isDark ? 'bg-zinc-800' : 'bg-gray-200'}>
                        <td className={`px-3 py-2 font-bold border ${isDark ? 'border-zinc-700 text-zinc-300' : 'border-gray-300 text-gray-700'}`}>Col</td>
                        {COLUMN_LETTERS.map((l) => (
                          <td key={l} className={`px-2 py-2 font-bold text-center border ${isDark ? 'border-zinc-700 text-zinc-300' : 'border-gray-300 text-gray-700'}`}>{l}</td>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={isDark ? 'bg-zinc-900' : 'bg-white'}>
                        <td className={`px-3 py-2 font-bold border ${isDark ? 'border-zinc-700 text-zinc-400' : 'border-gray-300 text-gray-600'}`}>Header</td>
                        {COLUMN_HEADERS.map((h) => (
                          <td key={h} className={`px-2 py-2 text-center border whitespace-nowrap ${isDark ? 'border-zinc-700 text-zinc-300' : 'border-gray-300 text-gray-700'}`}>{h}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className={`mt-4 p-4 rounded-lg border ${isDark ? 'bg-orange-500/10 border-orange-500/30 text-orange-200' : 'bg-orange-50 border-orange-300 text-orange-800'}`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <strong>Important:</strong> The column headers must match exactly — spelling, spaces, and capitalisation. Even a small typo like &quot;Brand name&quot; instead of &quot;Brand&quot; will cause the sync to fail.
                    </p>
                  </div>
                </div>
                <div className={`mt-4 rounded-lg border-2 border-orange-500 p-5 ${isDark ? 'bg-orange-500/5' : 'bg-orange-50/60'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <FileSpreadsheet className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={`font-bold text-sm mb-1 ${textPrimary}`}>Don&apos;t want to set up the columns manually?</p>
                      <p className={`text-sm ${textSecondary}`}>
                        We&apos;ve pre-built a template with all the right headers and checkbox columns. Just make a copy and start adding your products.
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm mb-3 ml-8 ${textSecondary}`}>
                    Use our pre-built template — already has all 19 columns and checkboxes set up.
                  </p>
                  <div className="ml-8">
                    <a
                      href="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/copy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-orange-500 hover:bg-orange-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      Open Template &amp; Make a Copy →
                    </a>
                    <p className={`text-xs mt-2 ${textMuted}`}>
                      When prompted by Google, click &apos;Make a copy&apos;. The copy will be saved to your own Google Drive.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`rounded-xl border p-6 ${cardBg}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-orange-500 text-black rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <div className={`flex items-center gap-2 mb-1.5`}>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md w-fit ${iconBox}`}>
                      <CheckSquare className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-500 text-xs font-semibold">Checkboxes</span>
                    </div>
                  </div>
                  <h3 className={`text-lg font-black ${textPrimary}`}>Set Up Columns Q, R, S as Checkboxes</h3>
                </div>
              </div>
              <div className={`space-y-3 text-sm ${textSecondary}`}>
                <p>
                  Columns <strong className={textPrimary}>Q (Weekly Focus)</strong>, <strong className={textPrimary}>R (All Models)</strong>, and <strong className={textPrimary}>S (New Launch)</strong> must be Google Sheets checkboxes, not plain text.
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                  <li>Click the column <strong className={textPrimary}>Q</strong> header to select the entire column.</li>
                  <li>Go to <strong className={textPrimary}>Insert → Checkbox</strong> in the top menu.</li>
                  <li>Repeat for column <strong className={textPrimary}>R (All Models)</strong>.</li>
                  <li>Repeat for column <strong className={textPrimary}>S (New Launch)</strong>.</li>
                </ol>
                <div className={`mt-2 p-4 rounded-lg border ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      These checkboxes control which products appear in the &quot;Weekly Focus&quot; and &quot;New Arrivals&quot; sections of the catalogue. If they are text cells instead of checkboxes, the filtering won&apos;t work.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`rounded-xl border p-6 ${cardBg}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-orange-500 text-black rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <div className={`flex items-center gap-2 mb-1.5`}>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md w-fit ${iconBox}`}>
                      <Table2 className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-500 text-xs font-semibold">Data Entry</span>
                    </div>
                  </div>
                  <h3 className={`text-lg font-black ${textPrimary}`}>Add Your Products</h3>
                </div>
              </div>
              <div className={`space-y-3 text-sm ${textSecondary}`}>
                <p>From <strong className={textPrimary}>Row 2</strong> onwards, add your products. Each row is one product or variant.</p>
                <ul className="space-y-2 ml-1">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold flex-shrink-0">•</span>
                    <span><strong className={textPrimary}>Image (Col C):</strong> Paste a direct public image URL (e.g., from the brand&apos;s website or a CDN). Leave blank if no image.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold flex-shrink-0">•</span>
                    <span><strong className={textPrimary}>Date fields (J, K, L):</strong> Use DD/MM/YYYY format, e.g. 01/03/2026.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold flex-shrink-0">•</span>
                    <span><strong className={textPrimary}>Price fields (E, F, G, H, I):</strong> Enter numbers only — no ₹ symbol, no commas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold flex-shrink-0">•</span>
                    <span><strong className={textPrimary}>Quick Pitch (Col M):</strong> A short 1–2 line sales tip for staff to use during a live sale.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold flex-shrink-0">•</span>
                    <span><strong className={textPrimary}>Offer columns (N, O, P):</strong> Free-text fields for offer descriptions — write naturally.</span>
                  </li>
                </ul>
                <div className={`mt-2 p-4 rounded-lg border ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <strong>Tip:</strong> Keep your Quick Pitch short and punchy — staff read it during a live sale. 1–2 sentences max.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`rounded-xl border p-6 ${cardBg}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-orange-500 text-black rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 mt-0.5">
                  4
                </div>
                <div className="flex-1">
                  <div className={`flex items-center gap-2 mb-1.5`}>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md w-fit ${iconBox}`}>
                      <FileSpreadsheet className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-500 text-xs font-semibold">Sheet ID</span>
                    </div>
                  </div>
                  <h3 className={`text-lg font-black ${textPrimary}`}>Get the Spreadsheet ID</h3>
                </div>
              </div>
              <div className={`space-y-3 text-sm ${textSecondary}`}>
                <p>Your spreadsheet ID is the long string of letters and numbers in the URL when you open your sheet.</p>
                <div className={`p-4 rounded-lg border font-mono text-xs break-all ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-300'}`}>
                  <span className={textMuted}>https://docs.google.com/spreadsheets/d/</span>
                  <span className="text-orange-500 font-bold">1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms</span>
                  <span className={textMuted}>/edit</span>
                </div>
                <p>The <span className="text-orange-500 font-bold">highlighted orange part</span> is your Spreadsheet ID. Copy it — you&apos;ll need it in Step 6.</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className={`rounded-xl border p-6 ${cardBg}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-orange-500 text-black rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 mt-0.5">
                  5
                </div>
                <div className="flex-1">
                  <div className={`flex items-center gap-2 mb-1.5`}>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md w-fit ${iconBox}`}>
                      <Share2 className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-500 text-xs font-semibold">Google Drive</span>
                    </div>
                  </div>
                  <h3 className={`text-lg font-black ${textPrimary}`}>Share the Sheet with SalesSync&apos;s Service Account</h3>
                </div>
              </div>
              <div className={`space-y-3 text-sm ${textSecondary}`}>
                <p>
                  SalesSync uses a Google Service Account to read your sheet. The service account email is displayed in your{' '}
                  <strong className={textPrimary}>Admin Panel → Google Sheets Integration</strong> section after you log in.
                </p>
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm space-y-1.5">
                      <p className="font-semibold">📍 Where to find the service account email:</p>
                      <p>Log in → Admin Panel (top-right menu) → Google Sheets Integration card → look for the &quot;Service Account Email&quot; field.</p>
                      <p className={`font-mono text-xs ${textMuted}`}>The email looks like: something@your-project.iam.gserviceaccount.com</p>
                    </div>
                  </div>
                </div>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                  <li>Open your Google Sheet.</li>
                  <li>Click the <strong className={textPrimary}>Share</strong> button (top-right, blue button).</li>
                  <li>In the &quot;Add people and groups&quot; field, paste the service account email from your Admin Panel.</li>
                  <li>Set permission to <strong className={textPrimary}>Viewer</strong> (not Editor — it only needs to read).</li>
                  <li>Uncheck &quot;Notify people&quot; (the service account doesn&apos;t need an email).</li>
                  <li>Click <strong className={textPrimary}>Share</strong>.</li>
                </ol>
                <div className={`p-3 rounded-lg flex items-center gap-2 ${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                  <span className={`text-sm ${textMuted}`}>Need to check your service account details?</span>
                  <a
                    href="https://console.cloud.google.com/iam-admin/serviceaccounts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-400 text-sm font-medium transition-colors"
                  >
                    Open Google Cloud Console →
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className={`mt-2 p-4 rounded-lg border ${isDark ? 'bg-orange-500/10 border-orange-500/30 text-orange-200' : 'bg-orange-50 border-orange-300 text-orange-800'}`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <strong>Important:</strong> Do NOT set the sheet to &quot;Anyone with the link can view&quot;. Share it only with the specific service account email shown in your Admin Panel. This keeps your prices private.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className={`rounded-xl border p-6 ${cardBg}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-orange-500 text-black rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 mt-0.5">
                  6
                </div>
                <div className="flex-1">
                  <div className={`flex items-center gap-2 mb-1.5`}>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md w-fit ${iconBox}`}>
                      <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-500 text-xs font-semibold">Final Step</span>
                    </div>
                  </div>
                  <h3 className={`text-lg font-black ${textPrimary}`}>Paste the Sheet ID in SalesSync</h3>
                </div>
              </div>
              <div className={`space-y-3 text-sm ${textSecondary}`}>
                <p>
                  Log in to your store at <strong className={textPrimary}>yourstore.salessupportapp.dedasystems.com</strong>
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                  <li>Go to <strong className={textPrimary}>Admin Panel</strong> (top right menu → Admin Panel).</li>
                  <li>Find the <strong className={textPrimary}>&quot;Google Sheets Integration&quot;</strong> card.</li>
                  <li>Click <strong className={textPrimary}>Edit</strong>, paste your Spreadsheet ID, and click <strong className={textPrimary}>Save</strong>.</li>
                  <li>SalesSync will immediately attempt to sync and verify the connection.</li>
                </ol>
                <div className={`mt-2 p-4 rounded-lg border ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <strong>Success:</strong> You&apos;ll see the last sync time update. Your products will appear in the catalogue within 2 minutes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* COLUMN REFERENCE TABLE */}
      <section className={`py-16 px-4 ${sectionAlt}`}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Reference</p>
            <h2 className={`text-2xl md:text-3xl font-black mb-2 ${textPrimary}`}>Column Reference Table</h2>
            <p className={`text-sm ${textSecondary}`}>All 19 columns your Google Sheet must have, in order.</p>
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full text-sm border-collapse rounded-xl overflow-hidden`}>
              <thead>
                <tr className={isDark ? 'bg-zinc-800' : 'bg-gray-200'}>
                  {['Col', 'Name', 'Type', 'Required', 'Example / Notes'].map((h) => (
                    <th key={h} className={`text-left px-4 py-3 font-bold text-xs uppercase tracking-wide border-b ${isDark ? 'border-zinc-700 text-zinc-300' : 'border-gray-300 text-gray-700'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COLUMN_REFERENCE.map((row, i) => (
                  <tr
                    key={row.col}
                    className={`border-b transition-colors ${
                      i % 2 === 0
                        ? isDark ? 'bg-zinc-900' : 'bg-white'
                        : isDark ? 'bg-zinc-900/50' : 'bg-gray-50'
                    } ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-gray-200 hover:bg-gray-100'}`}
                  >
                    <td className={`px-4 py-3 font-bold font-mono text-orange-500`}>{row.col}</td>
                    <td className={`px-4 py-3 font-semibold ${textPrimary}`}>{row.name}</td>
                    <td className={`px-4 py-3 ${textMuted}`}>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        row.type === 'Checkbox'
                          ? isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'
                          : row.type === 'Number'
                          ? isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200'
                          : row.type === 'Date'
                          ? isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200'
                          : row.type === 'URL'
                          ? isDark ? 'bg-zinc-700 text-zinc-300 border-zinc-600' : 'bg-gray-100 text-gray-600 border-gray-300'
                          : isDark ? 'bg-zinc-700 text-zinc-300 border-zinc-600' : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${row.required === 'Yes' ? 'text-orange-500 font-semibold' : textMuted}`}>
                      {row.required}
                    </td>
                    <td className={`px-4 py-3 text-xs ${textSecondary}`}>{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={`py-16 px-4 ${sectionBase}`}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-orange-500 text-sm font-bold uppercase tracking-widest mb-3">Troubleshooting</p>
            <h2 className={`text-2xl md:text-3xl font-black ${textPrimary}`}>Frequently Asked Questions</h2>
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
                    <ul className={`text-sm leading-relaxed pt-4 space-y-1.5 ${textSecondary}`}>
                      {faq.a.map((line, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="text-orange-500 flex-shrink-0">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-16 px-4 ${sectionAlt}`}>
        <div className="max-w-2xl mx-auto text-center">
          <div className={`rounded-2xl border-2 border-orange-500 p-10 bg-orange-500/5`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${iconBox}`}>
              <CheckCircle2 className="w-7 h-7 text-orange-500" />
            </div>
            <h2 className={`text-2xl md:text-3xl font-black mb-3 ${textPrimary}`}>
              Ready to Connect Your Sheet?
            </h2>
            <p className={`text-lg mb-8 ${textSecondary}`}>
              Register your store and connect your sheet in under 15 minutes.
            </p>
            <Button
              size="lg"
              onClick={() => { window.location.href = '/'; }}
              className="bg-orange-500 hover:bg-orange-400 text-black font-black text-lg px-10 py-6 rounded-xl"
            >
              Start Free Trial →
            </Button>
            <p className={`text-sm mt-4 ${textMuted}`}>No credit card · 5 days free · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`py-10 px-4 border-t ${sectionAlt} ${borderColor}`}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <LogoMark isDark={isDark} />
          <p className={`text-xs text-center ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
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
      </footer>
    </div>
  );
}
