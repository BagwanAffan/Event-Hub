'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { GridSkeleton } from '@/components/ui/page-skeleton';
import { Clock, MapPin, CheckCircle2, Loader2, CheckSquare } from 'lucide-react';
import { volunteerService } from '@/services/volunteer-service';
import { toast } from 'sonner';
import Link from 'next/link';

import { checkProfileCompletion, getRequiredMissingFields } from '@/hooks/use-profile-completion';
import { ProfileGuardDialog } from '@/components/shared/profile-guard-dialog';

type FilterStatus = 'all' | 'assigned' | 'accepted';

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All Tasks' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'accepted', label: 'Accepted' },
];

const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    default:
      return 'bg-[#edfcf6] text-[#007C46]';
  }
};

export default function VolunteerTasksPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [guardOpen, setGuardOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const loadTasks = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await volunteerService.getAssignedTasks(profile.id);
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [profile?.id]);

  const ensureProfileComplete = (actionName: string): boolean => {
    if (!profile) return false;
    const completion = checkProfileCompletion(profile);
    if (!completion.isComplete) {
      setMissingFields(getRequiredMissingFields(profile));
      setGuardOpen(true);
      return false;
    }
    return true;
  };

  const handleAcceptTask = async (taskId: string) => {
    if (!ensureProfileComplete('accept task')) return;
    setUpdatingId(taskId);
    try {
      await toast.promise(volunteerService.acceptTask(taskId), {
        loading: 'Accepting task assignment...',
        success: 'Task accepted successfully!',
        error: 'Failed to accept task',
      });
      await loadTasks();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept task');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => (filter === 'accepted' ? (t.status === 'accepted' || !!t.accepted_at) : (t.status !== 'accepted' && !t.accepted_at)));

  const renderTaskCard = (task: any) => {
    const isUpdating = updatingId === task.id;
    const isAccepted = task.status === 'accepted' || !!task.accepted_at;

    return (
      <Card key={task.id} className="flex flex-col border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-base font-bold text-[#01424E] dark:text-teal-100">{task.title}</CardTitle>
            <Badge className={getPriorityBadgeClass(task.priority)}>
              {task.priority}
            </Badge>
          </div>
          <CardDescription className="text-xs">{task.events?.title || 'Assigned Event'}</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4 text-xs">
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex-1">{task.description}</p>
          
          <div className="space-y-2 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
            {task.start_time && task.end_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#007C46]" />
                <span>{new Date(task.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(task.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {task.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#007C46]" />
                <span>{task.location}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t text-xs">
            <span className="text-muted-foreground font-semibold">Status:</span>
            {isAccepted ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold">
                Accepted
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
                Assigned
              </Badge>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-2 border-t mt-4">
            {!isAccepted && (
              <Button
                onClick={() => handleAcceptTask(task.id)}
                className="w-full bg-[#007C46] text-white hover:bg-[#006036] font-bold text-xs shadow-sm"
                size="sm"
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                Accept Task Assignment
              </Button>
            )}
            <Button variant="outline" size="sm" className="w-full text-xs font-semibold" asChild>
              <Link href={`/volunteer/tasks/${task.id}`}>View Task Details</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">My Assigned Tasks & Checklist</h1>
          <p className="text-muted-foreground text-xs mt-1">Track your assigned shift duties, location, and progress status</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(sf => (
            <Button
              key={sf.value}
              variant={filter === sf.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(sf.value)}
              className={filter === sf.value ? 'bg-[#01424E] text-[#7CEAAB] font-bold' : 'text-xs'}
            >
              {sf.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <GridSkeleton count={3} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No Assigned Shift Tasks"
          description={filter === 'all'
            ? 'You currently have no tasks assigned. Apply to volunteer opportunities or check back once organizers publish shift assignments.'
            : `No tasks found matching filter "${filter.replace('_', ' ')}".`}
          actionLabel="Browse Volunteer Opportunities"
          actionHref="/volunteer/events"
          className="mt-6"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map(renderTaskCard)}
        </div>
      )}

      <ProfileGuardDialog
        open={guardOpen}
        onOpenChange={setGuardOpen}
        missingFields={missingFields}
        userRole="volunteer"
      />
    </div>
  );
}
