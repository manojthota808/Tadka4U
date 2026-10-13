import { shows, genres, filterShows, type Show } from "@/lib/catalog";

export const catalogApi = {
  /**
   * Returns the entire catalog of streaming shows.
   */
  getAllShows: (): Show[] => shows,

  /**
   * Retrieves a single show by its unique identifier.
   */
  getShowById: (id: string): Show | undefined =>
    shows.find((show) => show.id === id),

  /**
   * Retrieves all available genre categories.
   */
  getGenres: (): string[] => genres,

  /**
   * Filters shows by genre and search text query.
   */
  filterShows: (
    genre: string,
    search: string = "",
    list: Show[] = shows,
  ): Show[] => {
    return filterShows(list, genre, search);
  },

  /**
   * Retrieves featured shows (e.g. shows with badges or top rated).
   */
  getFeaturedShows: (): Show[] => {
    return shows.filter((show) => Boolean(show.badge));
  },
};

export { shows, genres, filterShows, type Show };
