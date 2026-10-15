import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Check,
  Play,
  Star,
  X,
  Film,
  ChevronDown,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageLayout,
  Poster,
  Shelf,
  useAccount,
  pageHead,
  VideoPlayer,
  SubscriptionModal,
  VipBanner,
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
  const { saved, toggle, isVip } = useAccount();
  const [episode, setEpisode] = useState<number | null>(null);
  const [showEpisodeMenu, setShowEpisodeMenu] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const playerRef = useRef<HTMLElement>(null);
  const episodeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (episode !== null && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [episode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        episodeMenuRef.current &&
        !episodeMenuRef.current.contains(event.target as Node)
      ) {
        setShowEpisodeMenu(false);
      }
    }
    if (showEpisodeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEpisodeMenu]);

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
                <span className="hidden md:inline-flex items-center text-[10px] font-semibold text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                  1080p Full HD
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Netflix-Style Episode Quick Dropdown */}
                {episodeCount > 1 && (
                  <div className="relative" ref={episodeMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowEpisodeMenu(!showEpisodeMenu)}
                      className="h-8 px-3 text-xs font-semibold text-white/90 bg-white/10 hover:bg-white/15 rounded-full border border-white/15 gap-1.5 flex items-center transition-all cursor-pointer"
                      aria-expanded={showEpisodeMenu}
                      aria-label="Select Episode"
                    >
                      <Film className="size-3.5 text-primary" />
                      <span>
                        Episode {episode} of {episodeCount}
                      </span>
                      <ChevronDown
                        className={`size-3 text-white/70 transition-transform ${showEpisodeMenu ? "rotate-180" : ""}`}
                      />
                    </button>

                    {showEpisodeMenu && (
                      <div className="absolute right-0 top-full mt-2 w-56 py-1.5 bg-[#141418]/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-white/50 tracking-wider border-b border-white/10 mb-1">
                          Episodes ({episodeCount})
                        </div>
                        {Array.from({ length: episodeCount }, (_, i) => {
                          const epNum = i + 1;
                          const isActive = episode === epNum;
                          return (
                            <button
                              key={epNum}
                              type="button"
                              onClick={() => {
                                setEpisode(epNum);
                                setShowEpisodeMenu(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer ${
                                isActive
                                  ? "text-primary font-bold bg-primary/10"
                                  : "text-white/80"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Play
                                  className={`size-3 ${isActive ? "fill-primary text-primary" : "text-white/50"}`}
                                />
                                <span>Episode {epNum}</span>
                              </div>
                              {isActive ? (
                                <span className="text-[10px] font-bold uppercase text-primary px-1.5 py-0.5 rounded bg-primary/20">
                                  Playing
                                </span>
                              ) : (
                                <span className="text-[11px] text-white/40">
                                  HD
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

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

            {/* Clean 16:9 Video Player Box */}
            <div className="theater-player-box">
              <VideoPlayer
                show={show}
                episodeNumber={episode}
                totalEpisodes={episodeCount}
                onSelectEpisode={(ep) => setEpisode(ep)}
                onClose={() => setEpisode(null)}
              />
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
              <span className="font-semibold text-white/90">Full HD</span>
              <span className="font-medium text-white/60">Dolby 5.1</span>
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
              {!isVip && (
                <Button
                  variant="outline"
                  onClick={() => setShowVipModal(true)}
                  className="gap-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                >
                  <Crown className="size-4 text-amber-400" />
                  <span>VIP Pass</span>
                </Button>
              )}
            </div>
          </div>
        </div>
        <section className="episode-shelf">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div>
              <h2 className="text-xl font-bold">Episodes</h2>
              <p className="section-subtitle !my-1">
                Stream all {episodeCount} episodes in crystal-clear high
                definition.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/90 border border-white/15">
              1080p Ultra HD
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
                      <span className="flex items-center gap-1.5">
                        <span>Episode {i + 1}</span>
                        {i > 0 && !isVip && (
                          <span className="text-[9px] font-bold uppercase text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1 rounded flex items-center gap-0.5">
                            <Crown className="size-2.5 fill-amber-400" />
                            VIP
                          </span>
                        )}
                      </span>
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

        {/* Subscription VIP Banner */}
        <VipBanner />

        <div className="mt-14">
          <Shelf
            title="More stories to fall for"
            items={allShows.filter((s) => s.id !== show.id).slice(0, 6)}
          />
        </div>
      </main>

      <SubscriptionModal
        isOpen={showVipModal}
        onClose={() => setShowVipModal(false)}
      />
    </PageLayout>
  );
}
