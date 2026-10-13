import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { pageHead } from "@/components/streaming";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing and branding", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({
      routeTree,
      context: { queryClient: new QueryClient() },
    });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("formats page head with Tadka4U brand in title and og:title", () => {
    const head = pageHead("Trending", "Top short dramas");
    const titleMeta = head.meta.find((m) => "title" in m);
    const ogTitleMeta = head.meta.find(
      (m) => "property" in m && m.property === "og:title",
    );

    expect(titleMeta).toEqual({ title: "Trending | Tadka4U" });
    expect(ogTitleMeta).toEqual({
      property: "og:title",
      content: "Trending | Tadka4U",
    });
  });
});
