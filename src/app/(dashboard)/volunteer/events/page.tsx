'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, Handshake, Send, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useCallback } from 'react';
import { volunteerService, parseSkills, PREDEFINED_SKILLS } from '@/services/volunteer-service';
import { eventService } from '@/services/event-service';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

import { checkProfileCompletion, getRequiredMissingFields } from '@/hooks/use-profile-completion';
import { ProfileGuardDialog } from '@/components/shared/profile-guard-dialog';
import { useDataSync } from '@/lib/data-sync';

export default function VolunteerEventsPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [appliedMap, setAppliedMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [applyNotes, setApplyNotes] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  const [guardOpen, setGuardOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const [approvedCounts, setApprovedCounts] = useState<Record<string, number>>({});

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);

      const [eventsRes, volsRes, approvedVolsRes] = await Promise.all([
        eventService.getPublicEvents({ limit: 100 }),
        volunteerService.getVolunteers({ user_id: profile.id, limit: 100 }),
        volunteerService.getVolunteers({ application_status: 'approved', limit: 1000 }),
      ]);

      const activeEvents = (eventsRes.data || []).filter((e: any) => {
        const st = (e.status || 'draft') as string;
        return !e.is_soft_deleted && !e.is_disabled && st !== 'draft' && st !== 'cancelled' && st !== 'disabled' && st !== 'archived';
      });

      setEvents(activeEvents);

      const map: Record<string, any> = {};
      (volsRes.data || []).forEach((v: any) => {
        map[v.event_id] = v;
      });
      setAppliedMap(map);

      const counts: Record<string, number> = {};
      (approvedVolsRes.data || []).forEach((v: any) => {
        counts[v.event_id] = (counts[v.event_id] || 0) + 1;
      });
      setApprovedCounts(counts);
    } catch (err) {
      console.error('Error loading volunteer events:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useDataSync(['volunteers', 'events'], loadData, [profile?.id]);

  const openApply = (evt: any) => {
    if (!profile) return;
    const completion = checkProfileCompletion(profile);
    if (!completion.isComplete) {
      setMissingFields(getRequiredMissingFields(profile));
      setGuardOpen(true);
      return;
    }
    const currentSkills = parseSkills((profile as any).skills);
    setSelectedSkills(currentSkills.length > 0 ? currentSkills : []);
    setApplyNotes('');
    setCustomSkill('');
    setSelectedEvent(evt);
    setApplyOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedEvent || !profile) return;
    try {
      setApplying(true);
      const result = await volunteerService.applyAsVolunteer(
        selectedEvent.id,
        profile.id,
        selectedSkills,
        applyNotes.trim() || undefined
      );
      if (!result) {
        toast.error('Could not submit application. You may have already applied.');
      } else {
        toast.success('Application submitted! Awaiting organizer review.');
        setAppliedMap(prev => ({ ...prev, [selectedEvent.id]: result }));
        setApplyOpen(false);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addCustom = () => {
    const s = customSkill.trim();
    if (!s) return;
    if (!selectedSkills.includes(s)) setSelectedSkills([...selectedSkills, s]);
    setCustomSkill('');
  };

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Volunteer Opportunities</h1>
        <p className="text-muted-foreground">Browse published & upcoming events seeking volunteers and submit your application.</p>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading volunteer opportunities...</div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(evt => {
            const applied = appliedMap[evt.id];
            const startDate = evt.start_date ? format(new Date(evt.start_date), 'MMM dd, yyyy') : 'N/A';
            const startTime = evt.start_date ? format(new Date(evt.start_date), 'hh:mm a') : 'N/A';
            const organizerName = evt.profiles?.full_name || 'Organizer';
            return (
              <Card key={evt.id} className="pt-0 p-0 gap-0 overflow-hidden hover:shadow-lg transition-all border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col h-full bg-card">
                <div className="relative w-full h-36 overflow-hidden rounded-t-2xl bg-slate-900 shrink-0">
                  <img
                    src={evt.poster_url || evt.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200'}
                    alt={evt.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200';
                    }}
                    className="w-full h-full object-cover object-center block"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 pointer-events-none" />

                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <Badge className="bg-white/90 text-[#01424E] border-0 backdrop-blur text-[10px] uppercase tracking-wider font-bold">
                      {evt.category || 'General'}
                    </Badge>
                    <Badge className="bg-[#7CEAAB] text-[#01424E] border-0 text-[10px] uppercase tracking-wider font-bold">
                      {evt.event_type || 'Offline'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end z-10">
                    <div>
                      <div className="flex items-center gap-2 text-white/90 text-xs mb-1 font-medium">
                        <Users className="h-3.5 w-3.5 shrink-0 text-[#7CEAAB]" />
                        <span className="truncate max-w-[160px]">Organized by {organizerName}</span>
                      </div>
                    </div>
                    {(evt.registration_fee || 0) > 0 ? (
                      <Badge className="bg-amber-400 text-amber-950 border-0 font-bold text-[10px]">Paid Event</Badge>
                    ) : (
                      <Badge className="bg-emerald-400 text-emerald-950 border-0 font-bold text-[10px]">Free</Badge>
                    )}
                  </div>
                </div>
                <CardHeader className="p-5 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg leading-snug line-clamp-2 text-[#01424E] dark:text-teal-100">{evt.title}</CardTitle>
                    {applied && (
                      <Badge className={
                        applied.application_status === 'approved'
                          ? 'bg-[#edfcf6] text-[#007C46] border border-[#41B177] shrink-0'
                          : applied.application_status === 'rejected'
                          ? 'bg-red-100 text-red-800 shrink-0'
                          : 'bg-amber-100 text-amber-800 shrink-0'
                      }>
                        {applied.application_status}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 text-sm min-h-[40px]">
                    {evt.short_description || evt.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-2 pb-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4 text-[#007C46]" />
                      <span className="line-clamp-1 font-semibold text-slate-800 dark:text-slate-200">
                        {evt.reporting_location || evt.venue || 'Main Venue'}
                      </span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4 text-[#007C46]" />
                      <span>
                        Reporting:{' '}
                        {evt.reporting_time
                          ? format(new Date(evt.reporting_time), 'MMM dd, yyyy - hh:mm a')
                          : startDate + ' at ' + startTime}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border">
                    <div>
                      <span className="text-muted-foreground block">Volunteers Needed</span>
                      <span className="font-bold text-[#01424E] dark:text-teal-200 text-sm">
                        {evt.volunteers_needed || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Remaining Slots</span>
                      <span className="font-bold text-[#007C46] text-sm">
                        {Math.max(0, (evt.volunteers_needed || 0) - (approvedCounts[evt.id] || 0))}
                      </span>
                    </div>
                  </div>

                  {evt.volunteer_roles && evt.volunteer_roles.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-muted-foreground block">Roles Required:</span>
                      <div className="flex flex-wrap gap-1">
                        {evt.volunteer_roles.map((role: string) => (
                          <Badge
                            key={role}
                            variant="outline"
                            className="text-[10px] border-[#41B177] text-[#007C46] bg-[#edfcf6]/60 dark:bg-teal-950/40"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {!applied ? (
                    <Button onClick={() => openApply(evt)} className="w-full bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-semibold">
                      <Handshake className="mr-2 h-4 w-4" /> Apply as Volunteer
                    </Button>
                  ) : applied.application_status === 'approved' ? (
                    <Button disabled className="w-full bg-[#edfcf6] text-[#007C46] font-semibold opacity-100">
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Application Approved
                    </Button>
                  ) : applied.application_status === 'pending' ? (
                    <Button disabled variant="outline" className="w-full border-amber-300 text-amber-700 font-semibold opacity-100">
                      ⏳ Under Review
                    </Button>
                  ) : (
                    <Button onClick={() => openApply(evt)} variant="outline" className="w-full">
                      Re-apply
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Calendar className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-medium mb-2">No upcoming opportunities</h3>
            <p className="text-muted-foreground max-w-sm">
              Check back soon. New events seeking volunteers will appear here once published.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#01424E] dark:text-teal-100">
              <Handshake className="h-5 w-5 text-[#007C46]" />
              Apply as Volunteer
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.title ? `Volunteering for: ${selectedEvent.title}` : 'Submit your volunteer application'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Select your skills for this role</Label>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {selectedSkills.length} skills
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_SKILLS.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      selectedSkills.includes(skill)
                        ? 'bg-[#007C46] text-white border-[#007C46] shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#41B177] hover:text-[#007C46]'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {selectedSkills.filter(s => !PREDEFINED_SKILLS.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedSkills.filter(s => !PREDEFINED_SKILLS.includes(s)).map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#7CEAAB]/20 text-[#01424E] border border-[#41B177]/30">
                      {skill}
                      <button type="button" onClick={() => toggleSkill(skill)} className="hover:text-red-600 ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Add custom skill..."
                  value={customSkill}
                  onChange={e => setCustomSkill(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                />
                <Button type="button" variant="outline" onClick={addCustom} size="sm">+</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apply-notes">Notes to Organizer (optional)</Label>
              <Textarea
                id="apply-notes"
                rows={4}
                placeholder="Share your availability, past volunteer experience, or why you'd be a great fit..."
                value={applyNotes}
                onChange={e => setApplyNotes(e.target.value)}
              />
            </div>

            {profile && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={profile.profile_picture || ''} />
                  <AvatarFallback className="bg-[#7CEAAB]/20 text-[#01424E]">
                    {(profile.full_name || 'V').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.email} • {profile.department || 'No dept'}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between gap-2 pt-2">
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={applying} className="bg-[#01424E] hover:bg-[#007C46] text-[#7CEAAB] font-semibold">
              {applying ? 'Submitting...' : (<><Send className="mr-2 h-4 w-4" /> Submit Application</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProfileGuardDialog
        open={guardOpen}
        onOpenChange={setGuardOpen}
        missingFields={missingFields}
        actionName="apply as a volunteer"
        userRole="volunteer"
      />
    </div>
  );
}
