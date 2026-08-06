'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, Users, Calendar, IndianRupee, CheckCircle, FileText, 
  BarChart3, Sparkles, Plus, ArrowUpRight, Clock, QrCode, Award, ShieldCheck, Download
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import Link from 'next/link';
import { analyticsService } from '@/services/analytics-service';
import { eventService } from '@/services/event-service';
import { registrationService } from '@/services/registration-service';
import { exportService } from '@/services/export-service';
import { DepartmentParticipationChart } from '@/components/shared/department-participation-chart';
import { useDataSync } from '@/lib/data-sync';
import { toast } from 'sonner';

export default function OrganizerDashboard() {
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
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const loadDashboard = useCallback(async () => {
    if (!profile?.id) return;
    try {
      if (stats.totalEvents === 0) setLoading(true);
      const s = await analyticsService.getOrganizerDashboardStats(profile.id);
      setStats(s);
      const t = await analyticsService.getRegistrationTrend(profile.id);
      setTrendData(t);
      const d = await analyticsService.getDepartmentDistribution(profile.id);
      setDeptData(d);
      const evts = await eventService.getEvents({ created_by: profile.id, limit: 3 });
      setUpcomingEvents(evts.data);
    } catch (err) {
      console.error("Dashboard data error:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useDataSync(['events', 'registrations', 'volunteers', 'attendance', 'certificates', 'payments'], loadDashboard, [profile?.id]);

  const handleExportFullReport = async () => {
    toast.promise(exportService.exportAnalyticsSummary(stats, trendData), {
      loading: 'Generating Excel analytics summary report...',
      success: 'Excel report downloaded successfully! 📊',
      error: 'Failed to generate report.'
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-7 sm:p-9 rounded-2xl bg-gradient-to-r from-[#01424E] via-[#013540] to-[#007C46] dark:from-[#030d08] dark:via-[#012a16] dark:to-[#01391e] text-white shadow-xl dark:shadow-2xl dark:shadow-emerald-950/30 dark:border dark:border-emerald-900/30">
        {/* Premium SaaS mesh background — Dark mode only */}
        <div className="absolute inset-0 hidden dark:block pointer-events-none" aria-hidden="true">
          {/* Radial green glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_65%_55%,rgba(0,124,70,0.12),transparent)]" />
          {/* Dotted wave mesh + accent line */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Primary wave mesh */}
            <g stroke="rgba(124,234,171,0.13)" strokeWidth="0.7" strokeDasharray="2 8">
              <path d="M300,-10 C400,30 520,120 600,185 S740,290 800,330" />
              <path d="M280,15 C380,55 500,145 580,210 S720,310 800,350" />
              <path d="M320,-35 C420,5 540,95 620,160 S760,270 800,310" />
              <path d="M260,40 C360,80 480,170 560,235 S700,330 800,370" />
              <path d="M340,-60 C440,-20 560,70 640,135 S780,250 800,290" />
              <path d="M240,65 C340,105 460,195 540,260 S680,350 800,385" />
              <path d="M360,-85 C460,-45 580,45 660,110 S790,230 800,270" />
              <path d="M220,90 C320,130 440,220 520,285 S660,370 800,400" />
              <path d="M380,-110 C480,-70 600,20 680,85 S795,210 800,250" />
              <path d="M200,115 C300,155 420,245 500,310 S640,385 800,410" />
            </g>
            {/* Cross-wave mesh */}
            <g stroke="rgba(124,234,171,0.08)" strokeWidth="0.5" strokeDasharray="1.5 10">
              <path d="M350,400 C400,300 500,200 600,145 S730,75 800,35" />
              <path d="M380,400 C425,310 520,215 615,165 S740,100 800,65" />
              <path d="M320,400 C370,290 475,185 585,125 S720,50 800,5" />
              <path d="M410,400 C450,320 540,235 635,185 S750,125 800,95" />
              <path d="M290,400 C340,275 455,165 565,105 S710,25 800,-25" />
              <path d="M440,400 C475,335 555,255 650,205 S760,150 800,125" />
              <path d="M260,400 C310,265 430,145 545,85 S700,0 800,-55" />
              <path d="M470,400 C500,345 575,275 665,225 S770,175 800,155" />
            </g>
            {/* Glowing accent line */}
            <path d="M180,395 C320,325 460,210 570,150 S720,70 800,40" stroke="rgba(74,222,128,0.15)" strokeWidth="6" strokeLinecap="round" />
            <path d="M180,395 C320,325 460,210 570,150 S720,70 800,40" stroke="#4ade80" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
          </svg>
        </div>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
            Welcome back, {profile?.full_name || 'Organizer'} 👋
          </h1>
          <p className="text-[#d1f8e8] text-sm sm:text-base leading-relaxed opacity-95">
            Manage events, verify payments, track QR attendance live, allocate volunteers, and generate digital certificates.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-3.5 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
          <Button asChild className="h-11 px-5 rounded-xl text-xs sm:text-sm font-bold bg-[#7CEAAB] text-[#01424E] hover:bg-[#7CEAAB]/90 shadow-md cursor-pointer shrink-0">
            <Link href="/organizer/events/create" className="inline-flex items-center justify-center gap-2 h-full w-full">
              <Plus className="h-4 w-4 shrink-0" />
              <span>Create Event</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 px-5 rounded-xl text-xs sm:text-sm font-bold bg-white/10 text-white border-white/20 hover:bg-white/20 shadow-md cursor-pointer shrink-0">
            <Link href="/organizer/ai" className="inline-flex items-center justify-center gap-2 h-full w-full">
              <Sparkles className="h-4 w-4 text-[#7CEAAB] shrink-0" />
              <span>AI Copilot</span>
            </Link>
          </Button>
          <Button onClick={handleExportFullReport} variant="outline" className="h-11 px-5 rounded-xl text-xs sm:text-sm font-bold bg-white/10 text-white border-white/20 hover:bg-white/20 shadow-md cursor-pointer shrink-0 inline-flex items-center justify-center gap-2">
            <Download className="h-4 w-4 shrink-0" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* Quick Statistics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Events</CardTitle>
            <div className="p-2 rounded-xl bg-teal-100/90 text-[#01424E]">
              <Calendar className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-300">{stats.totalEvents}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-[#007C46] font-semibold">{stats.activeEvents} Active</span> right now
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registrations</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-100/90 text-[#007C46]">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-300">{stats.totalRegistrations}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-amber-600 dark:text-amber-400 font-medium">{stats.pendingRegistrations} Pending Verification</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Attendance</CardTitle>
            <div className="p-2 rounded-xl bg-teal-100/90 text-[#01424E]">
              <QrCode className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-300">{stats.totalAttendance}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-[#007C46] font-semibold">{stats.totalRegistrations > 0 ? `${Math.round((stats.totalAttendance / stats.totalRegistrations) * 100)}%` : '0%'} Attendance Rate</span> via QR
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Volunteers</CardTitle>
            <div className="p-2 rounded-xl bg-purple-100/90 text-purple-700">
              <Activity className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-300">{stats.totalVolunteers}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Approved event volunteers</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Bar */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-[#01424E] dark:text-teal-200">Organizer Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full items-stretch">
          <Link
            href="/organizer/events"
            className="flex flex-col items-center justify-center text-center p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card hover:border-[#7CEAAB] hover:bg-[#edfcf6]/60 dark:hover:bg-teal-950/40 shadow-xs hover:shadow-md transition-all duration-200 group cursor-pointer w-full h-full min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-full bg-teal-100/90 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-[#01424E] shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Manage Events</span>
          </Link>

          <Link
            href="/organizer/registrations"
            className="flex flex-col items-center justify-center text-center p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card hover:border-[#7CEAAB] hover:bg-[#edfcf6]/60 dark:hover:bg-teal-950/40 shadow-xs hover:shadow-md transition-all duration-200 group cursor-pointer w-full h-full min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100/90 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-[#007C46] shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Registrations</span>
          </Link>

          <Link
            href="/organizer/payments"
            className="flex flex-col items-center justify-center text-center p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card hover:border-[#7CEAAB] hover:bg-[#edfcf6]/60 dark:hover:bg-teal-950/40 shadow-xs hover:shadow-md transition-all duration-200 group cursor-pointer w-full h-full min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100/90 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-amber-700 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Verify Payments</span>
          </Link>

          <Link
            href="/organizer/volunteers"
            className="flex flex-col items-center justify-center text-center p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card hover:border-[#7CEAAB] hover:bg-[#edfcf6]/60 dark:hover:bg-teal-950/40 shadow-xs hover:shadow-md transition-all duration-200 group cursor-pointer w-full h-full min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-full bg-purple-100/90 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-purple-700 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Volunteers ({stats.totalVolunteers})</span>
          </Link>

          <Link
            href="/organizer/certificates"
            className="flex flex-col items-center justify-center text-center p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card hover:border-[#7CEAAB] hover:bg-[#edfcf6]/60 dark:hover:bg-teal-950/40 shadow-xs hover:shadow-md transition-all duration-200 group cursor-pointer w-full h-full min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100/90 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-emerald-700 shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Certificates</span>
          </Link>

          <Link
            href="/organizer/analytics"
            className="flex flex-col items-center justify-center text-center p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card hover:border-[#7CEAAB] hover:bg-[#edfcf6]/60 dark:hover:bg-teal-950/40 shadow-xs hover:shadow-md transition-all duration-200 group cursor-pointer w-full h-full min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-full bg-cyan-100/90 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-blue-700 shrink-0">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Analytics</span>
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-200">Registration Trend</CardTitle>
                <CardDescription>Daily registration accumulation over time</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">30 Days</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full flex items-center justify-center">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#01424E" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#01424E" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7CEAAB" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#7CEAAB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
                    <Legend />
                    <Area type="monotone" dataKey="registrations" stroke="#01424E" fillOpacity={1} fill="url(#regGrad)" name="Registrations" />
                    <Area type="monotone" dataKey="attendance" stroke="#41B177" fillOpacity={1} fill="url(#attGrad)" name="QR Attendance" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-10 space-y-2">
                  <BarChart3 className="h-10 w-10 mx-auto opacity-40 text-[#01424E]" />
                  <p className="text-sm font-medium">No registration trend data recorded yet</p>
                  <p className="text-xs">Data will appear once students register for your events</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-200">Department Participation</CardTitle>
                <CardDescription>Breakdown by student academic branch</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">All Events</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <DepartmentParticipationChart data={deptData} height={280} />
          </CardContent>
        </Card>
      </div>

      {/* Active Events Overview */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-200">Active & Upcoming Events</CardTitle>
            <CardDescription>Monitor status, registrations, and live check-in progress</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/organizer/events">View All ({stats.totalEvents})</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((evt) => (
                <div key={evt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 gap-4 hover:border-[#7CEAAB] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-800">
                      <img
                        src={evt.banner_url || evt.poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=300'}
                        alt={evt.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=300';
                        }}
                        className="w-full h-full object-cover object-center block"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#01424E] dark:text-teal-100">{evt.title}</h4>
                        <Badge className="bg-[#edfcf6] dark:bg-emerald-900/30 text-[#007C46] dark:text-emerald-300 border-[#41B177] dark:border-emerald-700 capitalize">{evt.status?.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                        <span>📍 {evt.venue || 'Main Campus'}</span>
                        <span>🗓 {new Date(evt.start_date).toLocaleDateString()}</span>
                        <span>💰 {evt.registration_fee > 0 ? `₹${evt.registration_fee}` : 'Free'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/organizer/events/${evt.id}`}>Dashboard</Link>
                    </Button>
                    <Button asChild size="sm" className="bg-[#01424E] text-white hover:bg-[#013540]">
                      <Link href="/organizer/registrations">Registrations</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No active or upcoming events created yet</p>
              <Button asChild size="sm" className="bg-[#007C46] text-white">
                <Link href="/organizer/events/create"><Plus className="mr-2 h-4 w-4" /> Create Your First Event</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
