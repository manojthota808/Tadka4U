import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Play,
  Plus,
  Check,
  Flame,
  Sparkles,
  Star,
  ArrowUpRight,
  Heart,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageLayout,
  Shelf,
  ShelfCoordinator,
  AppBand,
  useAccount,
  pageHead,
} from "@/frontend";
import { useShows, genres, filterShows, type Show } from "@/api";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Short dramas. Big emotions.",
      "Discover cinematic short dramas, romance, thrillers and fresh stories on Tadka4U.",
    ),
  component: Index,
});

function Index() {
  const [genre, setGenre] = useState("All");
  const [featured, setFeatured] = useState(0);
  const { saved, toggle } = useAccount();
  const shows = useShows();

  // Top Front Carousel items:
  // Shows explicitly marked as isHero (from admin), plus default curated originals
  const heroShows = useMemo(() => {
    const customHeroShows = shows.filter((s) => s.isHero);
    const defaultHeroIds = [
      "midnight-promise",
      "the-last-alibi",
      "royal-hearts",
    ];
    const defaultHeroShows = defaultHeroIds
      .map((id) => shows.find((s) => s.id === id))
      .filter((s): s is Show => Boolean(s));

    // Combine custom hero picks first, then defaults, avoiding duplicates
    const seen = new Set<string>();
    const list: Show[] = [];
    for (const item of [...customHeroShows, ...defaultHeroShows]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        list.push(item);
      }
    }
    return list.length > 0 ? list : shows.slice(0, 3);
  }, [shows]);

  const hero = heroShows[featured % heroShows.length] ?? heroShows[0];

  useEffect(() => {
    if (heroShows.length <= 1) return;
    const timer = setInterval(() => {
      setFeatured((prev) => (prev + 1) % heroShows.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroShows.length]);

  // Strict genre-filtered lists: a show only appears in its assigned genre!
  const romanceShows = useMemo(
    () => shows.filter((s) => s.genre.toLowerCase() === "romance"),
    [shows],
  );
  const thrillerShows = useMemo(
    () => shows.filter((s) => s.genre.toLowerCase() === "thriller"),
    [shows],
  );
  const dramaShows = useMemo(
    () => shows.filter((s) => s.genre.toLowerCase() === "drama"),
    [shows],
  );
  const comedyShows = useMemo(
    () => shows.filter((s) => s.genre.toLowerCase() === "comedy"),
    [shows],
  );
  const horrorShows = useMemo(
    () => shows.filter((s) => s.genre.toLowerCase() === "horror"),
    [shows],
  );

  // Must-Watch Top Picks (highest rated)
  const topPicks = useMemo(
    () =>
      [...shows]
        .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
        .slice(0, 8),
    [shows],
  );

  // Fresh releases (new episodes or custom additions)
  const freshShows = useMemo(
    () =>
      shows
        .filter((s) => s.isCustom || s.badge?.toLowerCase().includes("new"))
        .slice(0, 8),
    [shows],
  );

  if (!hero) return null;
  const titleParts = hero.title.split(" ");

  return (
    <PageLayout>
      <main>
        <section
          className="hero"
          aria-roledescription="carousel"
          aria-label="Featured Tadka4U stories"
        >
          <img
            key={hero.id}
            className="hero-image"
            src={hero.image}
            alt={hero.title}
            width={512}
            height={1024}
            fetchPriority="high"
          />
          <div className="hero-content">
            <div className="eyebrow">
              <Sparkles />
              TADKA4U ORIGINAL
            </div>
            <h1 key={hero.id}>
              {titleParts.length > 1 ? (
                <>
                  {titleParts.slice(0, -1).join(" ")}
                  <span>{titleParts.at(-1)}</span>
                </>
              ) : (
                hero.title
              )}
            </h1>
            <div className="show-meta">
              <span className="rating">
                <Star size={12} fill="currentColor" />
                {hero.rating}
              </span>
              <span>2026</span>
              <span className="age">U/A 16+</span>
              <span>{hero.episodes} Episodes</span>
              <span>Hindi</span>
            </div>
            <p className="hero-description">{hero.description}</p>
            <div className="hero-buttons">
              <Button variant="cinema" asChild>
                <Link to="/show/$showId" params={{ showId: hero.id }}>
                  <Play size={16} fill="currentColor" />
                  Watch now
                </Link>
              </Button>
              <Button variant="glass" onClick={() => toggle(hero.id)}>
                {saved.includes(hero.id) ? <Check /> : <Plus />}
                My List
              </Button>
            </div>
            <div className="hero-genre">
              <span>{hero.genre}</span>
              <i />
              <span>Drama</span>
              <i />
              <span>Secrets</span>
            </div>
          </div>
          <div className="hero-caption">
            SHORT DRAMAS.
            <span>Big emotions.</span>
          </div>
          <div
            className="hero-pagination"
            role="tablist"
            aria-label="Featured stories"
          >
            {heroShows.map((hShow, i) => (
              <Button
                variant="ghost"
                key={hShow.id}
                role="tab"
                aria-selected={i === featured % heroShows.length}
                aria-label={`Featured show ${i + 1}: ${hShow.title}`}
                className={i === featured % heroShows.length ? "selected" : ""}
                onClick={() => setFeatured(i)}
              />
            ))}
          </div>
        </section>
        <div className="catalog">
          <div className="genre-bar">
            {genres.map((g) => (
              <Button
                variant="ghost"
                className={genre === g ? "selected" : ""}
                key={g}
                onClick={() => setGenre(g)}
              >
                {g}
              </Button>
            ))}
            <Button variant="ghost" asChild>
              <Link to="/explore">
                More
                <ArrowUpRight size={12} />
              </Link>
            </Button>
          </div>
          <ShelfCoordinator>
            {/* If user clicked a specific genre tab, show that genre's stories first */}
            {genre !== "All" && (
              <Shelf
                id="shelf-genre-selected"
                title={`${genre} Stories`}
                subtitle={`Browse all short dramas in ${genre}.`}
                icon={<Flame className="size-5 text-primary fill-primary/20" />}
                items={filterShows(shows, genre)}
              />
            )}

            {/* Trending Shelf (when 'All' is selected) */}
            {genre === "All" && (
              <Shelf
                id="shelf-trending"
                title="Trending now"
                icon={
                  <Flame className="size-5 text-amber-500 fill-amber-500/20" />
                }
                items={shows.slice(0, 8)}
              />
            )}

            {/* Must-Watch Top Picks */}
            {topPicks.length > 0 && (
              <Shelf
                id="shelf-top-picks"
                title="Must-Watch"
                subtitle="Top rated stories you won’t want to put down."
                icon={<Star className="size-5 text-amber-400 fill-amber-400" />}
                items={topPicks}
                ranked
              />
            )}

            {/* Romance Stories (STRICTLY Romance genre only) */}
            {romanceShows.length > 0 && (
              <Shelf
                id="shelf-romance"
                title="Love Stories"
                subtitle="Passionate romance, deep connections, and emotional journeys."
                icon={
                  <Heart className="size-5 text-rose-500 fill-rose-500/20" />
                }
                items={romanceShows}
              />
            )}

            {/* Thriller Stories (STRICTLY Thriller genre only) */}
            {thrillerShows.length > 0 && (
              <Shelf
                id="shelf-thrillers"
                title="Edge of your seat"
                subtitle="High stakes, dark mysteries, and nail-biting suspense."
                icon={
                  <Zap className="size-5 text-amber-400 fill-amber-400/20" />
                }
                items={thrillerShows}
              />
            )}

            {/* Drama Stories (STRICTLY Drama genre only) */}
            {dramaShows.length > 0 && (
              <Shelf
                id="shelf-drama"
                title="Royal & Drama Secrets"
                subtitle="Family sagas, intense rivalries, and royal secrets."
                icon={
                  <Sparkles className="size-5 text-purple-400 fill-purple-400/20" />
                }
                items={dramaShows}
              />
            )}

            {/* Comedy Stories (STRICTLY Comedy genre only) */}
            {comedyShows.length > 0 && (
              <Shelf
                id="shelf-comedy"
                title="Binge Laughs"
                subtitle="Lighthearted humor, relatable chaos, and fun drama."
                icon={
                  <Sparkles className="size-5 text-amber-400 fill-amber-400/20" />
                }
                items={comedyShows}
              />
            )}

            {/* Horror Stories (STRICTLY Horror genre only) */}
            {horrorShows.length > 0 && (
              <Shelf
                id="shelf-horror"
                title="Dark & Paranormal"
                subtitle="Chilling mysteries and haunted ancestral tales."
                icon={<Zap className="size-5 text-red-500 fill-red-500/20" />}
                items={horrorShows}
              />
            )}

            {/* Fresh off the reel */}
            {freshShows.length > 0 && (
              <Shelf
                id="shelf-fresh"
                title="Fresh off the reel"
                subtitle="New episodes and latest releases."
                icon={
                  <Sparkles className="size-5 text-sky-400 fill-sky-400/20" />
                }
                items={freshShows}
              />
            )}
          </ShelfCoordinator>
          <AppBand />
        </div>
      </main>
    </PageLayout>
  );
}
