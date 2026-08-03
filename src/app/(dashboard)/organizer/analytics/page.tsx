'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { BarChart3, Download, TrendingUp, Users, QrCode, Award, IndianRupee, Calendar } from 'lucide-react';
import { analyticsService } from '@/services/analytics-service';
import { exportService } from '@/services/export-service';
import { toast } from 'sonner';

const COLOR_PALETTE = ['#01424E', '#007C46', '#41B177', '#7CEAAB', '#0284C7', '#6366F1'];

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    pendingRegistrations: 0,
    approvedRegistrations: 0,
    totalVolunteers: 0,
    totalAttendance: 0,
    totalCertificates: 0
  });

  const [trendData, setTrendData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [catData, setCatData] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!profile?.id) return;
      try {
        setLoading(true);
        const s = await analyticsService.getOrganizerDashboardStats(profile.id);
        setStats(s);
        const t = await analyticsService.getRegistrationTrend(profile.id);
        setTrendData(t);
        const d = await analyticsService.getDepartmentDistribution(profile.id);
        setDeptData(d);
        const c = await analyticsService.getCategoryDistribution(profile.id);
        setCatData(c);
      } catch (err) {
        console.error("Analytics error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile?.id]);

  const handleExportSummary = async () => {
    toast.promise(exportService.exportAnalyticsSummary(stats, trendData), {
      loading: 'Generating comprehensive analytics Excel report...',
      success: 'Analytics summary report downloaded! 📊',
      error: 'Export failed.'
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Event Analytics & Insights</h1>
          <p className="text-muted-foreground text-sm">Comprehensive visual metrics on participation trends, branch demographics, and check-in rates</p>
        </div>
        <Button onClick={handleExportSummary} className="bg-[#007C46] text-white hover:bg-[#007C46]/90" size="sm">
          <Download className="mr-2 h-4 w-4" /> Export Analytics Report
        </Button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Registrations</CardTitle>
            <Users className="h-5 w-5 text-[#01424E] dark:text-[#7CEAAB]" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{stats.totalRegistrations}</div>
            )}
            <p className="text-xs text-[#007C46] mt-1 font-medium flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> Real-time database metrics
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">QR Attendance Rate</CardTitle>
            <QrCode className="h-5 w-5 text-[#007C46]" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">
                {stats.totalRegistrations > 0 ? `${Math.round((stats.totalAttendance / stats.totalRegistrations) * 100)}%` : '0%'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">{stats.totalAttendance} verified QR check-ins</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Certificates Issued</CardTitle>
            <Award className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{stats.totalCertificates}</div>
            )}
            <p className="text-xs text-emerald-600 mt-1 font-medium">100% Verified Credentials</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Volunteers</CardTitle>
            <Users className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{stats.totalVolunteers}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Approved event volunteers</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cumulative Registration vs Attendance Chart */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-200">Registrations vs Live Check-Ins</CardTitle>
            <CardDescription>30-day timeline showing student signup vs verified QR scans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="regGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#01424E" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#01424E" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="attGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7CEAAB" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#7CEAAB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
                    <Legend />
                    <Area type="monotone" dataKey="registrations" stroke="#01424E" fillOpacity={1} fill="url(#regGrad2)" name="Registrations" />
                    <Area type="monotone" dataKey="attendance" stroke="#41B177" fillOpacity={1} fill="url(#attGrad2)" name="QR Scans" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-10 space-y-2">
                  <BarChart3 className="h-10 w-10 mx-auto opacity-40 text-[#01424E]" />
                  <p className="text-sm font-medium">No registration trend data recorded yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown Pie Chart */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-200">Event Category Breakdown</CardTitle>
            <CardDescription>Distribution across hackathons, workshops, and contests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              {catData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={catData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="category"
                      label={({ name, value }: any) => `${name} (${value})`}
                    >
                      {catData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-10 space-y-2">
                  <Calendar className="h-10 w-10 mx-auto opacity-40 text-[#007C46]" />
                  <p className="text-sm font-medium">No category breakdown data recorded yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Bar Chart */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-200">Department Participation Volume</CardTitle>
          <CardDescription>Total participant count broken down by engineering & science branch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full flex items-center justify-center">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="count" fill="#007C46" radius={[8, 8, 0, 0]} name="Students Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-10 space-y-2">
                <Users className="h-10 w-10 mx-auto opacity-40 text-[#007C46]" />
                <p className="text-sm font-medium">No department participation data recorded yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
