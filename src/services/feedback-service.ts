import { createClient } from "@/lib/supabase/client";
import { dataSync } from "@/lib/data-sync";
import type { Feedback, FeedbackSubmissionPayload } from "@/types/database.types";
import { notificationService } from "./notification-service";

const supabase = createClient();

export interface FeedbackStatsSummary {
  averageRating: number;
  totalReviews: number;
  recommendationPercent: number;
  ratingDistribution: { stars: number; count: number; percentage: number }[];
}

export function computeFeedbackStats(feedbackList: any[]): FeedbackStatsSummary {
  if (!feedbackList || feedbackList.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      recommendationPercent: 0,
      ratingDistribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, percentage: 0 })),
    };
  }

  const totalReviews = feedbackList.length;
  const sumRatings = feedbackList.reduce((acc: number, f: any) => acc + (f.overall_rating || f.rating || 0), 0);
  const averageRating = Math.round((sumRatings / totalReviews) * 10) / 10;

  const recommendCount = feedbackList.filter((f: any) => f.recommendation === "yes" || f.recommendation === "maybe").length;
  const recommendationPercent = Math.round((recommendCount / totalReviews) * 100);

  const distCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  feedbackList.forEach((f: any) => {
    const r = Math.min(Math.max(f.overall_rating || f.rating || 5, 1), 5);
    distCounts[r] = (distCounts[r] || 0) + 1;
  });

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: distCounts[stars] || 0,
    percentage: Math.round(((distCounts[stars] || 0) / totalReviews) * 100),
  }));

  return {
    averageRating,
    totalReviews,
    recommendationPercent,
    ratingDistribution,
  };
}

export const feedbackService = {
  async submitFeedback(payload: FeedbackSubmissionPayload) {
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        event_id: payload.eventId,
        user_id: payload.userId,
        registration_id: payload.registrationId || null,
        overall_rating: payload.overallRating,
        organization_rating: payload.organizationRating || payload.overallRating,
        content_rating: payload.contentRating || payload.overallRating,
        venue_rating: payload.venueRating || payload.overallRating,
        speaker_rating: payload.speakerRating || null,
        recommendation: payload.recommendation || 'yes',
        comment: payload.comment || null,
        anonymous: payload.anonymous ?? false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("You have already submitted feedback for this event");
      }
      throw error;
    }

    // Trigger notification to event organizer asynchronously
    try {
      const { data: eventData } = await supabase
        .from("events")
        .select("title, created_by")
        .eq("id", payload.eventId)
        .single();

      if (eventData?.created_by) {
        await notificationService.createNotification(
          eventData.created_by,
          "New Event Review",
          `New feedback received for "${eventData.title}".`,
          "info",
          "/organizer/analytics"
        );
      }

      // Check total review count for event to trigger 50-review admin notification
      const { count } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .eq("event_id", payload.eventId);

      if (count === 50) {
        const { data: adminProfiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        if (adminProfiles && adminProfiles.length > 0) {
          for (const admin of adminProfiles) {
            await notificationService.createNotification(
              admin.id,
              "High Review Volume",
              `Event "${eventData?.title || 'Event'}" has reached 50 attendee reviews!`,
              "success",
              "/admin/analytics"
            );
          }
        }
      }
    } catch (notifErr) {
      console.warn("Failed to dispatch feedback notification:", notifErr);
    }

    dataSync.notify("feedback", "events", "admin", "registrations");
    return data as Feedback;
  },

  async updateFeedback(feedbackId: string, userId: string, payload: Partial<FeedbackSubmissionPayload>) {
    // 24-hour edit eligibility check
    const { data: existing, error: fetchErr } = await supabase
      .from("feedback")
      .select("id, created_at, user_id")
      .eq("id", feedbackId)
      .single();

    if (fetchErr || !existing) {
      throw new Error("Feedback record not found");
    }

    if (existing.user_id !== userId) {
      throw new Error("Unauthorized to edit this feedback");
    }

    const createdTime = new Date(existing.created_at).getTime();
    const now = Date.now();
    const hoursElapsed = (now - createdTime) / (1000 * 60 * 60);

    if (hoursElapsed > 24) {
      throw new Error("Feedback becomes read-only 24 hours after submission");
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.overallRating !== undefined) updateData.overall_rating = payload.overallRating;
    if (payload.organizationRating !== undefined) updateData.organization_rating = payload.organizationRating;
    if (payload.contentRating !== undefined) updateData.content_rating = payload.contentRating;
    if (payload.venueRating !== undefined) updateData.venue_rating = payload.venueRating;
    if (payload.speakerRating !== undefined) updateData.speaker_rating = payload.speakerRating;
    if (payload.recommendation !== undefined) updateData.recommendation = payload.recommendation;
    if (payload.comment !== undefined) updateData.comment = payload.comment;
    if (payload.anonymous !== undefined) updateData.anonymous = payload.anonymous;

    const { data, error } = await supabase
      .from("feedback")
      .update(updateData)
      .eq("id", feedbackId)
      .select()
      .single();

    if (error) throw error;
    dataSync.notify("feedback", "events", "admin", "registrations");
    return data as Feedback;
  },

  async deleteFeedback(feedbackId: string) {
    const { error } = await supabase
      .from("feedback")
      .delete()
      .eq("id", feedbackId);

    if (error) throw error;
    dataSync.notify("feedback", "events", "admin", "registrations");
    return true;
  },

  async getStudentFeedbackForEvent(eventId: string, userId: string): Promise<Feedback | null> {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data as Feedback | null;
  },

  async getStudentPendingFeedback(userId: string) {
    // 1. Fetch user's approved registrations
    const { data: regs, error: regErr } = await supabase
      .from("registrations")
      .select(`
        id,
        event_id,
        status,
        events!registrations_event_id_fkey(
          id, title, status, event_date, banner_url, location
        )
      `)
      .eq("user_id", userId)
      .eq("status", "approved");

    if (regErr || !regs) return [];

    // Filter completed events
    const completedRegs = regs.filter((r: any) => r.events && (r.events.status === "completed" || new Date(r.events.event_date) < new Date()));
    if (completedRegs.length === 0) return [];

    // 2. Fetch user's attendance records
    const eventIds = completedRegs.map((r: any) => r.event_id);
    const { data: attendance, error: attErr } = await supabase
      .from("attendance")
      .select("event_id")
      .eq("user_id", userId)
      .in("event_id", eventIds);

    if (attErr) return [];
    const attendedEventIds = new Set((attendance || []).map((a: any) => a.event_id));

    // 3. Fetch existing feedback records
    const { data: feedbackData } = await supabase
      .from("feedback")
      .select("event_id")
      .eq("user_id", userId)
      .in("event_id", Array.from(attendedEventIds));

    const submittedEventIds = new Set((feedbackData || []).map((f: any) => f.event_id));

    // Attended AND completed AND no feedback yet
    return completedRegs.filter((r: any) => attendedEventIds.has(r.event_id) && !submittedEventIds.has(r.event_id));
  },

  async getEventFeedback(eventId: string, options?: { rating?: number; sort?: 'newest' | 'oldest' }) {
    let query = supabase
      .from("feedback")
      .select(`
        *,
        profiles!feedback_user_id_fkey(full_name, profile_picture, department)
      `)
      .eq("event_id", eventId);

    if (options?.rating && options.rating > 0) {
      query = query.eq("overall_rating", options.rating);
    }

    const isAscending = options?.sort === "oldest";
    query = query.order("created_at", { ascending: isAscending });

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Feedback[];
  },

  async getAverageRating(eventId: string) {
    const { data, error } = await supabase
      .from("feedback")
      .select("overall_rating, rating")
      .eq("event_id", eventId);

    if (error) throw error;
    const stats = computeFeedbackStats(data || []);
    return stats.averageRating;
  },

  async getEventFeedbackSummary(eventId: string) {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("event_id", eventId);

    if (error) throw error;
    return computeFeedbackStats(data || []);
  },

  async getOrganizerFeedbackAnalytics(organizerId: string) {
    // 1. Fetch events created by organizer
    const { data: events, error: evtErr } = await supabase
      .from("events")
      .select("id, title, status, event_date")
      .eq("created_by", organizerId);

    if (evtErr || !events || events.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        recommendationPercent: 0,
        ratingDistribution: [
          { stars: 5, count: 0, percentage: 0 },
          { stars: 4, count: 0, percentage: 0 },
          { stars: 3, count: 0, percentage: 0 },
          { stars: 2, count: 0, percentage: 0 },
          { stars: 1, count: 0, percentage: 0 },
        ],
        eventRatings: [],
        recentFeedback: [],
      };
    }

    const orgEventIds = events.map((e: any) => e.id);

    // 2. Fetch all feedback for organizer events
    const { data: feedbackList, error: fbErr } = await supabase
      .from("feedback")
      .select(`
        *,
        profiles!feedback_user_id_fkey(full_name, profile_picture, department),
        events!feedback_event_id_fkey(title)
      `)
      .in("event_id", orgEventIds)
      .order("created_at", { ascending: false });

    if (fbErr || !feedbackList || feedbackList.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        recommendationPercent: 0,
        ratingDistribution: [
          { stars: 5, count: 0, percentage: 0 },
          { stars: 4, count: 0, percentage: 0 },
          { stars: 3, count: 0, percentage: 0 },
          { stars: 2, count: 0, percentage: 0 },
          { stars: 1, count: 0, percentage: 0 },
        ],
        eventRatings: events.map((e: any) => ({
          eventId: e.id,
          eventTitle: e.title,
          avgRating: 0,
          reviewCount: 0,
          recommendationPercent: 0,
        })),
        recentFeedback: [],
      };
    }

    const overallStats = computeFeedbackStats(feedbackList);

    // Per-event breakdown
    const eventFbGroup = new Map<string, any[]>();
    feedbackList.forEach((f: any) => {
      const arr = eventFbGroup.get(f.event_id) || [];
      arr.push(f);
      eventFbGroup.set(f.event_id, arr);
    });

    const eventRatings = events.map((e: any) => {
      const fbs = eventFbGroup.get(e.id) || [];
      const stats = computeFeedbackStats(fbs);
      return {
        eventId: e.id,
        eventTitle: e.title,
        avgRating: stats.averageRating,
        reviewCount: stats.totalReviews,
        recommendationPercent: stats.recommendationPercent,
      };
    }).sort((a: any, b: any) => b.reviewCount - a.reviewCount);

    return {
      averageRating: overallStats.averageRating,
      totalReviews: overallStats.totalReviews,
      recommendationPercent: overallStats.recommendationPercent,
      ratingDistribution: overallStats.ratingDistribution,
      eventRatings,
      recentFeedback: feedbackList,
    };
  },

  async getAdminFeedbackAnalytics() {
    const { data: feedbackList, error } = await supabase
      .from("feedback")
      .select(`
        *,
        profiles!feedback_user_id_fkey(full_name, profile_picture, department),
        events!feedback_event_id_fkey(id, title)
      `)
      .order("created_at", { ascending: false });

    if (error || !feedbackList || feedbackList.length === 0) {
      return {
        platformRating: 0,
        totalFeedback: 0,
        recommendationPercent: 0,
        topRatedEvents: [],
        lowestRatedEvents: [],
        mostReviewedEvents: [],
        allFeedback: [],
      };
    }

    const overallStats = computeFeedbackStats(feedbackList);

    const eventMap = new Map<string, { id: string; title: string; ratings: any[] }>();
    feedbackList.forEach((f: any) => {
      const evtId = f.event_id;
      const title = f.events?.title || "Unknown Event";
      const existing = eventMap.get(evtId) || { id: evtId, title, ratings: [] as any[] };
      existing.ratings.push(f);
      eventMap.set(evtId, existing);
    });


    const eventSummaries = Array.from(eventMap.values()).map((e: { id: string; title: string; ratings: any[] }) => {
      const stats = computeFeedbackStats(e.ratings);
      return {
        id: e.id,
        title: e.title,
        avgRating: stats.averageRating,
        reviewCount: stats.totalReviews,
        recommendationPercent: stats.recommendationPercent,
      };
    });

    const topRatedEvents = [...eventSummaries].sort((a: any, b: any) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount).slice(0, 5);
    const lowestRatedEvents = [...eventSummaries].sort((a: any, b: any) => a.avgRating - b.avgRating || b.reviewCount - a.reviewCount).slice(0, 5);
    const mostReviewedEvents = [...eventSummaries].sort((a: any, b: any) => b.reviewCount - a.reviewCount || b.avgRating - a.avgRating).slice(0, 5);

    return {
      platformRating: overallStats.averageRating,
      totalFeedback: overallStats.totalReviews,
      recommendationPercent: overallStats.recommendationPercent,
      topRatedEvents,
      lowestRatedEvents,
      mostReviewedEvents,
      allFeedback: feedbackList as unknown as Feedback[],
    };
  },
};



