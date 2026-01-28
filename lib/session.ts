import { randomUUID } from 'crypto';
import { prisma } from './db';
import { publishMessage } from './redis';

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return randomUUID();
}

/**
 * Update user's active session in the database
 */
export async function updateUserSession(userId: string, sessionId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        activeSessionId: sessionId,
        lastLoginAt: new Date(),
      },
    });
    
    // Broadcast session invalidation event AFTER successful database update
    await publishMessage(`session:invalidate:${userId}`, sessionId);
    
    console.log(`Updated session for user ${userId}: ${sessionId}`);
  } catch (error) {
    console.error('Error updating user session:', error);
    throw error;
  }
}

/**
 * Validate if a session ID is the active one for a user
 */
export async function validateSession(userId: string, sessionId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeSessionId: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return false;
    }

    // If no active session ID is set, allow the session (backward compatibility)
    if (!user.activeSessionId) {
      return true;
    }

    return user.activeSessionId === sessionId;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
}

/**
 * Clear user's active session
 */
export async function clearUserSession(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        activeSessionId: null,
      },
    });
    console.log(`Cleared session for user ${userId}`);
  } catch (error) {
    console.error('Error clearing user session:', error);
  }
}
