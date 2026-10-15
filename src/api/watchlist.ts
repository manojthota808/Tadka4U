import { supabase } from "./client";

/**
 * Checks whether Supabase client is properly configured with environment variables.
 */
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

function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number = 2500,
  fallback: unknown,
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback as T), ms)),
  ]);
}

function getStorageKey(userId: string): string {
  return `tadka4u_watchlist_${userId}`;
}

function getLocalWatchlist(userId: string): string[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalWatchlist(userId: string, showIds: string[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(showIds));
  } catch (err) {
    console.warn("[Watchlist] Failed to write to localStorage:", err);
  }
}

export const watchlistApi = {
  /**
   * Fetches the list of saved show IDs for a given user.
   * Uses localStorage as instant reliable backing store and syncs with Supabase if configured.
   */
  getUserWatchlist: async (
    userId: string,
  ): Promise<{ showIds: string[]; error: Error | null }> => {
    const localIds = getLocalWatchlist(userId);

    if (!isSupabaseConfigured()) {
      return { showIds: localIds, error: null };
    }

    try {
      const { data, error } = await withTimeout(
        supabase.from("watchlist").select("show_id").eq("user_id", userId),
        2500,
        {
          data: null,
          error: { message: "Remote fetch timed out, using local storage" },
        },
      );

      if (error) {
        console.warn(
          "[Watchlist] Remote fetch returned error, using local storage:",
          error.message,
        );
        return { showIds: localIds, error: null };
      }

      const remoteIds = data?.map((item) => item.show_id) ?? [];
      const merged = Array.from(new Set([...remoteIds, ...localIds]));
      setLocalWatchlist(userId, merged);
      return { showIds: merged, error: null };
    } catch (err) {
      console.warn(
        "[Watchlist] Remote sync unavailable, using local store:",
        err,
      );
      return { showIds: localIds, error: null };
    }
  },

  /**
   * Adds a show to the user's watchlist.
   * Persists to localStorage immediately and attempts background sync with Supabase.
   */
  addToWatchlist: async (
    userId: string,
    showId: string,
  ): Promise<{ error: Error | null }> => {
    try {
      const current = getLocalWatchlist(userId);
      if (!current.includes(showId)) {
        setLocalWatchlist(userId, [...current, showId]);
      }

      if (isSupabaseConfigured()) {
        try {
          const { error } = await withTimeout(
            supabase.from("watchlist").insert({
              user_id: userId,
              show_id: showId,
            }),
            2500,
            { error: { message: "Remote insert timed out" } },
          );
          if (error) {
            console.warn("[Watchlist] Remote insert notice:", error.message);
          }
        } catch (remoteErr) {
          console.warn("[Watchlist] Remote insert failed:", remoteErr);
        }
      }

      return { error: null };
    } catch (err) {
      return {
        error:
          err instanceof Error ? err : new Error("Failed to add to watchlist"),
      };
    }
  },

  /**
   * Removes a show from the user's watchlist.
   * Removes from localStorage immediately and attempts background sync with Supabase.
   */
  removeFromWatchlist: async (
    userId: string,
    showId: string,
  ): Promise<{ error: Error | null }> => {
    try {
      const current = getLocalWatchlist(userId);
      setLocalWatchlist(
        userId,
        current.filter((id) => id !== showId),
      );

      if (isSupabaseConfigured()) {
        try {
          const { error } = await withTimeout(
            supabase
              .from("watchlist")
              .delete()
              .eq("user_id", userId)
              .eq("show_id", showId),
            2500,
            { error: { message: "Remote delete timed out" } },
          );
          if (error) {
            console.warn("[Watchlist] Remote delete notice:", error.message);
          }
        } catch (remoteErr) {
          console.warn("[Watchlist] Remote delete failed:", remoteErr);
        }
      }

      return { error: null };
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err
            : new Error("Failed to remove from watchlist"),
      };
    }
  },

  /**
   * Toggles a show in the user's watchlist (removes if present, adds if not).
   */
  toggleWatchlist: async (
    userId: string,
    showId: string,
    isCurrentlySaved: boolean,
  ): Promise<{ added: boolean; error: Error | null }> => {
    if (isCurrentlySaved) {
      const { error } = await watchlistApi.removeFromWatchlist(userId, showId);
      return { added: false, error };
    } else {
      const { error } = await watchlistApi.addToWatchlist(userId, showId);
      return { added: true, error };
    }
  },

  /**
   * Migrates watchlist items from one user ID to another (e.g. from 'guest' to authenticated user).
   */
  migrateWatchlist: async (
    fromUserId: string,
    toUserId: string,
  ): Promise<void> => {
    const items = getLocalWatchlist(fromUserId);
    if (!items.length) return;

    for (const showId of items) {
      await watchlistApi.addToWatchlist(toUserId, showId);
    }

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(getStorageKey(fromUserId));
      } catch (err) {
        console.warn("[Watchlist] Failed to cleanup migrated items:", err);
      }
    }
  },
};
