import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export const feedbackService = {
  async submitFeedback(eventId: string, userId: string, rating: number, feedback?: string) {
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        event_id: eventId,
        user_id: userId,
        rating,
        feedback,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("You have already submitted feedback for this event");
      }
      throw error;
    }
    return data;
  },

  async getEventFeedback(eventId: string) {
    const { data, error } = await supabase
      .from("feedback")
      .select(
        `*, 
        profiles!feedback_user_id_fkey(full_name, profile_picture, department)`
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAverageRating(eventId: string) {
    const { data, error } = await supabase
      .from("feedback")
      .select("rating")
      .eq("event_id", eventId);

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    const avg = data.reduce((sum: number, f: any) => sum + f.rating, 0) / data.length;
    return Math.round(avg * 10) / 10;
  },
};
