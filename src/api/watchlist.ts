import { supabase } from "./client";

export const watchlistApi = {
  /**
   * Fetches the list of saved show IDs for a given user.
   */
  getUserWatchlist: async (
    userId: string,
  ): Promise<{ showIds: string[]; error: Error | null }> => {
    try {
      const { data, error } = await supabase
        .from("watchlist")
        .select("show_id")
        .eq("user_id", userId);

      if (error) {
        return { showIds: [], error: new Error(error.message) };
      }

      return { showIds: data?.map((item) => item.show_id) ?? [], error: null };
    } catch (err) {
      return {
        showIds: [],
        error:
          err instanceof Error
            ? err
            : new Error("Unknown error fetching watchlist"),
      };
    }
  },

  /**
   * Adds a show to the user's watchlist.
   */
  addToWatchlist: async (
    userId: string,
    showId: string,
  ): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.from("watchlist").insert({
        user_id: userId,
        show_id: showId,
      });

      if (error) return { error: new Error(error.message) };
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
   */
  removeFromWatchlist: async (
    userId: string,
    showId: string,
  ): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", userId)
        .eq("show_id", showId);

      if (error) return { error: new Error(error.message) };
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
};
