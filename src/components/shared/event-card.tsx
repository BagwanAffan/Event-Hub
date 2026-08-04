'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FALLBACK_EVENT_IMAGE = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800';

export interface EventCardProps {
  event: {
    id: string;
    title: string;
    short_description?: string | null;
    description?: string | null;
    category: string;
    poster_url?: string | null;
    banner_url?: string | null;
    start_date: string;
    venue?: string | null;
    building?: string | null;
    registration_fee?: number;
    registration_mode?: string | null;
    max_participants?: number | null;
  };
  linkPrefix?: string; // '/events' or '/student/events'
}

export function EventCard({ event, linkPrefix = '/events' }: EventCardProps) {
  const [imgSrc, setImgSrc] = useState<string>(
    event.poster_url || event.banner_url || FALLBACK_EVENT_IMAGE
  );

  const displayDescription = event.short_description || event.description || 'Join this exciting campus event to network, learn, and showcase your skills.';
  const href = `${linkPrefix}/${event.id}`;

  return (
    <Card className="pt-0 p-0 gap-0 overflow-hidden flex flex-col h-full border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group rounded-2xl bg-card">
      {/* Image Header Container */}
      <div className="aspect-video relative w-full overflow-hidden bg-slate-900 shrink-0">
        <img
          src={imgSrc}
          alt={event.title}
          onError={() => setImgSrc(FALLBACK_EVENT_IMAGE)}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />
        
        {/* Category Badge Top-Left */}
        <Badge className="absolute top-3 left-3 bg-[#01424E] text-[#7CEAAB] capitalize text-xs font-bold shadow-md border border-[#7CEAAB]/30 px-2.5 py-1">
          {event.category || 'Campus Event'}
        </Badge>
        
        {/* Fee Badge Top-Right */}
        <Badge className="absolute top-3 right-3 bg-white text-[#007C46] font-extrabold text-xs shadow-lg border border-[#007C46]/20 px-2.5 py-1">
          {event.registration_fee && event.registration_fee > 0 ? `₹${event.registration_fee}` : 'FREE ENTRY'}
        </Badge>
      </div>

      {/* Card Header & Title */}
      <CardHeader className="p-5 pb-2 shrink-0">
        <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100 line-clamp-2 min-h-[3.5rem] flex items-center leading-snug">
          {event.title}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem] mt-1 leading-relaxed">
          {displayDescription}
        </CardDescription>
      </CardHeader>

      {/* Metadata List */}
      <CardContent className="px-5 py-3 flex-1 space-y-2 text-xs text-muted-foreground border-t border-slate-100 dark:border-slate-800/60 my-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-[#007C46]" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {event.start_date ? new Date(event.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-[#007C46]" />
          <span className="line-clamp-1 text-slate-700 dark:text-slate-300">
            {event.venue || 'Campus Auditorium'}{event.building ? `, ${event.building}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-[#007C46]" />
          <span className="capitalize text-slate-700 dark:text-slate-300">
            {event.registration_mode || 'individual'} registration
          </span>
        </div>
      </CardContent>

      {/* Action Button */}
      <CardFooter className="p-5 pt-0 mt-auto shrink-0">
        <Button
          asChild
          className="w-full h-10 bg-[#01424E] text-[#7CEAAB] hover:bg-[#007C46] hover:text-white font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-sm group/btn"
        >
          <Link href={href} className="w-full h-full inline-flex items-center justify-center gap-2 cursor-pointer">
            <span>View Details &amp; Register</span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
