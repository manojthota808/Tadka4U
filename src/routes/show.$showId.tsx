import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Plus, Check, Play, Star, Cloud, X } from "lucide-react";
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

const EPISODE_LIMIT = 8;

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
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
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
        {/* Netflix-Style Cinema Theater Stage */}
        {episode !== null && (
          <section
            ref={playerRef}
            className="netflix-theater-stage scroll-mt-24 mb-10"
            aria-label={`Streaming Episode ${episode} of ${show.title}`}
          >
            {/* Cinema Header */}
            <div className="theater-header">
              <div className="flex items-center gap-3">
                <span className="size-2.5 rounded-full bg-primary animate-pulse" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold tracking-widest text-primary uppercase px-2 py-0.5 rounded-full bg-primary/15 border border-primary/20">
                    Now Watching
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight m-0">
                    Episode {episode} · {show.title}
                  </h2>
                </div>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <Cloud size={11} />
                  Google Cloud 1080p
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Episode Switcher Quick Pills */}
                <div className="hidden sm:flex items-center gap-1.5 mr-1">
                  {Array.from({ length: episodeCount }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEpisode(i + 1)}
                      className={`theater-episode-pill ${episode === i + 1 ? "active" : ""}`}
                      aria-label={`Switch to Episode ${i + 1}`}
                    >
                      <Play className="size-3 fill-current" />
                      Ep {i + 1}
                    </button>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEpisode(null)}
                  className="h-8 px-3 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-full border border-white/10 gap-1.5 transition-all"
                >
                  <X className="size-3.5" />
                  <span>Close Cinema</span>
                </Button>
              </div>
            </div>

            {/* Video Player Display */}
            <div className="theater-player-box">
              <VideoPlayer
                show={show}
                episodeNumber={episode}
                totalEpisodes={episodeCount}
                onSelectEpisode={(ep) => setEpisode(ep)}
                onClose={() => setEpisode(null)}
              />
            </div>

            {/* Episode Selector Strip */}
            <div className="theater-episodes-strip">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider pl-1">
                Episodes:
              </span>
              {Array.from({ length: episodeCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setEpisode(i + 1)}
                  className={`theater-episode-pill ${episode === i + 1 ? "active" : ""}`}
                >
                  <span className="font-bold">Episode {i + 1}</span>
                  {episode === i + 1 && (
                    <span className="text-[10px] uppercase font-bold text-white bg-black/40 px-1.5 py-0.5 rounded">
                      Playing
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

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
              <Button
                variant="cinema"
                onClick={() => {
                  setEpisode(episode || 1);
                }}
              >
                <Play fill="currentColor" />
                {episode !== null
                  ? `Resume Episode ${episode}`
                  : "Watch preview"}
              </Button>
              <Button variant="glass" onClick={() => toggle(show.id)}>
                {saved.includes(show.id) ? <Check /> : <Plus />}
                My List
              </Button>
            </div>
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
