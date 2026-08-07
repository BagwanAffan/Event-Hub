'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Users, Award, QrCode, ArrowLeft, Edit2, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { eventService } from '@/services/event-service';
import { useDataSync } from '@/lib/data-sync';
import { toast } from 'sonner';

export default function OrganizerEventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadEventData = useCallback(async () => {
    try {
      if (!event) setLoading(true);
      const data = await eventService.getEventById(id);
      setEvent(data);
      const s = await eventService.getEventStats(id);
      setStats(s);
    } catch (err) {
      console.error('Error loading event detail:', err);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useDataSync(['events', 'registrations', 'volunteers', 'attendance', 'certificates'], loadEventData, [id]);

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse pb-12">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-[#01424E] dark:text-teal-100">Event Not Found</h2>
        <p className="text-sm text-muted-foreground">The event you are looking for does not exist or was removed.</p>
        <Button asChild variant="outline" className="rounded-lg">
          <Link href="/organizer/events"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Top Action Bar: Back Button & Published Badge */}
      <div className="flex items-center justify-between gap-4 w-full">
        <Button asChild variant="outline" size="sm" className="h-9 px-3.5 rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs sm:text-sm transition-colors shadow-2xs">
          <Link href="/organizer/events" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events</span>
          </Link>
        </Button>
        <Badge className={`capitalize text-xs font-semibold px-3 py-1 rounded-full shadow-2xs ${
          event.status === 'published' ? 'bg-[#007C46] text-white dark:bg-[#007C46] dark:text-white' : 'bg-amber-500 text-white'
        }`}>
          {event.status}
        </Badge>
      </div>

      {/* Hero Banner Card */}
      <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md bg-card">
        <div className="bg-gradient-to-r from-[#01424E] via-[#013540] to-[#007C46] text-white px-6 sm:px-8 md:px-10 py-7 sm:py-9 space-y-3 sm:space-y-4">
          {event.category && (
            <Badge className="bg-[#7CEAAB] text-[#01424E] dark:bg-[#7CEAAB] dark:text-[#01424E] font-bold text-[11px] uppercase tracking-wider px-3 py-0.5 rounded-full w-fit shadow-2xs">
              {event.category}
            </Badge>
          )}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {event.title}
          </h1>
          {event.short_description && (
            <p className="text-[#d1f8e8] dark:text-[#d1f8e8] text-xs sm:text-sm md:text-base leading-relaxed max-w-3xl font-normal opacity-95">
              {event.short_description}
            </p>
          )}
        </div>

        {/* Banner Metadata Row */}
        <div className="px-6 sm:px-8 md:px-10 py-5 sm:py-6 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {/* Venue */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-[#007C46]/10 dark:bg-teal-400/10 text-[#007C46] dark:text-[#7CEAAB] flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Venue</p>
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {event.venue || 'Main Campus'}{event.building ? `, ${event.building}` : ''}
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-[#007C46]/10 dark:bg-teal-400/10 text-[#007C46] dark:text-[#7CEAAB] flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Start Date</p>
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {new Date(event.start_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            {/* Fee */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-[#007C46]/10 dark:bg-teal-400/10 text-[#007C46] dark:text-[#7CEAAB] flex items-center justify-center shrink-0 font-bold text-sm">
                ₹
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Registration Fee</p>
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {event.registration_fee > 0 ? `₹${event.registration_fee}` : 'Free'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Live Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
        <Card className="border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Registrations</CardTitle>
            <div className="p-2 rounded-xl bg-[#01424E]/10 dark:bg-teal-400/10 text-[#01424E] dark:text-[#7CEAAB]">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#01424E] dark:text-teal-100">{stats?.totalRegistrations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Cap: {event.max_participants || 100} students</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">QR Attendance</CardTitle>
            <div className="p-2 rounded-xl bg-[#007C46]/10 dark:bg-emerald-400/10 text-[#007C46] dark:text-emerald-400">
              <QrCode className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#01424E] dark:text-teal-100">{stats?.totalAttendance || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Verified check-ins</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Volunteers</CardTitle>
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#01424E] dark:text-teal-100">{stats?.totalVolunteers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Approved event crew</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Certificates</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400">
              <Award className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#01424E] dark:text-teal-100">{stats?.totalCertificates || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Issued credentials</p>
          </CardContent>
        </Card>
      </div>

      {/* Description & Agenda */}
      <Card className="border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs w-full">
        <CardHeader className="p-6 sm:px-8 sm:pt-8 pb-3">
          <CardTitle className="text-lg font-bold tracking-tight text-[#01424E] dark:text-teal-100">
            Event Description & Agenda
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <p className="whitespace-pre-line">{event.description}</p>
        </CardContent>
      </Card>

      {/* Volunteer Requirements Section */}
      {event.need_volunteers && (
        <Card className="border-slate-200 dark:border-slate-800 bg-[#edfcf6]/40 dark:bg-teal-950/20 rounded-2xl shadow-2xs w-full">
          <CardHeader className="p-6 sm:px-8 sm:pt-8 pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-[#007C46] dark:text-emerald-400" />
                <span>Volunteer Requirements</span>
              </CardTitle>
              <Badge className="bg-[#007C46] text-white font-semibold text-xs px-3 py-1 rounded-full">
                {event.volunteers_needed || 0} Slots Needed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8 space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#007C46] dark:text-emerald-400 shrink-0" />
              <span><strong>Reporting Location:</strong> {event.reporting_location || event.venue || 'Main Venue'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#007C46] dark:text-emerald-400 shrink-0" />
              <span><strong>Reporting Time:</strong> {event.reporting_time ? new Date(event.reporting_time).toLocaleString() : 'TBA'}</span>
            </div>
            {event.shift_start_time && event.shift_end_time && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#007C46] dark:text-emerald-400 shrink-0" />
                <span><strong>Shift Schedule:</strong> {new Date(event.shift_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.shift_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {event.volunteer_roles && event.volunteer_roles.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <strong>Roles Needed:</strong>
                {event.volunteer_roles.map((r: string) => (
                  <Badge key={r} variant="outline" className="border-[#41B177]/60 text-[#007C46] dark:text-emerald-400 dark:border-emerald-500/40 rounded-md">
                    {r}
                  </Badge>
                ))}
              </div>
            )}
            {event.volunteer_instructions && (
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <strong>Instructions:</strong> {event.volunteer_instructions}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

