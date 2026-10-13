/**
 * Tadka4U API Layer
 *
 * Centralized API services for client data operations, authentication,
 * streaming catalog access, and user watchlist management.
 */

export { supabase, lovable } from "./client";
export { catalogApi, shows, genres, filterShows } from "./catalog";
export { watchlistApi } from "./watchlist";
export { authApi } from "./auth";
export type {
  Show,
  Genre,
  WatchlistItem,
  User,
  Session,
  AuthError,
  Database,
} from "./types";
