'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, MapPin, Plus, Edit2, Trash2, Eye, Search, 
  Users, Rocket, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';
import { eventService } from '@/services/event-service';
import { Event } from '@/types/database.types';
import { toast } from 'sonner';

export default function OrganizerEventsPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Edit Modal State
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Event>>({});

  // Delete Confirmation State
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchEvents = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const res = await eventService.getEvents({ created_by: profile.id });
      setEvents(res.data || []);
    } catch (err: any) {
      console.error('Failed to load organizer events:', err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [profile?.id]);

  const handlePublish = async (evt: Event) => {
    try {
      toast.loading('Publishing event live...', { id: 'publish' });
      await eventService.updateEvent(evt.id, { status: 'published' });
      toast.success(`"${evt.title}" is now published live! 🚀`, { id: 'publish' });
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish event', { id: 'publish' });
    }
  };

  const handleOpenEdit = (evt: Event) => {
    setEditingEvent(evt);
    setEditFormData({
      title: evt.title,
      short_description: evt.short_description,
      description: evt.description,
      category: evt.category,
      venue: evt.venue,
      building: evt.building,
      room: evt.room,
      registration_fee: evt.registration_fee,
      max_participants: evt.max_participants,
      start_date: evt.start_date ? new Date(evt.start_date).toISOString().slice(0, 16) : '',
      end_date: evt.end_date ? new Date(evt.end_date).toISOString().slice(0, 16) : '',
      need_volunteers: evt.need_volunteers ?? false,
      volunteers_needed: evt.volunteers_needed ?? 0,
      volunteer_roles: evt.volunteer_roles ?? [],
      reporting_location: evt.reporting_location || '',
      reporting_time: evt.reporting_time ? new Date(evt.reporting_time).toISOString().slice(0, 16) : '',
      shift_start_time: evt.shift_start_time ? new Date(evt.shift_start_time).toISOString().slice(0, 16) : '',
      shift_end_time: evt.shift_end_time ? new Date(evt.shift_end_time).toISOString().slice(0, 16) : '',
      volunteer_instructions: evt.volunteer_instructions || '',
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;
    try {
      setEditLoading(true);
      await eventService.updateEvent(editingEvent.id, editFormData);
      toast.success('Event details updated successfully! ✨');
      setIsEditOpen(false);
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update event');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    try {
      setDeleteLoading(true);
      await eventService.deleteEvent(deletingEvent.id);
      toast.success('Event deleted successfully');
      setIsDeleteOpen(false);
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete event');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const s = search.toLowerCase().trim();
    const matchesSearch =
      !s ||
      evt.title?.toLowerCase().includes(s) ||
      evt.category?.toLowerCase().includes(s) ||
      evt.venue?.toLowerCase().includes(s) ||
      evt.building?.toLowerCase().includes(s) ||
      evt.short_description?.toLowerCase().includes(s) ||
      evt.description?.toLowerCase().includes(s) ||
      evt.event_type?.toLowerCase().includes(s);

    const matchesStatus = statusFilter === 'all' || evt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Organizer Event Management</h1>
          <p className="text-muted-foreground text-sm">Create, publish, edit, and manage your campus events in real-time</p>
        </div>
        <Button asChild className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold shadow-md">
          <Link href="/organizer/events/create">
            <Plus className="mr-2 h-4 w-4" /> Create New Event
          </Link>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events by title or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Status:</span>
            <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
              <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Drafts Only</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEvents.length === 0 && (
        <Card className="border-dashed border-2 border-slate-300 dark:border-slate-800">
          <CardContent className="py-12 text-center space-y-4">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground opacity-40" />
            <div>
              <h3 className="text-lg font-bold text-[#01424E] dark:text-teal-200">No events found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {search || statusFilter !== 'all' ? 'Try adjusting your search filters' : 'You haven\'t created any events yet. Click below to draft your first event.'}
              </p>
            </div>
            <Button asChild className="bg-[#007C46] text-white">
              <Link href="/organizer/events/create"><Plus className="mr-2 h-4 w-4" /> Create Event Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Events Grid */}
      {!loading && filteredEvents.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map(evt => (
            <Card key={evt.id} className="border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className={`capitalize font-bold ${
                      evt.status === 'published' ? 'bg-[#007C46] text-white' :
                      evt.status === 'draft' ? 'bg-amber-500 text-white' :
                      'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}>
                      {evt.status}
                    </Badge>
                    <span className="text-xs font-bold text-[#007C46]">
                      {evt.registration_fee > 0 ? `₹${evt.registration_fee}` : 'FREE'}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-[#01424E] dark:text-teal-100 mt-2 line-clamp-1">
                    {evt.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">
                    {evt.short_description || evt.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#01424E] dark:text-[#7CEAAB] shrink-0" />
                    <span className="truncate">{evt.venue || 'Main Campus Auditorium'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#007C46] shrink-0" />
                    <span>{new Date(evt.start_date).toLocaleDateString()} at {new Date(evt.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Max {evt.max_participants || 100} Participants ({evt.registration_mode})</span>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4 border-t flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/40 rounded-b-xl">
                <div className="flex items-center justify-between gap-2 w-full">
                  {evt.status === 'draft' && (
                    <Button onClick={() => handlePublish(evt)} size="sm" className="bg-[#007C46] text-white hover:bg-[#007C46]/90 flex-1 font-bold text-xs">
                      <Rocket className="mr-1.5 h-3.5 w-3.5" /> Publish Live
                    </Button>
                  )}
                  <Button onClick={() => handleOpenEdit(evt)} variant="outline" size="sm" className="flex-1 text-xs">
                    <Edit2 className="mr-1.5 h-3.5 w-3.5 text-[#01424E]" /> Edit
                  </Button>
                  <Button onClick={() => { setDeletingEvent(evt); setIsDeleteOpen(true); }} variant="outline" size="sm" className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button asChild variant="secondary" size="sm" className="w-full text-xs">
                  <Link href={`/organizer/events/${evt.id}`}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Event Dashboard
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Event Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event Details</DialogTitle>
            <DialogDescription>Update event information. Changes persist directly to Supabase.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label className="font-semibold">Event Title</Label>
              <Input
                value={editFormData.title || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Venue / Building</Label>
              <Input
                value={editFormData.venue || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, venue: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Registration Fee (₹)</Label>
              <Input
                type="number"
                value={editFormData.registration_fee ?? 0}
                onChange={(e) => setEditFormData(prev => ({ ...prev, registration_fee: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Short Description</Label>
              <Textarea
                rows={2}
                value={editFormData.short_description || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, short_description: e.target.value }))}
              />
            </div>

            <div className="pt-2 border-t space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-900">
                <Label className="font-bold cursor-pointer" htmlFor="edit-need-volunteers">Need Volunteers</Label>
                <input
                  id="edit-need-volunteers"
                  type="checkbox"
                  checked={editFormData.need_volunteers ?? false}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, need_volunteers: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-[#007C46] focus:ring-[#007C46]"
                />
              </div>

              {editFormData.need_volunteers && (
                <div className="space-y-3 pl-1">
                  <div className="space-y-1">
                    <Label className="font-semibold">Volunteers Required</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editFormData.volunteers_needed ?? 0}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, volunteers_needed: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Reporting Location</Label>
                    <Input
                      value={editFormData.reporting_location || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, reporting_location: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Reporting Time</Label>
                    <Input
                      type="datetime-local"
                      value={editFormData.reporting_time || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, reporting_time: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={editLoading} className="bg-[#01424E] text-[#7CEAAB]">
              {editLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Delete Event
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingEvent?.title}</strong>? This action cannot be undone and will permanently remove all associated event data from Supabase.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} disabled={deleteLoading} variant="destructive">
              {deleteLoading ? 'Deleting...' : 'Delete Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
