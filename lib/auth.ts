import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { generateSessionId, updateUserSession } from './session';

const ROLE_REFRESH_INTERVAL = 30 * 1000;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantSlug: { label: 'Tenant', type: 'text' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        // Get tenant slug from credentials (injected from login form via hidden field)
        const tenantSlug = credentials.tenantSlug as string | undefined;
        if (!tenantSlug) {
          throw new Error('Tenant context missing');
        }

        const tenant = await prisma.tenant.findUnique({
          where: { slug: tenantSlug },
          select: { id: true, status: true },
        });

        if (!tenant) {
          throw new Error('Store not found');
        }

        if (tenant.status === 'SUSPENDED') {
          throw new Error('Store subscription has been suspended. Please contact support.');
        }

        if (tenant.status === 'CANCELLED') {
          throw new Error('Store subscription has been cancelled.');
        }

        const user = await prisma.user.findUnique({
          where: { email_tenantId: { email: credentials.email, tenantId: tenant.id } },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
          throw new Error('Account is disabled');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: tenant.id,
          tenantSlug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = (user as any).tenantId;
        token.tenantSlug = (user as any).tenantSlug;
        token.roleLastFetchedAt = Date.now();

        const sessionId = generateSessionId();
        token.sessionId = sessionId;
        await updateUserSession(user.id, sessionId);
      } else {
        const now = Date.now();
        const lastFetched = (token.roleLastFetchedAt as number) || 0;

        if (now - lastFetched > ROLE_REFRESH_INTERVAL) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { id: true, role: true, isActive: true, tenantId: true },
            });

            if (!dbUser || !dbUser.isActive) {
              throw new Error('Session invalidated: user not found or deactivated');
            }

            // Also check tenant status
            const tenant = await prisma.tenant.findUnique({
              where: { id: dbUser.tenantId },
              select: { status: true },
            });

            if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED') {
              throw new Error('Session invalidated: store suspended');
            }

            if (token.role !== dbUser.role) {
              token.role = dbUser.role;
            }
            token.roleLastFetchedAt = now;
          } catch (error) {
            if (error instanceof Error && error.message.includes('Session invalidated')) {
              throw error;
            }
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
        session.user.tenantId = token.tenantId as string;
        session.user.tenantSlug = token.tenantSlug as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
