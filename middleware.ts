import { NextRequest, NextResponse } from 'next/server';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'salessupportapp.dedasystems.com';

// Rate limit store (in-memory, use Upstash Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  // Strip port for local dev
  const host = hostname.replace(/:\d+$/, '');

  // ── Rate limiting on API routes ──────────────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    const isAuthRoute = url.pathname.startsWith('/api/auth');
    const limit = isAuthRoute ? 10 : 60;       // stricter on auth
    const window = isAuthRoute ? 60_000 : 60_000; // per minute
    const key = `${ip}:${url.pathname}`;
    if (!rateLimit(key, limit, window)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
        },
      });
    }
  }

  // ── Security headers ─────────────────────────────────────────────────────
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // ── Determine context from subdomain ────────────────────────────────────
  let subdomain = '';
  if (host === ROOT_DOMAIN || host === 'localhost' || host === '127.0.0.1') {
    // Root domain — landing page, no tenant context
    subdomain = '';
  } else if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    subdomain = host.replace(`.${ROOT_DOMAIN}`, '');
  } else if (host.includes('localhost')) {
    // Local dev: use x-tenant-slug header or query param ?tenant=xxx
    subdomain = request.headers.get('x-dev-tenant') || url.searchParams.get('tenant') || '';
  }

  // ── Super admin subdomain ────────────────────────────────────────────────
  if (subdomain === 'admin') {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-is-super-admin', 'true');
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── Inject tenant slug for tenant subdomains ─────────────────────────────
  if (subdomain) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', subdomain);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
};
