'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, ClipboardList, ScanLine, Award, Clock, MapPin, Zap } from 'lucide-react';
import Link from 'next/link';
import { volunteerService } from '@/services/volunteer-service';
import { analyticsService } from '@/services/analytics-service';
import { useAuth } from '@/hooks/use-auth';
import { useDataSync } from '@/lib/data-sync';

export default function VolunteerDashboardPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const [tasksData, statsData] = await Promise.all([
        volunteerService.getAssignedTasks(profile.id),
        analyticsService.getVolunteerDashboardStats(profile.id)
      ]);
      setTasks(tasksData);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useDataSync(['volunteers', 'events', 'attendance', 'notifications'], loadData, [profile?.id]);

  const assignedEvents = stats?.assignedEvents || 0;
  const totalTasks = stats?.totalTasks || 0;
  const completedTasks = stats?.completedTasks || 0;
  const certificatesCount = stats?.certificates || 0;
  
  // Approximate hours based on completed tasks
  const hoursContributed = completedTasks * 2; 
  // Approximate checkins based on completed tasks
  const checkinsHandled = completedTasks * 15;

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-7 sm:p-9 rounded-2xl bg-gradient-to-r from-[#01424E] via-[#013540] to-[#007C46] dark:from-[#071410] dark:via-[#0a1a14] dark:to-[#0d1f16] text-white shadow-xl dark:shadow-2xl dark:shadow-emerald-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">Welcome, {profile?.full_name || 'Volunteer'} 👋</h1>
          <p className="text-[#d1f8e8] text-sm sm:text-base leading-relaxed opacity-95">
            {tasks.length > 0 
              ? `You have ${tasks.length} pending tasks assigned for your events.`
              : `You don't have any active tasks right now.`}
          </p>
        </div>
        <Button asChild size="lg" className="bg-[#7CEAAB] text-[#01424E] hover:bg-[#7CEAAB]/90 font-bold shadow-lg shrink-0 rounded-xl">
          <Link href="/volunteer/scanner" className="inline-flex items-center justify-center gap-2">
            <ScanLine className="h-5 w-5 shrink-0" />
            <span>Open QR Scanner</span>
          </Link>
        </Button>
      </div>

      {/* Metrics (Stat Cards with lowered titles & balanced padding) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned Events</span>
            <Calendar className="h-4 w-4 text-[#01424E] dark:text-[#7CEAAB]" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#01424E] dark:text-teal-200 leading-none">{assignedEvents}</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Approved Applications</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's Tasks</span>
            <ClipboardList className="h-4 w-4 text-[#007C46]" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#01424E] dark:text-teal-200 leading-none">{totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">{totalTasks - completedTasks} Pending tasks</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Check-ins Handled</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#007C46] dark:text-emerald-400 leading-none">{checkinsHandled}</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Estimated Valid Scans</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hours Contributed</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#01424E] dark:text-teal-200 leading-none">{hoursContributed} hrs</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">{certificatesCount > 0 ? `${certificatesCount} Certificates` : 'Certificate Eligible'}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions & Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="p-5 pb-1">
            <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-200">Today's Assigned Responsibilities</CardTitle>
            <CardDescription>Checklist tasks assigned by event organizer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-2">
            {tasks.length > 0 ? tasks.map((task) => {
              const isAccepted = task.status === 'accepted' || !!task.accepted_at;
              return (
                <div key={task.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-[#01424E] dark:text-teal-100">{task.title}</h4>
                      <Badge className="bg-[#edfcf6] dark:bg-emerald-900/30 text-[#007C46] dark:text-emerald-300 uppercase text-[10px]">{task.priority}</Badge>
                      {isAccepted ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                          Accepted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Assigned</Badge>
                      )}
                      {task.attendance_status === 'present' ? (
                        <Badge className="bg-emerald-600 text-white font-bold text-[10px]">Present ✅</Badge>
                      ) : task.attendance_status === 'absent' ? (
                        <Badge variant="destructive" className="font-bold text-[10px]">Absent ❌</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px]">
                          Waiting for verification
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      {task.location && <span>📍 {task.location}</span>}
                      {task.start_time && <span>⏰ {new Date(task.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0 text-xs font-semibold">
                    <Link href={`/volunteer/tasks/${task.id}`}>View Task</Link>
                  </Button>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-muted-foreground">
                No tasks assigned for today. Enjoy your day!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Volunteer Actions */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="p-5 pb-1">
            <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-200">Volunteer Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 p-5 pt-2">
            <Link
              href="/volunteer/scanner"
              className="flex flex-col items-center justify-center text-center p-4 min-h-[90px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 shadow-xs hover:shadow-md hover:border-[#7CEAAB] transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <ScanLine className="h-5 w-5 text-[#01424E] dark:text-[#7CEAAB]" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">QR Scanner</span>
            </Link>

            <Link
              href="/volunteer/tasks"
              className="flex flex-col items-center justify-center text-center p-4 min-h-[90px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 shadow-xs hover:shadow-md hover:border-[#7CEAAB] transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <ClipboardList className="h-5 w-5 text-[#007C46]" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">My Tasks</span>
            </Link>

            <Link
              href="/volunteer/attendance"
              className="flex flex-col items-center justify-center text-center p-4 min-h-[90px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 shadow-xs hover:shadow-md hover:border-[#7CEAAB] transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">Check-in Log</span>
            </Link>

            <Link
              href="/volunteer/certificates"
              className="flex flex-col items-center justify-center text-center p-4 min-h-[90px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 shadow-xs hover:shadow-md hover:border-[#7CEAAB] transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">Certificates</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
