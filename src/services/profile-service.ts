import { createClient } from "@/lib/supabase/client";
import { dataSync } from "@/lib/data-sync";

const supabase = createClient();

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(
    userId: string,
    updates: Partial<Record<string, any>>
  ) {
    // Clean undefined keys
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const { data, error } = await supabase
      .from("profiles")
      .update(cleanUpdates)
      .eq("id", userId)
      .select();

    if (error) {
      console.warn("[profileService] update with select failed, trying fallback:", error);
      const { error: fallbackError } = await supabase
        .from("profiles")
        .update(cleanUpdates)
        .eq("id", userId);

      if (fallbackError) throw fallbackError;
    }

    dataSync.notify("profile");
    return data?.[0] || null;
  },

  async changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },

  async uploadProfilePicture(userId: string, file: File) {
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-images")
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("profile-images")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profile_picture: urlData.publicUrl })
      .eq("id", userId);

    if (updateError) throw updateError;

    dataSync.notify("profile");
    return urlData.publicUrl;
  },
};
