'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, Check, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { notificationService } from '@/services/notification-service';
import { PROFILE_REMINDER_TITLE } from '@/hooks/use-profile-completion';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

export default function OrganizerNotificationsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      if (!profile?.id) return;
      try {
        setLoading(true);
        const data = await notificationService.getNotificationsSortedWithPinned(profile.id);
        setNotifications(data);
      } catch (err) {
        console.error("Error loading notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, [profile?.id]);

  const markAllRead = async () => {
    if (!profile?.id) return;
    try {
      await notificationService.markAllAsRead(profile.id);
      setNotifications(notifications.map(n =>
        n.title === PROFILE_REMINDER_TITLE ? n : { ...n, read: true }
      ));
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const clearAllNotifications = async () => {
    if (!profile?.id) return;
    try {
      await notificationService.clearAllNotifications(profile.id);
      setNotifications(notifications.filter(n => n.title === PROFILE_REMINDER_TITLE));
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  };

  const markAsRead = async (notification: any) => {
    try {
      if (notification.title === PROFILE_REMINDER_TITLE) {
        if (notification.action_url) router.push(notification.action_url);
        return;
      }
      await notificationService.markAsRead(notification.id);
      setNotifications(notifications.map(n => n.id === notification.id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const deleteNotification = async (notification: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (notification.title === PROFILE_REMINDER_TITLE) return;
      await notificationService.deleteNotification(notification.id, profile?.id);
      setNotifications(notifications.filter(n => n.id !== notification.id));
      toast.success("Notification deleted");
    } catch (err) {
      console.error("Error deleting notification:", err);
      toast.error("Failed to delete notification");
    }
  };

  const getIcon = (type: string, title?: string) => {
    if (title === PROFILE_REMINDER_TITLE) return <User className="h-5 w-5 text-amber-500" />;
    switch(type?.toLowerCase()) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info': default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const deletableCount = notifications.filter(n => n.title !== PROFILE_REMINDER_TITLE).length;

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with your events, participants, and organizer activity
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllRead} className="shrink-0 text-xs font-bold">
              <Check className="mr-1.5 h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
          {deletableCount > 0 && (
            <Button variant="outline" onClick={clearAllNotifications} className="shrink-0 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear all
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading notifications...</div>
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
                onClick={() => markAsRead(notification)}
              >
                <CardContent className="p-4 sm:p-6 flex gap-4">
                  <div className="mt-1 shrink-0">
                    {getIcon(notification.type, notification.title)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={cn("font-medium text-lg", !notification.read ? "text-foreground" : "text-muted-foreground")}>
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
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {!isProfileReminder && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 -mt-1 -mr-2" onClick={(e) => deleteNotification(notification, e)}>
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
                            router.push(notification.action_url);
                          }}
                        >
                          View details →
                        </Button>
                      </div>
                    )}
                  </div>
                  {!isProfileReminder && !notification.read && (
                    <div className="flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-[#41B177]" />
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-24 w-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Bell className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-medium mb-2">No notifications yet</h3>
            <p className="text-muted-foreground max-w-sm">
              You'll see updates about your events, participants, and organizer activity here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
