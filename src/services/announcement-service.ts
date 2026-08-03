import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export const announcementService = {
  async getAnnouncements(eventId: string) {
    const { data, error } = await supabase
      .from("announcements")
      .select(
        `*, 
        profiles!announcements_created_by_fkey(full_name, profile_picture)`
      )
      .eq("event_id", eventId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createAnnouncement(
    eventId: string,
    createdBy: string,
    title: string,
    message: string,
    audience: "all" | "participants" | "volunteers" = "all",
    pinned: boolean = false
  ) {
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        event_id: eventId,
        created_by: createdBy,
        title,
        message,
        audience,
        pinned,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAnnouncement(id: string) {
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
