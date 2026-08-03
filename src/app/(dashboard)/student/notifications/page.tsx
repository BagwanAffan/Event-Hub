'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/page-skeleton';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, Check, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { notificationService } from '@/services/notification-service';
import { PROFILE_REMINDER_TITLE } from '@/hooks/use-profile-completion';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
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
    } catch (err) {
      console.error("Error marking all read:", err);
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
      await notificationService.deleteNotification(notification.id);
      setNotifications(notifications.filter(n => n.id !== notification.id));
    } catch (err) {
      console.error("Error deleting notification:", err);
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

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
            Notifications
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Stay updated with your event registrations, announcements, and team activities
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} className="shrink-0 text-xs font-bold">
            <Check className="mr-2 h-4 w-4 text-[#007C46]" /> Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const isProfileReminder = notification.title === PROFILE_REMINDER_TITLE;
            return (
              <Card
                key={notification.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-slate-200 dark:border-slate-800",
                  isProfileReminder
                    ? "border-2 border-amber-400/60 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900 shadow-sm"
                    : !notification.read ? "bg-slate-50 dark:bg-slate-900/50 border-[#7CEAAB]/50" : "bg-card"
                )}
                onClick={() => markAsRead(notification)}
              >
                <CardContent className="p-4 sm:p-5 flex gap-4">
                  <div className="mt-1 shrink-0">
                    {getIcon(notification.type, notification.title)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={cn("font-bold text-sm", !notification.read ? "text-foreground" : "text-muted-foreground")}>
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
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {!isProfileReminder && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500 -mt-1 -mr-2" onClick={(e) => deleteNotification(notification, e)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className={cn("text-xs leading-relaxed", !notification.read ? "text-foreground/90" : "text-muted-foreground")}>
                      {isProfileReminder
                        ? "Your profile is incomplete. Complete it to receive certificates, event updates, and personalized notifications."
                        : notification.message}
                    </p>
                    {isProfileReminder && (
                      <div className="pt-2 flex items-center gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notification.action_url) router.push(notification.action_url);
                          }}
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                        >
                          Complete Now
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll see real-time updates about your event registrations, QR pass clearances, and certificates here."
          className="mt-6"
        />
      )}
    </div>
  );
}
