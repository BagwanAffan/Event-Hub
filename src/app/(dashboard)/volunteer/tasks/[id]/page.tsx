'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, MapPin, User, ArrowLeft, CheckCircle2, Play, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { volunteerService } from '@/services/volunteer-service';
import type { ChecklistItem } from '@/types/database.types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

import { checkProfileCompletion, getRequiredMissingFields } from '@/hooks/use-profile-completion';
import { ProfileGuardDialog } from '@/components/shared/profile-guard-dialog';

type TaskStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

const getPriorityBadgeVariant = (priority: string) => {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'destructive' as const;
    default:
      return 'default' as const;
  }
};

const getPriorityBadgeClass = (priority: string) => {
  if (priority === 'urgent' || priority === 'high') return '';
  return 'bg-[#edfcf6] text-[#007C46]';
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'Urgent Priority';
    case 'high':
      return 'High Priority';
    case 'medium':
      return 'Medium Priority';
    default:
      return priority;
  }
};

export default function TaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile, user } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [updatingChecklist, setUpdatingChecklist] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [guardOpen, setGuardOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [guardAction, setGuardAction] = useState<(() => void) | null>(null);

  console.log("[PAGE] params.id =", id);
  console.log("[PAGE] profile.id =", profile?.id);
  console.log("[PAGE] auth.uid =", user?.id);

  const loadTask = async () => {
    setLoading(true);
    console.log("[PAGE loadTask] Triggered with id =", id, "profile.id =", profile?.id);
    try {
      const data = await volunteerService.getTaskById(id, profile?.id);
      console.log("[PAGE loadTask] Returned data =", data);
      setTask(data);
      if (data && Array.isArray(data.checklist)) {
        setChecklist(data.checklist);
      } else {
        setChecklist([]);
      }
    } catch (err) {
      console.error('[PAGE loadTask] Exception caught:', err);
      setTask(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [id, profile?.id]);

  const ensureProfileComplete = (actionName: string, onSuccess: () => void): boolean => {
    if (!profile) return false;
    const completion = checkProfileCompletion(profile);
    if (!completion.isComplete) {
      setMissingFields(getRequiredMissingFields(profile));
      setGuardAction(() => onSuccess);
      setGuardOpen(true);
      return false;
    }
    return true;
  };

  const toggleCheck = async (itemId: string) => {
    const newChecklist = checklist.map(c =>
      c.id === itemId ? { ...c, completed: !c.completed } : c
    );
    setChecklist(newChecklist);
    setUpdatingChecklist(itemId);
    try {
      await volunteerService.updateTaskChecklist(id, newChecklist);
      setTask((prev: any) => prev ? { ...prev, checklist: newChecklist } : prev);
      toast.success('Checklist updated');
    } catch (err: any) {
      setChecklist(checklist);
      toast.error(err?.message || 'Failed to update checklist');
    } finally {
      setUpdatingChecklist(null);
    }
  };

  const handleUpdateStatus = (newStatus: TaskStatus, actionName: string) => {
    const action = async () => {
      setUpdatingStatus(true);
      try {
        await toast.promise(volunteerService.updateTaskStatus(id, newStatus), {
          loading: 'Updating task status...',
          success: `Task marked as ${newStatus.replace('_', ' ')}!`,
          error: 'Failed to update task status',
        });
        await loadTask();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to update task status');
      } finally {
        setUpdatingStatus(false);
      }
    };
    if (!ensureProfileComplete(actionName, action)) return;
    action();
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div>
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log("[RENDER] task =", task);
  console.log("[RENDER] loading =", loading);

  if (!task) return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/volunteer/tasks">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Not Found</h1>
        </div>
      </div>
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          The task you are looking for does not exist or has been removed.
        </CardContent>
      </Card>
    </div>
  );

  const completedCount = checklist.filter(c => c.completed).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/volunteer/tasks">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-teal-100">Task Details</h1>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="capitalize text-xs">
                  {task.status?.replace('_', ' ') || 'unknown'}
                </Badge>
              </div>
              <CardTitle className="text-2xl mb-2 text-[#01424E] dark:text-teal-100">{task.title}</CardTitle>
              <p className="text-muted-foreground">{task.description}</p>
            </div>
            <Badge
              variant={getPriorityBadgeVariant(task.priority)}
              className={getPriorityBadgeClass(task.priority)}
            >
              {getPriorityLabel(task.priority)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {task.start_time && task.end_time && (
              <div className="flex items-center text-sm">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{new Date(task.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(task.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {task.location && (
              <div className="flex items-center text-sm">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{task.location}</span>
              </div>
            )}
            <div className="flex items-center text-sm">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Event: {task.events?.title || 'Unknown'}</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-[#01424E] dark:text-teal-100">Checklist</h3>
              {totalCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {completedCount} / {totalCount} ({progressPercent}%)
                </Badge>
              )}
            </div>

            {totalCount > 0 && (
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-[#007C46] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            <div className="space-y-3">
              {checklist.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No checklist items for this task.</p>
              ) : (
                checklist.map((item) => {
                  const isUpdating = updatingChecklist === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="relative flex items-center">
                        <Checkbox
                          id={`check-${item.id}`}
                          checked={item.completed}
                          onCheckedChange={() => toggleCheck(item.id)}
                          disabled={isUpdating}
                          className="data-[state=checked]:bg-[#007C46] data-[state=checked]:border-[#007C46]"
                        />
                        {isUpdating && (
                          <Loader2 className="absolute -right-5 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <label
                        htmlFor={`check-${item.id}`}
                        className={`flex-1 text-sm font-medium leading-none cursor-pointer select-none ${
                          item.completed ? 'line-through text-muted-foreground' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {item.text}
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            {(!task.accepted_at && task.status !== 'accepted') ? (
              <Button
                onClick={() => {
                  const action = async () => {
                    setUpdatingStatus(true);
                    try {
                      await toast.promise(volunteerService.acceptTask(id), {
                        loading: 'Accepting task assignment...',
                        success: 'Task accepted successfully!',
                        error: 'Failed to accept task',
                      });
                      await loadTask();
                    } catch (err: any) {
                      toast.error(err?.message || 'Failed to accept task');
                    } finally {
                      setUpdatingStatus(false);
                    }
                  };
                  if (!ensureProfileComplete('accept task', action)) return;
                  action();
                }}
                className="w-full sm:w-auto bg-[#007C46] hover:bg-[#006036] text-white font-semibold px-8 shadow-md"
                disabled={updatingStatus}
              >
                {updatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Accept Task
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 px-3 py-1 text-sm font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Accepted
                </Badge>
                {task.accepted_at && (
                  <span className="text-xs text-muted-foreground">
                    Accepted on {new Date(task.accepted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Post-Event Attendance:</span>
              {task.attendance_status === 'present' ? (
                <Badge className="bg-emerald-600 text-white font-bold px-3 py-1 text-sm">
                  Present ✅
                </Badge>
              ) : task.attendance_status === 'absent' ? (
                <Badge variant="destructive" className="font-bold px-3 py-1 text-sm">
                  Absent ❌
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300/40 font-medium px-3 py-1 text-sm">
                  Waiting for attendance verification
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileGuardDialog
        open={guardOpen}
        onOpenChange={(open) => {
          setGuardOpen(open);
          if (!open) setGuardAction(null);
        }}
        missingFields={missingFields}
        userRole="volunteer"
      />
    </div>
  );
}
