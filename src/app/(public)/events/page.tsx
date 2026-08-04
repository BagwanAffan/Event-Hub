'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { eventService } from '@/services/event-service';
import { EventCard } from '@/components/shared/event-card';

export default function PublicEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await eventService.getPublicEvents({
        category: category === 'all' ? undefined : category,
        search,
      });
      // Deduplicate by ID
      const uniqueEvents = Array.from(
        new Map((res.data || []).map((e: any) => [e.id, e])).values()
      );
      setEvents(uniqueEvents);
    } catch (err) {
      console.error("Error fetching public events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [category]);

  const filtered = events.filter((e) => {
    const s = search.toLowerCase().trim();
    const matchesSearch =
      !s ||
      e.title?.toLowerCase().includes(s) ||
      e.short_description?.toLowerCase().includes(s) ||
      e.description?.toLowerCase().includes(s) ||
      e.category?.toLowerCase().includes(s) ||
      e.venue?.toLowerCase().includes(s) ||
      e.profiles?.full_name?.toLowerCase().includes(s);

    const cat = category.toLowerCase().trim();
    const eventCat = (e.category || '').toLowerCase().trim();
    const matchesCategory =
      cat === 'all' ||
      eventCat === cat ||
      eventCat.includes(cat) ||
      cat.includes(eventCat);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 max-w-7xl animate-fade-in pb-24">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4 pt-8">
        <Badge className="bg-[#edfcf6] text-[#007C46] border-[#41B177] px-3 py-1 font-bold text-xs uppercase tracking-wider">
          Campus Event Discovery
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#01424E] dark:text-teal-100">
          Discover Upcoming Campus Events
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Browse national hackathons, technical workshops, robotics arenas, and cultural fests across engineering colleges.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto bg-card p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title, topic or category..." 
            className="pl-10 text-xs sm:text-sm h-11 rounded-xl border-slate-200 dark:border-slate-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex h-11 w-full sm:w-[220px] items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-background px-3.5 py-2 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#01424E] outline-none cursor-pointer"
        >
          <option value="all">All Categories</option>
          <option value="Hackathon">Hackathons &amp; Coding</option>
          <option value="Technical">Technical</option>
          <option value="Cultural">Cultural &amp; Arts</option>
          <option value="Sports">Sports</option>
          <option value="Workshop">Workshops &amp; AI Summits</option>
          <option value="Seminar">Seminars &amp; Keynotes</option>
          <option value="Robotics">Robotics &amp; Engineering</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Events Grid */}
      <div className="pt-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 max-w-xl mx-auto space-y-3">
            <h3 className="text-lg font-bold text-[#01424E] dark:text-teal-100">No Events Found</h3>
            <p className="text-xs text-muted-foreground">
              No campus events match your current search or category filter. Try clearing your search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} linkPrefix="/events" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
