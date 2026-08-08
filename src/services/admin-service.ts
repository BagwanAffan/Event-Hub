import { createClient } from "@/lib/supabase/client";
import { notificationService } from "./notification-service";
import { dataSync } from "@/lib/data-sync";
import type { Profile, Event, OrganizerStatus } from "@/types/database.types";

const supabase = createClient();

export interface OrganizerApplicationFilters {
  status?: OrganizerStatus | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserManagementFilters {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminEventFilters {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EnrichedAdminEvent extends Event {
  registrationCount: number;
  attendanceCount: number;
  revenue: number;
  profiles?: {
    full_name: string;
    email: string;
    college: string | null;
  } | null;
}

export interface PaymentAmountRow {
  amount: number | string | null;
}

export interface DateCategoryRow {
  category: string | null;
  created_at: string;
}

export interface RegistrationDateRow {
  created_at: string;
}

export const adminService = {
  async getAdminDashboardStats() {
    try {
      const [
        totalUsers,
        students,
        organizers,
        pendingOrganizers,
        approvedOrganizers,
        volunteers,
        totalEvents,
        registrations,
        todayAttendance,
        certificates,
        approvedPayments,
        recentOrganizers,
        recentEvents,
        recentRegistrations,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_soft_deleted", false),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student").eq("is_soft_deleted", false),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "organizer").eq("is_soft_deleted", false),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "organizer").or("approval_status.eq.pending,organizer_status.eq.pending").eq("is_soft_deleted", false),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "organizer").or("approval_status.eq.approved,organizer_status.eq.approved").eq("is_soft_deleted", false),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "volunteer").eq("is_soft_deleted", false),
        supabase.from("events").select("*", { count: "exact", head: true }).neq("status", "cancelled").or("is_soft_deleted.eq.false,is_soft_deleted.is.null"),
        supabase.from("registrations").select("*", { count: "exact", head: true }),
        supabase.from("attendance").select("*", { count: "exact", head: true }).gte("scanned_at", new Date(new Date().setHours(0,0,0,0)).toISOString()),
        supabase.from("certificates").select("*", { count: "exact", head: true }),
        supabase.from("payments").select("amount").eq("status", "approved"),
        supabase.from("profiles").select("*").eq("role", "organizer").eq("is_soft_deleted", false).order("created_at", { ascending: false }).limit(5),
        supabase.from("events").select("*, profiles:created_by(full_name)").neq("status", "cancelled").or("is_soft_deleted.eq.false,is_soft_deleted.is.null").order("created_at", { ascending: false }).limit(5),
        supabase.from("registrations").select("*, profiles:user_id(full_name, email), events(title)").order("created_at", { ascending: false }).limit(5),
      ]);

      const totalRevenue = (approvedPayments.data || []).reduce(
        (sum: number, p: PaymentAmountRow) => sum + (Number(p.amount) || 0),
        0
      );

      return {
        totalUsers: totalUsers.count || 0,
        students: students.count || 0,
        organizers: organizers.count || 0,
        pendingOrganizers: pendingOrganizers.count || 0,
        approvedOrganizers: approvedOrganizers.count || 0,
        volunteers: volunteers.count || 0,
        totalEvents: totalEvents.count || 0,
        registrations: registrations.count || 0,
        todayAttendance: todayAttendance.count || 0,
        certificates: certificates.count || 0,
        revenue: totalRevenue,
        recentOrganizers: (recentOrganizers.data || []) as Profile[],
        recentEvents: (recentEvents.data || []) as EnrichedAdminEvent[],
        recentRegistrations: (recentRegistrations.data || []) as Profile[],
      };
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      return {
        totalUsers: 0,
        students: 0,
        organizers: 0,
        pendingOrganizers: 0,
        approvedOrganizers: 0,
        volunteers: 0,
        totalEvents: 0,
        registrations: 0,
        todayAttendance: 0,
        certificates: 0,
        revenue: 0,
        recentOrganizers: [],
        recentEvents: [],
        recentRegistrations: [],
      };
    }
  },

  async getOrganizerApplications(filters: OrganizerApplicationFilters = {}) {
    const { status = 'pending', search, page = 1, limit = 20 } = filters;
    try {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "organizer")
        .eq("is_soft_deleted", false);

      if (status && status !== 'all') {
        query = query.or(`approval_status.eq.${status},organizer_status.eq.${status}`);
      }

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,college.ilike.%${search}%,club_name.ilike.%${search}%,organization.ilike.%${search}%`
        );
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error || !data) {
        return { data: [], count: 0, page, limit };
      }

      return { data: data as Profile[], count: count || 0, page, limit };
    } catch {
      return { data: [], count: 0, page, limit };
    }
  },

  async updateOrganizerStatus(userId: string, status: OrganizerStatus, rejectionReason?: string, adminId?: string) {
    const updates: Partial<Profile> = {
      organizer_status: status,
      approval_status: status,
      approved_by: status === 'approved' ? adminId : null,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from("organizer_verifications")
      .update({
        verification_status: status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId || null,
        rejection_reason: rejectionReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select();

    if (error) {
      console.error("[ERROR] updateOrganizerStatus profiles error:", error);
      throw new Error(error.message || "Failed to update organizer status in profiles table");
    }

    if (!data || data.length === 0) {
      const { error: directErr } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (directErr) {
        throw new Error(directErr.message || "Failed to update organizer profile record");
      }
    }

    const updatedProfile = data?.[0] || ({ id: userId, ...updates } as Profile);

    try {
      if (status === 'approved') {
        await notificationService.createNotification(
          userId,
          "Organizer Application Approved! 🎉",
          "Your organizer account has been approved by the administrator. You can now access your Organizer Dashboard and post campus events.",
          "success",
          "/organizer/dashboard"
        );
      } else if (status === 'rejected') {
        await notificationService.createNotification(
          userId,
          "Organizer Application Status Update",
          rejectionReason
            ? `Your organizer registration was rejected. Reason: ${rejectionReason}`
            : "Your organizer registration was rejected. Contact administrator at admin@eventhub.edu.",
          "error",
          "/organizer/dashboard"
        );
      }
    } catch (notifErr) {
      console.warn("Non-fatal notification creation warning:", notifErr);
    }

    return updatedProfile;
  },

  async getUsers(filters: UserManagementFilters = {}) {
    const { role, status, search, page = 1, limit = 20 } = filters;
    try {
      let query = supabase.from("profiles").select("*", { count: "exact" }).eq("is_soft_deleted", false);

      if (role && role !== 'all') {
        query = query.eq("role", role);
      }

      if (status && status !== 'all') {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,college.ilike.%${search}%,department.ilike.%${search}%`
        );
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error || !data) {
        return { data: [], count: 0, page, limit };
      }

      return { data: data as Profile[], count: count || 0, page, limit };
    } catch {
      return { data: [], count: 0, page, limit };
    }
  },

  async toggleUserStatus(userId: string, newStatus: 'active' | 'suspended' | 'inactive') {
    const { data, error } = await supabase
      .from("profiles")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select();

    if (error) {
      throw new Error(error?.message || "Failed to update user status");
    }

    return (data?.[0] as Profile) || null;
  },

  async softDeleteUser(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_soft_deleted: true, status: 'suspended', updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select();

    if (error) {
      throw new Error(error?.message || "Failed to soft delete user");
    }

    return true;
  },

  async resetUserPasswordDirect(userId: string, newPassword: string) {
    const response = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword }),
    });

    const res = await response.json();
    if (!response.ok || !res.success) {
      throw new Error(res?.error || 'Failed to update user password');
    }

    return true;
  },

  async getUserHistory(userId: string) {
    try {
      const [registrations, volunteerApplications, createdEvents] = await Promise.all([
        supabase
          .from("registrations")
          .select("*, events(title, start_date, venue)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("volunteers")
          .select("*, events(title, start_date)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("events")
          .select("*")
          .eq("created_by", userId)
          .neq("status", "cancelled")
          .or("is_soft_deleted.eq.false,is_soft_deleted.is.null")
          .order("created_at", { ascending: false }),
      ]);

      return {
        registrations: registrations.data || [],
        volunteerApplications: volunteerApplications.data || [],
        createdEvents: createdEvents.data || [],
      };
    } catch {
      return { registrations: [], volunteerApplications: [], createdEvents: [] };
    }
  },

  async getAllEventsForAdmin(filters: AdminEventFilters = {}) {
    const { status, category, search, page = 1, limit = 50 } = filters;
    try {
      let query = supabase
        .from("events")
        .select(
          `*, profiles:created_by(full_name, email, college)`,
          { count: "exact" }
        )
        .neq("status", "cancelled")
        .or("is_soft_deleted.eq.false,is_soft_deleted.is.null");

      if (status && status !== 'all') {
        if (status === 'disabled') {
          query = query.eq("is_disabled", true);
        } else {
          query = query.eq("status", status);
        }
      }
      if (category && category !== 'all') query = query.eq("category", category);
      if (search) {
        query = query.or(
          `title.ilike.%${search}%,venue.ilike.%${search}%,category.ilike.%${search}%`
        );
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error || !data) {
        console.error("getAllEventsForAdmin query error:", error);
        return { data: [], count: 0, page, limit };
      }

      const enriched: EnrichedAdminEvent[] = await Promise.all(
        data.map(async (evt: Event) => {
          let creatorProfile = (evt as any).profiles;
          if (!creatorProfile && evt.created_by) {
            try {
              const { data: profData } = await supabase
                .from("profiles")
                .select("full_name, email, college")
                .eq("id", evt.created_by)
                .maybeSingle();
              if (profData) creatorProfile = profData;
            } catch {
              /* noop */
            }
          }

          const [regCount, attCount, payments] = await Promise.all([
            supabase.from("registrations").select("*", { count: "exact", head: true }).eq("event_id", evt.id).neq("status", "cancelled"),
            supabase.from("attendance").select("*", { count: "exact", head: true }).eq("event_id", evt.id),
            supabase.from("payments").select("amount").eq("event_id", evt.id).eq("status", "approved"),
          ]);

          const revenue = (payments.data || []).reduce((acc: number, p: PaymentAmountRow) => acc + (Number(p.amount) || 0), 0);

          return {
            ...evt,
            profiles: creatorProfile || null,
            registrationCount: regCount.count || 0,
            attendanceCount: attCount.count || 0,
            revenue,
          };
        })
      );

      return { data: enriched, count: count || 0, page, limit };
    } catch (err) {
      console.error("Error in getAllEventsForAdmin:", err);
      return { data: [], count: 0, page, limit };
    }
  },

  async toggleEventDisabled(eventId: string, isDisabled: boolean) {
    if (!eventId) throw new Error("Event ID is required");
    const nextStatus = isDisabled ? 'disabled' : 'published';

    const { data, error } = await supabase
      .from("events")
      .update({ is_disabled: isDisabled, status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .select();

    if (error) {
      console.error("[toggleEventDisabled] Error:", error);
      throw new Error(error.message || "Failed to update event disabled status");
    }

    if (!data || data.length === 0) {
      const { error: directErr } = await supabase
        .from("events")
        .update({ is_disabled: isDisabled, status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", eventId);

      if (directErr) {
        throw new Error(directErr.message || "Database permission denied or row not found");
      }
    }

    dataSync.notify("events", "admin");
    return (data?.[0] as Event) || null;
  },

  async toggleEventFeatured(eventId: string, isFeatured: boolean) {
    if (!eventId) throw new Error("Event ID is required");

    const { data, error } = await supabase
      .from("events")
      .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .select();

    if (error) {
      console.error("[toggleEventFeatured] Error:", error);
      throw new Error(error.message || "Failed to update event featured status");
    }

    if (!data || data.length === 0) {
      const { error: directErr } = await supabase
        .from("events")
        .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
        .eq("id", eventId);

      if (directErr) {
        throw new Error(directErr.message || "Database permission denied or row not found");
      }
    }

    dataSync.notify("events", "admin");
    return (data?.[0] as Event) || null;
  },

  async deleteEventPermanently(eventId: string) {
    if (!eventId) throw new Error("Event ID is required for deletion");

    try {
      const response = await fetch('/api/admin/delete-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete event and dependent records');
      }

      dataSync.notify("events", "registrations", "volunteers", "certificates", "admin", "notifications");
      return true;
    } catch (err: any) {
      console.warn("[adminService] API event deletion failed, falling back to direct query:", err);

      // Fallback: Direct database cascade delete
      const { data: teamRows } = await supabase
        .from("teams")
        .select("id")
        .eq("event_id", eventId);

      if (teamRows && teamRows.length > 0) {
        const teamIds = teamRows.map((t: any) => t.id);
        await supabase.from("team_members").delete().in("team_id", teamIds);
      }

      await Promise.allSettled([
        supabase.from("payments").delete().eq("event_id", eventId),
        supabase.from("attendance").delete().eq("event_id", eventId),
        supabase.from("certificates").delete().eq("event_id", eventId),
        supabase.from("volunteer_tasks").delete().eq("event_id", eventId),
        supabase.from("volunteers").delete().eq("event_id", eventId),
        supabase.from("teams").delete().eq("event_id", eventId),
        supabase.from("registrations").delete().eq("event_id", eventId),
        supabase.from("announcements").delete().eq("event_id", eventId),
        supabase.from("event_faqs").delete().eq("event_id", eventId),
        supabase.from("event_galleries").delete().eq("event_id", eventId),
        supabase.from("feedback").delete().eq("event_id", eventId),
      ]);

      const { error: hardErr } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (hardErr) {
        throw new Error(hardErr.message || "Failed to delete event record");
      }

      dataSync.notify("events", "registrations", "volunteers", "certificates", "admin", "notifications");
      return true;
    }
  },

  async softDeleteEvent(eventId: string) {
    return this.deleteEventPermanently(eventId);
  },

  async getGlobalAnalytics() {
    try {
      const [
        students,
        organizers,
        volunteers,
        events,
        registrations,
        attendance,
        certificates,
        payments,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student").eq("is_soft_deleted", false),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "organizer").eq("is_soft_deleted", false),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "volunteer").eq("is_soft_deleted", false),
        supabase.from("events").select("category, created_at").neq("status", "cancelled").or("is_soft_deleted.eq.false,is_soft_deleted.is.null"),
        supabase.from("registrations").select("created_at"),
        supabase.from("attendance").select("*", { count: "exact", head: true }),
        supabase.from("certificates").select("*", { count: "exact", head: true }),
        supabase.from("payments").select("amount").eq("status", "approved"),
      ]);

      const totalRevenue = (payments.data || []).reduce((acc: number, p: PaymentAmountRow) => acc + (Number(p.amount) || 0), 0);

      const roleDistribution = [
        { role: "Students", count: students.count || 0 },
        { role: "Organizers", count: organizers.count || 0 },
        { role: "Volunteers", count: volunteers.count || 0 },
      ];

      const categoryMap: Record<string, number> = {};
      (events.data || []).forEach((e: DateCategoryRow) => {
        const cat = e.category || "General";
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });
      const categoryDistribution = Object.entries(categoryMap).map(([category, count]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        count,
      }));

      const monthlyMap: Record<string, number> = {};
      (registrations.data || []).forEach((r: RegistrationDateRow) => {
        const month = new Date(r.created_at).toLocaleString('default', { month: 'short' });
        monthlyMap[month] = (monthlyMap[month] || 0) + 1;
      });
      const monthlyRegistrations = Object.entries(monthlyMap).map(([month, count]) => ({
        month,
        registrations: count,
      }));

      return {
        studentsCount: students.count || 0,
        organizersCount: organizers.count || 0,
        volunteersCount: volunteers.count || 0,
        eventsCount: (events.data || []).length,
        registrationsCount: (registrations.data || []).length,
        attendanceCount: attendance.count || 0,
        certificatesCount: certificates.count || 0,
        totalRevenue,
        roleDistribution,
        categoryDistribution,
        monthlyRegistrations,
      };
    } catch {
      return {
        studentsCount: 0,
        organizersCount: 0,
        volunteersCount: 0,
        eventsCount: 0,
        registrationsCount: 0,
        attendanceCount: 0,
        certificatesCount: 0,
        totalRevenue: 0,
        roleDistribution: [],
        categoryDistribution: [],
        monthlyRegistrations: [],
      };
    }
  },
};
