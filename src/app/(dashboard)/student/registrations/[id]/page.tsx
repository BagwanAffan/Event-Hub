'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registrationService } from '@/services/registration-service';
import { attendanceService, calculateDuration } from '@/services/attendance-service';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CalendarDays, MapPin, Clock, CheckCircle2, AlertCircle, Ticket, Download, Trash2, ShieldCheck, FileText, QrCode, LogOut, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Attendance } from '@/types/database.types';

export default function RegistrationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [registration, setRegistration] = useState<any>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchAttendanceState = async (regId: string) => {
    const att = await attendanceService.getAttendanceForRegistration(regId);
    setAttendance(att);
    return att;
  };

  const loadData = async () => {
    try {
      if (!registration) setLoading(true);
      const data = await registrationService.getRegistrationById(resolvedParams.id);
      if (!data) {
        toast.error('Registration not found');
        router.push('/student/registrations');
        return;
      }
      setRegistration(data);
      await fetchAttendanceState(data.id);
    } catch (error) {
      console.error('Error fetching registration:', error);
      toast.error('Failed to load registration details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 1. Supabase Realtime subscription on attendance table
    const supabase = createClient();
    const channel = supabase
      .channel(`attendance-live-${resolvedParams.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `registration_id=eq.${resolvedParams.id}`,
        },
        async () => {
          await fetchAttendanceState(resolvedParams.id);
        }
      )
      .subscribe();

    // 2. Fallback polling every 15 seconds to guarantee freshness
    const interval = setInterval(async () => {
      if (resolvedParams.id) {
        await fetchAttendanceState(resolvedParams.id);
      }
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [resolvedParams.id, router]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    
    try {
      setCancelling(true);
      await registrationService.cancelRegistration(registration.id);
      toast.success('Registration cancelled successfully');
      setRegistration({ ...registration, status: 'cancelled' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel registration');
    } finally {
      setCancelling(false);
    }
  };

  const downloadQR = () => {
    const qrUrl = isPendingCheckout
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent('CHECKOUT:' + (registration.qr_token || registration.id))}&color=007C46`
      : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registration.qr_token || registration.id)}&color=01424E`;

    let downloadLink = document.createElement('a');
    downloadLink.href = qrUrl;
    downloadLink.target = '_blank';
    downloadLink.download = `${registration.events?.title?.replace(/\s+/g, '_') || 'Registration'}_Pass.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!registration) return null;

  const event = registration.events;
  const isApproved = registration.status === 'approved' || registration.status === 'completed';
  const isPending = registration.status === 'pending_payment' || registration.status === 'payment_under_review';
  const isCancelled = registration.status === 'cancelled';
  const requiresPayment = (event.registration_fee || 0) > 0;
  const paymentCompleted = registration.payment_status === 'approved';
  const isUnderReview = registration.payment_status === 'under_review' || registration.status === 'payment_under_review' || registration.payment_status === 'submitted';
  const paymentPending = (registration.payment_status === 'pending' || !registration.payment_status) && !isUnderReview && !paymentCompleted && registration.status !== 'payment_under_review';

  // Attendance states based directly on attendance table in Supabase
  const isCheckedOut = attendance?.attendance_status === 'present' || !!attendance?.check_out_time;
  const isPendingCheckout = !isCheckedOut && (attendance?.attendance_status === 'pending_checkout' || !!attendance?.check_in_time);
  const isNotCheckedIn = !attendance;

  // Status timeline steps
  const steps = [
    { title: 'Registered', active: true, icon: <FileText className="h-5 w-5" /> },
    { title: 'Payment', active: !requiresPayment || paymentCompleted || registration.payment_status === 'under_review', icon: <Ticket className="h-5 w-5" /> },
    { title: 'Verification', active: isApproved || isCancelled, icon: <ShieldCheck className="h-5 w-5" /> },
    { title: 'Pass Generated', active: isApproved, icon: <CheckCircle2 className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-6 pb-12 fade-in">
      <Button variant="ghost" className="pl-0 text-muted-foreground" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Registrations
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-white">
            Registration Details
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ID: {registration.id}
          </p>
        </div>
        
        {isPending && (
          <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
            <Trash2 className="h-4 w-4 mr-2" />
            {cancelling ? 'Cancelling...' : 'Cancel Registration'}
          </Button>
        )}
      </div>

      {/* Timeline Status */}
      <Card className="bg-slate-50 dark:bg-slate-900/50 border-0 shadow-sm mb-6 hidden md:block">
        <CardContent className="p-6">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 z-0"></div>
            {steps.map((step, index) => (
              <div key={index} className="relative z-10 flex flex-col items-center">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-2 border-4 border-slate-50 dark:border-slate-900 transition-colors",
                  step.active 
                    ? "bg-[#41B177] text-white" 
                    : isCancelled && index >= 2
                      ? "bg-red-500 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                )}>
                  {isCancelled && index === 2 ? <AlertCircle className="h-5 w-5" /> : step.icon}
                </div>
                <span className={cn(
                  "text-xs font-semibold px-2 py-1 rounded",
                  step.active ? "text-[#01424E] dark:text-white" : "text-muted-foreground"
                )}>
                  {isCancelled && index === 2 ? 'Cancelled' : step.title}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 uppercase">{registration.registration_type} REGISTRATION</Badge>
                  <CardTitle className="text-2xl text-[#01424E] dark:text-white">{event.title}</CardTitle>
                </div>
                <Badge className={cn(
                  "px-3 py-1 text-sm font-medium capitalize",
                  isApproved ? "bg-[#41B177] hover:bg-[#007C46]" : 
                  isCancelled ? "bg-slate-500 hover:bg-slate-600" : 
                  "bg-orange-500 hover:bg-orange-600"
                )}>
                  {registration.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                      <p className="font-semibold">{event.start_date ? format(new Date(event.start_date), 'MMMM dd, yyyy') : 'TBA'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Time</p>
                      <p className="font-semibold">{event.start_date ? format(new Date(event.start_date), 'hh:mm a') : 'TBA'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Venue</p>
                      <p className="font-semibold">{event.venue}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Payment Summary</h4>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Registration Fee</span>
                      <span className="font-medium">{event.registration_fee === 0 ? 'Free' : `₹${event.registration_fee}`}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Status</span>
                      <Badge variant="outline" className={cn(
                        "capitalize",
                        paymentCompleted ? "text-green-600 border-green-600" : 
                        requiresPayment ? "text-orange-500 border-orange-500" : "text-slate-500"
                      )}>
                        {event.registration_fee === 0 ? 'FREE' : registration.payment_status || 'PENDING'}
                      </Badge>
                    </div>
                  </div>
                  
                  {requiresPayment && paymentPending && !isCancelled && (
                    <Button asChild className="w-full bg-[#01424E] hover:bg-[#007C46]">
                      <Link href={`/student/payment/${registration.id}`}>
                        Complete Payment
                      </Link>
                    </Button>
                  )}
                  {requiresPayment && isUnderReview && !isCancelled && (
                    <div className="text-sm text-center text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                      Payment under review. We will notify you once verified.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Pass / Attendance Lifecycle Sidebar */}
        <div>
          <Card className={cn(
            "h-full overflow-hidden border-2 transition-colors",
            isCheckedOut 
              ? "border-[#007C46] shadow-lg shadow-[#007C46]/10" 
              : isPendingCheckout
                ? "border-amber-500 shadow-lg shadow-amber-500/10"
                : isApproved
                  ? "border-[#41B177] shadow-lg shadow-[#41B177]/10" 
                  : "border-slate-200 dark:border-slate-800"
          )}>
            <div className={cn(
              "p-4 text-center text-white font-bold",
              isCheckedOut
                ? "bg-[#007C46]"
                : isPendingCheckout
                  ? "bg-amber-600"
                  : isApproved
                    ? "bg-[#01424E]"
                    : isCancelled
                      ? "bg-slate-500"
                      : "bg-[#01424E]"
            )}>
              <h3 className="font-bold text-lg">
                {isCheckedOut 
                  ? 'ATTENDANCE VERIFIED' 
                  : isPendingCheckout 
                    ? 'CHECKOUT PASS' 
                    : 'ENTRY PASS'}
              </h3>
              <p className="text-sm opacity-90">{event.title}</p>
            </div>
            
            <CardContent className="pt-6 pb-6 flex flex-col items-center">
              {/* STATE 3: AFTER CHECKOUT - HIDE EVERY QR & SHOW ATTENDANCE COMPLETED */}
              {isCheckedOut ? (
                <div className="w-full space-y-6 text-center py-4">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-[#007C46] animate-scale-in border-4 border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  
                  <div>
                    <Badge className="bg-[#007C46] text-white font-bold px-3 py-1 text-sm mb-2">
                      Attendance Completed
                    </Badge>
                    <p className="text-xs text-muted-foreground">Thank you for attending! You are now eligible for certificates.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-left space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#007C46]" />
                      <span className="font-medium text-slate-600 dark:text-slate-300">Check-In Time:</span>
                      <span className="font-bold ml-auto font-mono text-[#01424E] dark:text-teal-200">
                        {attendance?.check_in_time ? format(new Date(attendance.check_in_time), 'hh:mm a') : 'Recorded'}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#007C46]" />
                      <span className="font-medium text-slate-600 dark:text-slate-300">Check-Out Time:</span>
                      <span className="font-bold ml-auto font-mono text-[#007C46] dark:text-[#7CEAAB]">
                        {attendance?.check_out_time ? format(new Date(attendance.check_out_time), 'hh:mm a') : 'Recorded'}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#007C46]" />
                      <span className="font-medium text-slate-600 dark:text-slate-300">Duration:</span>
                      <span className="font-bold ml-auto font-mono text-emerald-700 dark:text-emerald-300">
                        {calculateDuration(attendance?.check_in_time, attendance?.check_out_time)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : isPendingCheckout ? (
                /* STATE 2: AFTER CHECK-IN - HIDE ENTRY QR, DISPLAY CHECKOUT PASS & BANNER */
                <div className="space-y-5 flex flex-col items-center w-full">
                  <div className="w-full bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
                    <Badge className="bg-amber-600 text-white font-bold mb-1">
                      Status: Checked In
                    </Badge>
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold mt-1">
                      Please scan this Checkout QR before leaving the event.
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-md border-2 border-amber-500">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('CHECKOUT:' + (registration.qr_token || registration.id))}&color=007C46`} 
                      alt="Checkout QR Code" 
                      className="w-48 h-48"
                    />
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
                      <LogOut className="h-3.5 w-3.5" /> Checkout Pass
                    </p>
                    <p className="text-[11px] text-muted-foreground">Scan at volunteer exit counter</p>
                  </div>

                  <Button onClick={downloadQR} variant="outline" className="w-full border-amber-600 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 dark:border-amber-500 dark:text-amber-400">
                    <Download className="mr-2 h-4 w-4" /> Download Checkout Pass
                  </Button>
                </div>
              ) : isApproved ? (
                /* STATE 1: BEFORE CHECK-IN (NO ATTENDANCE ROW) - DISPLAY ENTRY PASS */
                <div className="space-y-6 flex flex-col items-center">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registration.qr_token || registration.id)}&color=01424E`} 
                      alt="Entry QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Scan at entry</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{registration.id.split('-')[0]}</p>
                  </div>
                  <Button onClick={downloadQR} variant="outline" className="w-full border-[#01424E] text-[#01424E] hover:bg-[#01424E]/5 dark:border-[#7CEAAB] dark:text-[#7CEAAB] dark:hover:bg-[#7CEAAB]/10">
                    <Download className="mr-2 h-4 w-4" /> Download Pass
                  </Button>
                </div>
              ) : isCancelled ? (
                <div className="text-center py-12 space-y-4">
                  <AlertCircle className="h-16 w-16 text-slate-400 mx-auto" />
                  <p className="font-medium text-slate-500">Registration Cancelled</p>
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="animate-pulse">
                    <div className="w-[200px] h-[200px] bg-slate-100 dark:bg-slate-800 rounded-xl mx-auto flex items-center justify-center">
                      <Clock className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-[#01424E] dark:text-white">Pass Generation Pending</p>
                    <p className="text-sm text-muted-foreground max-w-[220px] mx-auto">
                      {requiresPayment && paymentPending 
                        ? 'Complete payment to generate your entry pass.' 
                        : 'Your registration is under review. QR pass will be generated upon approval.'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
