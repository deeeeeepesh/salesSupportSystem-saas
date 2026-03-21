import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const raw = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!raw) {
      return NextResponse.json({ serviceAccountEmail: null });
    }
    const parsed = JSON.parse(raw) as { client_email?: string };
    const serviceAccountEmail = parsed.client_email ?? null;
    return NextResponse.json({ serviceAccountEmail });
  } catch (err) {
    console.error('[service-account-email] Failed to parse GOOGLE_SHEETS_CREDENTIALS:', err);
    return NextResponse.json({ serviceAccountEmail: null });
  }
}
