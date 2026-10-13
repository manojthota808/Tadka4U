import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
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
import { shows, genres, filterShows } from "@/api";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Short dramas. Big emotions.",
      "Discover cinematic short dramas, romance, thrillers and fresh stories on Tadka4U.",
    ),
  component: Index,
});

const HERO_INDICES = [0, 2, 5];

function Index() {
  const [genre, setGenre] = useState("All");
  const [featured, setFeatured] = useState(0);
  const { saved, toggle } = useAccount();

  const hero = shows.at(HERO_INDICES.at(featured) ?? 0);
  const topPicks = [5, 1, 7, 3, 6].flatMap((i) => (shows[i] ? [shows[i]] : []));

  useEffect(() => {
    const timer = setInterval(() => {
      setFeatured((prev) => (prev + 1) % HERO_INDICES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

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
            {HERO_INDICES.map((idx, i) => (
              <Button
                variant="ghost"
                key={idx}
                role="tab"
                aria-selected={i === featured}
                aria-label={`Featured show ${i + 1}`}
                className={i === featured ? "selected" : ""}
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
            <Shelf
              id="shelf-trending"
              title={genre === "All" ? "Trending now" : `${genre} picks`}
              icon={
                <Flame className="size-5 text-amber-500 fill-amber-500/20" />
              }
              items={filterShows(shows, genre).slice(0, 6)}
            />
            <Shelf
              id="shelf-top-picks"
              title="Top picks. Big obsessions."
              subtitle="The stories you won’t want to put down."
              icon={<Star className="size-5 text-amber-400 fill-amber-400" />}
              items={topPicks}
              ranked
            />
            <Shelf
              id="shelf-fresh"
              title="Fresh off the reel"
              subtitle="New episodes and latest releases."
              icon={
                <Sparkles className="size-5 text-sky-400 fill-sky-400/20" />
              }
              items={[6, 7, 8, 4, 2, 0].flatMap((i) =>
                shows[i] ? [shows[i]] : [],
              )}
            />
            <Shelf
              id="shelf-romance"
              title="Heartbeats & Romance"
              subtitle="Passionate love stories and heartfelt connections."
              icon={<Heart className="size-5 text-rose-500 fill-rose-500/20" />}
              items={[0, 5, 7, 2, 8, 4].flatMap((i) =>
                shows[i] ? [shows[i]] : [],
              )}
            />
            <Shelf
              id="shelf-thrillers"
              title="Edge of your seat"
              subtitle="High stakes, dark mysteries, and nail-biting suspense."
              icon={<Zap className="size-5 text-amber-400 fill-amber-400/20" />}
              items={[1, 6, 3, 2, 0, 7].flatMap((i) =>
                shows[i] ? [shows[i]] : [],
              )}
            />
          </ShelfCoordinator>
          <AppBand />
        </div>
      </main>
    </PageLayout>
  );
}
