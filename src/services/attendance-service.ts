import { createClient } from "@/lib/supabase/client";
import type { Attendance } from "@/types/database.types";

const supabase = createClient();

export interface ManualSearchResult {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  profiles: {
    full_name: string;
    email: string;
    department: string | null;
    year: string | null;
    profile_picture: string | null;
    prn?: string | null;
  };
  events?: {
    title: string;
  };
}

export function calculateDuration(startTime: string | null | undefined, endTime: string | null | undefined): string {
  if (!startTime || !endTime) return 'N/A';
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return 'N/A';
  const diffMs = end - start;
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export const attendanceService = {
  async verifyAndRecordAttendance(
    qrToken: string,
    volunteerId: string
  ): Promise<{
    success: boolean;
    message: string;
    actionType?: 'check_in' | 'check_out' | 'already_completed';
    data?: {
      studentName: string;
      registrationId: string;
      eventName: string;
      checkInTime?: string;
      checkOutTime?: string;
      duration?: string;
      status?: string;
    };
  }> {
    try {
      if (!qrToken || typeof qrToken !== "string") {
        return { success: false, message: "Invalid QR Code token" };
      }

      const rawToken = qrToken.trim();
      const isCheckoutScan = rawToken.toUpperCase().startsWith("CHECKOUT:");
      const cleanToken = isCheckoutScan ? rawToken.substring(9).trim() : rawToken;

      console.log("[SCANNER LOG] rawToken:", rawToken, "| isCheckoutScan:", isCheckoutScan, "| cleanToken:", cleanToken);

      // 1. Lookup registration safely using clean .eq() calls
      let { data: registration } = await supabase
        .from("registrations")
        .select("id, event_id, user_id, status, qr_token")
        .eq("qr_token", cleanToken)
        .maybeSingle();

      if (!registration) {
        const { data: regById } = await supabase
          .from("registrations")
          .select("id, event_id, user_id, status, qr_token")
          .eq("id", cleanToken)
          .maybeSingle();
        registration = regById;
      }

      // If still not found directly, check if cleanToken is an attendance ID
      if (!registration) {
        const { data: attRec } = await supabase
          .from("attendance")
          .select("registration_id, registrations(id, event_id, user_id, status, qr_token)")
          .eq("id", cleanToken)
          .maybeSingle();
        if (attRec?.registrations) {
          registration = attRec.registrations as any;
        }
      }

      if (!registration) {
        return {
          success: false,
          message: isCheckoutScan 
            ? "Invalid Checkout QR Code (Registration token not found)" 
            : "Invalid QR Code (Registration token not found)"
        };
      }

      if (registration.status !== "approved" && registration.status !== "completed") {
        return { success: false, message: "Registration not approved. Please contact the event organizer." };
      }

      const registrationId = registration.id;
      const eventId = registration.event_id;
      const userId = registration.user_id;

      // 2. Query existing attendance record for this registration
      const { data: existing } = await supabase
        .from("attendance")
        .select("id, check_in_time, check_out_time, attendance_status, checked_in_by, checked_out_by")
        .eq("registration_id", registrationId)
        .maybeSingle();

      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
      const { data: evt } = await supabase.from("events").select("title").eq("id", eventId).maybeSingle();
      const studentName = prof?.full_name || "Student";
      const eventName = evt?.title || "Event";

      // ==========================================
      // BRANCH 1: CHECKOUT WORKFLOW (starts with "CHECKOUT:")
      // ==========================================
      if (isCheckoutScan) {
        if (!existing) {
          return {
            success: false,
            message: "Cannot process checkout: Participant has not checked in yet.",
          };
        }

        if (existing.attendance_status === "present" || existing.check_out_time) {
          const duration = calculateDuration(existing.check_in_time, existing.check_out_time);
          return {
            success: false,
            actionType: 'already_completed',
            message: "Attendance already completed.",
            data: {
              studentName,
              registrationId,
              eventName,
              checkInTime: new Date(existing.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              checkOutTime: existing.check_out_time ? new Date(existing.check_out_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
              duration,
              status: "Present"
            },
          };
        }

        // Process Check-Out (update existing attendance row ONLY)
        const checkOutTime = new Date().toISOString();
        const { error: updateError } = await supabase
          .from("attendance")
          .update({
            check_out_time: checkOutTime,
            checked_out_by: volunteerId,
            attendance_status: "present",
            updated_at: checkOutTime,
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error("Failed to process check-out:", updateError);
          return { success: false, message: "Failed to process check-out: " + updateError.message };
        }

        const duration = calculateDuration(existing.check_in_time, checkOutTime);
        return {
          success: true,
          actionType: 'check_out',
          message: "✓ Check-Out Successful\nAttendance Completed",
          data: {
            studentName,
            registrationId,
            eventName,
            checkInTime: new Date(existing.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            checkOutTime: new Date(checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            duration,
            status: "Present"
          },
        };
      }

      // ==========================================
      // BRANCH 2: ENTRY QR WORKFLOW (normal entry scan)
      // ==========================================
      if (!existing) {
        // Create new attendance record with pending_checkout
        const checkInTime = new Date().toISOString();
        const { error: attError } = await supabase.from("attendance").insert({
          event_id: eventId,
          registration_id: registrationId,
          user_id: userId,
          volunteer_id: volunteerId,
          checked_in_by: volunteerId,
          check_in_time: checkInTime,
          attendance_status: "pending_checkout",
        });

        if (attError) {
          console.error("Failed to insert attendance record:", JSON.stringify(attError));
          if (attError.code === '23505') {
            return { success: false, message: "Attendance already recorded for this participant." };
          }
          return { success: false, message: "Failed to record attendance: " + (attError.message || "Unknown error") };
        }

        // NOTE: We do NOT modify registrations.qr_token! We only set registration status to completed if needed
        await supabase.from("registrations").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", registrationId);

        return {
          success: true,
          actionType: 'check_in',
          message: "✓ Check-In Successful",
          data: {
            studentName,
            registrationId,
            eventName,
            checkInTime: new Date(checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "Pending Checkout"
          },
        };
      }

      // If attendance record exists during entry scan:
      if (existing.attendance_status === "pending_checkout") {
        return {
          success: false,
          actionType: 'check_in',
          message: "Already checked in. Please scan Checkout QR before leaving.",
          data: {
            studentName,
            registrationId,
            eventName,
            checkInTime: new Date(existing.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "Pending Checkout"
          }
        };
      }

      // If already present
      const duration = calculateDuration(existing.check_in_time, existing.check_out_time);
      return {
        success: false,
        actionType: 'already_completed',
        message: "Attendance already completed.",
        data: {
          studentName,
          registrationId,
          eventName,
          checkInTime: new Date(existing.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          checkOutTime: existing.check_out_time ? new Date(existing.check_out_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
          duration,
          status: "Present"
        },
      };
    } catch (error: any) {
      console.error("Attendance verification error:", error);
      return { success: false, message: error?.message || "An error occurred during verification" };
    }
  },

  generateQRData(registrationId: string, eventId: string, userId: string, token: string): string {
    return token;
  },

  async searchRegistrationsForManualCheckIn(
    eventId: string | undefined,
    query: string
  ): Promise<ManualSearchResult[]> {
    try {
      if (!query || query.trim().length < 2) return [];

      const searchTerm = `%${query.trim()}%`;
      let q = supabase
        .from("registrations")
        .select(`
          id, event_id, user_id, status, prn,
          profiles!registrations_user_id_fkey(full_name, email, department, year, profile_picture),
          events(id, title)
        `)
        .or(`profiles.full_name.ilike.${searchTerm},profiles.email.ilike.${searchTerm},prn.ilike.${searchTerm}`)
        .in("status", ["approved", "completed"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (eventId) {
        q = q.eq("event_id", eventId);
      }

      const { data, error } = await q;

      if (error || !data) {
        console.error("Search error:", error);
        return [];
      }

      return (data as any[]).map(r => ({
        id: r.id,
        event_id: r.event_id,
        user_id: r.user_id,
        status: r.status,
        profiles: {
          full_name: r.profiles?.full_name || '',
          email: r.profiles?.email || '',
          department: r.profiles?.department || null,
          year: r.profiles?.year || null,
          profile_picture: r.profiles?.profile_picture || null,
          prn: r.prn || null,
        },
        events: r.events,
      }));
    } catch (e) {
      console.error("Search exception:", e);
      return [];
    }
  },

  async manualCheckIn(
    eventId: string,
    registrationId: string,
    userId: string,
    volunteerId: string
  ): Promise<{
    success: boolean;
    message: string;
    actionType?: 'check_in' | 'check_out' | 'already_completed';
    data?: { studentName: string; eventName: string; checkInTime: string; checkOutTime?: string; duration?: string; status?: string };
  }> {
    try {
      const { data: existing } = await supabase
        .from("attendance")
        .select("id, check_in_time, check_out_time, attendance_status")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle();

      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
      const { data: evt } = await supabase.from("events").select("title").eq("id", eventId).maybeSingle();
      const studentName = prof?.full_name || "Student";
      const eventName = evt?.title || "Event";

      // FIRST SCAN: Manual Check-In
      if (!existing) {
        const checkInTime = new Date().toISOString();
        const { error } = await supabase.from("attendance").insert({
          event_id: eventId,
          registration_id: registrationId,
          user_id: userId,
          volunteer_id: volunteerId,
          checked_in_by: volunteerId,
          check_in_time: checkInTime,
          attendance_status: "pending_checkout",
        });

        if (error) {
          if (error.code === '23505') {
            return { success: false, message: "Attendance already recorded for this participant." };
          }
          return { success: false, message: error.message || "Failed to record manual check-in" };
        }

        await supabase.from("registrations").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", registrationId);

        return {
          success: true,
          actionType: 'check_in',
          message: "✓ Check-In Successful",
          data: {
            studentName,
            eventName,
            checkInTime: new Date(checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "Pending Checkout"
          },
        };
      }

      // SECOND SCAN: Manual Check-Out
      if (existing.attendance_status === 'pending_checkout' || (!existing.check_out_time && existing.attendance_status !== 'present')) {
        const checkOutTime = new Date().toISOString();
        const { error: updateError } = await supabase
          .from("attendance")
          .update({
            check_out_time: checkOutTime,
            checked_out_by: volunteerId,
            attendance_status: "present",
            updated_at: checkOutTime,
          })
          .eq("id", existing.id);

        if (updateError) {
          return { success: false, message: "Failed to process check-out: " + updateError.message };
        }

        const duration = calculateDuration(existing.check_in_time, checkOutTime);
        return {
          success: true,
          actionType: 'check_out',
          message: "✓ Check-Out Successful\nAttendance Completed",
          data: {
            studentName,
            eventName,
            checkInTime: new Date(existing.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            checkOutTime: new Date(checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            duration,
            status: "Present"
          },
        };
      }

      // THIRD SCAN: Already Completed
      const duration = calculateDuration(existing.check_in_time, existing.check_out_time);
      return {
        success: false,
        actionType: 'already_completed',
        message: "Attendance already completed.",
        data: {
          studentName,
          eventName,
          checkInTime: new Date(existing.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          checkOutTime: existing.check_out_time ? new Date(existing.check_out_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
          duration,
          status: "Present"
        },
      };
    } catch (e: any) {
      console.error("Manual check-in exception:", e);
      return { success: false, message: e?.message || "Failed to record check-in" };
    }
  },

  async getEventAttendance(eventId: string) {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(
          `*, 
          profiles!attendance_user_id_fkey(full_name, email, department, year, profile_picture),
          volunteer:profiles!attendance_volunteer_id_fkey(full_name),
          registrations(id, registration_type, team_id, prn)`
        )
        .eq("event_id", eventId)
        .order("check_in_time", { ascending: false });

      if (error || !data) {
        return [];
      }
      return data as any[];
    } catch {
      return [];
    }
  },

  async getMyScanHistory(volunteerId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id, event_id, user_id, registration_id, check_in_time, check_out_time, attendance_status, checked_in_by, checked_out_by,
          profiles!attendance_user_id_fkey(full_name, email, department),
          events(id, title, venue)
        `)
        .or(`volunteer_id.eq.${volunteerId},checked_in_by.eq.${volunteerId},checked_out_by.eq.${volunteerId}`)
        .order("check_in_time", { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data as any[];
    } catch (catchErr) {
      console.error("[SERVICE getMyScanHistory EXCEPTION]", catchErr);
      return [];
    }
  },

  async getAttendanceStats(eventId: string) {
    try {
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("id, attendance_status")
        .eq("event_id", eventId);

      const { count: totalCount } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["approved", "completed"]);

      const total = totalCount || 0;
      const attList = attendanceData || [];
      const pendingCheckout = attList.filter((a: any) => a.attendance_status === 'pending_checkout').length;
      const present = attList.filter((a: any) => a.attendance_status === 'present' || a.attendance_status === 'checked_in').length;
      const checkedIn = attList.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        total,
        checkedIn,
        pendingCheckout,
        present,
        percentage,
      };
    } catch {
      return {
        total: 0,
        checkedIn: 0,
        pendingCheckout: 0,
        present: 0,
        percentage: 0,
      };
    }
  },

  async getAttendanceForRegistration(registrationId: string) {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("registration_id", registrationId)
        .maybeSingle();

      if (error || !data) return null;
      return data as Attendance;
    } catch {
      return null;
    }
  },
};
