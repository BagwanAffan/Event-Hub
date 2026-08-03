'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, ClipboardList, ScanLine, Award, Clock, MapPin, Zap } from 'lucide-react';
import Link from 'next/link';
import { volunteerService } from '@/services/volunteer-service';
import { analyticsService } from '@/services/analytics-service';

export default function VolunteerDashboardPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, [profile?.id]);

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
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#01424E] via-[#013540] to-[#007C46] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-[#7CEAAB] text-[#01424E] font-bold">Volunteer Workspace</Badge>
            {tasks.length > 0 && <span className="text-xs text-white/80">Shift Active</span>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {profile?.full_name || 'Volunteer'} 👋</h1>
          <p className="text-[#d1f8e8] text-sm mt-1 max-w-xl">
            {tasks.length > 0 
              ? `You have ${tasks.length} pending tasks assigned for your events.`
              : `You don't have any active tasks right now.`}
          </p>
        </div>
        <Button asChild size="lg" className="bg-[#7CEAAB] text-[#01424E] hover:bg-[#7CEAAB]/90 font-bold shadow-lg shrink-0">
          <Link href="/volunteer/scanner">
            <ScanLine className="mr-2 h-5 w-5" /> Open QR Scanner
          </Link>
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Assigned Events</CardTitle>
            <Calendar className="h-4 w-4 text-[#01424E] dark:text-[#7CEAAB]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{assignedEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved Applications</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Today's Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-[#007C46]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalTasks - completedTasks} Pending tasks</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Check-ins Handled</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#007C46]">{checkinsHandled}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated Valid Scans</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Hours Contributed</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{hoursContributed} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">{certificatesCount > 0 ? `${certificatesCount} Certificates` : 'Certificate Eligible'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-200">Today's Assigned Responsibilities</CardTitle>
            <CardDescription>Checklist tasks assigned by event organizer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.length > 0 ? tasks.map((task) => {
              const isAccepted = task.status === 'accepted' || !!task.accepted_at;
              return (
                <div key={task.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-[#01424E] dark:text-teal-100">{task.title}</h4>
                      <Badge className="bg-[#edfcf6] text-[#007C46] uppercase text-[10px]">{task.priority}</Badge>
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

        {/* Quick Shortcuts */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-200">Volunteer Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="h-20 flex-col gap-1 border-slate-200 hover:border-[#7CEAAB]">
              <Link href="/volunteer/scanner">
                <ScanLine className="h-5 w-5 text-[#01424E] dark:text-[#7CEAAB]" />
                <span className="text-xs font-bold">QR Scanner</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-20 flex-col gap-1 border-slate-200 hover:border-[#7CEAAB]">
              <Link href="/volunteer/tasks">
                <ClipboardList className="h-5 w-5 text-[#007C46]" />
                <span className="text-xs font-bold">My Tasks</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-20 flex-col gap-1 border-slate-200 hover:border-[#7CEAAB]">
              <Link href="/volunteer/attendance">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-bold">Check-in Log</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-20 flex-col gap-1 border-slate-200 hover:border-[#7CEAAB]">
              <Link href="/volunteer/certificates">
                <Award className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold">Certificates</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
