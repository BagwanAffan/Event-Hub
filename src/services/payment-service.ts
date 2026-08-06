import { createClient } from "@/lib/supabase/client";
import { dataSync } from "@/lib/data-sync";
import type { Payment, PaymentStatus } from "@/types/database.types";

const supabase = createClient();

export interface CreatePaymentData {
  registration_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  payment_method: "upi" | "bank_transfer" | "cash" | "other";
  transaction_reference?: string;
  screenshot_url?: string;
  remarks?: string;
}

export interface PaymentFilters {
  event_id?: string;
  user_id?: string;
  status?: PaymentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export const paymentService = {
  async getPayments(filters: PaymentFilters = {}) {
    const { event_id, user_id, status, search, page = 1, limit = 10 } = filters;

    try {
      let query = supabase
        .from("payments")
        .select(
          `*, 
          profiles!payments_user_id_fkey(full_name, email, profile_picture),
          events(id, title, registration_fee),
          registrations(id, registration_type, status)`,
          { count: "exact" }
        );

      if (event_id) query = query.eq("event_id", event_id);
      if (user_id) query = query.eq("user_id", user_id);
      if (status) query = query.eq("status", status);

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        return { data: [], count: 0, page, limit };
      }
      return { data: data || [], count: count || 0, page, limit };
    } catch {
      return { data: [], count: 0, page, limit };
    }
  },

  async createPayment(paymentData: CreatePaymentData) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .insert({ ...paymentData, status: "under_review" as const })
        .select()
        .single();

      if (error || !data) {
        throw error || new Error('Failed to create payment');
      }

      await supabase
        .from("registrations")
        .update({
          payment_status: "under_review",
          status: "payment_under_review",
        })
        .eq("id", paymentData.registration_id);

      dataSync.notify("payments", "registrations");
      return data as Payment;
    } catch (error) {
      throw error;
    }
  },

  async approvePayment(id: string, verifiedBy: string) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .update({
          status: "approved",
          verified_by: verifiedBy,
          verified_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error || !data) {
        throw error || new Error('Failed to approve payment');
      }

      await supabase
        .from("registrations")
        .update({
          payment_status: "approved",
          status: "approved",
        })
        .eq("id", data.registration_id);

      dataSync.notify("payments", "registrations");
      return data as Payment;
    } catch (error) {
      throw error;
    }
  },

  async rejectPayment(id: string, remarks?: string) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .update({
          status: "rejected",
          remarks: remarks || "Payment verification rejected",
        })
        .eq("id", id)
        .select()
        .single();

      if (error || !data) {
        throw error || new Error('Failed to reject payment');
      }

      await supabase
        .from("registrations")
        .update({
          payment_status: "rejected",
          status: "pending_payment",
        })
        .eq("id", data.registration_id);

      dataSync.notify("payments", "registrations");
      return data as Payment;
    } catch (error) {
      throw error;
    }
  },

  async getPaymentByRegistration(registrationId: string) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("registration_id", registrationId)
        .maybeSingle();

      if (error) return null;
      return data as Payment | null;
    } catch {
      return null;
    }
  },
};
