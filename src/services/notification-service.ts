import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database.types";
import type { Profile } from "@/types/database.types";
import {
  checkProfileCompletion,
  PROFILE_REMINDER_TITLE,
} from "@/hooks/use-profile-completion";

const supabase = createClient();

export const PROFILE_REMINDER_MESSAGE =
  "Please complete your profile to enjoy all EventHub features, receive certificates, and participate smoothly in events.";

export function profileReminderActionUrl(role?: string): string {
  const safeRole = role && ["student", "volunteer", "organizer"].includes(role)
    ? role
    : "student";
  return `/${safeRole}/profile`;
}

export const notificationService = {
  async getNotifications(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Notification[];
  },

  async getNotificationsSortedWithPinned(userId: string, limit = 50) {
    const all = await this.getNotifications(userId, limit);
    const pinned = all.filter(
      (n) => n.title === PROFILE_REMINDER_TITLE && !n.read
    );
    const others = all.filter(
      (n) => !(n.title === PROFILE_REMINDER_TITLE && !n.read)
    );
    return [...pinned, ...others];
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
    return count || 0;
  },

  async findProfileReminder(userId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("title", PROFILE_REMINDER_TITLE)
      .limit(1);

    if (error) throw error;
    return (data?.[0] || null) as Notification | null;
  },

  async ensureProfileReminder(profile: Profile) {
    if (profile.role === 'admin') {
      return { action: "skipped-admin", notification: null as Notification | null };
    }
    const { isComplete } = checkProfileCompletion(profile);
    if (isComplete) {
      return { action: "skipped-complete", notification: null as Notification | null };
    }
    const existing = await this.findProfileReminder(profile.id);
    if (existing) {
      if (existing.read) {
        const { data, error } = await supabase
          .from("notifications")
          .update({
            read: false,
            message: PROFILE_REMINDER_MESSAGE,
            action_url: profileReminderActionUrl(profile.role),
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return { action: "unreaded", notification: data as Notification };
      }
      return { action: "reused", notification: existing };
    }
    const created = await this.createNotification(
      profile.id,
      PROFILE_REMINDER_TITLE,
      PROFILE_REMINDER_MESSAGE,
      "warning",
      profileReminderActionUrl(profile.role)
    );
    return { action: "created", notification: created };
  },

  async removeProfileReminder(userId: string) {
    const existing = await this.findProfileReminder(userId);
    if (!existing) return { deleted: 0 };
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
    return { deleted: 1, id: existing.id };
  },

  async syncProfileReminder(profile: Profile) {
    if (profile.role === 'admin') {
      return await this.removeProfileReminder(profile.id);
    }
    const { isComplete } = checkProfileCompletion(profile);
    if (isComplete) {
      return await this.removeProfileReminder(profile.id);
    }
    return await this.ensureProfileReminder(profile);
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw error;
  },

  async deleteNotification(id: string) {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: "success" | "warning" | "error" | "info" | "announcement" = "info",
    actionUrl?: string
  ) {
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, message, type, actionUrl }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        return result.data as Notification;
      }
    } catch (apiErr) {
      console.warn("API notification dispatch fallback:", apiErr);
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({ user_id: userId, title, message, type, action_url: actionUrl })
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  },
};
