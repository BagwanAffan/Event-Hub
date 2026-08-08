import { createClient } from "@/lib/supabase/client";
import { dataSync } from "@/lib/data-sync";
import { logDeletionAudit } from "@/lib/deletion-framework";
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
    let validOrganizerId = generatedBy;
    if (!validOrganizerId || validOrganizerId === 'organizer' || validOrganizerId === 'unknown') {
      const { data: authData } = await supabase.auth.getUser();
      validOrganizerId = authData?.user?.id || '';
    }

    if (!validOrganizerId) {
      throw new Error("Valid organizer UUID is required to generate certificate");
    }

    const { data, error } = await supabase
      .from("certificates")
      .insert({
        event_id: eventId,
        user_id: userId,
        registration_id: registrationId,
        certificate_type: certificateType,
        generated_by: validOrganizerId,
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
      let validOrganizerId = generatedBy;
      if (!validOrganizerId || validOrganizerId === 'organizer' || validOrganizerId === 'unknown') {
        const { data: authData } = await supabase.auth.getUser();
        validOrganizerId = authData?.user?.id || '';
      }

      if (!validOrganizerId) {
        console.error("Bulk certificate error: Missing valid organizer UUID");
        return { count: 0, data: [] };
      }

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
        generated_by: validOrganizerId,
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

  async setEventWinner(
    eventId: string,
    userId: string,
    type: 'winner' | 'runner_up' | 'second_runner_up',
    organizerId?: string
  ) {
    if (!eventId || !userId) {
      throw new Error("Event ID and User ID are required.");
    }
    if (!['winner', 'runner_up', 'second_runner_up'].includes(type)) {
      throw new Error("Invalid award type specified.");
    }

    const eligibleList = await this.getEligibleParticipants(eventId);
    const isEligible = eligibleList.some((p: any) => p.user_id === userId);
    if (!isEligible) {
      throw new Error("Student is not eligible for winner designation. Attendance checkout must be completed.");
    }

    let validOrganizerId = organizerId;
    if (!validOrganizerId || validOrganizerId === 'organizer' || validOrganizerId === 'unknown') {
      const { data: authData } = await supabase.auth.getUser();
      validOrganizerId = authData?.user?.id;
    }

    if (!validOrganizerId) {
      throw new Error("Valid organizer profile UUID is required to assign winners.");
    }

    const dbCertType = (type === 'second_runner_up') ? 'runner_up' : type;
    const prefix = (type === 'winner') ? 'EH-CERT-WINNER' : (type === 'second_runner_up') ? 'EH-CERT-RUNNER2' : 'EH-CERT-RUNNER1';

    // 1. Remove any existing award certificate for this specific user in this event
    await supabase
      .from("certificates")
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .in('certificate_type', ['winner', 'runner_up']);

    // 2. Enforce single recipient per award: Remove any existing holder of this exact award type in this event
    const existingWinners = await this.getEventWinners(eventId);
    const existingAwardHolder = existingWinners.find((w: any) => w.certificate_type === type);
    if (existingAwardHolder) {
      await supabase
        .from("certificates")
        .delete()
        .eq('id', existingAwardHolder.id);
    }

    // 3. Insert new winner certificate with DB-allowed certificate_type ('winner' or 'runner_up')
    const { data, error } = await supabase
      .from("certificates")
      .insert({
        event_id: eventId,
        user_id: userId,
        certificate_type: dbCertType,
        generated_by: validOrganizerId,
        generated_at: new Date().toISOString(),
        verification_id: `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`,
      })
      .select()
      .single();

    if (error) {
      console.error("Set winner error:", error);
      throw new Error(error.message || "Failed to set winner designation");
    }

    dataSync.notify("certificates");

    if (data && type === 'second_runner_up') {
      return { ...data, certificate_type: 'second_runner_up' };
    }
    return data;
  },

  async removeEventWinner(eventId: string, userId: string) {
    if (!eventId || !userId) return;
    const { error } = await supabase
      .from("certificates")
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .in('certificate_type', ['winner', 'runner_up']);

    if (error) {
      console.error("Remove winner error:", error);
      throw new Error(error.message || "Failed to remove winner designation");
    }

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
      .in('certificate_type', ['winner', 'runner_up']);

    if (error || !data) return [];

    return data.map((c: any) => {
      if (c.certificate_type === 'runner_up' && c.verification_id && c.verification_id.includes('RUNNER2')) {
        return { ...c, certificate_type: 'second_runner_up' };
      }
      return c;
    });
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

  async deleteCertificate(id: string) {
    if (!id) throw new Error("Certificate ID is required for deletion");

    // 1. Fetch certificate details first (verification_id, pdf_url, event_id)
    const { data: cert, error: fetchErr } = await supabase
      .from("certificates")
      .select("id, verification_id, pdf_url, file_path, event_id, certificate_type")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[deleteCertificate] Fetch certificate error:", fetchErr);
    }

    const eventId = cert?.event_id;
    const verificationId = cert?.verification_id;
    const pdfUrl = (cert as any)?.pdf_url || (cert as any)?.file_path;

    // 2. Remove generated PDF file from Supabase storage if stored
    if (pdfUrl) {
      try {
        let filePath = pdfUrl;
        if (filePath.includes('/certificates/')) {
          filePath = filePath.split('/certificates/').pop() || filePath;
        }
        await supabase.storage.from('certificates').remove([filePath, `${id}.pdf`, `${verificationId}.pdf`]);
      } catch (storageErr) {
        console.warn("[deleteCertificate] Warning deleting PDF from storage:", storageErr);
      }
    }

    // 3. Delete certificate record from database (Invalidates verification ID)
    const { error: deleteErr } = await supabase
      .from("certificates")
      .delete()
      .eq("id", id);

    if (deleteErr) {
      throw new Error(deleteErr.message || "Failed to delete certificate record");
    }

    // Log deletion event to audit_logs
    await logDeletionAudit({
      action: "DELETE_CERTIFICATE",
      resourceType: "certificate",
      resourceId: id,
      details: { event_id: eventId, verification_id: verificationId }
    });

    // 4. Update certificate counters / event stats
    if (eventId) {
      try {
        const { count: remainingCerts } = await supabase
          .from("certificates")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId);

        await supabase
          .from("events")
          .update({
            issued_certificates_count: remainingCerts || 0,
            updated_at: new Date().toISOString()
          })
          .eq("id", eventId);
      } catch (countErr) {
        console.warn("[deleteCertificate] Warning updating certificate counter:", countErr);
      }
    }

    // 5. Trigger real-time sync for certificates and events
    dataSync.notify("certificates", "events");
    return true;
  },
};
