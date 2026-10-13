import { describe, it, expect, beforeEach } from "vitest";
import { catalogApi, watchlistApi, shows, genres } from "@/api";

describe("API Layer - Catalog API", () => {
  it("returns all shows from the catalog", () => {
    const allShows = catalogApi.getAllShows();
    expect(allShows.length).toBeGreaterThan(0);
    expect(allShows).toEqual(shows);
  });

  it("fetches a show by its unique id", () => {
    const show = catalogApi.getShowById("midnight-promise");
    expect(show).toBeDefined();
    expect(show?.title).toBe("Midnight Promise");
  });

  it("returns undefined for non-existent show id", () => {
    const show = catalogApi.getShowById("unknown-id-xyz");
    expect(show).toBeUndefined();
  });

  it("returns all available genres including All", () => {
    const genreList = catalogApi.getGenres();
    expect(genreList).toContain("All");
    expect(genreList).toEqual(genres);
  });

  it("filters shows by genre correctly", () => {
    const romanceShows = catalogApi.filterShows("Romance");
    expect(romanceShows.length).toBeGreaterThan(0);
    expect(romanceShows.every((s) => s.genre === "Romance")).toBe(true);
  });

  it("filters shows by search query case-insensitively", () => {
    const results = catalogApi.filterShows("All", "midnight");
    expect(results.length).toBe(1);
    expect(results[0]?.id).toBe("midnight-promise");
  });

  it("fetches featured shows with badges", () => {
    const featured = catalogApi.getFeaturedShows();
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.every((s) => Boolean(s.badge))).toBe(true);
  });
});

describe("API Layer - Watchlist API", () => {
  const testUser = "test-user-123";

  beforeEach(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it("fetches empty watchlist without error", async () => {
    const { showIds, error } = await watchlistApi.getUserWatchlist(testUser);
    expect(error).toBeNull();
    expect(showIds).toEqual([]);
  });

  it("adds show to watchlist successfully", async () => {
    const { error } = await watchlistApi.addToWatchlist(
      testUser,
      "midnight-promise",
    );
    expect(error).toBeNull();

    const { showIds } = await watchlistApi.getUserWatchlist(testUser);
    expect(showIds).toContain("midnight-promise");
  });

  it("toggles show in watchlist (removes when present)", async () => {
    await watchlistApi.addToWatchlist(testUser, "midnight-promise");
    const { added, error } = await watchlistApi.toggleWatchlist(
      testUser,
      "midnight-promise",
      true,
    );
    expect(error).toBeNull();
    expect(added).toBe(false);

    const { showIds } = await watchlistApi.getUserWatchlist(testUser);
    expect(showIds).not.toContain("midnight-promise");
  });

  it("migrates guest watchlist items to user account", async () => {
    await watchlistApi.addToWatchlist("guest", "shadows-of-delhi");
    await watchlistApi.migrateWatchlist("guest", testUser);

    const { showIds } = await watchlistApi.getUserWatchlist(testUser);
    expect(showIds).toContain("shadows-of-delhi");

    const { showIds: guestIds } = await watchlistApi.getUserWatchlist("guest");
    expect(guestIds).toEqual([]);
  }, 15000);
});
