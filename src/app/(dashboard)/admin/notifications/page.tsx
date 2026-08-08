'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/page-skeleton';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, Check, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { notificationService } from '@/services/notification-service';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types/database.types';
import { useDataSync } from '@/lib/data-sync';

import { toast } from 'sonner';

export default function AdminNotificationsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(profile.id);
      setNotifications(data);
    } catch (err) {
      console.error("Error loading admin notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useDataSync(['notifications', 'admin'], loadNotifications, [profile?.id]);

  const markAllRead = async () => {
    if (!profile?.id) return;
    try {
      await notificationService.markAllAsRead(profile.id);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success("All admin notifications marked as read");
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const clearAllNotifications = async () => {
    if (!profile?.id) return;
    try {
      await notificationService.clearAllAdminNotifications(profile.id);
      setNotifications([]);
      toast.success("All admin notifications cleared");
    } catch (err) {
      toast.error("Failed to clear admin notifications");
    }
  };

  const markAsRead = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await notificationService.markAsRead(notification.id);
        setNotifications(notifications.map(n => n.id === notification.id ? { ...n, read: true } : n));
      }
      if (notification.action_url) {
        router.push(notification.action_url);
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const deleteNotification = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(notification.id, profile?.id);
      setNotifications(notifications.filter(n => n.id !== notification.id));
      toast.success("Admin notification deleted");
    } catch (err) {
      console.error("Error deleting notification:", err);
      toast.error("Failed to delete notification");
    }
  };

  const getIcon = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info': default: return <Info className="h-5 w-5 text-[#007C46]" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-[#01424E] dark:text-[#7CEAAB]">
              Admin Notifications
            </h1>
            <ShieldCheck className="h-6 w-6 text-[#007C46]" />
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            System activity alerts, organizer verification requests, and administrative notifications
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllRead} className="shrink-0 text-xs font-bold">
              <Check className="mr-1.5 h-3.5 w-3.5 text-[#007C46]" /> Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={clearAllNotifications} className="shrink-0 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear all
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border-slate-200 dark:border-slate-800",
                !notification.read ? "bg-slate-50 dark:bg-slate-900/50 border-[#7CEAAB]/50" : "bg-card"
              )}
              onClick={() => markAsRead(notification)}
            >
              <CardContent className="p-4 sm:p-5 flex gap-4">
                <div className="mt-1 shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <h3 className={cn("font-bold text-sm", !notification.read ? "text-[#01424E] dark:text-teal-100" : "text-muted-foreground")}>
                        {notification.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500 -mt-1 -mr-2"
                        onClick={(e) => deleteNotification(notification, e)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className={cn("text-xs leading-relaxed", !notification.read ? "text-foreground/90" : "text-muted-foreground")}>
                    {notification.message}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No admin notifications yet"
          description="System activity alerts and organizer verification notifications will appear here."
          className="mt-6"
        />
      )}
    </div>
  );
}
