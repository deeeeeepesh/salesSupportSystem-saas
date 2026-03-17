'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

interface Subscription {
  status: string;
  monthlyAmount: number;
  salesSeats: number;
  managerSeats: number;
  adminSeats: number;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: TenantStatus;
  createdAt: string;
  trialEndsAt: string | null;
  subscription: Subscription | null;
  _count: { users: number };
}

const STATUS_COLORS: Record<TenantStatus, string> = {
  TRIAL: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function paiseToRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function SuperAdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [adminName, setAdminName] = useState('');

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTenants = async () => {
    setTenantsLoading(true);
    try {
      const res = await fetch('/api/super-admin/tenants');
      if (res.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (e) {
      console.error('Failed to fetch tenants', e);
    } finally {
      setTenantsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchTenants();
    }
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/super-admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Login failed');
      } else {
        setAdminName(data.name);
        setIsLoggedIn(true);
      }
    } catch {
      setLoginError('An unexpected error occurred');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/super-admin/auth', { method: 'DELETE' });
    setIsLoggedIn(false);
    setTenants([]);
  };

  const handleStatusChange = async (tenantId: string, status: TenantStatus) => {
    setActionLoading(tenantId);
    try {
      const res = await fetch('/api/super-admin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, status }),
      });
      if (res.ok) {
        await fetchTenants();
      }
    } catch (e) {
      console.error('Failed to update tenant status', e);
    } finally {
      setActionLoading(null);
    }
  };

  // Stats
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;
  const trialTenants = tenants.filter((t) => t.status === 'TRIAL').length;
  const totalMonthlyRevenue = tenants
    .filter((t) => t.status === 'ACTIVE')
    .reduce((sum, t) => sum + (t.subscription?.monthlyAmount || 0), 0);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">Super Admin</CardTitle>
            <CardDescription>Sales Support System Admin Portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sa-email">Email</Label>
                <Input
                  id="sa-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={loginLoading}
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sa-password">Password</Label>
                <Input
                  id="sa-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={loginLoading}
                  placeholder="••••••••"
                />
              </div>
              {loginError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {loginError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Super Admin Portal</h1>
          <p className="text-xs text-gray-400">Sales Support System</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">Welcome, {adminName}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-white border-gray-600 hover:bg-gray-700">
            Sign Out
          </Button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Tenants', value: totalTenants },
            { label: 'Active', value: activeTenants },
            { label: 'On Trial', value: trialTenants },
            { label: 'Monthly Revenue', value: paiseToRupees(totalMonthlyRevenue) },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tenants Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Tenants</CardTitle>
              <CardDescription>Manage all stores on the platform</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={fetchTenants} disabled={tenantsLoading}>
              {tenantsLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </CardHeader>
          <CardContent>
            {tenantsLoading ? (
              <p className="text-center text-gray-500 py-8">Loading tenants...</p>
            ) : tenants.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No tenants registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-gray-600 text-left">
                      <th className="pb-2 pr-4 font-medium">Store</th>
                      <th className="pb-2 pr-4 font-medium">Slug</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 pr-4 font-medium">Users</th>
                      <th className="pb-2 pr-4 font-medium">Sub Status</th>
                      <th className="pb-2 pr-4 font-medium">Monthly</th>
                      <th className="pb-2 pr-4 font-medium">Created</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-xs text-gray-400">{tenant.email}</div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs">{tenant.slug}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[tenant.status]}`}>
                            {tenant.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center">{tenant._count.users}</td>
                        <td className="py-3 pr-4 text-xs text-gray-500">
                          {tenant.subscription?.status || '—'}
                        </td>
                        <td className="py-3 pr-4">
                          {tenant.subscription ? paiseToRupees(tenant.subscription.monthlyAmount) : '—'}
                        </td>
                        <td className="py-3 pr-4 text-xs text-gray-500">
                          {new Date(tenant.createdAt).toLocaleDateString('en-IN')}
                          {tenant.trialEndsAt && tenant.status === 'TRIAL' && (
                            <div className="text-orange-500">
                              Trial ends {new Date(tenant.trialEndsAt).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1 flex-wrap">
                            {tenant.status !== 'ACTIVE' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-700 border-green-200 hover:bg-green-50 text-xs h-7 px-2"
                                disabled={actionLoading === tenant.id}
                                onClick={() => handleStatusChange(tenant.id, 'ACTIVE')}
                              >
                                Activate
                              </Button>
                            )}
                            {tenant.status !== 'SUSPENDED' && tenant.status !== 'CANCELLED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-yellow-700 border-yellow-200 hover:bg-yellow-50 text-xs h-7 px-2"
                                disabled={actionLoading === tenant.id}
                                onClick={() => handleStatusChange(tenant.id, 'SUSPENDED')}
                              >
                                Suspend
                              </Button>
                            )}
                            {tenant.status !== 'CANCELLED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-700 border-red-200 hover:bg-red-50 text-xs h-7 px-2"
                                disabled={actionLoading === tenant.id}
                                onClick={() => handleStatusChange(tenant.id, 'CANCELLED')}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
