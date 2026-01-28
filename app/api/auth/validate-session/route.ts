import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Validate if the current session is still active
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ valid: false, reason: 'No session' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ valid: false, reason: 'No session ID' }, { status: 400 });
    }

    const isValid = await validateSession(session.user.id, sessionId);

    if (!isValid) {
      return NextResponse.json(
        { valid: false, reason: 'Session invalidated' },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Error validating session:', error);
    return NextResponse.json(
      { valid: false, reason: 'Internal error' },
      { status: 500 }
    );
  }
}
