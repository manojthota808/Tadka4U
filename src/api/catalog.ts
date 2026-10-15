import { useSyncExternalStore } from "react";
import {
  shows as seedShows,
  genres as baseGenres,
  filterShows,
  type Show,
} from "@/lib/catalog";
import { supabase } from "./client";
import type { NewShowInput } from "./types";
import { triggerNewReleaseNotification } from "@/frontend/components/notifications";
import { isSafeUrl, sanitizeText, sanitizeStorageSlug } from "@/lib/security";

const CUSTOM_SHOWS_KEY = "tadka4u_custom_shows";

// Type-safe accessor for dynamic supabase tables not yet present in static generated types
interface DynamicSupabaseClient {
  from: (table: string) => {
    select: (columns: string) => PromiseLike<{
      data: unknown[] | null;
      error: { message: string } | null;
    }>;
    insert: (
      values: Record<string, unknown>,
    ) => PromiseLike<{ error: { message: string } | null }>;
    delete: () => {
      eq: (
        column: string,
        value: unknown,
      ) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        file: File,
        options?: { upsert?: boolean },
      ) => PromiseLike<{
        data: unknown | null;
        error: { message: string } | null;
      }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
}

const dynamicDb = supabase as unknown as DynamicSupabaseClient;

function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number = 3000,
  fallback: T,
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function isSupabaseConfigured(): boolean {
  try {
    const url =
      (typeof import.meta !== "undefined" &&
        import.meta.env?.["VITE_SUPABASE_URL"]) ||
      (typeof process !== "undefined" && process.env?.["SUPABASE_URL"]);
    const key =
      (typeof import.meta !== "undefined" &&
        import.meta.env?.["VITE_SUPABASE_PUBLISHABLE_KEY"]) ||
      (typeof process !== "undefined" &&
        process.env?.["SUPABASE_PUBLISHABLE_KEY"]);
    return Boolean(url && key);
  } catch {
    return false;
  }
}

const IDB_NAME = "tadka4u_catalog_db";
const IDB_STORE = "custom_shows";

function openIdb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveToIndexedDb(showsList: Show[]): Promise<void> {
  const db = await openIdb();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.clear();
    for (const item of showsList) {
      store.put(item);
    }
  } catch (e) {
    console.warn("[Catalog] IndexedDB write notice:", e);
  }
}

async function loadFromIndexedDb(): Promise<Show[]> {
  const db = await openIdb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () =>
        resolve(Array.isArray(req.result) ? (req.result as Show[]) : []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

function getLocalCustomShows(): Show[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_SHOWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Show[]) : [];
  } catch {
    return [];
  }
}

function setLocalCustomShows(customShows: Show[]): void {
  if (typeof window === "undefined") return;
  if (window.localStorage) {
    try {
      window.localStorage.setItem(
        CUSTOM_SHOWS_KEY,
        JSON.stringify(customShows),
      );
    } catch (err) {
      console.warn(
        "[Catalog] LocalStorage write notice, writing to IndexedDB:",
        err,
      );
    }
  }
  // Always persist into IndexedDB as a resilient long-term backup
  saveToIndexedDb(customShows).catch(() => {});
}

// In-memory catalog store
const localCustom = getLocalCustomShows();
let currentShows: Show[] = [...localCustom, ...seedShows];

// Mutable exported array for backward compatibility
export const shows: Show[] = [...currentShows];

const listeners = new Set<() => void>();

function notifyListeners() {
  shows.length = 0;
  shows.push(...currentShows);
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error("[Catalog] Listener error:", e);
    }
  });
}

function updateCurrentShows(customList: Show[]) {
  const seedIds = new Set(seedShows.map((s) => s.id));
  const filteredCustom = customList.filter((c) => !seedIds.has(c.id));
  currentShows = [...filteredCustom, ...seedShows];
  notifyListeners();
}

let hasInitialSynced = false;

async function syncRemoteShows(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const { data, error } = await withTimeout(
      dynamicDb.from("shows").select("*"),
      3000,
      { data: null, error: { message: "Supabase sync timed out" } },
    );
    if (error || !Array.isArray(data)) return;

    const remoteShows: Show[] = data.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row["id"]),
        title: String(row["title"]),
        genre: String(row["genre"]),
        image: String(row["image"]),
        episodes: Number(row["episodes"]) || 2,
        badge: row["badge"] ? String(row["badge"]) : undefined,
        description: String(row["description"] || ""),
        rating: String(row["rating"] || "4.8"),
        isCustom: true,
        isHero: Boolean(row["is_hero"]),
        videoUrl: row["video_url"] ? String(row["video_url"]) : undefined,
        episodeVideos: row["episode_videos"]
          ? typeof row["episode_videos"] === "object"
            ? (row["episode_videos"] as Record<number, string>)
            : (() => {
                try {
                  return JSON.parse(String(row["episode_videos"]));
                } catch {
                  return undefined;
                }
              })()
          : undefined,
        createdAt: row["created_at"] ? String(row["created_at"]) : undefined,
      };
    });

    const previousKnownIds = new Set(currentShows.map((s) => s.id));
    const seedIds = new Set(seedShows.map((s) => s.id));

    // Detect newly added shows that were not previously in memory and not original seed shows
    const newlyAddedShows = hasInitialSynced
      ? remoteShows.filter(
          (r) => !previousKnownIds.has(r.id) && !seedIds.has(r.id),
        )
      : [];

    // Supabase cloud is authoritative!
    // Overwrite local custom shows directly so deleted cloud shows are immediately purged from both localStorage & IndexedDB!
    setLocalCustomShows(remoteShows);
    updateCurrentShows(remoteShows);
    hasInitialSynced = true;

    // Trigger in-app toast & desktop notification for all active users
    if (newlyAddedShows.length > 0) {
      newlyAddedShows.forEach((newShow) => {
        triggerNewReleaseNotification(newShow);
      });
    }
  } catch (err) {
    console.warn("[Catalog] Supabase sync notice:", err);
  }
}

// Client-side initial sync with IndexedDB, Supabase Realtime, and periodic heartbeat
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === CUSTOM_SHOWS_KEY) {
      const updated = getLocalCustomShows();
      updateCurrentShows(updated);
    }
  });

  window.addEventListener("focus", () => {
    syncRemoteShows().catch(() => {});
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      syncRemoteShows().catch(() => {});
    }
  });

  // Supabase Realtime Channel: Instantly refresh when any show is published or deleted
  if (isSupabaseConfigured()) {
    try {
      const clientWithRealtime = supabase as unknown as {
        channel: (name: string) => {
          on: (
            type: string,
            filter: Record<string, unknown>,
            callback: (payload: unknown) => void,
          ) => { subscribe: () => unknown };
        };
      };
      if (typeof clientWithRealtime.channel === "function") {
        clientWithRealtime
          .channel("tadka4u-catalog-realtime")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "shows" },
            () => {
              syncRemoteShows().catch(() => {});
            },
          )
          .subscribe();
      }
    } catch (e) {
      console.warn("[Catalog] Realtime channel setup:", e);
    }
  }

  // Periodic heartbeat poller every 8 seconds for resilient multi-device sync
  setInterval(() => {
    syncRemoteShows().catch(() => {});
  }, 8000);

  // Restore from IndexedDB only if localStorage is currently empty
  const local = getLocalCustomShows();
  if (local.length === 0) {
    loadFromIndexedDb()
      .then((idbShows) => {
        if (idbShows && idbShows.length > 0 && !hasInitialSynced) {
          updateCurrentShows(idbShows);
        }
      })
      .catch(() => {});
  }

  // Initial remote sync
  syncRemoteShows().catch(() => {});
}

export const catalogApi = {
  /**
   * Returns all shows (both published custom shows and catalog originals).
   */
  getAllShows: (): Show[] => currentShows,

  /**
   * Retrieves a single show by its unique identifier.
   */
  getShowById: (id: string): Show | undefined =>
    currentShows.find((show) => show.id === id),

  /**
   * Retrieves all available genre categories including any custom added genres.
   */
  getGenres: (): string[] => {
    const genreSet = new Set(baseGenres);
    currentShows.forEach((s) => {
      if (s.genre && typeof s.genre === "string") {
        genreSet.add(s.genre);
      }
    });
    return Array.from(genreSet);
  },

  /**
   * Filters shows by genre and search text query.
   */
  filterShows: (
    genre: string,
    search: string = "",
    list: Show[] = currentShows,
  ): Show[] => {
    return filterShows(list, genre, search);
  },

  /**
   * Retrieves featured shows (shows with badges or top rated).
   */
  getFeaturedShows: (): Show[] => {
    return currentShows.filter((show) => Boolean(show.badge));
  },

  /**
   * Returns only user-published custom shows.
   */
  getCustomShows: (): Show[] => {
    return currentShows.filter((s) => s.isCustom);
  },

  /**
   * Subscribes to catalog updates.
   */
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Publishes a new show to the catalog.
   * Persists to Supabase and browser localStorage with automatic fallback.
   */
  publishShow: async (
    input: NewShowInput,
    file?: File | null,
  ): Promise<{
    show: Show | null;
    error: Error | null;
    remoteSaved?: boolean | undefined;
    remoteError?: string | undefined;
  }> => {
    try {
      const cleanTitle = sanitizeText(input.title, 120);
      const cleanGenre = sanitizeText(input.genre, 50);
      const cleanDescription = sanitizeText(
        input.description || "A captivating short drama on Tadka4U.",
        2000,
      );
      const cleanBadge = input.badge
        ? sanitizeText(input.badge, 30)
        : undefined;
      const cleanRating = input.rating ? sanitizeText(input.rating, 10) : "4.8";

      if (!cleanTitle) {
        return { show: null, error: new Error("Show title is required.") };
      }
      if (!cleanGenre) {
        return { show: null, error: new Error("Show genre is required.") };
      }
      if (!input.image?.trim() && !file) {
        return { show: null, error: new Error("A poster image is required.") };
      }

      // Generate a clean, path-safe URL slug for the ID
      const baseSlug = sanitizeStorageSlug(cleanTitle);
      let showId = baseSlug || `show-${Date.now()}`;

      // Ensure uniqueness
      if (currentShows.some((s) => s.id === showId)) {
        showId = `${showId}-${Math.random().toString(36).substring(2, 6)}`;
      }

      let finalImageUrl = input.image?.trim() || "";

      // Validate image URL safety
      if (finalImageUrl && !isSafeUrl(finalImageUrl)) {
        return {
          show: null,
          error: new Error(
            "Poster image URL must be a valid, secure web URL (https://).",
          ),
        };
      }

      // If an image file is provided, attempt Supabase Storage upload
      if (file && isSupabaseConfigured()) {
        try {
          const fileExt = file.name.split(".").pop() || "jpg";
          const fileName = `posters/${showId}-${Date.now()}.${fileExt}`;
          const { error: uploadErr } = await dynamicDb.storage
            .from("posters")
            .upload(fileName, file, { upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = dynamicDb.storage
              .from("posters")
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              finalImageUrl = publicUrlData.publicUrl;
            }
          }
        } catch (uploadNotice) {
          console.warn(
            "[Catalog] Storage upload notice, using fallback image:",
            uploadNotice,
          );
        }
      }

      // Sanitize main video URL
      const cleanVideoUrl =
        input.videoUrl && isSafeUrl(input.videoUrl.trim())
          ? input.videoUrl.trim()
          : undefined;

      // Sanitize episode videos map: only keep safe URLs
      let sanitizedEpisodeVideos: Record<number, string> | undefined;
      if (input.episodeVideos && typeof input.episodeVideos === "object") {
        sanitizedEpisodeVideos = {};
        for (const [key, val] of Object.entries(input.episodeVideos)) {
          const epNum = Number(key);
          if (epNum > 0 && typeof val === "string" && isSafeUrl(val.trim())) {
            sanitizedEpisodeVideos[epNum] = val.trim();
          }
        }
        if (Object.keys(sanitizedEpisodeVideos).length === 0) {
          sanitizedEpisodeVideos = undefined;
        }
      }

      const newShow: Show = {
        id: showId,
        title: cleanTitle,
        genre: cleanGenre,
        image: finalImageUrl,
        episodes: Math.max(1, Number(input.episodes) || 2),
        badge: cleanBadge,
        description: cleanDescription,
        rating: cleanRating,
        isCustom: true,
        isHero: Boolean(input.isHero),
        videoUrl: cleanVideoUrl,
        episodeVideos: sanitizedEpisodeVideos,
        createdAt: new Date().toISOString(),
      };

      let remoteSaved = false;
      let remoteError: string | undefined;

      // Try inserting into Supabase shows table
      if (isSupabaseConfigured()) {
        try {
          const insertPayload: Record<string, unknown> = {
            id: newShow.id,
            title: newShow.title,
            genre: newShow.genre,
            image: newShow.image,
            episodes: newShow.episodes,
            badge: newShow.badge ?? null,
            description: newShow.description,
            rating: newShow.rating,
            is_custom: true,
            is_hero: Boolean(newShow.isHero),
            video_url: newShow.videoUrl ?? null,
            episode_videos: newShow.episodeVideos ?? null,
          };

          const { error: dbError } = await withTimeout(
            dynamicDb.from("shows").insert(insertPayload),
            3000,
            { error: { message: "Supabase insert timed out" } },
          );
          if (dbError) {
            // If video_url or is_hero column doesn't exist yet, retry with basic fields
            const fallbackPayload: Record<string, unknown> = {
              id: newShow.id,
              title: newShow.title,
              genre: newShow.genre,
              image: newShow.image,
              episodes: newShow.episodes,
              badge: newShow.badge ?? null,
              description: newShow.description,
              rating: newShow.rating,
              is_custom: true,
            };
            const { error: retryErr } = await withTimeout(
              dynamicDb.from("shows").insert(fallbackPayload),
              3000,
              { error: { message: "Supabase fallback insert timed out" } },
            );
            if (!retryErr) {
              remoteSaved = true;
            } else {
              console.warn("[Catalog] Remote insert notice:", retryErr.message);
              remoteError = retryErr.message;
            }
          } else {
            remoteSaved = true;
          }
        } catch (dbErr) {
          console.warn("[Catalog] Remote insert error:", dbErr);
          remoteError =
            dbErr instanceof Error ? dbErr.message : "Remote save failed";
        }
      }

      // Persist in localStorage and IndexedDB
      const existingCustom = getLocalCustomShows();
      const updatedCustom = [
        newShow,
        ...existingCustom.filter((s) => s.id !== newShow.id),
      ];
      setLocalCustomShows(updatedCustom);
      updateCurrentShows(updatedCustom);

      return { show: newShow, error: null, remoteSaved, remoteError };
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to publish show.");
      return { show: null, error, remoteSaved: false };
    }
  },

  /**
   * Manually triggers a remote catalog sync with Supabase cloud.
   */
  syncRemote: syncRemoteShows,

  /**
   * Validates Supabase cloud database readiness and whether the shows table exists.
   */
  checkCloudStatus: async (): Promise<{
    configured: boolean;
    tableReady: boolean;
    error?: string;
  }> => {
    if (!isSupabaseConfigured()) {
      return {
        configured: false,
        tableReady: false,
        error: "Supabase environment keys are missing.",
      };
    }
    try {
      const { error } = await dynamicDb.from("shows").select("id");
      if (error) {
        return { configured: true, tableReady: false, error: error.message };
      }
      return { configured: true, tableReady: true };
    } catch (e) {
      return {
        configured: true,
        tableReady: false,
        error: e instanceof Error ? e.message : "Failed to query shows table",
      };
    }
  },

  /**
   * Deletes a user-published show.
   */
  deleteShow: async (
    id: string,
  ): Promise<{ success: boolean; error: Error | null }> => {
    try {
      if (!id || typeof id !== "string" || !/^[a-z0-9-_]+$/i.test(id)) {
        return {
          success: false,
          error: new Error("Invalid show identifier format."),
        };
      }
      const isSeed = seedShows.some((s) => s.id === id);
      if (isSeed) {
        return {
          success: false,
          error: new Error("Original catalog shows cannot be removed."),
        };
      }

      // Remove from Supabase
      if (isSupabaseConfigured()) {
        try {
          await withTimeout(
            dynamicDb.from("shows").delete().eq("id", id),
            3000,
            { error: null },
          );
        } catch (err) {
          console.warn("[Catalog] Remote delete notice:", err);
        }
      }

      // Remove from localStorage
      const existingCustom = getLocalCustomShows();
      const updatedCustom = existingCustom.filter((s) => s.id !== id);
      setLocalCustomShows(updatedCustom);
      updateCurrentShows(updatedCustom);

      return { success: true, error: null };
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to delete show.");
      return { success: false, error };
    }
  },

  /**
   * Toggles whether a show is featured in the top hero carousel.
   */
  toggleHero: async (
    id: string,
  ): Promise<{ success: boolean; isHero: boolean }> => {
    const show = currentShows.find((s) => s.id === id);
    if (!show) return { success: false, isHero: false };
    const nextIsHero = !show.isHero;
    show.isHero = nextIsHero;

    // Persist in localStorage and IndexedDB
    const local = getLocalCustomShows();
    const target = local.find((s) => s.id === id);
    if (target) {
      target.isHero = nextIsHero;
      setLocalCustomShows(local);
    }
    notifyListeners();

    // Persist in Supabase if custom show and configured
    if (isSupabaseConfigured() && show.isCustom) {
      try {
        await (
          dynamicDb.from("shows") as unknown as {
            update: (v: Record<string, unknown>) => {
              eq: (c: string, val: unknown) => PromiseLike<unknown>;
            };
          }
        )
          .update({ is_hero: nextIsHero })
          .eq("id", id);
      } catch (e) {
        console.warn("[Catalog] toggleHero remote update notice:", e);
      }
    }
    return { success: true, isHero: nextIsHero };
  },
};

/**
 * React hook to access live catalog of shows.
 * Reactive across component re-renders and publishing actions.
 */
export function useShows(): Show[] {
  return useSyncExternalStore(
    catalogApi.subscribe,
    catalogApi.getAllShows,
    () => seedShows,
  );
}

/**
 * React hook to retrieve a single show reactively.
 */
export function useShow(id: string): Show | undefined {
  const allShows = useShows();
  return allShows.find((s) => s.id === id);
}

export { baseGenres as genres, filterShows, type Show };
