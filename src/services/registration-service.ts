import { createClient } from "@/lib/supabase/client";
import { dataSync } from "@/lib/data-sync";
import { logDeletionAudit } from "@/lib/deletion-framework";
import type { Registration, RegistrationStatus, PaymentStatus } from "@/types/database.types";

const supabase = createClient();

export interface CreateRegistrationData {
  event_id: string;
  user_id: string;
  team_id?: string;
  registration_type: "individual" | "team";
  phone?: string;
  department?: string;
  year?: string;
  prn?: string;
  special_requirements?: string;
  emergency_contact?: string;
}

export interface RegistrationFilters {
  event_id?: string;
  user_id?: string;
  status?: RegistrationStatus;
  payment_status?: PaymentStatus;
  registration_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const registrationService = {
  async getRegistrations(filters: RegistrationFilters = {}) {
    const {
      event_id,
      user_id,
      status,
      payment_status,
      registration_type,
      search,
      page = 1,
      limit = 10,
    } = filters;

    try {
      let query = supabase
        .from("registrations")
        .select(
          `*, 
          events(id, title, start_date, end_date, venue, poster_url, registration_fee, status),
          profiles!registrations_user_id_fkey(full_name, email, phone, department, year, profile_picture),
          teams(id, team_name)`,
          { count: "exact" }
        );

      if (event_id) query = query.eq("event_id", event_id);
      if (user_id) query = query.eq("user_id", user_id);
      if (status) query = query.eq("status", status);
      if (payment_status) query = query.eq("payment_status", payment_status);
      if (registration_type) query = query.eq("registration_type", registration_type);

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error || !data || data.length === 0) {
        return { data: [], count: 0, page, limit };
      }
      return { data: data || [], count: count || 0, page, limit };
    } catch {
      return { data: [], count: 0, page, limit };
    }
  },

  async getUserRegistrations(userId: string) {
    const res = await this.getRegistrations({ user_id: userId, limit: 100 });
    return res.data;
  },

  async getRegistrationById(id: string) {
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select(
          `*, 
          events(*),
          profiles!registrations_user_id_fkey(*),
          teams(*, team_members(*, profiles(*)))`
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  async createRegistration(regData: CreateRegistrationData) {
    console.log("[TRACE] createRegistration started with payload:", JSON.stringify(regData));
    
    // 1. Fetch event fee to set correct registration status
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("registration_fee")
      .eq("id", regData.event_id)
      .single();

    if (eventErr) {
      console.error("[TRACE] failed to fetch event fee:", eventErr);
    }

    const isPaid = (event?.registration_fee || 0) > 0;
    const initialStatus = isPaid ? 'pending_payment' : 'approved';
    const initialPaymentStatus = isPaid ? 'pending' : 'not_required';
    const qrGenerated = !isPaid;
    
    console.log(`[TRACE] event fee check resolved. registration_fee: ${event?.registration_fee || 0}, isPaid: ${isPaid}, status: ${initialStatus}, payment_status: ${initialPaymentStatus}`);

    // 2. Pre-check if user is already registered for this event
    const { data: existing, error: existErr } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", regData.event_id)
      .eq("user_id", regData.user_id)
      .maybeSingle();

    if (existErr) {
      console.error("[TRACE] Pre-check registrations select query returned error:", existErr);
    }

    if (existing) {
      console.log("[TRACE] Pre-check found existing registration row:", JSON.stringify(existing));
      return existing as Registration;
    }

    // 3. Attempt insert
    const insertPayload = {
      ...regData,
      status: initialStatus,
      payment_status: initialPaymentStatus,
      qr_generated: qrGenerated,
      qr_token: `EH-${regData.event_id.toUpperCase().slice(0, 8)}-PASS-${Date.now()}`
    };
    
    console.log("[TRACE] Executing Supabase INSERT registrations with payload:", JSON.stringify(insertPayload));
    
    const { data, error } = await supabase
      .from("registrations")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("[TRACE] INSERT registrations failed with error:", error);
      // 4. Handle race condition / duplicate key constraint error gracefully
      if (error.code === '23505') {
        console.log("[TRACE] unique constraint 23505 hit. Querying duplicate registration...");
        const { data: duplicate } = await supabase
          .from("registrations")
          .select("*")
          .eq("event_id", regData.event_id)
          .eq("user_id", regData.user_id)
          .single();
        if (duplicate) {
          console.log("[TRACE] Found existing registration from duplicate query:", JSON.stringify(duplicate));
          return duplicate as Registration;
        }
      }
      throw new Error("Unable to complete registration. You may already be registered for this event.");
    }

    if (!data) {
      console.error("[TRACE] INSERT returned no data");
      throw new Error("No data returned from database after registration creation");
    }

    console.log("[TRACE] INSERT registrations succeeded. Returned data object:", JSON.stringify(data));
    dataSync.notify("registrations", "events");
    return data as Registration;
  },

  async updateRegistrationStatus(id: string, status: RegistrationStatus, payment_status?: PaymentStatus, approvedBy?: string) {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (payment_status) updates.payment_status = payment_status;
    if (status === "approved") {
      updates.approved_at = new Date().toISOString();
      updates.qr_generated = true;
      updates.qr_token = `EH-PASS-${Date.now()}`;
      if (approvedBy) updates.approved_by = approvedBy;
    }

    console.log("[UPDATE TRACE] Registration ID:", id);
    console.log("[UPDATE TRACE] Updates object:", JSON.stringify(updates, null, 2));
    console.log("[UPDATE TRACE] Full PATCH payload:", JSON.stringify({ table: "registrations", filter: { id }, updates }, null, 2));

    const { data, error } = await supabase
      .from("registrations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[UPDATE TRACE] Complete Error Object:", JSON.stringify(error, null, 2));
      console.error("[UPDATE TRACE] Error Code:", error.code);
      console.error("[UPDATE TRACE] Error Message:", error.message);
      console.error("[UPDATE TRACE] Error Details:", error.details);
      console.error("[UPDATE TRACE] Error Hint:", error.hint);
      throw new Error(error.message || "Failed to update registration status");
    }

    if (!data) {
      throw new Error("Registration not found or failed to update");
    }

    dataSync.notify("registrations", "events");
    return data as Registration;
  },

  async cancelRegistration(id: string) {
    return this.updateRegistrationStatus(id, "cancelled");
  },

  async deleteRegistrationPermanently(id: string) {
    if (!id) throw new Error("Registration ID is required");

    // 1. Get registration details first
    const { data: reg, error: fetchErr } = await supabase
      .from("registrations")
      .select("id, user_id, event_id, team_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[deleteRegistrationPermanently] Fetch error:", fetchErr);
    }

    const regUserId = reg?.user_id;
    const eventId = reg?.event_id;
    const teamId = reg?.team_id;

    // 2. Remove attendance records
    if (id) {
      await supabase.from("attendance").delete().eq("registration_id", id);
    }
    if (regUserId && eventId) {
      await supabase.from("attendance").delete().eq("user_id", regUserId).eq("event_id", eventId);
    }

    // 3. Remove issued certificates & invalidate them
    if (id) {
      await supabase.from("certificates").delete().eq("registration_id", id);
    }
    if (regUserId && eventId) {
      await supabase.from("certificates").delete().eq("user_id", regUserId).eq("event_id", eventId);
    }

    // 4. Remove volunteer mapping if applicable
    if (regUserId && eventId) {
      const { data: volRows } = await supabase
        .from("volunteers")
        .select("id")
        .eq("user_id", regUserId)
        .eq("event_id", eventId);

      if (volRows && volRows.length > 0) {
        const volIds = volRows.map((v: any) => v.id);
        await supabase.from("volunteer_tasks").delete().in("volunteer_id", volIds);
      }
      await supabase.from("volunteers").delete().eq("user_id", regUserId).eq("event_id", eventId);
    }

    // 5. Remove team membership if applicable
    if (regUserId && eventId) {
      if (teamId) {
        await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", regUserId);
      }
      const { data: teamRows } = await supabase
        .from("teams")
        .select("id")
        .eq("event_id", eventId);

      if (teamRows && teamRows.length > 0) {
        const teamIds = teamRows.map((t: any) => t.id);
        await supabase.from("team_members").delete().in("team_id", teamIds).eq("user_id", regUserId);
      }
    }

    // 6. Delete payments
    if (id) {
      await supabase.from("payments").delete().eq("registration_id", id);
    }

    // 7. Delete registration row itself
    const { error: deleteErr } = await supabase
      .from("registrations")
      .delete()
      .eq("id", id);

    if (deleteErr) {
      throw new Error(deleteErr.message || "Failed to delete registration record");
    }

    // Log deletion event to audit_logs
    await logDeletionAudit({
      action: "DELETE_REGISTRATION",
      resourceType: "registration",
      resourceId: id,
      details: { event_id: eventId, user_id: regUserId }
    });

    // 8. Update event participant count (recalculate remaining active registrations)
    if (eventId) {
      try {
        const { count: activeCount } = await supabase
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .in("status", ["approved", "completed", "pending", "pending_payment"]);

        await supabase
          .from("events")
          .update({
            registered_participants: activeCount || 0,
            registered_count: activeCount || 0,
            updated_at: new Date().toISOString()
          })
          .eq("id", eventId);
      } catch (countErr) {
        console.warn("[deleteRegistrationPermanently] Warning updating event count:", countErr);
      }
    }

    // 9. Trigger real-time synchronization
    dataSync.notify("registrations", "events", "attendance", "certificates", "volunteers");
    return true;
  },
};
