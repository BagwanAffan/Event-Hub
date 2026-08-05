import { createClient } from "@/lib/supabase/client";
import { normalizeDepartmentName } from "@/lib/utils";

const supabase = createClient();

export const analyticsService = {
  async getOrganizerDashboardStats(organizerId: string) {
    try {
      const [
        totalEvents,
        activeEvents,
        totalRegistrations,
        pendingRegistrations,
        approvedRegistrations,
        totalVolunteers,
        totalAttendance,
        totalCertificates,
      ] = await Promise.all([
        supabase.from("events").select("*", { count: "exact", head: true }).eq("created_by", organizerId),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("created_by", organizerId).in("status", ["published", "registration_open", "upcoming", "ongoing"]),
        supabase.from("registrations").select("*", { count: "exact", head: true }),
        supabase.from("registrations").select("*", { count: "exact", head: true }).eq("status", "pending_payment"),
        supabase.from("registrations").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("volunteers").select("*", { count: "exact", head: true }).eq("application_status", "approved"),
        supabase.from("attendance").select("*", { count: "exact", head: true }),
        supabase.from("certificates").select("*", { count: "exact", head: true }),
      ]);

      return {
        totalEvents: totalEvents.count || 0,
        activeEvents: activeEvents.count || 0,
        totalRegistrations: totalRegistrations.count || 0,
        pendingRegistrations: pendingRegistrations.count || 0,
        approvedRegistrations: approvedRegistrations.count || 0,
        totalVolunteers: totalVolunteers.count || 0,
        totalAttendance: totalAttendance.count || 0,
        totalCertificates: totalCertificates.count || 0,
      };
    } catch {
      return {
        totalEvents: 0,
        activeEvents: 0,
        totalRegistrations: 0,
        pendingRegistrations: 0,
        approvedRegistrations: 0,
        totalVolunteers: 0,
        totalAttendance: 0,
        totalCertificates: 0,
      };
    }
  },

  async getStudentDashboardStats(studentId: string) {
    try {
      const [upcomingEvents, completedEvents, certificates, pendingRegistrations] = await Promise.all([
        supabase.from("registrations").select("*", { count: "exact", head: true }).eq("user_id", studentId).eq("status", "approved"),
        supabase.from("registrations").select("*", { count: "exact", head: true }).eq("user_id", studentId).eq("status", "completed"),
        supabase.from("certificates").select("*", { count: "exact", head: true }).eq("user_id", studentId),
        supabase.from("registrations").select("*", { count: "exact", head: true }).eq("user_id", studentId).in("status", ["pending_payment", "payment_under_review"]),
      ]);

      return {
        upcomingEvents: upcomingEvents.count || 0,
        completedEvents: completedEvents.count || 0,
        certificates: certificates.count || 0,
        pendingRegistrations: pendingRegistrations.count || 0,
      };
    } catch {
      return {
        upcomingEvents: 0,
        completedEvents: 0,
        certificates: 0,
        pendingRegistrations: 0,
      };
    }
  },

  async getVolunteerDashboardStats(volunteerId: string) {
    try {
      const [assignedEvents, totalTasks, completedTasks, certificates] = await Promise.all([
        supabase.from("volunteers").select("*", { count: "exact", head: true }).eq("user_id", volunteerId).eq("application_status", "approved"),
        supabase.from("volunteer_tasks").select("*", { count: "exact", head: true }).eq("volunteer_id", volunteerId),
        supabase.from("volunteer_tasks").select("*", { count: "exact", head: true }).eq("volunteer_id", volunteerId).eq("status", "completed"),
        supabase.from("certificates").select("*", { count: "exact", head: true }).eq("user_id", volunteerId),
      ]);

      return {
        assignedEvents: assignedEvents.count || 0,
        totalTasks: totalTasks.count || 0,
        completedTasks: completedTasks.count || 0,
        certificates: certificates.count || 0,
      };
    } catch {
      return {
        assignedEvents: 0,
        totalTasks: 0,
        completedTasks: 0,
        certificates: 0,
      };
    }
  },

  async getRegistrationTrend(organizerId: string, days = 30) {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('created_at, attendance(id)')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      if (error || !data) return [];

      const grouped: Record<string, { date: string; registrations: number; attendance: number }> = {};

      data.forEach((reg: any) => {
        const dateStr = new Date(reg.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        if (!grouped[dateStr]) {
          grouped[dateStr] = { date: dateStr, registrations: 0, attendance: 0 };
        }
        grouped[dateStr].registrations++;
        if (reg.attendance && reg.attendance.length > 0) {
          grouped[dateStr].attendance += reg.attendance.length;
        }
      });

      return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch {
      return [];
    }
  },

  async getCategoryDistribution(organizerId: string) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('category')
        .eq('created_by', organizerId);

      if (error || !data) return [];

      const countMap: Record<string, number> = {};
      data.forEach((e: any) => {
        const cat = e.category || 'Other';
        countMap[cat] = (countMap[cat] || 0) + 1;
      });

      const total = data.length;
      return Object.entries(countMap).map(([category, count]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        count,
        percentage: Math.round((count / total) * 100)
      }));
    } catch {
      return [];
    }
  },

  async getDepartmentDistribution(organizerId: string) {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('department, profiles!registrations_user_id_fkey(department), events!inner(created_by)')
        .eq('events.created_by', organizerId);

      if (error || !data) return [];

      const countMap: Record<string, number> = {};
      let total = 0;
      data.forEach((r: any) => {
        const rawDept = r.department || r.profiles?.department;
        const dept = normalizeDepartmentName(rawDept);
        countMap[dept] = (countMap[dept] || 0) + 1;
        total++;
      });

      return Object.entries(countMap)
        .map(([department, count]) => ({
          department,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);
    } catch {
      return [];
    }
  },
};
