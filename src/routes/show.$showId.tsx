import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Plus, Check, Play, Star, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageLayout,
  Poster,
  Shelf,
  useAccount,
  pageHead,
  VideoPlayer,
} from "@/frontend";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { catalogApi, useShows } from "@/api";

const EPISODE_LIMIT = 4;

export const Route = createFileRoute("/show/$showId")({
  loader: ({ params }) => {
    const show = catalogApi.getShowById(params.showId);
    return { show: show ?? null, showId: params.showId };
  },
  head: ({ loaderData }) =>
    pageHead(
      loaderData?.show?.title ?? "Story",
      loaderData?.show?.description ?? "Discover a Tadka4U story.",
    ),
  component: ShowDetail,
});

function ShowDetail() {
  const { show: initialShow, showId } = Route.useLoaderData();
  const allShows = useShows();
  const dynamicShow = allShows.find((s) => s.id === showId);
  const show = dynamicShow ?? initialShow;
  const { saved, toggle } = useAccount();
  const [episode, setEpisode] = useState<number | null>(null);
  const playerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (episode !== null && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [episode]);

  if (!show) {
    return (
      <PageLayout>
        <main className="inner-page text-center py-20 max-w-md mx-auto">
          <h1 className="text-2xl font-semibold mb-3">Story Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The story you are looking for may have been removed or does not
            exist.
          </p>
          <Button variant="cinema" asChild>
            <Link to="/explore">Explore Stories</Link>
          </Button>
        </main>
      </PageLayout>
    );
  }

  const episodeCount = Math.min(show.episodes, EPISODE_LIMIT);

  return (
    <PageLayout>
      <main className="inner-page">
        <div className="detail-layout">
          <Poster show={show} />
          <div className="detail-info">
            <div className="eyebrow mb-5">TADKA4U ORIGINAL</div>
            <h1>{show.title}</h1>
            <div className="show-meta">
              <span className="rating">
                <Star size={13} />
                {show.rating}
              </span>
              <span>{show.genre}</span>
              <span>Hindi</span>
              <span className="age">U/A 16+</span>
              <span>{episodeCount} episodes</span>
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Cloud size={12} />
                Google Cloud
              </span>
            </div>
            <p>{show.description}</p>
            <div className="hero-buttons">
              <Button variant="cinema" onClick={() => setEpisode(1)}>
                <Play fill="currentColor" />
                Watch preview
              </Button>
              <Button variant="glass" onClick={() => toggle(show.id)}>
                {saved.includes(show.id) ? <Check /> : <Plus />}
                My List
              </Button>
            </div>
            {episode !== null && (
              <section ref={playerRef} className="preview-panel mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Play className="size-4 fill-primary text-primary" />
                    Episode {episode} · {show.title}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEpisode(null)}
                    className="text-xs text-muted-foreground hover:text-white"
                  >
                    Close
                  </Button>
                </div>
                <VideoPlayer
                  show={show}
                  episodeNumber={episode}
                  totalEpisodes={episodeCount}
                  onSelectEpisode={(ep) => setEpisode(ep)}
                  onClose={() => setEpisode(null)}
                />
              </section>
            )}
          </div>
        </div>
        <section className="episode-shelf">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div>
              <h2 className="text-xl font-bold">Episodes</h2>
              <p className="section-subtitle !my-1">
                Stream all {episodeCount} episodes in high definition powered by
                Google Cloud edge delivery.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5">
              <Cloud className="size-3 text-emerald-400" />
              Google Cloud Streaming Active
            </span>
          </div>
          <Carousel opts={{ align: "start" }} className="episode-carousel">
            <CarouselContent className="-ml-4">
              {Array.from({ length: episodeCount }, (_, i) => (
                <CarouselItem
                  key={i}
                  className="pl-4 basis-[78%] sm:basis-[48%] md:basis-[36%] lg:basis-[24%]"
                >
                  <button
                    type="button"
                    className={`episode-card${episode === i + 1 ? " selected" : ""}`}
                    onClick={() => setEpisode(i + 1)}
                    aria-label={`Play episode ${i + 1}`}
                    aria-pressed={episode === i + 1}
                  >
                    <div className="relative overflow-hidden rounded-lg">
                      <img src={show.image} alt="" width={512} height={288} />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="size-8 fill-white text-white drop-shadow" />
                      </div>
                    </div>
                    <span className="flex items-center justify-between w-full">
                      <span>Episode {i + 1}</span>
                      {episode === i + 1 && (
                        <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                          <Play className="size-2.5 fill-primary" />
                          Playing
                        </span>
                      )}
                    </span>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious
              variant="glass"
              className="left-0 border-border bg-card/90"
            />
            <CarouselNext
              variant="glass"
              className="right-0 border-border bg-card/90"
            />
          </Carousel>
        </section>
        <div className="mt-14">
          <Shelf
            title="More stories to fall for"
            items={allShows.filter((s) => s.id !== show.id).slice(0, 6)}
          />
        </div>
      </main>
    </PageLayout>
  );
}
