import { createClient } from "@/lib/supabase/client";
import { dataSync } from "@/lib/data-sync";
import type { Certificate } from "@/types/database.types";

const supabase = createClient();

export const certificateService = {
  async getCertificates(filters: { event_id?: string; user_id?: string; certificate_type?: string } = {}) {
    try {
      let query = supabase
        .from("certificates")
        .select(`
          *, 
          events(
            id, title, venue, start_date, end_date, created_by
          ),
          profiles!certificates_user_id_fkey(full_name, email, department, year, college)
        `);

      if (filters.event_id) query = query.eq("event_id", filters.event_id);
      if (filters.user_id) query = query.eq("user_id", filters.user_id);
      if (filters.certificate_type) query = query.eq("certificate_type", filters.certificate_type);

      const { data, error } = await query.order("generated_at", { ascending: false });

      if (error || !data) {
        return [];
      }

      // Populate organizer profile details (organization, faculty_advisor_name, etc.)
      const createdByIds = Array.from(new Set((data || []).map((c: any) => c.events?.created_by).filter(Boolean)));
      if (createdByIds.length > 0) {
        const { data: orgProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, organization, club_name, organization_type, designation, faculty_advisor_name, profile_picture")
          .in("id", createdByIds);
        
        const orgMap = new Map((orgProfiles || []).map((p: any) => [p.id, p]));
        data.forEach((c: any) => {
          if (c.events && c.events.created_by) {
            c.events.organizer = orgMap.get(c.events.created_by);
          }
        });
      }

      return data;
    } catch {
      return [];
    }
  },

  /**
   * Student Participation Certificate Eligibility Rule:
   * Registration Status IN ('approved', 'completed') AND Attendance Status = 'present'.
   * Excludes pending_checkout, checked_in, absent, late, or unapproved/cancelled registrations.
   */
  async getEligibleParticipants(eventId: string) {
    try {
      const { data: attData, error: attError } = await supabase
        .from('attendance')
        .select(`
          user_id,
          registration_id,
          profiles!attendance_user_id_fkey(full_name, email, department, year)
        `)
        .eq('event_id', eventId)
        .eq('attendance_status', 'present');

      if (attError || !attData || attData.length === 0) return [];

      const regIds = attData.map((a: any) => a.registration_id).filter(Boolean);

      const { data: regData } = await supabase
        .from('registrations')
        .select('id')
        .in('id', regIds)
        .in('status', ['approved', 'completed']);

      const validRegIds = new Set((regData || []).map((r: any) => r.id));

      return attData
        .filter((a: any) => validRegIds.has(a.registration_id))
        .map((a: any) => ({
          user_id: a.user_id,
          registration_id: a.registration_id,
          profiles: a.profiles,
        }));
    } catch {
      return [];
    }
  },

  /**
   * Volunteer Certificate Eligibility Rule:
   * Application Status = 'approved' AND Task Status = 'accepted' AND Volunteer Task Attendance Status = 'present'.
   */
  async getEligibleVolunteers(eventId: string) {
    try {
      const { data: volunteers, error: volError } = await supabase
        .from('volunteers')
        .select(`
          id,
          user_id,
          profiles!volunteers_user_id_fkey(full_name, email, department, year)
        `)
        .eq('event_id', eventId)
        .eq('application_status', 'approved');

      if (volError || !volunteers || volunteers.length === 0) return [];

      const volunteerIds = volunteers.map((v: any) => v.id);

      const { data: tasks, error: tasksError } = await supabase
        .from('volunteer_tasks')
        .select('volunteer_id')
        .eq('event_id', eventId)
        .eq('status', 'accepted')
        .eq('attendance_status', 'present')
        .in('volunteer_id', volunteerIds);

      if (tasksError || !tasks || tasks.length === 0) return [];

      const presentVolunteerIds = new Set(tasks.map((t: any) => t.volunteer_id));
      return volunteers
        .filter((v: any) => presentVolunteerIds.has(v.id))
        .map((v: any) => ({
          user_id: v.user_id,
          volunteer_id: v.id,
          profiles: v.profiles,
        }));
    } catch {
      return [];
    }
  },

  async generateCertificate(
    eventId: string,
    userId: string,
    registrationId: string | null,
    certificateType: "participation" | "winner" | "runner_up" | "second_runner_up" | "volunteer",
    generatedBy: string
  ) {
    const { data, error } = await supabase
      .from("certificates")
      .insert({
        event_id: eventId,
        user_id: userId,
        registration_id: registrationId,
        certificate_type: certificateType,
        generated_by: generatedBy,
        generated_at: new Date().toISOString(),
        verification_id: `EH-CERT-${Math.floor(100000 + Math.random() * 900000)}`,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to generate certificate");
    }
    dataSync.notify("certificates");
    return data as Certificate;
  },

  async generateBulkCertificates(
    eventId: string,
    certificateType: "participation" | "winner" | "runner_up" | "second_runner_up" | "volunteer",
    generatedBy: string
  ) {
    try {
      let eligibleUsers: any[] = [];

      if (certificateType === "participation") {
        eligibleUsers = await this.getEligibleParticipants(eventId);
      } else if (certificateType === "volunteer") {
        eligibleUsers = await this.getEligibleVolunteers(eventId);
      } else if (certificateType === "winner" || certificateType === "runner_up" || certificateType === "second_runner_up") {
        const winners = await this.getEventWinners(eventId);
        eligibleUsers = winners.filter((w: any) => w.certificate_type === certificateType);
      }

      if (!eligibleUsers.length) return { count: 0, data: [] };

      // Prevent duplicate certificates
      const { data: existingCerts } = await supabase
        .from("certificates")
        .select("user_id")
        .eq("event_id", eventId)
        .eq("certificate_type", certificateType);

      const existingUserIds = new Set((existingCerts || []).map((c: any) => c.user_id));
      const unissuedUsers = eligibleUsers.filter((u: any) => !existingUserIds.has(u.user_id));

      if (!unissuedUsers.length) return { count: 0, data: [] };

      const certificatesToInsert = unissuedUsers.map((user: any) => ({
        event_id: eventId,
        user_id: user.user_id,
        registration_id: user.registration_id || null,
        certificate_type: certificateType,
        generated_by: generatedBy,
        generated_at: new Date().toISOString(),
        verification_id: `EH-CERT-${Math.floor(100000 + Math.random() * 900000)}`,
      }));

      const { data, error } = await supabase
        .from("certificates")
        .insert(certificatesToInsert)
        .select();

      if (error) {
        console.error("Bulk certificate insertion error:", error);
        return { count: 0, data: [] };
      }

      dataSync.notify("certificates");
      return { count: data.length, data: data as Certificate[] };
    } catch (e) {
      console.error("Bulk certificate exception:", e);
      return { count: 0, data: [] };
    }
  },

  async setEventWinner(eventId: string, userId: string, type: 'winner' | 'runner_up' | 'second_runner_up') {
    const eligibleList = await this.getEligibleParticipants(eventId);
    const isEligible = eligibleList.some((p: any) => p.user_id === userId);
    if (!isEligible) {
      throw new Error("Student is not eligible for winner designation. Attendance checkout must be completed.");
    }

    await supabase
      .from("certificates")
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .in('certificate_type', ['winner', 'runner_up', 'second_runner_up']);

    const { data, error } = await supabase
      .from("certificates")
      .insert({
        event_id: eventId,
        user_id: userId,
        certificate_type: type,
        generated_by: 'organizer',
        generated_at: new Date().toISOString(),
        verification_id: `EH-CERT-${Math.floor(100000 + Math.random() * 900000)}`,
      })
      .select()
      .single();

    if (error) throw error;
    dataSync.notify("certificates");
    return data;
  },

  async removeEventWinner(eventId: string, userId: string) {
    const { error } = await supabase
      .from("certificates")
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .in('certificate_type', ['winner', 'runner_up', 'second_runner_up']);

    if (error) throw error;
    dataSync.notify("certificates");
  },

  async getEventWinners(eventId: string) {
    const { data, error } = await supabase
      .from("certificates")
      .select(`
        *,
        profiles!certificates_user_id_fkey(full_name, email, department, year)
      `)
      .eq('event_id', eventId)
      .in('certificate_type', ['winner', 'runner_up', 'second_runner_up']);

    if (error || !data) return [];
    return data;
  },

  async verifyCertificate(verificationId: string) {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select(`
          *, 
          events(id, title, category, start_date, venue, created_by),
          profiles!certificates_user_id_fkey(full_name, college, department, email)
        `)
        .eq("verification_id", verificationId)
        .single();

      if (error || !data) {
        return null;
      }

      if (data.events?.created_by) {
        const { data: orgProfile } = await supabase
          .from("profiles")
          .select("full_name, organization, club_name, organization_type, designation, faculty_advisor_name, profile_picture")
          .eq("id", data.events.created_by)
          .maybeSingle();

        if (orgProfile && data.events) {
          data.events.organizer = orgProfile;
        }
      }

      return data;
    } catch {
      return null;
    }
  },
};
