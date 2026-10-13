import { describe, it, expect } from "vitest";
import * as Frontend from "@/frontend";
import * as Backend from "@/backend";
import * as Api from "@/api";

describe("Architecture Organization - Frontend Layer", () => {
  it("exports core layout components", () => {
    expect(Frontend.Brand).toBeDefined();
    expect(Frontend.Header).toBeDefined();
    expect(Frontend.Footer).toBeDefined();
    expect(Frontend.PageLayout).toBeDefined();
    expect(Frontend.AppBand).toBeDefined();
  });

  it("exports streaming domain components", () => {
    expect(Frontend.ShowCard).toBeDefined();
    expect(Frontend.Poster).toBeDefined();
    expect(Frontend.Shelf).toBeDefined();
  });

  it("exports contexts and state hooks", () => {
    expect(Frontend.AccountProvider).toBeDefined();
    expect(Frontend.useAccount).toBeDefined();
    expect(Frontend.ShelfCoordinator).toBeDefined();
    expect(Frontend.useShelfCoordinator).toBeDefined();
  });

  it("exports frontend utilities", () => {
    expect(Frontend.pageHead).toBeDefined();
    const meta = Frontend.pageHead("Test Title", "Test Description");
    expect(meta.meta).toBeDefined();
    expect(meta.meta.length).toBeGreaterThan(0);
  });
});

describe("Architecture Organization - Backend Layer", () => {
  it("exports database clients and schemas", () => {
    expect(Backend.supabaseAdmin).toBeDefined();
  });

  it("exports server lifecycle middlewares", () => {
    expect(Backend.attachSupabaseAuth).toBeDefined();
    expect(Backend.requireSupabaseAuth).toBeDefined();
    expect(Backend.createAuthMiddleware).toBeDefined();
    expect(Backend.authenticateCronRequest).toBeDefined();
    expect(Backend.verifyCronSecret).toBeDefined();
  });

  it("exports SSR error normalization helper", () => {
    expect(Backend.normalizeCatastrophicSsrResponse).toBeDefined();
    expect(Backend.isH3SwallowedErrorBody).toBeDefined();
  });
});

describe("Architecture Organization - API Layer", () => {
  it("exports client instances", () => {
    expect(Api.supabase).toBeDefined();
    expect(Api.lovable).toBeDefined();
  });

  it("exports catalog API service and catalog data", () => {
    expect(Api.catalogApi).toBeDefined();
    expect(Api.shows).toBeDefined();
    expect(Api.genres).toBeDefined();
    expect(Array.isArray(Api.shows)).toBe(true);
    expect(Array.isArray(Api.genres)).toBe(true);
  });

  it("exports auth API service", () => {
    expect(Api.authApi).toBeDefined();
    expect(typeof Api.authApi.getSession).toBe("function");
    expect(typeof Api.authApi.signInWithEmail).toBe("function");
    expect(typeof Api.authApi.signOut).toBe("function");
  });

  it("exports watchlist API service", () => {
    expect(Api.watchlistApi).toBeDefined();
    expect(typeof Api.watchlistApi.getUserWatchlist).toBe("function");
    expect(typeof Api.watchlistApi.addToWatchlist).toBe("function");
    expect(typeof Api.watchlistApi.removeFromWatchlist).toBe("function");
    expect(typeof Api.watchlistApi.toggleWatchlist).toBe("function");
  });
});
