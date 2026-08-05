"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type DataTag =
  | "events"
  | "registrations"
  | "volunteers"
  | "certificates"
  | "notifications"
  | "attendance"
  | "payments"
  | "admin"
  | "profile"
  | "*";

type SyncCallback = (tags: DataTag[]) => void;

class DataSyncManager {
  private listeners: Map<SyncCallback, DataTag[]> = new Map();
  private realtimeInitialized = false;

  public notify(...tags: DataTag[]): void {
    if (tags.length === 0) return;

    // 1. Invoke local in-memory listeners
    this.listeners.forEach((subscribedTags, callback) => {
      const match = subscribedTags.some(
        (t) => t === "*" || tags.includes(t)
      );
      if (match) {
        try {
          callback(tags);
        } catch (err) {
          console.error("[DataSync] Listener error:", err);
        }
      }
    });

    // 2. Dispatch custom DOM event for cross-component notification
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("eventhub-data-sync", { detail: { tags } })
      );
    }
  }

  public subscribe(
    tags: DataTag | DataTag[],
    callback: SyncCallback
  ): () => void {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    this.listeners.set(callback, tagArray);

    return () => {
      this.listeners.delete(callback);
    };
  }

  public initRealtime(): void {
    if (typeof window === "undefined" || this.realtimeInitialized) return;
    this.realtimeInitialized = true;

    try {
      const supabase = createClient();
      const channel = supabase.channel("eventhub-db-sync");

      const tableToTagsMap: Record<string, DataTag[]> = {
        events: ["events"],
        registrations: ["registrations", "events"],
        profiles: ["profile", "admin"],
        volunteers: ["volunteers", "events"],
        volunteer_tasks: ["volunteers", "events"],
        certificates: ["certificates"],
        notifications: ["notifications"],
        attendance: ["attendance", "registrations"],
        payments: ["payments", "registrations"],
        organizer_verifications: ["admin", "profile"],
      };

      Object.entries(tableToTagsMap).forEach(([table, tags]) => {
        channel.on(
          "postgres_changes" as any,
          { event: "*", schema: "public", table },
          () => {
            this.notify(...tags);
          }
        );
      });

      channel.subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          console.log("[DataSync] Supabase Realtime synchronized");
        }
      });
    } catch (err) {
      console.warn("[DataSync] Realtime initialization skipped/failed:", err);
    }
  }
}

export const dataSync = new DataSyncManager();

if (typeof window !== "undefined") {
  dataSync.initRealtime();
}

export function useDataSync(
  tags: DataTag | DataTag[],
  fetchFn?: () => void | Promise<void>,
  deps: any[] = []
) {
  const router = useRouter();
  const fetchRef = useRef(fetchFn);

  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    let active = true;

    // Initial fetch on mount or deps change
    if (fetchRef.current) {
      Promise.resolve(fetchRef.current()).catch((err) =>
        console.error("[useDataSync] Fetch error:", err)
      );
    }

    const tagArray = Array.isArray(tags) ? tags : [tags];

    const handleSync = (notifiedTags: DataTag[]) => {
      if (!active) return;
      const match = tagArray.some(
        (t) => t === "*" || notifiedTags.includes(t)
      );
      if (match) {
        if (fetchRef.current) {
          Promise.resolve(fetchRef.current()).catch((err) =>
            console.error("[useDataSync] Re-fetch error:", err)
          );
        }
        try {
          router.refresh();
        } catch {
          /* noop */
        }
      }
    };

    const unsubscribe = dataSync.subscribe(tagArray, handleSync);

    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.tags) {
        handleSync(detail.tags);
      }
    };

    window.addEventListener("eventhub-data-sync", handleCustomEvent);

    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("eventhub-data-sync", handleCustomEvent);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(Array.isArray(tags) ? tags : [tags]), router, ...deps]);
}
