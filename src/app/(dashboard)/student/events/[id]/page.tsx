'use client';

import { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { eventService } from '@/services/event-service';
import { registrationService } from '@/services/registration-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, MapPin, Clock, Users, Ticket, ArrowLeft, Info, Phone, Mail, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { checkProfileCompletion } from '@/hooks/use-profile-completion';
import { ProfileGuardDialog } from '@/components/shared/profile-guard-dialog';
import { useDataSync } from '@/lib/data-sync';
import { getEventStatusDetails } from '@/utils/event-status';

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { profile } = useAuth();
  
  const [event, setEvent] = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [guardOpen, setGuardOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      if (!event) setLoading(true);
      const eventData = await eventService.getEventById(resolvedParams.id);
      if (!eventData) {
        toast.error('Event not found');
        router.push('/student/events');
        return;
      }
      setEvent(eventData);

      if (profile?.id) {
        const regs = await registrationService.getUserRegistrations(profile.id);
        const currentReg = regs.find((r: any) => r.event_id === resolvedParams.id);
        setRegistration(currentReg || null);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id, profile?.id, router]);

  useDataSync(['events', 'registrations'], loadData, [resolvedParams.id, profile?.id]);

  const handleRegister = async () => {
    console.log("[TRACE] handleRegister clicked");
    console.log("[TRACE] profile.id:", profile?.id, "| event.id:", event?.id);

    if (!profile?.id || !event?.id) {
      console.warn("[TRACE] Missing profile.id or event.id - aborting registration");
      toast.error('Please log in to register for events');
      return;
    }

    // Check profile completion guard
    const completion = checkProfileCompletion(profile);
    if (!completion.isComplete) {
      setMissingFields(completion.missingFields.filter(f => !f.includes('Recommended')));
      setGuardOpen(true);
      return;
    }

    if (registration) {
      console.log("[TRACE] Pre-check active: user already registered. registration.id:", registration.id);
      toast.info('You are already registered for this event!');
      const redirectUrl = `/student/registrations/${registration.id}`;
      console.log("[TRACE] Executing router.push to existing registration URL:", redirectUrl);
      router.push(redirectUrl);
      return;
    }
    
    try {
      setIsRegistering(true);
      console.log("[TRACE] Calling registrationService.createRegistration...");
      const newReg = await registrationService.createRegistration({
        user_id: profile.id,
        event_id: event.id,
        registration_type: (event.max_team_size || 1) > 1 ? 'team' : 'individual'
      });
      
      console.log("[TRACE] registrationService.createRegistration returned:", JSON.stringify(newReg));

      if (!newReg || !newReg.id) {
        console.error("[TRACE] newReg is null or missing id property. newReg:", newReg);
        toast.error('Unable to complete registration. Please try again.');
        return;
      }

      setRegistration(newReg);
      toast.success('Registration completed successfully! 🎉');
      
      const isPaid = (event.registration_fee || 0) > 0;
      const targetUrl = isPaid 
        ? `/student/payment/${newReg.id}`
        : `/student/registrations/${newReg.id}`;

      console.log(`[TRACE] targetUrl determined: ${targetUrl}. isPaid: ${isPaid}. registration_fee: ${event.registration_fee || 0}`);
      console.log("[TRACE] Executing router.push to target URL:", targetUrl);
      router.push(targetUrl);
      console.log("[TRACE] router.push execution statement passed");
    } catch (error: any) {
      console.error('[TRACE] Registration submission caught error:', error);
      toast.error(error?.message || 'Unable to register for event');
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const statusDetails = getEventStatusDetails(event);
  const { canRegister, buttonText, badgeLabel, isEnded } = statusDetails;

  return (
    <div className="space-y-6 pb-12 fade-in">
      <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
      </Button>

      {/* Banner */}
      <div className="w-full h-52 sm:h-64 md:h-[400px] rounded-2xl overflow-hidden relative bg-gradient-to-br from-[#01424E] to-[#007C46]">
        {event.poster_url && (
          <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4 sm:p-6 md:p-10">
          <Badge className="w-fit mb-3 bg-[#7CEAAB] text-[#01424E] hover:bg-[#7CEAAB]/90 text-xs sm:text-sm font-semibold">
            {event.category}
          </Badge>
          <h1 className="text-xl sm:text-3xl md:text-5xl font-bold text-white mb-2">{event.title}</h1>
          <p className="text-white/80 text-sm sm:text-lg md:text-xl max-w-2xl line-clamp-2">{event.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-card rounded-xl p-6 border shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-[#01424E] dark:text-white">
              <Info className="h-5 w-5 text-[#007C46]" /> Event Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <InfoItem icon={<Calendar />} label="Date" value={event.start_date ? format(new Date(event.start_date), 'MMMM dd, yyyy') : 'TBA'} />
              <InfoItem icon={<Clock />} label="Venue / Room" value={event.room || event.building || 'TBA'} />
              <InfoItem icon={<MapPin />} label="Venue" value={event.venue || 'TBA'} />
              <InfoItem icon={<Ticket />} label="Fee" value={event.registration_fee === 0 ? 'Free' : `₹${event.registration_fee}`} />
              <InfoItem icon={<Users />} label="Capacity" value={event.max_participants ? `${event.max_participants} seats` : 'Unlimited'} />
              <InfoItem icon={<FileText />} label="Registration Mode" value={(event.max_team_size || 1) > 1 ? `Team (Max ${event.max_team_size})` : 'Individual'} />
            </div>

            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#01424E] dark:text-white">About the Event</h3>
              <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {event.description}
              </div>
            </div>
          </section>

          {event.payment_instructions && (
            <section className="bg-card rounded-xl p-6 border shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-[#01424E] dark:text-white">Rules & Guidelines</h2>
              <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                {event.payment_instructions}
              </div>
            </section>
          )}

          {event.event_faqs && event.event_faqs.length > 0 && (
            <section className="bg-card rounded-xl p-6 border shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-[#01424E] dark:text-white">Frequently Asked Questions</h2>
              <Accordion className="w-full">
                {event.event_faqs.map((faq: any, i: number) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="sticky top-20">
            <Card className="border-2 border-[#01424E]/10 shadow-lg">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-6">
                <CardTitle className="text-2xl text-center">Registration</CardTitle>
                <CardDescription className="text-center">
                  Secure your spot for this event
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={isEnded ? "secondary" : "default"} className={isEnded ? "" : "bg-[#41B177]"}>
                    {badgeLabel}
                  </Badge>
                </div>
                
                {event.registration_deadline && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-medium">{format(new Date(event.registration_deadline), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="text-xl font-bold text-[#01424E] dark:text-white">
                    {event.registration_fee === 0 ? 'Free' : `₹${event.registration_fee}`}
                  </span>
                </div>

                <div className="pt-4">
                  {registration ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg flex flex-col items-center justify-center text-center gap-2 border border-green-200 dark:border-green-800">
                        <CheckCircle className="h-8 w-8" />
                        <div>
                          <p className="font-semibold">Already Registered</p>
                          <p className="text-sm opacity-90">Status: {registration.status}</p>
                        </div>
                      </div>
                      <Button asChild className="w-full bg-[#01424E] hover:bg-[#007C46]" size="lg">
                        <Link href={`/student/registrations/${registration.id}`}>
                          View Registration Pass
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-[#01424E] hover:bg-[#007C46] h-12 text-lg font-bold" 
                      size="lg"
                      onClick={handleRegister}
                      disabled={!canRegister || isRegistering}
                    >
                      {isRegistering ? 'Processing...' : buttonText}
                    </Button>
                  )}
                  {(event.max_team_size || 1) > 1 && !registration && (
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Note: This is a team event. You can create or join a team after registering.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6 border-dashed">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-[#01424E] dark:text-white mb-4">Event Organizer</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-muted-foreground">
                      <Users className="h-4 w-4 text-[#01424E] dark:text-teal-300" />
                    </div>
                    <div>
                      <p className="font-semibold">{event.profiles?.full_name || 'Event Organizer'}</p>
                      {event.profiles?.department && (
                        <p className="text-xs text-muted-foreground">{event.profiles.department} Department</p>
                      )}
                    </div>
                  </div>
                  {(event.profiles?.email || event.contact_email) && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-muted-foreground">
                        <Mail className="h-4 w-4 text-[#007C46]" />
                      </div>
                      <span className="truncate">{event.profiles?.email || event.contact_email}</span>
                    </div>
                  )}
                  {(event.profiles?.phone || event.contact_phone) && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-muted-foreground">
                        <Phone className="h-4 w-4 text-amber-600" />
                      </div>
                      <span>{event.profiles?.phone || event.contact_phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>

      <ProfileGuardDialog
        open={guardOpen}
        onOpenChange={setGuardOpen}
        missingFields={missingFields}
        actionName="register for events"
        userRole={profile?.role || 'student'}
      />
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-[#7CEAAB]/20 text-[#01424E] dark:text-[#7CEAAB] rounded-lg mt-0.5">
        <div className="h-5 w-5">{icon}</div>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
