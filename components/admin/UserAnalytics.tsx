'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock } from 'lucide-react';

interface UserAnalytics {
  id: string;
  name: string;
  email: string;
  role: string;
  totalVisits: number;
  totalPageViews: number;
  totalDuration: number;
  totalRefreshes: number;
  lastActiveAt: Date | null;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

function formatLastActive(date: Date | null): string {
  if (!date) return 'Never';
  
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' {
  if (role === 'ADMIN') return 'default';
  if (role === 'STORE_MANAGER') return 'secondary';
  return 'outline';
}

function formatRoleDisplay(role: string): string {
  if (role === 'STORE_MANAGER') return 'Store Manager';
  return role;
}

export function UserAnalytics() {
  const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/users');
      
      if (!res.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            User Analytics
          </CardTitle>
          <CardDescription>Track user activity and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            User Analytics
          </CardTitle>
          <CardDescription>Track user activity and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          User Analytics
        </CardTitle>
        <CardDescription>Track user activity and engagement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">User</th>
                <th className="text-left py-3 px-4 font-medium">Role</th>
                <th className="text-right py-3 px-4 font-medium">Visits</th>
                <th className="text-right py-3 px-4 font-medium">Page Views</th>
                <th className="text-right py-3 px-4 font-medium">Duration</th>
                <th className="text-right py-3 px-4 font-medium">Refreshes</th>
                <th className="text-right py-3 px-4 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {formatRoleDisplay(user.role)}
                    </Badge>
                  </td>
                  <td className="text-right py-3 px-4 font-mono">{user.totalVisits}</td>
                  <td className="text-right py-3 px-4 font-mono">{user.totalPageViews}</td>
                  <td className="text-right py-3 px-4 font-mono">
                    {formatDuration(user.totalDuration)}
                  </td>
                  <td className="text-right py-3 px-4 font-mono">{user.totalRefreshes}</td>
                  <td className="text-right py-3 px-4">
                    <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatLastActive(user.lastActiveAt)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {analytics.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No analytics data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
