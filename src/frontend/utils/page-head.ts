/**
 * Helper to generate consistent SEO head metadata tags for TanStack Start routes.
 */
export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} | Tadka4U` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | Tadka4U` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
