'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getRequiredMissingFields } from '@/hooks/use-profile-completion';
import { ProfileGuardDialog } from '@/components/shared/profile-guard-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Eye,
  Clock,
  MapPin,
  ListChecks,
  AlertTriangle,
  X,
  UserCheck,
  Search,
  Loader2,
  Briefcase,
  Layers,
  Calendar,
  Building,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';
import { volunteerService, parseSkills } from '@/services/volunteer-service';
import { eventService } from '@/services/event-service';
import { notificationService } from '@/services/notification-service';
import { toast } from 'sonner';
import type { ChecklistItem, Volunteer, VolunteerTask, Event, VolunteerStatus } from '@/types/database.types';

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TabType = 'applications' | 'assigned' | 'tasks';

export default function VolunteersPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabType>('applications');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [allVolunteers, setAllVolunteers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);

  const [markPresentDialogOpen, setMarkPresentDialogOpen] = useState(false);
  const [taskToMarkPresent, setTaskToMarkPresent] = useState<any>(null);
  const [markingAttendanceLoading, setMarkingAttendanceLoading] = useState(false);

  const handleMarkAttendance = async (taskId: string, status: 'present' | 'absent') => {
    setMarkingAttendanceLoading(true);
    try {
      await toast.promise(volunteerService.markTaskAttendance(taskId, status), {
        loading: `Marking volunteer as ${status}...`,
        success: `Volunteer marked as ${status.toUpperCase()}!`,
        error: `Failed to mark volunteer as ${status}`,
      });
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update attendance');
    } finally {
      setMarkingAttendanceLoading(false);
      setMarkPresentDialogOpen(false);
      setTaskToMarkPresent(null);
    }
  };

  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [newTaskBuilding, setNewTaskBuilding] = useState('');
  const [newTaskFloor, setNewTaskFloor] = useState('');
  const [newTaskRoom, setNewTaskRoom] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskStartTime, setNewTaskStartTime] = useState('');
  const [newTaskEndTime, setNewTaskEndTime] = useState('');
  const [newTaskAssignedVolunteer, setNewTaskAssignedVolunteer] = useState<string>('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: crypto.randomUUID(), text: 'Setup registration desk & laptop connections', completed: false },
    { id: crypto.randomUUID(), text: 'Scan attendee QR codes & hand out ID badges', completed: false }
  ]);

  const [profileGuardOpen, setProfileGuardOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const [eventsRes, volsRes] = await Promise.all([
        eventService.getEvents({ created_by: profile.id, limit: 100 }),
        volunteerService.getVolunteers({ limit: 1000 }),
      ]);

      setEvents(eventsRes.data || []);
      setAllVolunteers(volsRes.data || []);

      if (selectedEventId !== 'all') {
        const taskRes = await volunteerService.getEventTasks(selectedEventId);
        setTasks(taskRes || []);
      } else {
        const organizerEventIds = (eventsRes.data || []).map(e => e.id);
        if (organizerEventIds.length > 0) {
          const allTasksPromises = organizerEventIds.map(eId => volunteerService.getEventTasks(eId));
          const taskResults = await Promise.all(allTasksPromises);
          setTasks(taskResults.flat());
        } else {
          setTasks([]);
        }
      }
    } catch (err) {
      console.error('Error loading volunteer dashboard data:', err);
      toast.error('Failed to load volunteer data');
    } finally {
      setLoading(false);
    }
  }, [profile?.id, selectedEventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ensureProfileComplete = (actionName: string, action: () => void) => {
    if (!profile) return;
    const missing = getRequiredMissingFields(profile);
    if (missing.length > 0) {
      setPendingAction(() => action);
      setProfileGuardOpen(true);
    } else {
      action();
    }
  };

  // Filtered volunteers for Applications tab
  const filteredVolunteers = allVolunteers.filter((vol) => {
    const matchesEvent = selectedEventId === 'all' || vol.event_id === selectedEventId;
    const matchesStatus = statusFilter === 'all' || vol.application_status === statusFilter;
    const s = searchQuery.toLowerCase().trim();
    const name = vol.profiles?.full_name?.toLowerCase() || '';
    const email = vol.profiles?.email?.toLowerCase() || '';
    const dept = vol.profiles?.department?.toLowerCase() || '';
    const skills = (parseSkills(vol.skills) || []).join(' ').toLowerCase();

    const matchesSearch = !s || name.includes(s) || email.includes(s) || dept.includes(s) || skills.includes(s);
    return matchesEvent && matchesStatus && matchesSearch;
  });

  // Assigned volunteers MUST ONLY include 'approved' status
  const assignedVolunteersList = allVolunteers.filter(vol => 
    vol.application_status === 'approved' &&
    (selectedEventId === 'all' || vol.event_id === selectedEventId)
  );

  const approvedVolunteers = allVolunteers.filter(v => 
    v.application_status === 'approved' &&
    (selectedEventId === 'all' || v.event_id === selectedEventId)
  );

  // Open Task dialog pre-filled with selected volunteer
  const handleOpenTaskModalForVolunteer = (volId: string, eventId: string) => {
    setNewTaskAssignedVolunteer(volId);
    setSelectedEventId(eventId);
    setCreateTaskOpen(true);
  };

  // Volunteer approval
  const handleApprove = () => {
    if (!selectedVolunteer || !profile?.id) return;
    const action = async () => {
      try {
        await volunteerService.approveVolunteer(selectedVolunteer.id, profile.id);
        const eventTitle = selectedVolunteer.events?.title || 'the event';
        try {
          await notificationService.createNotification(
            selectedVolunteer.user_id,
            'Volunteer Application Approved',
            `Your application for ${eventTitle} has been approved! Check your workspace for shifts.`,
            'success',
            '/volunteer/tasks'
          );
        } catch (notifErr) {
          console.error('Notification dispatch note:', notifErr);
        }
        toast.success('Volunteer application approved! 🤝');
        setReviewModalOpen(false);
        setSelectedVolunteer(null);
        loadData();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to approve volunteer');
      }
    };
    ensureProfileComplete('approve volunteers', action);
  };

  // Volunteer rejection
  const handleReject = () => {
    if (!selectedVolunteer) return;
    const action = async () => {
      try {
        await volunteerService.rejectVolunteer(selectedVolunteer.id);
        const eventTitle = selectedVolunteer.events?.title || 'the event';
        try {
          await notificationService.createNotification(
            selectedVolunteer.user_id,
            'Volunteer Application Status Update',
            `Your application for ${eventTitle} was not selected at this time.`,
            'info',
            '/volunteer/events'
          );
        } catch (notifErr) {
          console.error('Notification dispatch note:', notifErr);
        }
        toast.success('Volunteer application rejected');
        setReviewModalOpen(false);
        setSelectedVolunteer(null);
        loadData();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to reject volunteer');
      }
    };
    ensureProfileComplete('reject volunteers', action);
  };

  const addChecklistItem = () => {
    setChecklistItems([
      ...checklistItems,
      { id: crypto.randomUUID(), text: '', completed: false }
    ]);
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };

  const updateChecklistItemText = (id: string, text: string) => {
    setChecklistItems(checklistItems.map(item => item.id === id ? { ...item, text } : item));
  };

  const handleCreateTask = () => {
    const action = async () => {
      const assignedVolObj = approvedVolunteers.find(v => v.id === newTaskAssignedVolunteer) || allVolunteers.find(v => v.id === newTaskAssignedVolunteer);
      const targetEventId = assignedVolObj?.event_id || (selectedEventId !== 'all' ? selectedEventId : events[0]?.id);

      if (!targetEventId) {
        toast.error('Could not resolve event for task assignment.');
        return;
      }
      if (!newTaskTitle.trim()) {
        toast.error('Please enter a task title');
        return;
      }
      if (!newTaskAssignedVolunteer) {
        toast.error('Please select a volunteer from the approved list to assign a task');
        return;
      }

      try {
        const fullLocation = [newTaskLocation, newTaskBuilding, newTaskFloor, newTaskRoom]
          .filter(Boolean)
          .join(', ');

        const validChecklist = checklistItems.filter(c => c.text.trim().length > 0);

        await volunteerService.createTask({
          event_id: targetEventId,
          volunteer_id: newTaskAssignedVolunteer,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
          location: fullLocation || 'Main Campus Venue',
          priority: newTaskPriority,
          start_time: newTaskStartTime || new Date().toISOString(),
          end_time: newTaskEndTime || new Date(Date.now() + 4 * 3600000).toISOString(),
          status: 'pending',
          checklist: validChecklist,
        });

        if (assignedVolObj) {
          try {
            await notificationService.createNotification(
              assignedVolObj.user_id,
              'New Volunteer Task Assigned',
              `You have been assigned task: "${newTaskTitle.trim()}". Check details in your workspace.`,
              'info',
              '/volunteer/tasks'
            );
          } catch (notifErr) {
            console.error('Notification dispatch note:', notifErr);
          }
        }

        toast.success('Task assigned successfully to volunteer! 📋');
        setCreateTaskOpen(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskLocation('');
        setNewTaskBuilding('');
        setNewTaskFloor('');
        setNewTaskRoom('');
        setNewTaskAssignedVolunteer('');
        setChecklistItems([
          { id: crypto.randomUUID(), text: 'Setup registration desk & laptop connections', completed: false },
          { id: crypto.randomUUID(), text: 'Scan attendee QR codes & hand out ID badges', completed: false }
        ]);
        loadData();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to create task');
      }
    };
    ensureProfileComplete('assign tasks', action);
  };

  const getStatusBadgeClass = (status: VolunteerStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-[#edfcf6] text-[#007C46] border border-[#41B177] font-bold';
      case 'pending':
        return 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 font-bold';
      case 'rejected':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const selectedVolunteerObj = approvedVolunteers.find(v => v.id === newTaskAssignedVolunteer) || allVolunteers.find(v => v.id === newTaskAssignedVolunteer);
  const assignedEventTitle = selectedVolunteerObj?.events?.title 
    || (selectedEventId !== 'all' ? events.find(e => e.id === selectedEventId)?.title : null) 
    || events[0]?.title 
    || 'Campus Event';

  return (
    <div className="space-y-6 animate-fade-in pb-16 w-full">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Volunteer Management</h1>
          <p className="text-muted-foreground text-sm">Review applications, assign shift duties, manage volunteer attendance and crew presence</p>
        </div>
        <Button
          onClick={() => {
            if (approvedVolunteers.length > 0) {
              handleOpenTaskModalForVolunteer(approvedVolunteers[0].id, approvedVolunteers[0].event_id);
            } else {
              toast.info('Please approve a volunteer application first.');
            }
          }}
          className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Task Assignment
        </Button>
      </div>

      {/* HORIZONTAL SEGMENTED CONTROL TAB BAR */}
      <div className="bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-xl border flex items-center gap-1 w-full max-w-2xl">
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'applications'
              ? 'bg-[#01424E] text-[#7CEAAB] shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Applications</span>
          <Badge className={`ml-1 text-[10px] ${activeTab === 'applications' ? 'bg-[#7CEAAB] text-[#01424E]' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
            {filteredVolunteers.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('assigned')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'assigned'
              ? 'bg-[#01424E] text-[#7CEAAB] shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Assigned Volunteers</span>
          <Badge className={`ml-1 text-[10px] ${activeTab === 'assigned' ? 'bg-[#7CEAAB] text-[#01424E]' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
            {assignedVolunteersList.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'tasks'
              ? 'bg-[#01424E] text-[#7CEAAB] shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50'
          }`}
        >
          <ListChecks className="h-4 w-4" />
          <span>Task Assignments</span>
          <Badge className={`ml-1 text-[10px] ${activeTab === 'tasks' ? 'bg-[#7CEAAB] text-[#01424E]' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
            {tasks.length}
          </Badge>
        </button>
      </div>

      {/* APPLICATIONS TAB */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidate, email, skill, dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <Select value={selectedEventId} onValueChange={(val) => setSelectedEventId(val || 'all')}>
                <SelectTrigger className="w-full sm:w-60 text-xs bg-white dark:bg-slate-900">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organized Events</SelectItem>
                  {events.map((evt) => (
                    <SelectItem key={evt.id} value={evt.id}>
                      {evt.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {['all', 'pending', 'approved', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-[#007C46] text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-muted-foreground">Loading volunteer applications...</div>
            ) : filteredVolunteers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/80">
                    <TableHead className="font-bold text-xs uppercase">Volunteer Candidate</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Event Title</TableHead>
                    <TableHead className="font-bold text-xs uppercase hidden md:table-cell">Department & Year</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Matched Skills</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVolunteers.map((vol) => {
                    const skillsList = parseSkills(vol.skills);
                    return (
                      <TableRow key={vol.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0 border">
                              <AvatarImage src={vol.profiles?.profile_picture || ''} />
                              <AvatarFallback className="bg-[#7CEAAB]/20 text-[#01424E] font-bold text-xs">
                                {(vol.profiles?.full_name || 'V').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-[#01424E] dark:text-teal-100 text-sm">{vol.profiles?.full_name || 'Volunteer Candidate'}</div>
                              <div className="text-xs text-muted-foreground">{vol.profiles?.email}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">{vol.events?.title || 'Campus Event'}</div>
                          <div className="text-[11px] text-muted-foreground">{vol.events?.category}</div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          <div className="text-xs font-medium">{vol.profiles?.department || 'N/A'}</div>
                          <div className="text-[11px] text-muted-foreground">Year: {vol.profiles?.year || 'N/A'}</div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {skillsList.slice(0, 3).map((sk: string) => (
                              <Badge key={sk} variant="outline" className="text-[10px] border-[#41B177] text-[#007C46] bg-[#edfcf6]/50">
                                {sk}
                              </Badge>
                            ))}
                            {skillsList.length > 3 && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                +{skillsList.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className={`capitalize font-bold text-[11px] ${getStatusBadgeClass(vol.application_status)}`}>
                            {vol.application_status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedVolunteer(vol);
                              setReviewModalOpen(true);
                            }}
                            className="text-xs font-bold text-[#01424E] border-[#01424E]/30 hover:bg-[#edfcf6]"
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Review Application
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-16 text-center space-y-3">
                <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
                <div>
                  <h3 className="font-bold text-base text-[#01424E] dark:text-teal-100">No Volunteer Applications</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    No volunteer applications match your search or status filter.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSIGNED VOLUNTEERS TAB */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-sm text-[#01424E] dark:text-teal-100 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#007C46]" /> Active Event Crew ({assignedVolunteersList.length})
            </h3>
            <span className="text-xs text-muted-foreground">Approved volunteers for your events ready for task assignment</span>
          </div>

          <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
            {assignedVolunteersList.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/80">
                    <TableHead className="font-bold text-xs uppercase">Volunteer</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Role & Skills</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Assigned Task</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Reporting Location</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedVolunteersList.map((vol) => {
                    const assignedTask = tasks.find(t => t.volunteer_id === vol.id);
                    const skillsList = parseSkills(vol.skills);
                    return (
                      <TableRow key={vol.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0 border">
                              <AvatarImage src={vol.profiles?.profile_picture || ''} />
                              <AvatarFallback className="bg-[#7CEAAB]/20 text-[#01424E] font-bold text-xs">
                                {(vol.profiles?.full_name || 'V').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-[#01424E] dark:text-teal-100 text-sm">{vol.profiles?.full_name}</div>
                              <div className="text-xs text-muted-foreground">{vol.profiles?.department || 'Dept'} • Year {vol.profiles?.year || 'N/A'} • 📞 {vol.profiles?.phone || 'No phone'}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {skillsList.slice(0, 2).map((sk: string) => (
                              <Badge key={sk} variant="outline" className="text-[10px] border-[#41B177] text-[#007C46] bg-[#edfcf6]/50">
                                {sk}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell>
                          {assignedTask ? (
                            <div className="font-bold text-xs text-indigo-900 dark:text-indigo-300">
                              {assignedTask.title}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No task assigned</span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs">
                          <div>📍 {assignedTask?.location || vol.events?.reporting_location || vol.events?.venue || 'Main Entrance'}</div>
                        </TableCell>

                        <TableCell>
                          <Badge className="bg-[#edfcf6] text-[#007C46] border border-[#41B177] text-[11px] font-bold">
                            APPROVED CREW
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenTaskModalForVolunteer(vol.id, vol.event_id)}
                            className="text-xs bg-white text-[#007C46] border-[#007C46]/30 font-bold"
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" /> Assign Task
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-16 text-center space-y-3">
                <UserCheck className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
                <div>
                  <h3 className="font-bold text-base text-[#01424E] dark:text-teal-100">No Active Assigned Volunteers</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Approved volunteers for your events will appear here ready for shift assignment and duty tracking.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TASK ASSIGNMENTS TAB */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="font-bold text-sm text-[#01424E] dark:text-teal-100 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-[#007C46]" /> Event Shift Duties ({tasks.length})
              </h3>
              <p className="text-xs text-muted-foreground">Active task assignments for volunteer crew</p>
            </div>
            <Button
              onClick={() => {
                if (approvedVolunteers.length > 0) {
                  handleOpenTaskModalForVolunteer(approvedVolunteers[0].id, approvedVolunteers[0].event_id);
                } else {
                  toast.info('Please approve a volunteer application first.');
                }
              }}
              size="sm"
              className="bg-[#007C46] text-white hover:bg-[#007C46]/90 text-xs font-bold"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Task
            </Button>
          </div>

          <div className="rounded-xl border bg-white dark:bg-slate-900 overflow-hidden">
            {tasks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/80">
                    <TableHead className="font-bold text-xs uppercase">Volunteer</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Task</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Priority</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Accepted</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Accepted At</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Attendance Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const isAccepted = task.status === 'accepted' || !!task.accepted_at;
                    return (
                      <TableRow key={task.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <TableCell>
                          <div className="font-bold text-[#01424E] dark:text-teal-100 text-sm">
                            {task.volunteers?.profiles?.full_name || 'Assigned Volunteer'}
                          </div>
                          <div className="text-xs text-muted-foreground">{task.volunteers?.profiles?.email}</div>
                          {task.volunteers?.profiles?.department && (
                            <div className="text-[11px] text-muted-foreground">{task.volunteers?.profiles?.department}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">{task.title}</div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1">{task.description}</div>
                          {task.location && <div className="text-[11px] text-muted-foreground mt-0.5">📍 {task.location}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge className="uppercase text-[10px] bg-amber-100 text-amber-900 font-bold border-0">
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isAccepted ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border-emerald-500/30 text-[11px]">
                              ✅ Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 text-[11px]">
                              ❌ No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {task.accepted_at ? new Date(task.accepted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                        </TableCell>
                        <TableCell>
                          {task.attendance_status === 'present' ? (
                            <Badge className="bg-emerald-600 text-white font-bold text-[11px]">Present ✅</Badge>
                          ) : task.attendance_status === 'absent' ? (
                            <Badge variant="destructive" className="font-bold text-[11px]">Absent ❌</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[11px]">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAccepted && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setTaskToMarkPresent(task);
                                    setMarkPresentDialogOpen(true);
                                  }}
                                  className="h-7 text-xs bg-[#007C46] hover:bg-[#006036] text-white font-semibold"
                                >
                                  Mark Present
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAttendance(task.id, 'absent')}
                                  className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                  Mark Absent
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-16 text-center space-y-3">
                <ListChecks className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
                <div>
                  <h3 className="font-bold text-base text-[#01424E] dark:text-teal-100">No Shift Tasks Created</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Click "Add Task" on an approved volunteer to delegate shift duties.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VOLUNTEER REVIEW MODAL */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-4xl sm:max-w-[950px] w-full p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[#007C46]" /> Volunteer Application Review
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Applicant profile details, skills, notes, and approval decision
                </DialogDescription>
              </div>
              {selectedVolunteer && (
                <Badge className={`capitalize font-bold text-xs ${getStatusBadgeClass(selectedVolunteer.application_status)}`}>
                  {selectedVolunteer.application_status}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {selectedVolunteer && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-4">
              <div className="md:col-span-5 space-y-4 border-r md:pr-6">
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border">
                  <Avatar className="h-20 w-20 border-2 border-white dark:border-slate-800 shadow-md mb-2">
                    <AvatarImage src={selectedVolunteer.profiles?.profile_picture || ''} />
                    <AvatarFallback className="bg-[#7CEAAB]/20 text-[#01424E] font-bold text-xl">
                      {(selectedVolunteer.profiles?.full_name || 'V').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-bold text-[#01424E] dark:text-teal-100">{selectedVolunteer.profiles?.full_name}</h3>
                  <Badge className="bg-[#007C46] text-white mt-1 text-[10px]">Volunteer Applicant</Badge>
                </div>

                <div className="space-y-2.5 text-xs bg-slate-50/50 dark:bg-slate-900/30 p-3.5 rounded-xl border">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{selectedVolunteer.profiles?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedVolunteer.profiles?.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedVolunteer.profiles?.department || 'General'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">Year {selectedVolunteer.profiles?.year || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <span className="text-muted-foreground block text-[10px] font-semibold uppercase">College</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{selectedVolunteer.profiles?.college || 'Main Campus'}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-7 space-y-4">
                <div className="p-3.5 rounded-xl border bg-[#edfcf6]/30 dark:bg-teal-950/20 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Target Event Application</div>
                  <h4 className="text-base font-bold text-[#01424E] dark:text-teal-100">{selectedVolunteer.events?.title || 'Campus Event'}</h4>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-0.5">
                    <span>📍 {selectedVolunteer.events?.venue || 'Main Venue'}</span>
                    <span>🗓 Applied: {selectedVolunteer.created_at ? new Date(selectedVolunteer.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Matched Skills</label>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border bg-white dark:bg-slate-900 min-h-[48px] items-center">
                    {parseSkills(selectedVolunteer.skills).length > 0 ? (
                      parseSkills(selectedVolunteer.skills).map((sk: string) => (
                        <Badge key={sk} className="bg-[#7CEAAB]/20 text-[#01424E] border border-[#41B177]/40 font-bold text-xs py-0.5 px-2">
                          {sk}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No specific skills tagged</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Applicant Notes to Organizer</label>
                  <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 min-h-[80px] whitespace-pre-line italic">
                    {selectedVolunteer.notes || 'No additional notes provided by applicant.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Close
            </Button>
            <div className="flex items-center gap-2">
              {selectedVolunteer?.application_status === 'pending' && (
                <>
                  <Button variant="outline" onClick={handleReject} className="text-red-600 border-red-300 hover:bg-red-50">
                    <XCircle className="mr-1.5 h-4 w-4" /> Reject Application
                  </Button>
                  <Button onClick={handleApprove} className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve Volunteer
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSIGN VOLUNTEER TASK DIALOG (NO Volunteer Dropdown, READ-ONLY Assigned Event Title) */}
      <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
        <DialogContent className="max-w-2xl sm:max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl">
          <DialogHeader className="pb-3 border-b space-y-1">
            <DialogTitle className="text-2xl font-extrabold text-[#01424E] dark:text-teal-100 flex items-center gap-2.5">
              <ListChecks className="h-6 w-6 text-[#007C46]" /> Assign Volunteer Task
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign duties and reporting details for this volunteer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 text-xs">
            {/* Task Title */}
            <div className="space-y-2">
              <label className="font-bold text-xs text-slate-800 dark:text-slate-200">Task Title *</label>
              <Input
                placeholder="e.g. Registration Desk Badge Distribution & Scanner"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="text-xs h-10 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Assigned Event (Purely Read-Only Text - No Dropdown / Input) */}
            <div className="space-y-2">
              <label className="font-bold text-xs text-slate-800 dark:text-slate-200">Assigned Event *</label>
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-[#01424E] dark:text-teal-200 flex items-center gap-2 select-none">
                <Calendar className="h-4 w-4 text-[#007C46] shrink-0" />
                <span>{assignedEventTitle}</span>
              </div>
            </div>

            {/* Priority & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-bold text-xs text-slate-800 dark:text-slate-200">Priority</label>
                <Select value={newTaskPriority} onValueChange={(val) => setNewTaskPriority(val as TaskPriority)}>
                  <SelectTrigger className="h-10 text-xs bg-slate-50/50 dark:bg-slate-900/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="urgent">Urgent Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-xs text-slate-800 dark:text-slate-200">Reporting Location</label>
                <Input
                  placeholder="e.g. Main Auditorium Entrance"
                  value={newTaskLocation}
                  onChange={(e) => setNewTaskLocation(e.target.value)}
                  className="text-xs h-10 bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
            </div>

            {/* Building / Floor / Room/Lab */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-[11px] text-muted-foreground uppercase">Building</label>
                <Input
                  placeholder="e.g. Block B"
                  value={newTaskBuilding}
                  onChange={(e) => setNewTaskBuilding(e.target.value)}
                  className="text-xs h-9 bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-[11px] text-muted-foreground uppercase">Floor</label>
                <Input
                  placeholder="e.g. 3rd Floor"
                  value={newTaskFloor}
                  onChange={(e) => setNewTaskFloor(e.target.value)}
                  className="text-xs h-9 bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-[11px] text-muted-foreground uppercase">Room / Lab</label>
                <Input
                  placeholder="e.g. Room 302"
                  value={newTaskRoom}
                  onChange={(e) => setNewTaskRoom(e.target.value)}
                  className="text-xs h-9 bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
            </div>

            {/* Reporting Start & Shift End */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-bold text-xs text-slate-800 dark:text-slate-200">Reporting Start *</label>
                <Input
                  type="datetime-local"
                  value={newTaskStartTime}
                  onChange={(e) => setNewTaskStartTime(e.target.value)}
                  className="text-xs h-10 bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-xs text-slate-800 dark:text-slate-200">Shift End *</label>
                <Input
                  type="datetime-local"
                  value={newTaskEndTime}
                  onChange={(e) => setNewTaskEndTime(e.target.value)}
                  className="text-xs h-10 bg-slate-50/50 dark:bg-slate-900/50"
                />
              </div>
            </div>

            {/* Special Instructions */}
            <div className="space-y-2">
              <label className="font-bold text-xs text-slate-800 dark:text-slate-200">Special Instructions</label>
              <Textarea
                rows={2}
                placeholder="Specific instructions for volunteer on duty..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="text-xs bg-slate-50/50 dark:bg-slate-900/50"
              />
            </div>

            {/* Checklist Duties */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Checklist Duties</label>
                <Button type="button" variant="outline" size="sm" onClick={addChecklistItem} className="h-7 text-xs border-[#007C46] text-[#007C46] hover:bg-[#edfcf6] font-semibold">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Duty
                </Button>
              </div>

              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {checklistItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2.5">
                    <span className="font-bold text-xs text-muted-foreground w-6 text-right shrink-0">{idx + 1}.</span>
                    <Input
                      placeholder="Enter specific duty or task step..."
                      value={item.text}
                      onChange={(e) => updateChecklistItemText(item.id, e.target.value)}
                      className="text-xs flex-1 h-9 bg-slate-50/50 dark:bg-slate-900/50"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeChecklistItem(item.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setCreateTaskOpen(false)} className="h-10 px-5">
              Cancel
            </Button>
            <Button onClick={handleCreateTask} className="bg-[#007C46] text-white hover:bg-[#007C46]/90 font-bold h-10 px-6">
              Assign Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MARK PRESENT CONFIRMATION DIALOG */}
      <Dialog open={markPresentDialogOpen} onOpenChange={setMarkPresentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#01424E] dark:text-teal-100 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#007C46]" /> Mark Volunteer as Present
            </DialogTitle>
            <DialogDescription className="text-xs pt-2 leading-relaxed">
              Mark this volunteer as <strong className="text-emerald-600 dark:text-emerald-400">PRESENT</strong> for the event?
              <br /><br />
              <span className="text-amber-800 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 p-2 rounded block border border-amber-200 dark:border-amber-900">
                ⚠️ Only volunteers marked Present will receive volunteer certificates.
              </span>
            </DialogDescription>
          </DialogHeader>

          {taskToMarkPresent && (
            <div className="py-2 text-xs space-y-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
              <div>👤 <strong>Volunteer:</strong> {taskToMarkPresent.volunteers?.profiles?.full_name || 'Volunteer'}</div>
              <div>📋 <strong>Task:</strong> {taskToMarkPresent.title}</div>
              <div>⏰ <strong>Accepted At:</strong> {taskToMarkPresent.accepted_at ? new Date(taskToMarkPresent.accepted_at).toLocaleString() : 'Yes'}</div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setMarkPresentDialogOpen(false)} disabled={markingAttendanceLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => handleMarkAttendance(taskToMarkPresent.id, 'present')}
              className="bg-[#007C46] hover:bg-[#006036] text-white font-bold"
              disabled={markingAttendanceLoading}
            >
              {markingAttendanceLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
              Confirm Present
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProfileGuardDialog
        open={profileGuardOpen}
        onOpenChange={(open) => {
          setProfileGuardOpen(open);
          if (!open) setPendingAction(null);
        }}
        missingFields={[]}
        userRole="organizer"
      />
    </div>
  );
}
