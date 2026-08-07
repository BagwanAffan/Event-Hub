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
import { useDataSync } from '@/lib/data-sync';
import { toast } from 'sonner';
import { BannerUpload } from '@/components/shared/banner-upload';
import { getEventStatusDetails } from '@/utils/event-status';

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
      if (events.length === 0) setLoading(true);
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
      banner_url: evt.banner_url || evt.poster_url || '',
      poster_url: evt.poster_url || evt.banner_url || '',
      registration_mode: evt.registration_mode || 'individual',
      registration_fee: evt.registration_fee ?? 0,
      max_participants: evt.max_participants ?? 100,
      max_teams: evt.max_teams ?? 25,
      max_team_size: evt.max_team_size ?? 4,
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
        <Button asChild className="h-10 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#007C46] text-white hover:bg-[#007C46]/90 shadow-sm shrink-0">
          <Link href="/organizer/events/create" className="inline-flex items-center justify-center gap-2 h-full w-full">
            <Plus className="h-4 w-4 shrink-0" />
            <span>Create New Event</span>
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
              <SelectTrigger className="w-full md:w-44">
                <SelectValue>
                  {statusFilter === 'all' ? 'All Statuses' :
                   statusFilter === 'draft' ? 'Drafts Only' :
                   statusFilter === 'published' ? 'Published' :
                   statusFilter === 'completed' ? 'Completed' :
                   statusFilter === 'cancelled' ? 'Cancelled' : 'All Statuses'}
                </SelectValue>
              </SelectTrigger>
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
        <Card className="border-dashed border-2 border-slate-300 dark:border-slate-800 rounded-2xl bg-card">
          <CardContent className="py-12 sm:py-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#edfcf6] dark:bg-teal-950/60 text-[#007C46] dark:text-[#22C55E] flex items-center justify-center shadow-xs mx-auto mb-1">
              <Calendar className="h-8 w-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg sm:text-xl font-bold text-[#01424E] dark:text-[#F5F5F5]">No Events Found</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#9CA3AF] leading-relaxed">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your search query or status filter criteria.'
                  : 'You haven\'t created any events yet. Click below to draft and publish your first event.'}
              </p>
            </div>
            <Button
              asChild
              className="h-11 sm:h-12 px-6 sm:px-8 rounded-xl font-bold text-xs sm:text-sm bg-[#007C46] text-white hover:bg-[#007C46]/90 dark:bg-[#22C55E] dark:text-[#090909] dark:hover:bg-[#16A34A] shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-2"
            >
              <Link href="/organizer/events/create" className="inline-flex items-center justify-center gap-2 h-full w-full">
                <Plus className="h-4 w-4 shrink-0" />
                <span>Create Event Now</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Events Grid */}
      {!loading && filteredEvents.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map(evt => (
            <Card
              key={evt.id}
              className="pt-0 p-0 gap-0 border-slate-200 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between h-full rounded-2xl bg-card overflow-hidden group"
            >
              <div>
                {/* Event Banner Image Header */}
                <div className="relative w-full h-36 overflow-hidden rounded-t-2xl bg-slate-900 shrink-0">
                  <img
                    src={evt.banner_url || evt.poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200'}
                    alt={evt.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200';
                    }}
                    className="w-full h-full object-cover object-center block transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 pointer-events-none" />

                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    {(() => {
                      const statusDetails = getEventStatusDetails(evt);
                      return (
                        <Badge
                          className={`capitalize font-bold text-[10px] px-2.5 py-0.5 rounded-lg shrink-0 ${
                            evt.status === 'draft'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : statusDetails.timeStatus === 'ongoing'
                              ? 'bg-[#007C46] text-white shadow-xs'
                              : statusDetails.timeStatus === 'upcoming'
                              ? 'bg-[#01424E] text-[#7CEAAB] shadow-xs'
                              : 'bg-slate-500 text-white shadow-xs'
                          }`}
                        >
                          {evt.status === 'draft' ? 'Draft' : statusDetails.badgeLabel}
                        </Badge>
                      );
                    })()}
                    <Badge className="bg-white/90 text-[#01424E] border-0 backdrop-blur text-[10px] uppercase tracking-wider font-bold">
                      {evt.category || 'General'}
                    </Badge>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    <span className="text-[10px] font-extrabold text-white px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur border border-white/20 shrink-0">
                      {evt.registration_fee > 0 ? `₹${evt.registration_fee}` : 'FREE'}
                    </span>
                    <Button
                      onClick={() => { setDeletingEvent(evt); setIsDeleteOpen(true); }}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-white/80 hover:text-red-400 hover:bg-black/50 backdrop-blur rounded-lg shrink-0 transition-colors cursor-pointer"
                      title="Delete event"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-lg font-bold text-[#01424E] dark:text-[#F5F5F5] line-clamp-1 tracking-tight">
                    {evt.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs text-muted-foreground dark:text-[#9CA3AF] leading-relaxed mt-1">
                    {evt.short_description || evt.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-5 pb-5 space-y-2.5 text-xs text-slate-600 dark:text-[#CFCFCF]">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-[#01424E] dark:text-[#22C55E] shrink-0" />
                    <span className="truncate">{evt.venue || 'Main Campus Auditorium'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-[#007C46] dark:text-[#22C55E] shrink-0" />
                    <span className="truncate">{new Date(evt.start_date).toLocaleDateString()} at {new Date(evt.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">Max {evt.max_participants || 100} Participants ({evt.registration_mode})</span>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="p-4 sm:p-5 pt-4 border-t border-slate-100 dark:border-white/[0.08] flex flex-col gap-2.5 bg-slate-50/50 dark:bg-[#181818] rounded-b-2xl">
                {evt.status === 'draft' ? (
                  <div className="flex items-center gap-2.5 w-full">
                    <Button
                      onClick={() => handlePublish(evt)}
                      className="h-10 flex-1 text-xs font-bold rounded-xl inline-flex items-center justify-center gap-2 bg-[#007C46] text-white hover:bg-[#007C46]/90 dark:bg-[#22C55E] dark:text-[#090909] dark:hover:bg-[#16A34A] shadow-xs cursor-pointer"
                    >
                      <Rocket className="h-4 w-4 shrink-0" />
                      <span>Publish</span>
                    </Button>
                    <Button
                      onClick={() => handleOpenEdit(evt)}
                      variant="outline"
                      className="h-10 flex-1 text-xs font-bold rounded-xl inline-flex items-center justify-center gap-2 border-slate-200 dark:border-white/10 dark:bg-[#1F1F1F] dark:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#222222] transition-colors cursor-pointer shadow-xs"
                    >
                      <Edit2 className="h-4 w-4 text-[#01424E] dark:text-[#22C55E] shrink-0" />
                      <span>Edit</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleOpenEdit(evt)}
                    variant="outline"
                    className="h-10 w-full text-xs font-bold rounded-xl inline-flex items-center justify-center gap-2 border-slate-200 dark:border-white/10 dark:bg-[#1F1F1F] dark:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#222222] transition-colors cursor-pointer shadow-xs"
                  >
                    <Edit2 className="h-4 w-4 text-[#01424E] dark:text-[#22C55E] shrink-0" />
                    <span>Edit Event</span>
                  </Button>
                )}

                <Button
                  asChild
                  variant="outline"
                  className="h-10 w-full text-xs font-bold rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-[#15271B] text-[#01424E] dark:text-[#22C55E] dark:hover:bg-[#1F2B22] transition-all cursor-pointer shadow-xs"
                >
                  <Link href={`/organizer/events/${evt.id}`} className="inline-flex items-center justify-center gap-2 h-full w-full">
                    <Eye className="h-4 w-4 shrink-0" />
                    <span>Event Dashboard</span>
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
              <Label className="font-semibold">Event Banner Image</Label>
              <BannerUpload
                value={editFormData.banner_url || ''}
                onChange={(url) => setEditFormData(prev => ({ ...prev, banner_url: url, poster_url: url || prev.poster_url }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Venue / Building</Label>
              <Input
                value={editFormData.venue || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, venue: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Registration Mode</Label>
                <Select
                  value={editFormData.registration_mode || 'individual'}
                  onValueChange={(val) => setEditFormData(prev => ({ ...prev, registration_mode: val as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Registration</SelectItem>
                    <SelectItem value="team">Team Registration</SelectItem>
                    <SelectItem value="both">Both Allowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Registration Fee (₹)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0 for Free"
                  value={editFormData.registration_fee ?? 0}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      const parsed = parseFloat(val);
                      setEditFormData(prev => ({ ...prev, registration_fee: isNaN(parsed) ? 0 : Math.max(0, parsed) }));
                    } else {
                      toast.error('Registration fee must be a positive number.');
                    }
                  }}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Dynamic Registration Fields - 2-Column Symmetrical UI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {editFormData.registration_mode !== 'individual' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Max Teams Capacity</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={editFormData.max_teams ?? 25}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                          const parsed = parseInt(val, 10);
                          setEditFormData(prev => ({ ...prev, max_teams: isNaN(parsed) ? 1 : Math.max(1, parsed) }));
                        } else {
                          toast.error('Max teams capacity must be a positive integer.');
                        }
                      }}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Max Team Size</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={editFormData.max_team_size ?? 4}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                          const parsed = parseInt(val, 10);
                          setEditFormData(prev => ({ ...prev, max_team_size: isNaN(parsed) ? 1 : Math.max(1, parsed) }));
                        } else {
                          toast.error('Max team members must be a positive integer.');
                        }
                      }}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </>
              )}

              {editFormData.registration_mode !== 'team' && (
                <div className={`space-y-1.5 ${editFormData.registration_mode === 'both' ? 'sm:col-span-2' : ''}`}>
                  <Label className="font-semibold">Max Participants</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={editFormData.max_participants ?? 100}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) {
                        const parsed = parseInt(val, 10);
                        setEditFormData(prev => ({ ...prev, max_participants: isNaN(parsed) ? 1 : Math.max(1, parsed) }));
                      } else {
                        toast.error('Max participants must be a positive integer.');
                      }
                    }}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              )}
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
