import { createClient } from "@/lib/supabase/client";
import { dataSync } from "@/lib/data-sync";
import { adminService } from "./admin-service";
import type {
  Event,
  EventStatus,
} from "@/types/database.types";

const supabase = createClient();

export interface CreateEventData {
  title: string;
  short_description?: string | null;
  description?: string | null;
  category: string;
  event_type?: string | null;
  venue?: string | null;
  building?: string | null;
  room?: string | null;
  start_date: string;
  end_date: string;
  registration_deadline?: string | null;
  registration_fee?: number;
  registration_mode?: string | null;
  max_participants?: number | null;
  max_teams?: number | null;
  max_team_size?: number | null;
  poster_url?: string | null;
  banner_url?: string | null;
  status?: EventStatus;
  payment_instructions?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  tags?: string[] | null;
  need_volunteers?: boolean;
  volunteers_needed?: number | null;
  volunteer_roles?: string[] | null;
  reporting_location?: string | null;
  reporting_time?: string | null;
  shift_start_time?: string | null;
  shift_end_time?: string | null;
  volunteer_instructions?: string | null;
}

export interface EventFilters {
  status?: EventStatus;
  category?: string;
  search?: string;
  created_by?: string;
  upcoming?: boolean;
  need_volunteers?: boolean;
  page?: number;
  limit?: number;
}

export const eventService = {
  async getEvents(filters: EventFilters = {}) {
    const {
      status,
      category,
      search,
      created_by,
      upcoming,
      need_volunteers,
      page = 1,
      limit = 50,
    } = filters;

    try {
      let query = supabase
        .from("events")
        .select("*, profiles!events_created_by_fkey(full_name, email, profile_picture, college)", { count: "exact" })
        .eq("is_soft_deleted", false);

      if (!created_by) {
        query = query.eq("is_disabled", false).neq("status", "disabled").neq("status", "cancelled");
      }

      if (status) query = query.eq("status", status);
      if (category && category !== 'all' && category !== 'All') {
        query = query.ilike("category", `%${category}%`);
      }
      if (created_by) query = query.eq("created_by", created_by);
      if (need_volunteers !== undefined) query = query.eq("need_volunteers", need_volunteers);
      if (search && search.trim()) {
        const s = search.trim();
        query = query.or(
          `title.ilike.%${s}%,short_description.ilike.%${s}%,description.ilike.%${s}%,category.ilike.%${s}%,venue.ilike.%${s}%,building.ilike.%${s}%`
        );
      }
      if (upcoming) {
        query = query.gte("start_date", new Date().toISOString());
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error || !data || data.length === 0) {
        return { data: [], count: 0, page, limit };
      }
      return { data: data as (Event & { profiles: { full_name: string; email: string; profile_picture: string | null; college: string | null } })[], count: count || 0, page, limit };
    } catch {
      return { data: [], count: 0, page, limit };
    }
  },

  async getPublicEvents(filters: EventFilters = {}) {
    const { category, search, page = 1, limit = 50 } = filters;

    try {
      let query = supabase
        .from("events")
        .select("*, profiles!events_created_by_fkey(full_name, email, profile_picture, college)", { count: "exact" })
        .eq("is_soft_deleted", false)
        .eq("is_disabled", false)
        .neq("status", "disabled")
        .neq("status", "draft")
        .neq("status", "cancelled")
        .neq("status", "archived");

      if (category && category !== "all" && category !== "All") {
        query = query.ilike("category", `%${category}%`);
      }

      if (search && search.trim()) {
        const s = search.trim();
        query = query.or(
          `title.ilike.%${s}%,short_description.ilike.%${s}%,description.ilike.%${s}%,category.ilike.%${s}%,venue.ilike.%${s}%`
        );
      }
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error || !data || data.length === 0) {
        return { data: [], count: 0, page, limit };
      }

      // Deduplicate events by ID
      const uniqueData = Array.from(
        new Map((data || []).map((item: any) => [item.id, item])).values()
      );

      return { data: uniqueData, count: count || 0, page, limit };
    } catch {
      return { data: [], count: 0, page, limit };
    }
  },

  async getEventById(id: string) {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          `*, 
          profiles!events_created_by_fkey(full_name, email, profile_picture, phone, department, college),
          event_faqs(*),
          event_gallery(*)`
        )
        .eq("id", id)
        .eq("is_soft_deleted", false)
        .maybeSingle();

      if (error || !data || data.is_disabled || data.status === 'disabled') {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  async createEvent(eventData: CreateEventData & { created_by: string; rules?: string[]; faqs?: any[] }) {
    const { rules, faqs, ...cleanData } = eventData;

    if (!cleanData.created_by || cleanData.created_by === 'user-organizer-1') {
      throw new Error("Invalid organizer account. Please sign in with an organizer account to create events.");
    }

    const { data, error } = await supabase
      .from("events")
      .insert(cleanData)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Database error creating event:", error);
      throw new Error(error.message || "Failed to insert event into database");
    }

    if (!data) {
      throw new Error("No data returned from database after event creation");
    }

    // Insert FAQs into event_faqs if provided
    if (faqs && Array.isArray(faqs) && faqs.length > 0) {
      const faqsToInsert = faqs.map((faq: any, idx: number) => ({
        event_id: data.id,
        question: faq.question || '',
        answer: faq.answer || '',
        display_order: idx + 1
      }));
      await supabase.from("event_faqs").insert(faqsToInsert);
    }

    dataSync.notify("events");
    return data as Event;
  },

  async updateEvent(id: string, updates: Partial<CreateEventData> & { rules?: string[]; faqs?: any[] }) {
    const { rules, faqs, ...cleanUpdates } = updates;

    const { data, error } = await supabase
      .from("events")
      .update(cleanUpdates)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Database error updating event:", error);
      throw new Error(error.message || "Failed to update event in database");
    }

    const updated = data?.[0] || ({ id, ...cleanUpdates } as Event);
    dataSync.notify("events");
    return updated;
  },

  async deleteEvent(id: string) {
    const res = await adminService.deleteEventPermanently(id);
    dataSync.notify("events", "registrations", "volunteers", "certificates", "admin");
    return res;
  },

  async getEventRegistrationCount(eventId: string) {
    try {
      const { count, error } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .neq("status", "cancelled");

      if (error || count === null) return 0;
      return count;
    } catch {
      return 0;
    }
  },

  async getEventStats(eventId: string) {
    try {
      const [registrations, attendance, volunteers, certificates] =
        await Promise.all([
          supabase
            .from("registrations")
            .select("*", { count: "exact", head: true })
            .eq("event_id", eventId)
            .neq("status", "cancelled"),
          supabase
            .from("attendance")
            .select("*", { count: "exact", head: true })
            .eq("event_id", eventId),
          supabase
            .from("volunteers")
            .select("*", { count: "exact", head: true })
            .eq("event_id", eventId)
            .eq("application_status", "approved"),
          supabase
            .from("certificates")
            .select("*", { count: "exact", head: true })
            .eq("event_id", eventId),
        ]);

      return {
        totalRegistrations: registrations.count || 0,
        totalAttendance: attendance.count || 0,
        totalVolunteers: volunteers.count || 0,
        totalCertificates: certificates.count || 0,
      };
    } catch {
      return {
        totalRegistrations: 0,
        totalAttendance: 0,
        totalVolunteers: 0,
        totalCertificates: 0,
      };
    }
  },
};
