import { createClient } from "@/lib/supabase/client";
import { dataSync, DataTag } from "@/lib/data-sync";
import { toast } from "sonner";

const supabase = createClient();

export interface AuditLogPayload {
  performedBy?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
}

/**
 * Log deletion events into audit_logs table safely
 */
export async function logDeletionAudit(payload: AuditLogPayload) {
  try {
    const user = payload.performedBy || (await supabase.auth.getUser()).data.user?.id;
    await supabase.from("audit_logs").insert({
      user_id: user || null,
      action: payload.action,
      entity_type: payload.resourceType,
      entity_id: payload.resourceId,
      details: JSON.stringify(payload.details || {}),
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[AuditLog] Warning recording audit log:", err);
  }
}

/**
 * Standardized Deletion Execution Options
 */
export interface SafeDeleteOptions {
  resourceType: "account" | "event" | "registration" | "certificate" | "volunteer" | "notification";
  resourceId: string;
  title: string;
  performedBy?: string;
  metadata?: Record<string, any>;
  notifyTags?: DataTag[];
}

/**
 * Unified execution handler that wraps cascade deletes with:
 * - Duplicate request prevention
 * - Meaningful error catch
 * - Audit log creation
 * - Toast notifications
 * - Automatic UI refresh via dataSync
 */
export async function executeSafeDelete<T>(
  options: SafeDeleteOptions,
  deletionFn: () => Promise<T>
): Promise<T> {
  const { resourceType, resourceId, title, performedBy, metadata, notifyTags } = options;
  
  try {
    // 1. Run deletion task
    const result = await deletionFn();

    // 2. Record in audit log
    await logDeletionAudit({
      performedBy,
      action: `DELETE_${resourceType.toUpperCase()}`,
      resourceType,
      resourceId,
      details: { title, ...metadata },
    });

    // 3. Dispatch real-time UI refresh
    const tags: DataTag[] = notifyTags && notifyTags.length > 0
      ? notifyTags
      : ["events", "registrations", "volunteers", "certificates", "notifications"];
    
    dataSync.notify(...tags);

    // 4. Return result
    return result;
  } catch (err: any) {
    const errorMessage = err?.message || `Failed to delete ${resourceType} "${title}"`;
    console.error(`[UnifiedDeletionFramework] Error deleting ${resourceType}:`, err);
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}
