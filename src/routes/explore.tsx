import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout, ShowCard, pageHead } from "@/frontend";
import { useShows, catalogApi, filterShows } from "@/api";
export const Route = createFileRoute("/explore")({
  head: () =>
    pageHead(
      "Explore dramas",
      "Find your next short-drama obsession. Browse romance, thrillers, comedy, horror and drama.",
    ),
  component: Explore,
});
function Explore() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const allShows = useShows();
  const availableGenres = catalogApi.getGenres();
  const results = filterShows(allShows, genre, search);
  return (
    <PageLayout>
      <main className="inner-page">
        <h1>Find your next obsession.</h1>
        <p className="section-subtitle">
          A little romance. A lot of drama. Your kind of story.
        </p>
        <input
          className="search-input"
          type="search"
          aria-label="Search shows"
          placeholder="Search for a show…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="genre-bar">
          {availableGenres.map((g) => (
            <Button
              key={g}
              variant="ghost"
              className={genre === g ? "selected" : ""}
              onClick={() => setGenre(g)}
            >
              {g}
            </Button>
          ))}
        </div>
        {results.length ? (
          <div className="show-grid">
            {results.map((s) => (
              <ShowCard key={s.id} show={s} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search />
            <h2>No stories found</h2>
            <p>Try a different title or genre.</p>
            <Button
              variant="glass"
              onClick={() => {
                setSearch("");
                setGenre("All");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </main>
    </PageLayout>
  );
}
