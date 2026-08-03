'use client';

import { use, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Users, Award, QrCode, ArrowLeft, Edit2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { eventService } from '@/services/event-service';
import { toast } from 'sonner';

export default function OrganizerEventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEventData() {
      try {
        setLoading(true);
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
    }
    loadEventData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-[#01424E]">Event Not Found</h2>
        <p className="text-sm text-muted-foreground">The event you are looking for does not exist or was removed.</p>
        <Button asChild><Link href="/organizer/events"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Events</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/organizer/events"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Events</Link>
        </Button>
        <Badge className={`capitalize text-xs font-bold px-3 py-1 ${
          event.status === 'published' ? 'bg-[#007C46] text-white' : 'bg-amber-500 text-white'
        }`}>
          {event.status}
        </Badge>
      </div>

      {/* Banner / Header Card */}
      <Card className="border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#01424E] to-[#007C46] text-white p-8">
          <Badge className="bg-[#7CEAAB] text-[#01424E] capitalize w-fit mb-2">{event.category}</Badge>
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <p className="text-[#d1f8e8] text-sm mt-1 max-w-2xl">{event.short_description}</p>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-slate-900 border-t">
          <div>📍 <strong>Venue:</strong> {event.venue || 'Main Campus'}, {event.building}</div>
          <div>🗓 <strong>Start Date:</strong> {new Date(event.start_date).toLocaleString()}</div>
          <div>💰 <strong>Fee:</strong> {event.registration_fee > 0 ? `₹${event.registration_fee}` : 'Free'}</div>
        </CardContent>
      </Card>

      {/* Event Live Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Registrations</CardTitle>
            <Users className="h-5 w-5 text-[#01424E]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{stats?.totalRegistrations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Cap: {event.max_participants || 100} students</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">QR Attendance</CardTitle>
            <QrCode className="h-5 w-5 text-[#007C46]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{stats?.totalAttendance || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Verified check-ins</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Volunteers</CardTitle>
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{stats?.totalVolunteers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved event crew</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Certificates</CardTitle>
            <Award className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#01424E] dark:text-teal-200">{stats?.totalCertificates || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Issued credentials</p>
          </CardContent>
        </Card>
      </div>

      {/* Description & Rules */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#01424E]">Event Description & Agenda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <p className="whitespace-pre-line">{event.description}</p>
        </CardContent>
      </Card>

      {/* Volunteer Requirements Section */}
      {event.need_volunteers && (
        <Card className="border-slate-200 dark:border-slate-800 bg-[#edfcf6]/30 dark:bg-teal-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#007C46]" /> Volunteer Requirements
              </CardTitle>
              <Badge className="bg-[#007C46] text-white font-bold">{event.volunteers_needed || 0} Slots Needed</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>📍 <strong>Reporting Location:</strong> {event.reporting_location || event.venue || 'Main Venue'}</div>
            <div>⏰ <strong>Reporting Time:</strong> {event.reporting_time ? new Date(event.reporting_time).toLocaleString() : 'TBA'}</div>
            {event.shift_start_time && event.shift_end_time && (
              <div>🕒 <strong>Shift Schedule:</strong> {new Date(event.shift_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.shift_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            )}
            {event.volunteer_roles && event.volunteer_roles.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <strong>Roles Needed:</strong>
                {event.volunteer_roles.map((r: string) => (
                  <Badge key={r} variant="outline" className="border-[#41B177] text-[#007C46]">{r}</Badge>
                ))}
              </div>
            )}
            {event.volunteer_instructions && (
              <div className="pt-2 border-t text-slate-600 dark:text-slate-400">
                <strong>Instructions:</strong> {event.volunteer_instructions}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
