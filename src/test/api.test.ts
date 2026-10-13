import { describe, it, expect } from "vitest";
import { catalogApi, shows, genres } from "@/api";

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
