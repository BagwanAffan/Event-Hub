'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { notificationService } from '@/services/notification-service';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, Check, Megaphone, AlertTriangle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/database.types';
import { PROFILE_REMINDER_TITLE } from '@/hooks/use-profile-completion';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

export default function VolunteerNotificationsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const data = await notificationService.getNotificationsSortedWithPinned(profile.id);
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [profile?.id]);

  const handleMarkAllRead = async () => {
    if (!profile?.id) return;
    const previous = [...notifications];
    setNotifications(prev => prev.map(n =>
      n.title === PROFILE_REMINDER_TITLE ? n : { ...n, read: true }
    ));
    try {
      await notificationService.markAllAsRead(profile.id);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications(previous);
    }
  };

  const handleClearAll = async () => {
    if (!profile?.id) return;
    try {
      await notificationService.clearAllNotifications(profile.id);
      setNotifications(prev => prev.filter(n => n.title === PROFILE_REMINDER_TITLE));
      toast.success("All notifications cleared");
    } catch (error) {
      toast.error("Failed to clear notifications");
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.title === PROFILE_REMINDER_TITLE) {
      if (notification.action_url) router.push(notification.action_url);
      return;
    }
    if (notification.read) return;
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    try {
      await notificationService.markAsRead(notification.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.title === PROFILE_REMINDER_TITLE) return;
    const previous = [...notifications];
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    try {
      await notificationService.deleteNotification(notification.id, profile?.id);
      toast.success("Notification deleted");
    } catch (error) {
      console.error('Error deleting notification:', error);
      setNotifications(previous);
    }
  };

  const getIcon = (type: string, title?: string) => {
    if (title === PROFILE_REMINDER_TITLE) return <User className="h-5 w-5 text-amber-500" />;
    const normalizedType = type?.toLowerCase();
    switch (normalizedType) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      case 'announcement':
        return <Megaphone className="h-5 w-5 text-purple-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-sky-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const deletableCount = notifications.filter(n => n.title !== PROFILE_REMINDER_TITLE).length;

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Notifications"
        description="Stay updated with your volunteer assignments, task updates, and announcements"
      >
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead} className="shrink-0 text-xs font-bold">
              <Check className="mr-1.5 h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
          {deletableCount > 0 && (
            <Button variant="outline" onClick={handleClearAll} className="shrink-0 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear all
            </Button>
          )}
        </div>
      </PageHeader>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const isProfileReminder = notification.title === PROFILE_REMINDER_TITLE;
            return (
              <Card
                key={notification.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isProfileReminder
                    ? "border-2 border-amber-400/60 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900 shadow-sm"
                    : !notification.read ? "bg-slate-50 dark:bg-slate-900/50 border-[#7CEAAB]/50" : "bg-card"
                )}
                onClick={() => handleMarkAsRead(notification)}
              >
                <CardContent className="p-4 sm:p-6 flex gap-4">
                  <div className="mt-1 shrink-0">
                    {getIcon(notification.type, notification.title)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={cn("font-medium text-lg", !notification.read ? "text-foreground font-semibold" : "text-muted-foreground")}>
                            {notification.title}
                          </h3>
                          {isProfileReminder && (
                            <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 border border-amber-300/60">
                              Pinned
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {notification.created_at ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true }) : ''}
                        </span>
                        {!isProfileReminder && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 -mt-1 -mr-2"
                            onClick={(e) => handleDelete(notification, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className={cn("text-sm", !notification.read ? "text-foreground/90" : "text-muted-foreground")}>
                      {isProfileReminder
                        ? "Your profile is incomplete. Complete it to receive certificates, event updates, and personalized notifications."
                        : notification.message}
                    </p>
                    {isProfileReminder && (
                      <div className="pt-3 flex items-center gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notification.action_url) router.push(notification.action_url);
                          }}
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          Complete Now
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          Will do later
                        </Button>
                      </div>
                    )}
                    {!isProfileReminder && notification.action_url && (
                      <div className="pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-3 text-xs text-[#007C46] hover:bg-[#7CEAAB]/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notification.action_url) router.push(notification.action_url);
                          }}
                        >
                          View details →
                        </Button>
                      </div>
                    )}
                  </div>
                  {!isProfileReminder && !notification.read && (
                    <div className="flex items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#41B177]" />
                    </div>
                  )}
                  {isProfileReminder && (
                    <div className="flex items-center justify-center self-start pt-1">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="h-10 w-10 text-muted-foreground opacity-50" />}
          title="All caught up!"
          description="You don't have any notifications right now. We'll let you know when new volunteer tasks or updates are assigned."
        />
      )}
    </div>
  );
}
