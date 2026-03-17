import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      sessionId?: string;
      tenantId: string;
      tenantSlug: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    tenantSlug: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    sessionId?: string;
    roleLastFetchedAt?: number;
    tenantId: string;
    tenantSlug: string;
  }
}
