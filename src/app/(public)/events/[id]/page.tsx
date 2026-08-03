'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, ArrowLeft, ShieldCheck, HelpCircle, Phone, Mail, Award, ArrowRight } from 'lucide-react';
import { eventService } from '@/services/event-service';
import { useAuth } from '@/hooks/use-auth';

export default function PublicEventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await eventService.getEventById(resolvedParams.id);
        setEvent(data);
      } catch (err) {
        console.error("Error loading event detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading event details...</div>;
  }

  if (!event) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl animate-fade-in pb-20">
      <Link href="/events" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-[#01424E] mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to all events
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 relative shadow-xl">
            <img 
              src={event.banner_url || event.poster_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200'} 
              alt={event.title} 
              className="object-cover w-full h-full opacity-90"
            />
            <Badge className="absolute top-4 left-4 bg-[#01424E] text-[#7CEAAB] capitalize font-bold">
              {event.category}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#01424E] dark:text-teal-100">{event.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {event.short_description}
            </p>
          </div>

          <div className="space-y-6 pt-4 border-t">
            <h3 className="text-xl font-bold text-[#01424E] dark:text-teal-200">About the Event</h3>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm leading-relaxed">
              {event.description}
            </p>

            {event.event_faqs && event.event_faqs.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-xl font-bold text-[#01424E] dark:text-teal-200 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-[#007C46]" /> Frequently Asked Questions
                </h3>
                <div className="space-y-3">
                  {event.event_faqs.map((faq: any) => (
                    <div key={faq.id} className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 space-y-1">
                      <h4 className="font-bold text-sm text-[#01424E] dark:text-teal-100">Q: {faq.question}</h4>
                      <p className="text-xs text-muted-foreground">A: {faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info & Register */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-lg space-y-6 sticky top-24 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-4">
              <span className="text-sm font-semibold text-muted-foreground">Registration Fee</span>
              <span className="text-2xl font-extrabold text-[#007C46]">
                {event.registration_fee > 0 ? `₹${event.registration_fee}` : 'FREE ENTRY'}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-[#007C46] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Start Date</p>
                  <p className="text-muted-foreground">{new Date(event.start_date).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#007C46] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Venue</p>
                  <p className="text-muted-foreground">{event.venue}, {event.building}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-[#007C46] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Mode & Capacity</p>
                  <p className="text-muted-foreground capitalize">{event.registration_mode} (Max {event.max_participants} Seats)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-[#007C46] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Certificate</p>
                  <p className="text-muted-foreground">Verified QR Pass & Digital Certificate Included</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              {user ? (
                <Button asChild className="w-full bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold" size="lg">
                  <Link href={`/student/events/${event.id}`}>Register Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              ) : (
                <Button asChild className="w-full bg-[#01424E] text-[#7CEAAB] hover:bg-[#013540] font-bold" size="lg">
                  <Link href="/login?redirect=/events">Login to Register</Link>
                </Button>
              )}
              <p className="text-[11px] text-center text-muted-foreground">Requires verified college student account</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
