import { createClient } from "@/lib/supabase/client";
import { dataSync } from "@/lib/data-sync";
import { notificationService } from "@/services/notification-service";
import { format } from "date-fns";

const supabase = createClient();
const LOCAL_STORAGE_KEY = "eventhub_account_deletion_requests";

function buildRequestPayload(request: AccountDeletionRequest) {
  return {
    id: request.id,
    user_id: request.user_id,
    role: request.role,
    name: request.name,
    email: request.email,
    reason: request.reason ?? null,
    status: request.status,
    requested_at: request.requested_at,
    reviewed_at: request.reviewed_at ?? null,
    admin_notes: request.admin_notes ?? null,
  };
}

export type DeletionRequestStatus = "pending" | "approved" | "rejected";

export interface AccountDeletionRequest {
  id: string;
  user_id: string;
  role: string;
  name: string;
  email: string;
  reason?: string | null;
  status: DeletionRequestStatus;
  requested_at: string;
  reviewed_at?: string | null;
  admin_notes?: string | null;
}

export interface CreateDeletionRequestInput {
  userId: string;
  role: string;
  name: string;
  email: string;
  reason?: string;
}

function getLocalRequests(): AccountDeletionRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRequests(requests: AccountDeletionRequest[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requests));
  } catch (err) {
    console.warn("Failed to save local deletion requests", err);
  }
}

export const accountDeletionService = {
  async getUserRequests(userId: string): Promise<AccountDeletionRequest[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from("account_deletion_requests")
        .select("*")
        .eq("user_id", userId)
        .order("requested_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as AccountDeletionRequest[];
      }
    } catch {
      // Fallback to local storage
    }

    const local = getLocalRequests().filter((r) => r.user_id === userId);
    return local.sort(
      (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
    );
  },

  async getLatestPendingRequest(userId: string): Promise<AccountDeletionRequest | null> {
    const requests = await this.getUserRequests(userId);
    return requests.find((r) => r.status === "pending") || null;
  },

  async getLatestRequest(userId: string): Promise<AccountDeletionRequest | null> {
    const requests = await this.getUserRequests(userId);
    return requests[0] || null;
  },

  async createRequest(input: CreateDeletionRequestInput): Promise<AccountDeletionRequest> {
    const existingPending = await this.getLatestPendingRequest(input.userId);
    if (existingPending) {
      throw new Error("You already have a pending deletion request.");
    }

    const newRequest: AccountDeletionRequest = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      user_id: input.userId,
      role: input.role,
      name: input.name || "User",
      email: input.email || "",
      reason: input.reason?.trim() || null,
      status: "pending",
      requested_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from("account_deletion_requests")
        .insert(buildRequestPayload(newRequest));

      if (error) {
        throw error;
      }
    } catch (dbError) {
      console.warn("Failed to persist deletion request to database, falling back to local storage", dbError);
    }

    // Save to local storage cache/fallback
    const allLocal = getLocalRequests();
    const existingIdx = allLocal.findIndex(r => r.id === newRequest.id);
    if (existingIdx >= 0) {
      allLocal[existingIdx] = newRequest;
    } else {
      allLocal.unshift(newRequest);
    }
    saveLocalRequests(allLocal);

    // Dispatch admin notification immediately
    try {
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      const adminIds = new Set<string>();
      if (adminProfiles && adminProfiles.length > 0) {
        adminProfiles.forEach((a: any) => adminIds.add(a.id));
      }
      adminIds.add("user-admin-1");

      const formattedRole = input.role ? input.role.charAt(0).toUpperCase() + input.role.slice(1) : "Student";
      const formattedTime = format(new Date(newRequest.requested_at), "MMM dd, yyyy 'at' h:mm a");

      const title = "New Account Deletion Request";
      const description = `${input.name || "User"} requested permanent deletion of their account.\nRole: ${formattedRole} | Email: ${input.email || "N/A"} | Time: ${formattedTime} | Status: Pending`;
      const actionUrl = `/${input.role || 'student'}/settings`;

      for (const adminId of adminIds) {
        try {
          await notificationService.createNotification(
            adminId,
            title,
            description,
            "warning",
            actionUrl,
            "admin",
            "admin"
          );
        } catch (err) {
          console.warn("Could not dispatch notification to admin ID:", adminId, err);
        }
      }
    } catch (notifErr) {
      console.warn("Error creating admin notification for account deletion:", notifErr);
    }

    dataSync.notify("profile", "admin", "notifications");
    return newRequest;
  },

  async getAllRequests(): Promise<AccountDeletionRequest[]> {
    try {
      const { data, error } = await supabase
        .from("account_deletion_requests")
        .select("*")
        .order("requested_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as AccountDeletionRequest[];
      }
    } catch {
      // Fallback to local storage
    }

    const local = getLocalRequests();
    return local.sort(
      (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
    );
  },

  async updateRequestStatus(
    requestId: string,
    status: 'approved' | 'rejected',
    adminNotes?: string,
    adminId?: string
  ): Promise<AccountDeletionRequest> {
    const reviewedAt = new Date().toISOString();
    let targetUserId = "";

    // 1. Get current request to find user_id
    const requests = await this.getAllRequests();
    const req = requests.find((r) => r.id === requestId);
    if (req) {
      targetUserId = req.user_id;
    }

    if (status === 'approved') {
      // Execute complete account & auth user deletion via API
      if (targetUserId) {
        const response = await fetch('/api/admin/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: targetUserId, requestId, adminId }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete user account from Supabase Auth');
        }
      }
    } else {
      // If rejected, update request status in database
      try {
        const { error } = await supabase
          .from("account_deletion_requests")
          .update({
            status,
            admin_notes: adminNotes?.trim() || null,
            reviewed_at: reviewedAt,
          })
          .eq("id", requestId);

        if (error) {
          throw error;
        }
      } catch (dbError) {
        console.warn("Failed to update deletion request status in database", dbError);
      }

      // Notify user about rejection
      if (req) {
        try {
          await notificationService.createNotification(
            req.user_id,
            "Account Deletion Request Rejected",
            `Your account deletion request was rejected by administration.${adminNotes ? ` Remarks: ${adminNotes}` : ''}`,
            "warning",
            `/${req.role || 'student'}/settings`,
            req.role || 'student',
            req.role as any
          );
        } catch (err) {
          console.warn("Error notifying user of deletion decision:", err);
        }
      }
    }

    // Update local storage requests list
    const allLocal = getLocalRequests();
    const idx = allLocal.findIndex((r) => r.id === requestId);
    let updatedRequest: AccountDeletionRequest;
    if (idx >= 0) {
      allLocal[idx] = {
        ...allLocal[idx],
        status,
        admin_notes: adminNotes?.trim() || null,
        reviewed_at: reviewedAt,
      };
      updatedRequest = allLocal[idx];
      saveLocalRequests(allLocal);
    } else {
      updatedRequest = {
        id: requestId,
        user_id: targetUserId || "deleted-user",
        role: req?.role || "student",
        name: req?.name || "User",
        email: req?.email || "",
        status,
        requested_at: req?.requested_at || reviewedAt,
        reviewed_at: reviewedAt,
        admin_notes: adminNotes?.trim() || null,
      };
    }

    dataSync.notify("profile", "admin", "notifications");
    return updatedRequest;
  },
};
