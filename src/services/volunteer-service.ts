import { createClient } from "@/lib/supabase/client";
import { dataSync } from "@/lib/data-sync";
import { logDeletionAudit } from "@/lib/deletion-framework";
import type { Volunteer, VolunteerTask, ChecklistItem, TaskPriority, VolunteerAttendanceStatus } from "@/types/database.types";

const supabase = createClient();

export const PREDEFINED_SKILLS = [
  'Stage Management',
  'Technical/AV',
  'Registration & Helpdesk',
  'Security & Crowd Control',
  'Design & Media',
  'First Aid',
  'Photography',
  'Logistics & Transport',
  'Food & Hospitality',
  'Content & Scripting',
];

export interface VolunteerFilters {
  event_id?: string;
  user_id?: string;
  application_status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function parseSkills(skills: string | string[] | null | undefined): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  try {
    const parsed = JSON.parse(skills);
    return Array.isArray(parsed) ? parsed : [skills];
  } catch {
    return skills.split(",").map(s => s.trim()).filter(Boolean);
  }
}

export function serializeSkills(skills: string[] | string | undefined): string | undefined {
  if (!skills) return undefined;
  if (Array.isArray(skills)) return JSON.stringify(skills);
  return skills;
}

export const volunteerService = {
  async getVolunteers(filters: VolunteerFilters = {}) {
    const { event_id, user_id, application_status, page = 1, limit = 10 } = filters;

    try {
      let query = supabase
        .from("volunteers")
        .select(
          `*, 
          profiles!volunteers_user_id_fkey(full_name, email, phone, department, year, college, profile_picture),
          events(id, title, start_date, venue, created_by)`,
          { count: "exact" }
        );

      if (event_id) query = query.eq("event_id", event_id);
      if (user_id) query = query.eq("user_id", user_id);
      if (application_status) query = query.eq("application_status", application_status);

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error || !data) {
        return { data: [], count: 0, page, limit };
      }

      const normalized = data.map((v: any) => ({
        ...v,
        skills: parseSkills(v.skills as any),
      }));

      return { data: normalized, count: count || 0, page, limit };
    } catch {
      return { data: [], count: 0, page, limit };
    }
  },

  async getVolunteerApplications(eventId: string) {
    return this.getVolunteers({ event_id: eventId, limit: 1000 });
  },

  async getVolunteerByEventAndUser(eventId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from("volunteers")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) return null;
      return { ...data, skills: parseSkills(data.skills as any) } as Volunteer;
    } catch {
      return null;
    }
  },

  async getVolunteerSkills(userId: string): Promise<string[]> {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from("volunteers")
        .select("skills")
        .eq("user_id", userId);

      const dbSkills: string[] = [];
      if (!error && data) {
        data.forEach((row: any) => {
          const parsed = parseSkills(row.skills);
          parsed.forEach((s: string) => {
            if (s && !dbSkills.includes(s)) {
              dbSkills.push(s);
            }
          });
        });
      }

      let localSkills: string[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(`volunteer_skills_${userId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localSkills = parsed;
          }
        } catch {}
      }

      const combined = Array.from(new Set([...dbSkills, ...localSkills]))
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean);

      return combined;
    } catch {
      return [];
    }
  },

  async updateVolunteerSkills(userId: string, skills: string[]): Promise<string[]> {
    if (!userId) return [];
    try {
      const cleanSkills = Array.from(
        new Set((skills || []).map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean))
      );
      const serialized = JSON.stringify(cleanSkills);

      const { data: userVols } = await supabase
        .from("volunteers")
        .select("id")
        .eq("user_id", userId);

      if (userVols && userVols.length > 0) {
        await supabase
          .from("volunteers")
          .update({ skills: serialized })
          .eq("user_id", userId);
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`volunteer_skills_${userId}`, serialized);
        } catch {}
      }

      return cleanSkills;
    } catch {
      return skills || [];
    }
  },

  async applyAsVolunteer(eventId: string, userId: string, skills?: string[] | string, notes?: string) {
    try {
      const serializedSkills = skills ? serializeSkills(skills) : undefined;
      const { data, error } = await supabase
        .from("volunteers")
        .insert({
          event_id: eventId,
          user_id: userId,
          skills: serializedSkills,
          notes,
          application_status: 'pending'
        })
        .select()
        .single();

      if (error || !data) {
        if (error) console.error("Error applying as volunteer:", error);
        return null;
      }
      dataSync.notify("volunteers", "events");
      return { ...data, skills: parseSkills(data.skills as any) } as Volunteer;
    } catch (err) {
      console.error("Exception in applyAsVolunteer:", err);
      return null;
    }
  },

  async approveVolunteer(id: string, approvedBy: string) {
    const { data, error } = await supabase
      .from("volunteers")
      .update({
        application_status: "approved",
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error approving volunteer in Supabase:", error);
      throw new Error(error.message || "Failed to approve volunteer");
    }

    if (!data) {
      throw new Error("Volunteer record not found");
    }

    dataSync.notify("volunteers", "events");
    return { ...data, skills: parseSkills(data.skills as any) } as Volunteer;
  },

  async rejectVolunteer(id: string) {
    const { data, error } = await supabase
      .from("volunteers")
      .update({ application_status: "rejected" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error rejecting volunteer in Supabase:", error);
      throw new Error(error.message || "Failed to reject volunteer");
    }

    if (!data) {
      throw new Error("Volunteer record not found");
    }

    dataSync.notify("volunteers", "events");
    return { ...data, skills: parseSkills(data.skills as any) } as Volunteer;
  },


  async getAssignedTasks(userId: string) {
    try {
      const { data: volunteerRows, error: volError } = await supabase
        .from("volunteers")
        .select("id")
        .eq("user_id", userId)
        .eq("application_status", "approved");

      if (volError || !volunteerRows || volunteerRows.length === 0) return [];

      const volunteerIds = volunteerRows.map((v: any) => v.id);

      const { data, error } = await supabase
        .from("volunteer_tasks")
        .select("*, events(id, title, start_date, end_date, venue)")
        .in("volunteer_id", volunteerIds)
        .order("start_time", { ascending: true, nullsFirst: false });

      if (error || !data) return [];
      return data.map((t: any) => ({
        ...t,
        checklist: Array.isArray(t.checklist) ? t.checklist : [],
      }));
    } catch {
      return [];
    }
  },

  async getTaskById(taskId: string, userId?: string) {
    console.log("[SERVICE] taskId =", taskId);
    console.log("[SERVICE] userId =", userId);
    try {
      let volunteerIds: string[] = [];

      if (userId) {
        console.log("[VOLUNTEERS QUERY] Executing: SELECT id FROM volunteers WHERE user_id =", userId, "AND application_status = 'approved'");
        const { data: volRows, error: volError } = await supabase
          .from("volunteers")
          .select("id")
          .eq("user_id", userId)
          .eq("application_status", "approved");

        console.log("[VOLUNTEERS DATA]", volRows);
        console.log("[VOLUNTEERS ERROR]", JSON.stringify(volError, null, 2));

        if (volRows && volRows.length > 0) {
          volunteerIds = volRows.map((v: any) => v.id);
        }
      }

      console.log("[SERVICE] Resolved volunteerIds =", volunteerIds);

      console.log("[TASK QUERY] Executing: SELECT * FROM volunteer_tasks WHERE id =", taskId, "AND volunteer_id IN", volunteerIds);
      let query = supabase
        .from("volunteer_tasks")
        .select("*, events(id, title, start_date, end_date, venue), volunteers(id, user_id, profiles!volunteers_user_id_fkey(full_name, email, phone, department, college))")
        .eq("id", taskId);

      if (userId && volunteerIds.length > 0) {
        query = query.in("volunteer_id", volunteerIds);
      }

      const { data, error } = await query.single();

      console.log("[TASK DATA]", data);
      console.log("[TASK ERROR]", JSON.stringify(error, null, 2));

      if (error || !data) {
        console.log("[FALLBACK TASK QUERY] Executing fallback query: SELECT * FROM volunteer_tasks WHERE id =", taskId);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("volunteer_tasks")
          .select("*, events(id, title, start_date, end_date, venue), volunteers(id, user_id, profiles!volunteers_user_id_fkey(full_name, email, phone, department, college))")
          .eq("id", taskId)
          .single();

        console.log("[FALLBACK TASK DATA]", fallbackData);
        console.log("[FALLBACK TASK ERROR]", JSON.stringify(fallbackError, null, 2));

        if (fallbackError || !fallbackData) return null;
        return {
          ...fallbackData,
          checklist: Array.isArray(fallbackData.checklist) ? fallbackData.checklist : [],
        };
      }

      return {
        ...data,
        checklist: Array.isArray(data.checklist) ? data.checklist : [],
      };
    } catch (catchErr) {
      console.error("[SERVICE CATCH EXCEPTION]", catchErr);
      return null;
    }
  },

  async acceptTask(taskId: string) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("volunteer_tasks")
      .update({
        status: "accepted",
        accepted_at: now,
        updated_at: now,
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Error accepting task in Supabase:", error);
      throw new Error(error.message || "Failed to accept task");
    }

    if (!data) {
      throw new Error("Volunteer task not found");
    }

    dataSync.notify("volunteers", "events");
    return {
      ...data,
      checklist: Array.isArray(data.checklist) ? data.checklist : [],
    } as VolunteerTask;
  },

  async markTaskAttendance(taskId: string, attendanceStatus: 'present' | 'absent') {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("volunteer_tasks")
      .update({
        attendance_status: attendanceStatus,
        attendance_marked_at: now,
        updated_at: now,
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Error marking task attendance in Supabase:", error);
      throw new Error(error.message || "Failed to mark task attendance");
    }

    if (!data) {
      throw new Error("Volunteer task not found");
    }

    dataSync.notify("volunteers", "events");
    return {
      ...data,
      checklist: Array.isArray(data.checklist) ? data.checklist : [],
    } as VolunteerTask;
  },

  async updateTaskStatus(taskId: string, status: any) {
    const { data, error } = await supabase
      .from("volunteer_tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Error updating task status in Supabase:", error);
      throw new Error(error.message || "Failed to update task status");
    }

    if (!data) {
      throw new Error("Volunteer task not found");
    }

    dataSync.notify("volunteers", "events");
    return {
      ...data,
      checklist: Array.isArray(data.checklist) ? data.checklist : [],
    } as VolunteerTask;
  },

  async createTask(taskData: Partial<VolunteerTask> & { event_id: string; volunteer_id: string; title: string; description: string; priority: TaskPriority }) {
    const payload: any = {
      event_id: taskData.event_id,
      volunteer_id: taskData.volunteer_id,
      title: taskData.title,
      description: taskData.description,
      location: taskData.location,
      priority: taskData.priority,
      start_time: taskData.start_time,
      end_time: taskData.end_time,
      status: taskData.status || 'pending',
      checklist: taskData.checklist || [],
    };

    const { data, error } = await supabase
      .from("volunteer_tasks")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error creating task in Supabase:", error);
      throw new Error(error.message || "Failed to create volunteer task");
    }

    if (!data) {
      throw new Error("No data returned after task creation");
    }

    dataSync.notify("volunteers", "events");
    return {
      ...data,
      checklist: Array.isArray(data.checklist) ? data.checklist : [],
    } as VolunteerTask;
  },

  async updateTaskChecklist(taskId: string, checklist: ChecklistItem[]) {
    const { data, error } = await supabase
      .from("volunteer_tasks")
      .update({ checklist, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Error updating task checklist in Supabase:", error);
      throw new Error(error.message || "Failed to update task checklist");
    }

    dataSync.notify("volunteers", "events");

    return {
      ...data,
      checklist: Array.isArray(data.checklist) ? data.checklist : [],
    } as VolunteerTask;
  },

  async getEventTasks(eventId: string) {
    try {
      const { data, error } = await supabase
        .from("volunteer_tasks")
        .select("*, volunteers(id, user_id, profiles!volunteers_user_id_fkey(full_name, email))")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data.map((t: any) => ({
        ...t,
        checklist: Array.isArray(t.checklist) ? t.checklist : [],
      }));
    } catch {
      return [];
    }
  },

  async getVolunteerStats(userId: string) {
    try {
      const { data: volunteerRows, error: volError } = await supabase
        .from("volunteers")
        .select("id")
        .eq("user_id", userId)
        .eq("application_status", "approved");

      if (volError || !volunteerRows || volunteerRows.length === 0) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          assignedEventsCount: 0,
          totalHours: 0,
          completedTasksCount: 0,
        };
      }

      const volunteerIds = volunteerRows.map((v: any) => v.id);

      const { count: totalTasks } = await supabase
        .from("volunteer_tasks")
        .select("*", { count: "exact", head: true })
        .in("volunteer_id", volunteerIds);

      const { count: completedTasksCount } = await supabase
        .from("volunteer_tasks")
        .select("*", { count: "exact", head: true })
        .in("volunteer_id", volunteerIds)
        .eq("status", "completed");

      const { data: assignments } = await supabase
        .from("volunteer_tasks")
        .select("event_id")
        .in("volunteer_id", volunteerIds);

      const assignedEventsCount = new Set(assignments?.map((a: any) => a.event_id) || []).size;

      return {
        totalTasks: totalTasks || 0,
        completedTasks: completedTasksCount || 0,
        assignedEventsCount,
        totalHours: (completedTasksCount || 0) * 2,
        completedTasksCount: completedTasksCount || 0,
      };
    } catch {
      return {
        totalTasks: 0,
        completedTasks: 0,
        assignedEventsCount: 0,
        totalHours: 0,
        completedTasksCount: 0,
      };
    }
  },

  async getMyApprovedEvents(userId: string) {
    try {
      const { data, error } = await supabase
        .from("volunteers")
        .select(`
          id, application_status, skills, notes,
          events(id, title, start_date, end_date, venue, status, created_by, profiles!events_created_by_fkey(full_name))
        `)
        .eq("user_id", userId)
        .eq("application_status", "approved")
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data.map((v: any) => ({
        ...v,
        skills: parseSkills(v.skills as any),
      }));
    } catch {
      return [];
    }
  },

  async deleteVolunteerPermanently(id: string) {
    if (!id) throw new Error("Volunteer ID is required for deletion");

    // 1. Fetch volunteer application record first
    const { data: vol, error: fetchErr } = await supabase
      .from("volunteers")
      .select("id, user_id, event_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[deleteVolunteerPermanently] Fetch volunteer error:", fetchErr);
    }

    const userId = vol?.user_id;
    const eventId = vol?.event_id;

    // 2. Remove volunteer tasks
    if (id) {
      await supabase.from("volunteer_tasks").delete().eq("volunteer_id", id);
    }
    if (userId && eventId) {
      const { data: volRows } = await supabase
        .from("volunteers")
        .select("id")
        .eq("user_id", userId)
        .eq("event_id", eventId);

      if (volRows && volRows.length > 0) {
        const volIds = volRows.map((v: any) => v.id);
        await supabase.from("volunteer_tasks").delete().in("volunteer_id", volIds);
      }
    }

    // 3. Remove attendance related to volunteer role
    if (userId && eventId) {
      await supabase
        .from("attendance")
        .delete()
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .is("registration_id", null);
    }

    // 4. Revoke & delete volunteer certificate if issued
    if (userId && eventId) {
      const { data: certs } = await supabase
        .from("certificates")
        .select("id, verification_id, pdf_url, file_path")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .eq("certificate_type", "volunteer");

      if (certs && certs.length > 0) {
        for (const cert of certs) {
          const pdfUrl = (cert as any).pdf_url || (cert as any).file_path;
          if (pdfUrl) {
            try {
              let filePath = pdfUrl;
              if (filePath.includes('/certificates/')) {
                filePath = filePath.split('/certificates/').pop() || filePath;
              }
              await supabase.storage.from('certificates').remove([filePath, `${cert.id}.pdf`, `${cert.verification_id}.pdf`]);
            } catch (storageErr) {
              console.warn("[deleteVolunteerPermanently] Storage removal note:", storageErr);
            }
          }
        }

        await supabase
          .from("certificates")
          .delete()
          .eq("user_id", userId)
          .eq("event_id", eventId)
          .eq("certificate_type", "volunteer");
      }
    }

    // 5. Delete volunteer application row from database
    const { error: deleteErr } = await supabase
      .from("volunteers")
      .delete()
      .eq("id", id);

    if (deleteErr) {
      throw new Error(deleteErr.message || "Failed to delete volunteer record");
    }

    // Log deletion event to audit_logs
    await logDeletionAudit({
      action: "DELETE_VOLUNTEER",
      resourceType: "volunteer",
      resourceId: id,
      details: { event_id: eventId, user_id: userId }
    });

    // 6. Update volunteer slot count on events table
    if (eventId) {
      try {
        const { count: remainingApproved } = await supabase
          .from("volunteers")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .eq("application_status", "approved");

        await supabase
          .from("events")
          .update({
            volunteers_assigned: remainingApproved || 0,
            volunteers_count: remainingApproved || 0,
            updated_at: new Date().toISOString()
          })
          .eq("id", eventId);
      } catch (slotErr) {
        console.warn("[deleteVolunteerPermanently] Slot count update note:", slotErr);
      }
    }

    // 7. Trigger real-time sync across volunteers, events, certificates, and attendance
    dataSync.notify("volunteers", "events", "certificates", "attendance");
    return true;
  },
};
