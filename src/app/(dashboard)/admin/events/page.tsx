'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  Search,
  Eye,
  MapPin,
  Users,
  User,
  IndianRupee,
  RefreshCw,
  Star,
  Ban,
  Trash2,
  AlertTriangle,
  Loader2,
  Clock,
  Mail,
  Phone,
  FileText,
  ImageIcon,
} from 'lucide-react';
import { adminService, EnrichedAdminEvent } from '@/services/admin-service';
import { useAuth } from '@/hooks/use-auth';
import { useDataSync } from '@/lib/data-sync';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminEventsPage() {
  const { profile: currentAdmin } = useAuth();
  const [events, setEvents] = useState<EnrichedAdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // View Details Modal State
  const [selectedEvent, setSelectedEvent] = useState<EnrichedAdminEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Delete Confirmation Modal State
  const [eventToDelete, setEventToDelete] = useState<EnrichedAdminEvent | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      if (events.length === 0) setLoading(true);
      const res = await adminService.getAllEventsForAdmin({
        status: statusFilter,
        category: categoryFilter,
        search,
      });
      setEvents(res.data || []);
    } catch (err: any) {
      console.error('Failed to load events for admin:', err);
      toast.error(err?.message || 'Failed to load campus events');
    } finally {
      setLoading(false);
    }
  };

  useDataSync(['events', 'admin'], fetchEvents, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  // 1. Feature Toggle Action (DB First)
  const handleToggleFeatured = async (evt: EnrichedAdminEvent) => {
    const nextState = !evt.is_featured;
    setProcessingId(evt.id);

    try {
      await adminService.toggleEventFeatured(evt.id, nextState);
      setEvents((prev) =>
        prev.map((e) => (e.id === evt.id ? { ...e, is_featured: nextState } : e))
      );
      if (nextState) {
        toast.success('Event marked as Featured');
      } else {
        toast.info('Removed from Featured');
      }
      await fetchEvents();
    } catch (err: any) {
      console.error('Feature toggle error:', err);
      toast.error(err?.message || 'Failed to update featured status');
    } finally {
      setProcessingId(null);
    }
  };

  // 2. Disable / Unpublish Toggle Action (DB First)
  const handleToggleDisabled = async (evt: EnrichedAdminEvent) => {
    const nextState = !evt.is_disabled;
    setProcessingId(evt.id);

    try {
      await adminService.toggleEventDisabled(evt.id, nextState);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === evt.id
            ? {
                ...e,
                is_disabled: nextState,
                status: (nextState ? 'disabled' : 'published') as any,
              }
            : e
        )
      );
      if (nextState) {
        toast.warning('Event disabled successfully');
      } else {
        toast.success('Event published successfully');
      }
      await fetchEvents();
    } catch (err: any) {
      console.error('Disable toggle error:', err);
      toast.error(err?.message || 'Failed to update event state');
    } finally {
      setProcessingId(null);
    }
  };

  // 3. Delete Confirmation Dialog Opener
  const openDeleteConfirmation = (evt: EnrichedAdminEvent) => {
    setEventToDelete(evt);
    setConfirmDeleteText('');
    setIsDeleteModalOpen(true);
  };

  // 4. Permanent Cascade Delete Execution (DB Confirmation FIRST, then UI Update)
  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    if (confirmDeleteText.trim() !== 'DELETE') {
      toast.error('Please type DELETE to confirm deletion');
      return;
    }
    const targetId = eventToDelete.id;

    setProcessingId(targetId);

    try {
      // 1. Delete from database FIRST and wait for response!
      await adminService.deleteEventPermanently(targetId);

      // 2. Only after database confirmation, update UI state
      setEvents((prev) => prev.filter((e) => e.id !== targetId));
      toast.success('Event deleted successfully.');
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
      setConfirmDeleteText('');

      // 3. Re-fetch to ensure complete sync
      await fetchEvents();
    } catch (err: any) {
      console.error('Delete event error:', err);
      toast.error(err?.message || 'Failed to delete event from database');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDateStr = (dateStr?: string | null) => {
    if (!dateStr) return 'Not Available';
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return 'Not Available';
    }
  };

  const formatTimeStr = (dateStr?: string | null) => {
    if (!dateStr) return 'Not Available';
    try {
      return format(new Date(dateStr), 'hh:mm a');
    } catch {
      return 'Not Available';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Campus Events Governance</h1>
          <p className="text-muted-foreground text-sm">Monitor, feature, disable, delete, and inspect all posted campus events</p>
        </div>
        <Badge className="bg-[#edfcf6] text-[#007C46] border-[#41B177] px-3 py-1 text-xs font-bold">
          {events.length} Events Listed
        </Badge>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title, venue, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Category:</span>
                <Select value={categoryFilter} onValueChange={(val) => val && setCategoryFilter(val)}>
                  <SelectTrigger className="w-36 text-xs h-9">
                    <SelectValue>
                      {categoryFilter === 'all' ? 'All Categories' :
                       categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                    <SelectItem value="hackathon" className="text-xs">Hackathon</SelectItem>
                    <SelectItem value="workshop" className="text-xs">Workshop</SelectItem>
                    <SelectItem value="robotics" className="text-xs">Robotics</SelectItem>
                    <SelectItem value="cultural" className="text-xs">Cultural</SelectItem>
                    <SelectItem value="sports" className="text-xs">Sports</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
                  <SelectTrigger className="w-36 text-xs h-9">
                    <SelectValue>
                      {statusFilter === 'all' ? 'All Statuses' :
                       statusFilter === 'published' ? 'Published' :
                       statusFilter === 'disabled' ? 'Disabled' :
                       statusFilter === 'draft' ? 'Draft' :
                       statusFilter === 'completed' ? 'Completed' :
                       statusFilter === 'cancelled' ? 'Cancelled' : 'All Statuses'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                    <SelectItem value="published" className="text-xs">Published</SelectItem>
                    <SelectItem value="disabled" className="text-xs">Disabled</SelectItem>
                    <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                    <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                    <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" variant="secondary" size="sm" className="shrink-0 font-bold text-xs h-9 cursor-pointer">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Events Table Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-md">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#007C46]" /> Campus Events Registry
          </CardTitle>
          <CardDescription className="text-xs">Comprehensive telemetry, featuring, and operational actions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!loading && events.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/80">
                    <TableHead className="font-bold text-xs uppercase">Title & Category</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Organizer</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Date & Venue</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Registrations</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Revenue</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((evt) => (
                    <TableRow key={evt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-[#01424E] dark:text-teal-100">{evt.title}</div>
                          {evt.is_featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 shrink-0" />}
                        </div>
                        <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 capitalize text-[10px] mt-0.5">
                          {evt.category || 'General'}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-slate-800 dark:text-slate-200">{evt.profiles?.full_name || 'Organizer'}</div>
                        <div className="text-[11px] text-muted-foreground">{evt.profiles?.college || 'Not Available'}</div>
                      </TableCell>

                      <TableCell>
                        <div>{formatDateStr(evt.start_date)}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{evt.venue || 'Not Available'}</div>
                      </TableCell>

                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                        {evt.registrationCount} / {evt.max_participants || 'Unlimited'}
                      </TableCell>

                      <TableCell className="font-bold text-[#007C46]">
                        ₹{(evt.revenue || 0).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={`capitalize font-bold text-[10px] w-fit ${
                            evt.is_disabled ? 'bg-red-500 text-white' :
                            evt.status === 'published' ? 'bg-[#007C46] text-white' :
                            evt.status === 'draft' ? 'bg-amber-500 text-white' :
                            'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                          }`}>
                            {evt.is_disabled ? 'Disabled' : evt.status}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="text-right space-x-1">
                        {/* VIEW BUTTON */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedEvent(evt); setIsDetailsOpen(true); }}
                          className="h-8 text-xs font-semibold cursor-pointer"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5 text-[#01424E]" /> View
                        </Button>

                        {/* FEATURE STAR BUTTON */}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === evt.id}
                          onClick={() => handleToggleFeatured(evt)}
                          className={`h-8 text-xs cursor-pointer ${evt.is_featured ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800' : 'text-slate-500'}`}
                          title={evt.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                        >
                          {processingId === evt.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Star className={`h-3.5 w-3.5 ${evt.is_featured ? 'fill-amber-400 text-amber-500' : ''}`} />
                          )}
                        </Button>

                        {/* DISABLE / PUBLISH BUTTON */}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === evt.id}
                          onClick={() => handleToggleDisabled(evt)}
                          className={`h-8 text-xs cursor-pointer ${evt.is_disabled ? 'text-emerald-600 border-emerald-300' : 'text-amber-600 border-amber-300'}`}
                          title={evt.is_disabled ? 'Publish Event' : 'Disable Event'}
                        >
                          {processingId === evt.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Ban className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        {/* DELETE BUTTON */}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === evt.id}
                          onClick={() => openDeleteConfirmation(evt)}
                          className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 cursor-pointer"
                          title="Delete event permanently"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : loading ? (
            <div className="p-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#007C46]" /> Loading campus events...
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground text-xs">
              No campus events found matching filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* VIEW EVENT DETAILS MODAL */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01424E] dark:text-teal-100 font-bold text-lg">
              <Calendar className="h-5 w-5 text-[#007C46]" /> Event Details
            </DialogTitle>
            <DialogDescription className="text-xs">Complete event information, telemetry, and contact details</DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-5 py-2 text-xs max-h-[75vh] overflow-y-auto pr-1">
              {/* Banner / Poster Preview */}
              {(selectedEvent.banner_url || selectedEvent.poster_url) ? (
                <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100">
                  <img
                    src={selectedEvent.banner_url || selectedEvent.poster_url || ''}
                    alt={selectedEvent.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-[#01424E] text-[#7CEAAB] font-bold uppercase text-[10px]">
                      {selectedEvent.registration_fee > 0 ? `₹${selectedEvent.registration_fee}` : 'FREE ENTRY'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="h-24 w-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-5 w-5 text-slate-400" />
                  <span className="text-xs font-semibold">No Banner Image Uploaded</span>
                </div>
              )}

              {/* Title & Category Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge className="bg-[#01424E] text-[#7CEAAB] capitalize text-[10px] font-extrabold">{selectedEvent.category || 'General'}</Badge>
                  <Badge className={`capitalize font-bold text-[10px] ${
                    selectedEvent.is_disabled ? 'bg-red-500 text-white' :
                    selectedEvent.status === 'published' ? 'bg-[#007C46] text-white' :
                    'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}>
                    {selectedEvent.is_disabled ? 'Disabled' : selectedEvent.status || 'Not Available'}
                  </Badge>
                </div>
                <h3 className="text-xl font-extrabold text-[#01424E] dark:text-teal-100">{selectedEvent.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {selectedEvent.description || selectedEvent.short_description || 'Not Available'}
                </p>
              </div>

              {/* Event Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailBox icon={<User className="h-4 w-4 text-[#007C46]" />} label="Organizer" value={selectedEvent.profiles?.full_name || 'Not Available'} />
                <DetailBox icon={<MapPin className="h-4 w-4 text-[#007C46]" />} label="Venue & Location" value={[selectedEvent.venue, selectedEvent.building, selectedEvent.room].filter(Boolean).join(', ') || 'Not Available'} />
                <DetailBox icon={<Calendar className="h-4 w-4 text-[#007C46]" />} label="Date Range" value={`Start: ${formatDateStr(selectedEvent.start_date)} | End: ${formatDateStr(selectedEvent.end_date)}`} />
                <DetailBox icon={<Clock className="h-4 w-4 text-[#007C46]" />} label="Event Time" value={`Start: ${formatTimeStr(selectedEvent.start_date)} | End: ${formatTimeStr(selectedEvent.end_date)}`} />
                <DetailBox icon={<Users className="h-4 w-4 text-[#007C46]" />} label="Registrations" value={`${selectedEvent.registrationCount} Registered`} />
                <DetailBox icon={<Users className="h-4 w-4 text-[#007C46]" />} label="Maximum Capacity" value={selectedEvent.max_participants ? `${selectedEvent.max_participants} Participants` : 'Unlimited / Not Specified'} />
                <DetailBox icon={<IndianRupee className="h-4 w-4 text-[#007C46]" />} label="Registration Fee" value={selectedEvent.registration_fee > 0 ? `₹${selectedEvent.registration_fee}` : 'Free Entry'} />
                <DetailBox icon={<Mail className="h-4 w-4 text-[#007C46]" />} label="Contact Info" value={[selectedEvent.contact_email, selectedEvent.contact_phone].filter(Boolean).join(' • ') || 'Not Available'} />
              </div>

              {/* Event Rules / Instructions */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#01424E] dark:text-teal-100">
                  <FileText className="h-4 w-4 text-[#007C46]" />
                  <span>Event Rules & Guidelines</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedEvent.payment_instructions || selectedEvent.volunteer_instructions || 'Not Available'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="text-xs font-bold rounded-xl h-9 px-4">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-red-600 dark:text-red-400 font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Permanently Delete Event
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-relaxed">
              Are you sure you want to permanently delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 leading-relaxed">
              <strong>Warning:</strong> Deleting an event permanently removes all associated registrations, teams, volunteers, certificates, payments, attendance, and feedback.
            </div>

            {eventToDelete && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">{eventToDelete.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Category: {eventToDelete.category || 'General'}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-red-600 dark:text-red-400">
                Please type "DELETE" to confirm:
              </Label>
              <Input
                placeholder="Type DELETE to confirm"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                className="text-xs h-10 border-red-300 dark:border-red-800 focus-visible:ring-red-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsDeleteModalOpen(false); setEventToDelete(null); setConfirmDeleteText(''); }}
              className="text-xs font-bold rounded-xl h-10 flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={confirmDeleteText.trim() !== 'DELETE' || !!processingId}
              onClick={handleConfirmDelete}
              className="text-xs font-bold rounded-xl h-10 flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 cursor-pointer"
            >
              {processingId ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Deleting Event...
                </>
              ) : (
                'Confirm Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-start gap-2.5">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">{label}</span>
        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5 block">{value}</span>
      </div>
    </div>
  );
}
