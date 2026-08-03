import { createClient } from "@/lib/supabase/client";
import { storageService } from "./storage-service";
import type { OrganizerVerification } from "@/types/database.types";

const supabase = createClient();

export const organizerVerificationService = {
  async getVerificationByUserId(userId: string): Promise<OrganizerVerification | null> {
    try {
      const { data, error } = await supabase
        .from("organizer_verifications")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching organizer verification:", error);
        return null;
      }

      return data as OrganizerVerification | null;
    } catch {
      return null;
    }
  },

  async uploadDocument(userId: string, docType: string, file: File): Promise<string> {
    const bucket = "organizer-documents";
    const path = `verifications/${userId}/${docType}`;
    return await storageService.uploadFile(bucket, path, file);
  },

  async submitVerificationProfile(payload: Omit<OrganizerVerification, 'id' | 'created_at' | 'updated_at'>): Promise<OrganizerVerification> {
    const { data: existing } = await supabase
      .from("organizer_verifications")
      .select("id")
      .eq("user_id", payload.user_id)
      .maybeSingle();

    let result;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("organizer_verifications")
        .update({
          ...payload,
          verification_status: "pending",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || "Failed to update verification profile");
      result = data;
    } else {
      const { data, error } = await supabase
        .from("organizer_verifications")
        .insert({
          ...payload,
          verification_status: "pending",
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || "Failed to submit verification profile");
      result = data;
    }

    // Also update public.profiles with the real submitted credentials
    await supabase
      .from("profiles")
      .update({
        full_name: payload.full_name,
        phone: payload.phone,
        profile_picture: payload.profile_picture || null,
        college: payload.college,
        department: payload.department,
        organization: payload.organization_name,
        club_name: payload.organization_name,
        designation: payload.designation,
        position: payload.designation,
        organization_type: payload.organization_type,
        experience: payload.years_experience,
        verification_status: "pending",
        organizer_status: "pending",
        approval_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.user_id);

    return result as OrganizerVerification;
  },
};
