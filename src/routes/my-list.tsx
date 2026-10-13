import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout, ShowCard, useAccount, pageHead } from "@/frontend";
import { shows } from "@/api";
export const Route = createFileRoute("/my-list")({
  head: () =>
    pageHead(
      "My List",
      "Keep your favorite Tadka4U stories together in your personal watchlist.",
    ),
  component: MyList,
});
function MyList() {
  const { user, saved } = useAccount();
  const list = shows.filter((s) => saved.includes(s.id));
  return (
    <PageLayout>
      <main className="inner-page">
        <h1>My List</h1>
        <p className="section-subtitle mb-8">
          Your stories, ready when you are.
        </p>
        {list.length ? (
          <>
            {!user && (
              <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  You are viewing saved shows on this browser. Sign in to sync
                  your watchlist across all devices.
                </p>
                <Button variant="cinema" size="sm" asChild>
                  <Link to="/sign-in/$">Sign in</Link>
                </Button>
              </div>
            )}
            <div className="show-grid">
              {list.map((s) => (
                <ShowCard key={s.id} show={s} />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <Bookmark />
            <h2>
              {user
                ? "Your next obsession belongs here."
                : "A little list. A lot to love."}
            </h2>
            <p>
              {user
                ? "Save a show to make it yours."
                : "Sign in to keep your favorite stories in one place."}
            </p>
            {user ? (
              <Button variant="cinema" asChild>
                <Link to="/explore">Explore shows</Link>
              </Button>
            ) : (
              <Button variant="cinema" asChild>
                <Link to="/sign-in/$">Sign in</Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
