'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { User } from '@/types';
import { ArrowLeft, RefreshCw, UserPlus, Shield, Users, Trash2, CreditCard } from 'lucide-react';
import { UserAnalytics } from '@/components/admin/UserAnalytics';

// ── Pricing constants (paise) ──────────────────────────────────────────────
const PRICE_STORE_BASE = 200000;   // ₹2,000
const PRICE_EXTRA_STAFF = 20000;   // ₹200
const PRICE_EXTRA_MANAGER = 50000; // ₹500
const PRICE_EXTRA_ADMIN = 70000;   // ₹700

function calcMonthly(adminSeats: number, managerSeats: number, salesSeats: number, branches: number): number {
  const extraBranchCost = Math.max(0, branches - 1) * PRICE_STORE_BASE;
  const extraAdmins   = Math.max(0, adminSeats   - 1);
  const extraManagers = Math.max(0, managerSeats - branches);
  const extraStaff    = Math.max(0, salesSeats   - branches * 4);
  return PRICE_STORE_BASE + extraBranchCost
    + extraAdmins   * PRICE_EXTRA_ADMIN
    + extraManagers * PRICE_EXTRA_MANAGER
    + extraStaff    * PRICE_EXTRA_STAFF;
}

function paiseToRupees(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Subscription {
  id: string;
  tenantId: string;
  adminSeats: number;
  managerSeats: number;
  salesSeats: number;
  monthlyAmount: number;
  tenant: {
    status: string;
    trialEndsAt: string | null;
    name: string;
  };
}

interface UsedSeats {
  ADMIN: number;
  STORE_MANAGER: number;
  SALES: number;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshingCache, setRefreshingCache] = useState(false);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'SALES' | 'ADMIN' | 'STORE_MANAGER'>('SALES');
  const [creatingUser, setCreatingUser] = useState(false);

  // ── Subscription state ──
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usedSeats, setUsedSeats] = useState<UsedSeats>({ ADMIN: 0, STORE_MANAGER: 0, SALES: 0 });
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState('');
  const [subSaving, setSubSaving] = useState(false);
  const [subSuccess, setSubSuccess] = useState('');

  // Form inputs (initialised from fetched data)
  const [formAdminSeats, setFormAdminSeats] = useState(1);
  const [formManagerSeats, setFormManagerSeats] = useState(1);
  const [formSalesSeats, setFormSalesSeats] = useState(4);
  const [formBranches, setFormBranches] = useState(1);

  // ── Auth guards ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/catalogue');
    }
  }, [status, session, router]);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    try {
      setSubLoading(true);
      const res = await fetch('/api/tenant/subscription');
      if (!res.ok) throw new Error('Failed to fetch subscription');
      const data = await res.json();
      setSubscription(data.subscription);
      setUsedSeats(data.usedSeats);
      setFormAdminSeats(data.subscription.adminSeats);
      setFormManagerSeats(data.subscription.managerSeats);
      setFormSalesSeats(data.subscription.salesSeats);
      // branchCount is not stored on subscription directly — derive from included managers
      // (included managers == branchCount, so branchCount == managerSeats when no extra managers)
      // Use monthlyAmount back-calculation isn't reliable; default to 1 branch on first load
      // unless the server exposes it. For now keep as 1 and let admin adjust.
    } catch (err) {
      setSubError('Failed to load subscription data');
      console.error(err);
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchUsers();
      fetchSubscription();
    }
  }, [status, session, fetchUsers, fetchSubscription]);

  // ── Live cost preview ────────────────────────────────────────────────────
  const previewAmount = calcMonthly(formAdminSeats, formManagerSeats, formSalesSeats, formBranches);
  const includedAdmins   = 1;
  const includedManagers = formBranches;
  const includedStaff    = formBranches * 4;
  const extraAdmins      = Math.max(0, formAdminSeats   - includedAdmins);
  const extraManagers    = Math.max(0, formManagerSeats - includedManagers);
  const extraStaff       = Math.max(0, formSalesSeats   - includedStaff);
  const extraBranches    = Math.max(0, formBranches - 1);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail, name: newUserName, password: newUserPassword, role: newUserRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user');
      }
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setNewUserRole('SALES');
      setShowCreateUser(false);
      fetchUsers();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
      console.error(err);
    }
  };

  const handleForcePasswordReset = async (userId: string) => {
    const newPassword = prompt('Enter new password for this user:');
    if (!newPassword) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, password: newPassword }),
      });
      if (!res.ok) throw new Error('Failed to reset password');
      alert('Password reset successfully');
    } catch {
      setError('Failed to reset password');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'SALES' | 'STORE_MANAGER' | 'ADMIN') => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user role');
      }
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      console.error(err);
    }
  };

  const handleRefreshCache = async () => {
    setRefreshingCache(true);
    try {
      const res = await fetch('/api/cache/refresh', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to refresh cache');
      alert('Cache refreshed successfully');
    } catch (err) {
      setError('Failed to refresh cache');
      console.error(err);
    } finally {
      setRefreshingCache(false);
    }
  };

  const handleSaveSeats = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubSaving(true);
    setSubError('');
    setSubSuccess('');
    try {
      const res = await fetch('/api/tenant/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminSeats: formAdminSeats,
          managerSeats: formManagerSeats,
          salesSeats: formSalesSeats,
          branchCount: formBranches,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save changes');
      setSubscription(data.subscription);
      setSubSuccess(`Plan updated. New monthly amount: ₹${paiseToRupees(data.newMonthlyAmount)}`);
    } catch (err) {
      setSubError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSubSaving(false);
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return null;
  }

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/catalogue')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8" />
                Admin Panel
              </h1>
              <p className="text-muted-foreground">Manage users and system settings</p>
            </div>
          </div>
          <Button onClick={handleRefreshCache} disabled={refreshingCache}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshingCache ? 'animate-spin' : ''}`} />
            Refresh Cache
          </Button>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* ── Plan & Seats ──────────────────────────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plan &amp; Seats
            </CardTitle>
            <CardDescription>View your current plan and adjust seat allocations</CardDescription>
          </CardHeader>
          <CardContent>
            {subLoading ? (
              <p className="text-sm text-muted-foreground">Loading subscription data…</p>
            ) : (
              <>
                {/* Plan summary card */}
                {subscription && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-lg">{subscription.tenant.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={subscription.tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {subscription.tenant.status}
                        </Badge>
                        {subscription.tenant.status === 'TRIAL' && subscription.tenant.trialEndsAt && (
                          <span className="text-xs text-muted-foreground">
                            Trial ends: {new Date(subscription.tenant.trialEndsAt).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{paiseToRupees(subscription.monthlyAmount)}</p>
                      <p className="text-xs text-muted-foreground">per month</p>
                    </div>
                  </div>
                )}

                {subError && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md mb-4">
                    {subError}
                  </div>
                )}
                {subSuccess && (
                  <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md mb-4">
                    {subSuccess}
                  </div>
                )}

                {/* Seat adjustment form */}
                <form onSubmit={handleSaveSeats}>
                  {/* Seat inputs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="adminSeats">Admin Seats</Label>
                      <Input
                        id="adminSeats"
                        type="number"
                        min={1}
                        value={formAdminSeats}
                        onChange={(e) => setFormAdminSeats(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <p className="text-xs text-muted-foreground">Used: {usedSeats.ADMIN}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="managerSeats">Manager Seats</Label>
                      <Input
                        id="managerSeats"
                        type="number"
                        min={1}
                        value={formManagerSeats}
                        onChange={(e) => setFormManagerSeats(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <p className="text-xs text-muted-foreground">Used: {usedSeats.STORE_MANAGER}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salesSeats">Staff Seats</Label>
                      <Input
                        id="salesSeats"
                        type="number"
                        min={4}
                        value={formSalesSeats}
                        onChange={(e) => setFormSalesSeats(Math.max(4, parseInt(e.target.value) || 4))}
                      />
                      <p className="text-xs text-muted-foreground">Used: {usedSeats.SALES}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branches">Branches</Label>
                      <Input
                        id="branches"
                        type="number"
                        min={1}
                        value={formBranches}
                        onChange={(e) => setFormBranches(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <p className="text-xs text-muted-foreground">1st included</p>
                    </div>
                  </div>

                  {/* Cost breakdown table */}
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/60 text-muted-foreground">
                          <th className="text-left px-4 py-2 font-medium">Role / Item</th>
                          <th className="text-center px-4 py-2 font-medium">Allocated</th>
                          <th className="text-center px-4 py-2 font-medium">Used</th>
                          <th className="text-center px-4 py-2 font-medium">Included</th>
                          <th className="text-center px-4 py-2 font-medium">Extra</th>
                          <th className="text-right px-4 py-2 font-medium">Extra Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-2">Admin</td>
                          <td className="px-4 py-2 text-center">{formAdminSeats}</td>
                          <td className="px-4 py-2 text-center">{usedSeats.ADMIN}</td>
                          <td className="px-4 py-2 text-center">{includedAdmins}</td>
                          <td className="px-4 py-2 text-center">{extraAdmins}</td>
                          <td className="px-4 py-2 text-right">
                            {extraAdmins > 0 ? `₹${paiseToRupees(extraAdmins * PRICE_EXTRA_ADMIN)}` : '₹0'}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Manager</td>
                          <td className="px-4 py-2 text-center">{formManagerSeats}</td>
                          <td className="px-4 py-2 text-center">{usedSeats.STORE_MANAGER}</td>
                          <td className="px-4 py-2 text-center">{includedManagers} (×branches)</td>
                          <td className="px-4 py-2 text-center">{extraManagers}</td>
                          <td className="px-4 py-2 text-right">
                            {extraManagers > 0 ? `₹${paiseToRupees(extraManagers * PRICE_EXTRA_MANAGER)}` : '₹0'}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Staff</td>
                          <td className="px-4 py-2 text-center">{formSalesSeats}</td>
                          <td className="px-4 py-2 text-center">{usedSeats.SALES}</td>
                          <td className="px-4 py-2 text-center">{includedStaff} (×branches)</td>
                          <td className="px-4 py-2 text-center">{extraStaff}</td>
                          <td className="px-4 py-2 text-right">
                            {extraStaff > 0 ? `₹${paiseToRupees(extraStaff * PRICE_EXTRA_STAFF)}` : '₹0'}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">Branch (base)</td>
                          <td className="px-4 py-2 text-center">{formBranches}</td>
                          <td className="px-4 py-2 text-center">—</td>
                          <td className="px-4 py-2 text-center">1</td>
                          <td className="px-4 py-2 text-center">{extraBranches}</td>
                          <td className="px-4 py-2 text-right">
                            {extraBranches > 0
                              ? `₹${paiseToRupees(extraBranches * PRICE_STORE_BASE)}`
                              : '₹0'}
                          </td>
                        </tr>
                        <tr className="bg-muted/40 font-semibold">
                          <td className="px-4 py-2" colSpan={5}>
                            Base store (1 Admin + 1 Manager + 4 Staff)
                          </td>
                          <td className="px-4 py-2 text-right">₹{paiseToRupees(PRICE_STORE_BASE)}</td>
                        </tr>
                        <tr className="bg-muted/70 font-bold text-base">
                          <td className="px-4 py-3" colSpan={5}>
                            Total monthly
                          </td>
                          <td className="px-4 py-3 text-right">₹{paiseToRupees(previewAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <Button type="submit" disabled={subSaving}>
                    {subSaving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── User Management ───────────────────────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>Manage system users and their access</CardDescription>
              </div>
              <Button onClick={() => setShowCreateUser(!showCreateUser)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Create User Form */}
            {showCreateUser && (
              <form onSubmit={handleCreateUser} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUserRole} onValueChange={(value: 'SALES' | 'ADMIN' | 'STORE_MANAGER') => setNewUserRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SALES">Sales</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="STORE_MANAGER">Store Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creatingUser}>
                    {creatingUser ? 'Creating...' : 'Create User'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateUser(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Users List */}
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium">{user.name}</span>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto">
                    {/* Role Selector */}
                    <div className="w-full lg:w-auto min-w-[150px]">
                      <Select
                        value={user.role}
                        onValueChange={(value: 'SALES' | 'STORE_MANAGER' | 'ADMIN') => handleUpdateRole(user.id, value)}
                        disabled={user.id === session?.user?.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SALES">Sales</SelectItem>
                          <SelectItem value="STORE_MANAGER">Store Manager</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                      disabled={user.id === session?.user?.id}
                      className="w-full lg:w-auto"
                    >
                      {user.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleForcePasswordReset(user.id)}
                      className="w-full lg:w-auto"
                    >
                      Reset Password
                    </Button>
                    {/* Delete User with Confirmation */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={user.id === session?.user?.id}
                          className="w-full lg:w-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the user <strong>{user.name}</strong> ({user.email}).
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Analytics */}
        <UserAnalytics />
      </div>
    </div>
  );
}
