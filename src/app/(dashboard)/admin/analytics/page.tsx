'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  Calendar,
  Award,
  IndianRupee,
  ScanLine,
  TrendingUp,
  Download,
  PieChart as PieIcon,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '@/services/admin-service';
import { exportService } from '@/services/export-service';
import { AdminFeedbackAnalytics } from '@/components/feedback/admin-feedback-analytics';
import { useDataSync } from '@/lib/data-sync';
import { toast } from 'sonner';


import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLOR_PALETTE = ['#01424E', '#007C46', '#7CEAAB', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{
    studentsCount: number;
    organizersCount: number;
    volunteersCount: number;
    eventsCount: number;
    registrationsCount: number;
    attendanceCount: number;
    certificatesCount: number;
    totalRevenue: number;
    roleDistribution: { role: string; count: number }[];
    categoryDistribution: { category: string; count: number }[];
  }>({
    studentsCount: 0,
    organizersCount: 0,
    volunteersCount: 0,
    eventsCount: 0,
    registrationsCount: 0,
    attendanceCount: 0,
    certificatesCount: 0,
    totalRevenue: 0,
    roleDistribution: [],
    categoryDistribution: [],
  });

  const fetchGlobalAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getGlobalAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load global analytics:', err);
      toast.error('Failed to load analytics metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useDataSync(['admin', 'feedback', 'events'], fetchGlobalAnalytics, []);


  const handleExportExcel = async () => {
    try {
      toast.loading('Generating platform analytics Excel report...', { id: 'excel-export' });
      await exportService.exportAnalyticsSummary(
        {
          totalEvents: analytics.eventsCount,
          activeEvents: analytics.eventsCount,
          totalRegistrations: analytics.registrationsCount,
          pendingRegistrations: 0,
          totalAttendance: analytics.attendanceCount,
          totalCertificates: analytics.certificatesCount,
        },
        analytics.roleDistribution.map(r => ({ date: r.role, registrations: r.count, attendance: 0 }))
      );
      toast.success('Analytics report downloaded successfully! 📊', { id: 'excel-export' });
    } catch {
      toast.error('Failed to generate Excel report', { id: 'excel-export' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Global Campus Analytics</h1>
          <p className="text-muted-foreground text-sm">Comprehensive platform metrics, user demographics, and category distribution</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportExcel} className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold shadow-md">
            <Download className="mr-2 h-4 w-4" /> Export Analytics Excel
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Registrations</p>
              <p className="text-2xl font-extrabold text-[#01424E] dark:text-teal-100">{loading ? '...' : analytics.registrationsCount}</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Verified QR Scans</p>
              <p className="text-2xl font-extrabold text-[#007C46]">{loading ? '...' : analytics.attendanceCount}</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#edfcf6] dark:bg-teal-950/40 text-[#007C46]">
              <ScanLine className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Issued Certificates</p>
              <p className="text-2xl font-extrabold text-purple-600">{loading ? '...' : analytics.certificatesCount}</p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Gross Revenue</p>
              <p className="text-2xl font-extrabold text-green-600">₹{loading ? '...' : analytics.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-950/40 text-green-600">
              <IndianRupee className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Role Distribution Bar Chart */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#007C46]" /> User Role Distribution
            </CardTitle>
            <CardDescription className="text-xs">Breakdown of students, organizers, and volunteers</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.roleDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="role" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#01424E', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#7CEAAB' }}
                  />
                  <Bar dataKey="count" fill="#007C46" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown Pie Chart */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-[#01424E]" /> Event Category Share
            </CardTitle>
            <CardDescription className="text-xs">Distribution of campus events by discipline</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72 w-full flex items-center justify-center">
              {analytics.categoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryDistribution}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {analytics.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#01424E', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#7CEAAB' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground">No category data recorded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Feedback & Moderation Section */}
      <AdminFeedbackAnalytics />
    </div>
  );
}

