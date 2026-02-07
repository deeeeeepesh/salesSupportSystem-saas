import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { generateSessionId, updateUserSession } from './session';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
          throw new Error('Account is disabled');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - set user data from authorize callback
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roleLastFetchedAt = Date.now();
        
        // Generate and store new session ID on sign in
        const sessionId = generateSessionId();
        token.sessionId = sessionId;
        
        // Update user's active session in database
        await updateUserSession(user.id, sessionId);
      } else {
        // Subsequent requests - refresh role from database periodically
        const now = Date.now();
        const lastFetched = token.roleLastFetchedAt as number || 0;
        const REFRESH_INTERVAL = 30 * 1000; // 30 seconds
        
        // Only refresh if enough time has passed since last fetch
        if (now - lastFetched > REFRESH_INTERVAL) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: {
                id: true,
                role: true,
                isActive: true,
              },
            });
            
            // If user doesn't exist or is deactivated, invalidate session
            if (!dbUser || !dbUser.isActive) {
              // Clear token to force re-authentication
              // NextAuth will handle this as an invalid session
              throw new Error('Session invalidated: user not found or deactivated');
            }
            
            // Update role if it has changed
            token.role = dbUser.role;
            token.roleLastFetchedAt = now;
          } catch (error) {
            // If it's a session invalidation error, re-throw it
            if (error instanceof Error && error.message.includes('Session invalidated')) {
              throw error;
            }
            // For other errors (e.g., database connection issues),
            // log and keep existing token to avoid disrupting user session
            console.error('Error refreshing user role:', error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.sessionId = token.sessionId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
