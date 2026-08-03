'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { analyticsService } from '@/services/analytics-service';
import { registrationService } from '@/services/registration-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardCardsSkeleton } from '@/components/ui/page-skeleton';
import { CalendarDays, CheckCircle2, Award, Clock, ArrowRight, Activity, Users, Ticket } from 'lucide-react';
import { format } from 'date-fns';

export default function StudentDashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!profile?.id) return;
      
      try {
        setLoading(true);
        const [statsData, eventsData] = await Promise.all([
          analyticsService.getStudentDashboardStats(profile.id),
          registrationService.getUserRegistrations(profile.id)
        ]);
        
        setStats(statsData);
        const upcoming = (eventsData || [])
          .filter((reg: any) => new Date(reg.events?.start_date || new Date()) >= new Date() && reg.status === 'approved')
          .sort((a: any, b: any) => new Date(a.event?.start_date).getTime() - new Date(b.event?.start_date).getTime())
          .slice(0, 3);
          
        setUpcomingEvents(upcoming);
      } catch (error) {
        console.error('Error loading dashboard data', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [profile]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
            {greeting()}, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Ready for your next campus hackathon, workshop, or event?
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="h-10 px-4 rounded-xl bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#7CEAAB]/20 hover:border-[#7CEAAB]/50 shrink-0"
        >
          <Link href="/student/events" className="inline-flex items-center justify-center gap-2 h-full w-full">
            <CalendarDays className="h-4 w-4 shrink-0 text-[#7CEAAB]" />
            <span>Explore Campus Events</span>
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <DashboardCardsSkeleton />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Upcoming Events</p>
                <p className="text-2xl font-extrabold text-[#01424E] dark:text-teal-100 mt-1">
                  {stats?.upcoming_events_count ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#edfcf6] dark:bg-teal-950/40 text-[#007C46]">
                <CalendarDays className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completed Events</p>
                <p className="text-2xl font-extrabold text-[#01424E] dark:text-teal-100 mt-1">
                  {stats?.completed_events_count ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Certificates</p>
                <p className="text-2xl font-extrabold text-[#01424E] dark:text-teal-100 mt-1">
                  {stats?.certificates_count ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                <Award className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pending Passes</p>
                <p className="text-2xl font-extrabold text-[#01424E] dark:text-teal-100 mt-1">
                  {stats?.pending_registrations_count ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions (Redesigned) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#01424E] dark:text-teal-100">Quick Portal Shortcuts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Jump directly to your most used student modules</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          <QuickActionLink
            href="/student/events"
            icon={<CalendarDays className="h-6 w-6" />}
            label="Browse Events"
            description="Explore available campus events & hackathons"
          />
          <QuickActionLink
            href="/student/registrations"
            icon={<Ticket className="h-6 w-6" />}
            label="My Passes"
            description="View your tickets & QR attendance passes"
          />
          <QuickActionLink
            href="/student/teams"
            icon={<Users className="h-6 w-6" />}
            label="My Teams"
            description="Manage team formations & member invites"
          />
          <QuickActionLink
            href="/student/certificates"
            icon={<Award className="h-6 w-6" />}
            label="Certificates"
            description="Download & verify your earned awards"
          />
        </div>
      </div>

      {/* Grid Layout: Upcoming Events + Activity */}
      <div className="grid gap-8 md:grid-cols-3">
        {/* Upcoming Events */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#01424E] dark:text-teal-100">Your Upcoming Registered Events</h2>
            <Button asChild variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-xs font-bold text-[#007C46] hover:bg-[#edfcf6] dark:hover:bg-teal-950/40 cursor-pointer">
              <Link href="/student/registrations" className="inline-flex items-center gap-1">
                <span>View all passes</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((reg) => (
                <Card key={reg.id} className="hover:shadow-md transition-all border-slate-200 dark:border-slate-800">
                  <CardHeader className="p-4 flex flex-row items-center space-y-0 gap-4">
                    <div className="h-12 w-12 rounded-xl bg-[#edfcf6] dark:bg-teal-950/60 flex flex-col items-center justify-center text-[#007C46] font-bold text-center leading-none shrink-0 shadow-inner">
                      <span className="text-[10px] uppercase">{format(new Date(reg.events?.start_date || new Date()), 'MMM')}</span>
                      <span className="text-base font-extrabold">{format(new Date(reg.events?.start_date || new Date()), 'dd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-100 truncate">{reg.events?.title}</CardTitle>
                      <CardDescription className="text-xs truncate">{reg.events?.venue || 'Main Campus Auditorium'}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex h-8 px-3 rounded-lg text-xs font-bold border-slate-200 dark:border-slate-800 hover:border-[#01424E] hover:text-[#01424E] cursor-pointer">
                      <Link href={`/student/registrations/${reg.id}`}>View Pass</Link>
                    </Button>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming registered events"
              description="Explore live campus hackathons and workshops to get your entry pass!"
              actionLabel="Find Events to Join"
              actionHref="/student/events"
            />
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#01424E] dark:text-teal-100">Live Activity Feed</h2>
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-xs text-[#01424E] dark:text-teal-100">No Recent Activity</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Your recent check-in scans and certificates will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickActionLink({
  href,
  icon,
  label,
  description
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group hover:border-[#7CEAAB] overflow-hidden">
      <Button
        asChild
        variant="ghost"
        className="w-full h-full p-5 flex flex-col items-start justify-between text-left gap-4 rounded-2xl cursor-pointer hover:bg-transparent"
      >
        <Link href={href} className="w-full flex flex-col items-start justify-between h-full gap-4">
          <div className="p-3 rounded-2xl bg-[#edfcf6] dark:bg-teal-950/40 text-[#007C46] group-hover:bg-[#007C46] group-hover:text-white transition-colors duration-200 shrink-0">
            {icon}
          </div>
          <div className="space-y-1">
            <span className="font-bold text-sm text-[#01424E] dark:text-teal-100 block">{label}</span>
            <span className="text-xs text-muted-foreground leading-relaxed block font-normal">{description}</span>
          </div>
        </Link>
      </Button>
    </Card>
  );
}
