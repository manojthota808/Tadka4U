import type { User, Session, AuthError } from "@supabase/supabase-js";
import type { Database, Tables } from "@/integrations/supabase/types";

// Show & Catalog Domain Types
export type Show = {
  id: string;
  title: string;
  genre: string;
  image: string;
  episodes: number;
  badge?: string | undefined;
  description: string;
  rating: string;
  isCustom?: boolean | undefined;
  createdAt?: string | undefined;
};

export type NewShowInput = {
  title: string;
  genre: string;
  image: string;
  episodes?: number | undefined;
  badge?: string | undefined;
  description: string;
  rating?: string | undefined;
};

export type Genre =
  "All" | "Romance" | "Thriller" | "Drama" | "Horror" | "Comedy" | string;

// Watchlist Domain Types
export type WatchlistItem = Tables<"watchlist">;

// Auth Types
export type { User, Session, AuthError };

// Database Schema Types
export type { Database };
