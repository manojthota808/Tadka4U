import { useSyncExternalStore } from "react";
import {
  shows as seedShows,
  genres as baseGenres,
  filterShows,
  type Show,
} from "@/lib/catalog";
import { supabase } from "./client";
import type { NewShowInput } from "./types";

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
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(CUSTOM_SHOWS_KEY, JSON.stringify(customShows));
  } catch (err) {
    console.warn(
      "[Catalog] Failed to write custom shows to localStorage:",
      err,
    );
  }
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

// Client-side initial sync with Supabase if configured
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === CUSTOM_SHOWS_KEY) {
      const updated = getLocalCustomShows();
      updateCurrentShows(updated);
    }
  });

  if (isSupabaseConfigured()) {
    (async () => {
      try {
        const { data, error } = await dynamicDb.from("shows").select("*");
        if (!error && Array.isArray(data) && data.length > 0) {
          const remoteShows: Show[] = data.map((item) => {
            const row = item as Record<string, unknown>;
            return {
              id: String(row["id"]),
              title: String(row["title"]),
              genre: String(row["genre"]),
              image: String(row["image"]),
              episodes: Number(row["episodes"]) || 4,
              badge: row["badge"] ? String(row["badge"]) : undefined,
              description: String(row["description"] || ""),
              rating: String(row["rating"] || "4.8"),
              isCustom: true,
              createdAt: row["created_at"]
                ? String(row["created_at"])
                : undefined,
            };
          });

          const local = getLocalCustomShows();
          const remoteIds = new Set(remoteShows.map((s) => s.id));
          const merged = [
            ...remoteShows,
            ...local.filter((l) => !remoteIds.has(l.id)),
          ];
          setLocalCustomShows(merged);
          updateCurrentShows(merged);
        }
      } catch (err) {
        console.warn("[Catalog] Supabase initial sync notice:", err);
      }
    })();
  }
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
  ): Promise<{ show: Show | null; error: Error | null }> => {
    try {
      if (!input.title?.trim()) {
        return { show: null, error: new Error("Show title is required.") };
      }
      if (!input.genre?.trim()) {
        return { show: null, error: new Error("Show genre is required.") };
      }
      if (!input.image?.trim() && !file) {
        return { show: null, error: new Error("A poster image is required.") };
      }

      // Generate a clean URL slug for the ID
      const baseSlug = input.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      let showId = baseSlug || `show-${Date.now()}`;

      // Ensure uniqueness
      if (currentShows.some((s) => s.id === showId)) {
        showId = `${showId}-${Math.random().toString(36).substring(2, 6)}`;
      }

      let finalImageUrl = input.image || "";

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

      const newShow: Show = {
        id: showId,
        title: input.title.trim(),
        genre: input.genre.trim(),
        image: finalImageUrl,
        episodes: Math.max(1, Number(input.episodes) || 4),
        badge: input.badge?.trim() ? input.badge.trim() : undefined,
        description:
          input.description?.trim() || "A captivating short drama on Tadka4U.",
        rating: input.rating?.trim() || "4.8",
        isCustom: true,
        createdAt: new Date().toISOString(),
      };

      // Try inserting into Supabase shows table
      if (isSupabaseConfigured()) {
        try {
          const { error: dbError } = await dynamicDb.from("shows").insert({
            id: newShow.id,
            title: newShow.title,
            genre: newShow.genre,
            image: newShow.image,
            episodes: newShow.episodes,
            badge: newShow.badge ?? null,
            description: newShow.description,
            rating: newShow.rating,
            is_custom: true,
          });
          if (dbError) {
            console.warn("[Catalog] Remote insert notice:", dbError.message);
          }
        } catch (dbErr) {
          console.warn("[Catalog] Remote insert error:", dbErr);
        }
      }

      // Persist in localStorage
      const existingCustom = getLocalCustomShows();
      const updatedCustom = [
        newShow,
        ...existingCustom.filter((s) => s.id !== newShow.id),
      ];
      setLocalCustomShows(updatedCustom);
      updateCurrentShows(updatedCustom);

      return { show: newShow, error: null };
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to publish show.");
      return { show: null, error };
    }
  },

  /**
   * Deletes a user-published show.
   */
  deleteShow: async (
    id: string,
  ): Promise<{ success: boolean; error: Error | null }> => {
    try {
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
          await dynamicDb.from("shows").delete().eq("id", id);
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
