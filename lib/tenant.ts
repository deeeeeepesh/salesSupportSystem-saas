import { headers } from 'next/headers';
import { prisma } from './db';
import { cache } from 'react';

export type TenantContext = {
  id: string;
  slug: string;
  name: string;
  status: string;
  googleSheetId: string | null;
};

// Cache tenant lookup per request (React cache)
export const getTenantBySlug = cache(async (slug: string): Promise<TenantContext | null> => {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, status: true, googleSheetId: true },
  });
  return tenant;
});

export const getTenantById = cache(async (id: string): Promise<TenantContext | null> => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true, status: true, googleSheetId: true },
  });
  return tenant;
});

// Get tenant from request headers (set by middleware)
export async function getTenantFromHeaders(): Promise<TenantContext | null> {
  const headersList = headers();
  const slug = headersList.get('x-tenant-slug');
  if (!slug) return null;
  return getTenantBySlug(slug);
}

// Check if tenant is allowed to operate (not suspended/cancelled)
export function isTenantActive(status: string): boolean {
  return status === 'TRIAL' || status === 'ACTIVE';
}
