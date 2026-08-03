'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  IndianRupee,
  ScanLine,
  RefreshCw,
  Star,
  Ban,
  Trash2,
  CheckCircle2,
  Building,
  GraduationCap,
} from 'lucide-react';
import { adminService, EnrichedAdminEvent } from '@/services/admin-service';
import { toast } from 'sonner';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EnrichedAdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // View Event Details Modal State
  const [selectedEvent, setSelectedEvent] = useState<EnrichedAdminEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllEventsForAdmin({
        status: statusFilter,
        category: categoryFilter,
        search,
      });
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to load events for admin:', err);
      toast.error('Failed to load campus events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleToggleDisabled = async (evt: EnrichedAdminEvent) => {
    const nextState = !evt.is_disabled;
    setProcessingId(evt.id);
    try {
      await adminService.toggleEventDisabled(evt.id, nextState);
      toast.info(`Event "${evt.title}" is now ${nextState ? 'Disabled' : 'Enabled'}.`);
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update event state');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleFeatured = async (evt: EnrichedAdminEvent) => {
    const nextState = !evt.is_featured;
    setProcessingId(evt.id);
    try {
      await adminService.toggleEventFeatured(evt.id, nextState);
      toast.success(`Event "${evt.title}" ${nextState ? 'Featured on Showcase ⭐' : 'Unfeatured'}.`);
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to feature event');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSoftDelete = async (evt: EnrichedAdminEvent) => {
    if (!confirm(`Are you sure you want to soft delete event "${evt.title}"?`)) return;
    setProcessingId(evt.id);
    try {
      await adminService.softDeleteEvent(evt.id);
      toast.warning(`Event "${evt.title}" soft deleted.`);
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to soft delete event');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Campus Events Governance</h1>
          <p className="text-muted-foreground text-sm">Monitor, feature, disable, soft delete, and inspect all posted campus events</p>
        </div>
        <Badge className="bg-[#edfcf6] text-[#007C46] border-[#41B177] px-3 py-1 text-xs font-bold">
          {events.length} Active Events
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
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Category:</span>
                <Select value={categoryFilter} onValueChange={(val) => val && setCategoryFilter(val)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="hackathon">Hackathon</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="robotics">Robotics</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" variant="secondary" size="sm" className="shrink-0 font-semibold">
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
                  <TableHead className="font-bold text-xs uppercase">Attendance</TableHead>
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
                        {evt.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{evt.profiles?.full_name || 'Organizer'}</div>
                      <div className="text-[11px] text-muted-foreground">{evt.profiles?.college || 'Apex Institute'}</div>
                    </TableCell>
                    <TableCell>
                      <div>{new Date(evt.start_date).toLocaleDateString()}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{evt.venue || 'Main Auditorium'}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                      {evt.registrationCount} / {evt.max_participants || '100'}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
                        {evt.attendanceCount} Scanned
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-[#007C46]">
                      ₹{(evt.revenue || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={`capitalize font-bold text-[10px] ${
                          evt.status === 'published' ? 'bg-[#007C46] text-white' :
                          evt.status === 'draft' ? 'bg-amber-500 text-white' :
                          'bg-slate-200 text-slate-800'
                        }`}>
                          {evt.status}
                        </Badge>
                        {evt.is_disabled && (
                          <Badge className="bg-red-500 text-white text-[9px] font-bold">DISABLED</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedEvent(evt); setIsDetailsOpen(true); }}
                        className="h-8 text-xs font-semibold"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5 text-[#01424E]" /> View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === evt.id}
                        onClick={() => handleToggleFeatured(evt)}
                        className={`h-8 text-xs ${evt.is_featured ? 'text-amber-600 bg-amber-50' : 'text-slate-600'}`}
                        title="Toggle Featured"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === evt.id}
                        onClick={() => handleToggleDisabled(evt)}
                        className={`h-8 text-xs ${evt.is_disabled ? 'text-emerald-600' : 'text-amber-600'}`}
                        title={evt.is_disabled ? 'Enable Event' : 'Disable Event'}
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === evt.id}
                        onClick={() => handleSoftDelete(evt)}
                        className="h-8 text-xs text-red-600 hover:bg-red-50"
                        title="Soft delete event"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No campus events found matching filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Event Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01424E] dark:text-teal-100">
              <Calendar className="h-5 w-5 text-[#007C46]" /> Event Details & Administrative Actions
            </DialogTitle>
            <DialogDescription>Telemetry, venue details, and registration statistics</DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 py-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="bg-[#01424E] text-[#7CEAAB] capitalize mb-1">{selectedEvent.category}</Badge>
                    <h3 className="text-lg font-bold text-[#01424E] dark:text-teal-100">{selectedEvent.title}</h3>
                    <p className="text-muted-foreground text-xs">{selectedEvent.short_description || selectedEvent.description}</p>
                  </div>
                  <Badge className="bg-[#007C46] text-white font-bold text-xs">
                    {selectedEvent.registration_fee > 0 ? `₹${selectedEvent.registration_fee}` : 'FREE ENTRY'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 border rounded-xl bg-white dark:bg-slate-900">
                <div>
                  <span className="text-muted-foreground text-[10px] font-bold block uppercase">Organizer Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEvent.profiles?.full_name || 'Organizer'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] font-bold block uppercase">Campus Institution</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEvent.profiles?.college || 'Apex Institute'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] font-bold block uppercase">Venue & Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEvent.venue || 'Main Auditorium'}, {selectedEvent.building || 'Block B'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] font-bold block uppercase">Registration Mode</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEvent.registration_mode} (Max {selectedEvent.max_team_size}/team)</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border text-center">
                  <span className="text-muted-foreground text-[10px] font-bold block uppercase">Registrations</span>
                  <span className="text-lg font-extrabold text-blue-700 dark:text-blue-300">{selectedEvent.registrationCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border text-center">
                  <span className="text-muted-foreground text-[10px] font-bold block uppercase">Verified Check-ins</span>
                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">{selectedEvent.attendanceCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border text-center">
                  <span className="text-muted-foreground text-[10px] font-bold block uppercase">Total Revenue</span>
                  <span className="text-lg font-extrabold text-[#007C46]">₹{(selectedEvent.revenue || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close Monitor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
