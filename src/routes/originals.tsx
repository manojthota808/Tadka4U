import { createFileRoute } from "@tanstack/react-router";
import { PageLayout, ShowCard, pageHead } from "@/frontend";
import { useShows } from "@/api";
export const Route = createFileRoute("/originals")({
  head: () =>
    pageHead(
      "Tadka4U Originals",
      "Discover original short-form stories, cinematic drama and unexpected twists.",
    ),
  component: Originals,
});
function Originals() {
  const allShows = useShows();
  return (
    <PageLayout>
      <main className="inner-page">
        <div className="eyebrow mb-4">EXCLUSIVELY TADKA4U</div>
        <h1>Original stories. Unforgettable emotions.</h1>
        <p className="section-subtitle mb-8">
          Meet the stories that stay with you.
        </p>
        <div className="show-grid">
          {allShows.map((s) => (
            <ShowCard show={s} key={s.id} />
          ))}
        </div>
      </main>
    </PageLayout>
  );
}
