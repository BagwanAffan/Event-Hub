'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { eventService } from '@/services/event-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EventCard } from '@/components/shared/event-card';

const DEFAULT_CATEGORIES = ['All', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon'];

const formatCategory = (cat: string) => {
  if (!cat) return '';
  const trimmed = cat.trim();
  if (trimmed.toLowerCase() === 'all') return 'All';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

function StudentEventsContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const data = await eventService.getPublicEvents();
        // Strict deduplication by ID
        const uniqueEvents = Array.from(
          new Map((data.data || []).map((e: any) => [e.id, e])).values()
        );
        setEvents(uniqueEvents);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const categoryMap = new Map<string, string>();
  [...DEFAULT_CATEGORIES, ...events.map((e) => e.category)]
    .filter(Boolean)
    .forEach((c) => {
      const formatted = formatCategory(c);
      const key = formatted.toLowerCase();
      if (!categoryMap.has(key)) {
        categoryMap.set(key, formatted);
      }
    });
  const availableCategories = Array.from(categoryMap.values());

  const filteredEvents = events.filter((event) => {
    const s = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !s ||
      event.title?.toLowerCase().includes(s) ||
      event.short_description?.toLowerCase().includes(s) ||
      event.description?.toLowerCase().includes(s) ||
      event.category?.toLowerCase().includes(s) ||
      event.venue?.toLowerCase().includes(s) ||
      event.building?.toLowerCase().includes(s) ||
      event.event_type?.toLowerCase().includes(s) ||
      event.profiles?.full_name?.toLowerCase().includes(s);

    const cat = selectedCategory.toLowerCase().trim();
    const eventCat = (event.category || '').toLowerCase().trim();

    const matchesCategory =
      cat === 'all' ||
      eventCat === cat ||
      eventCat.includes(cat) ||
      cat.includes(eventCat);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 fade-in pb-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
          Explore Campus Events
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Discover and register for exciting technical hackathons, summits, and workshops
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search events..." 
            className="pl-9 text-xs sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
          {availableCategories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={cn(
                "rounded-full whitespace-nowrap text-xs font-bold px-4",
                selectedCategory === category ? "bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB]" : ""
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} linkPrefix="/student/events" />
          ))}
        </div>
      ) : (
        <Card className="border-dashed mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Filter className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">No events found</h3>
            <p className="text-muted-foreground max-w-sm mb-6 text-xs">
              We couldn&apos;t find any events matching your search criteria. Try adjusting your filters or search term.
            </p>
            <Button 
              variant="outline" 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="text-xs font-bold"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ExploreEventsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-muted-foreground">Loading campus events...</div>}>
      <StudentEventsContent />
    </Suspense>
  );
}
