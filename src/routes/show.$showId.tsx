import { createFileRoute, notFound } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Check, Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout, Poster, Shelf, useAccount, pageHead } from '@/components/streaming';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { shows } from '@/lib/catalog';

const EPISODE_LIMIT = 4;

export const Route = createFileRoute('/show/$showId')({
  loader: ({ params }) => {
    const show = shows.find((s) => s.id === params.showId);
    if (!show) throw notFound();
    return { show };
  },
  head: ({ loaderData }) => pageHead(loaderData?.show.title ?? 'Story', loaderData?.show.description ?? 'Discover a Tadka4U story.'),
  component: ShowDetail,
});

function ShowDetail() {
  const { show } = Route.useLoaderData();
  const { saved, toggle } = useAccount();
  const [episode, setEpisode] = useState<number | null>(null);
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
              <section className="preview-panel">
                <h2 className="text-xl">
                  Episode {episode} · {show.title}
                </h2>
                <img src={show.image} width={512} height={1024} alt={`${show.title} episode artwork`} />
                <p>This is an illustrative story preview. Full episodes for this demo have not been uploaded.</p>
              </section>
            )}
          </div>
        </div>
        <section className="episode-shelf">
          <h2 className="text-xl">Episodes</h2>
          <p className="section-subtitle !my-2">Four episodes are available to preview.</p>
          <Carousel opts={{ align: 'start' }} className="episode-carousel">
            <CarouselContent className="-ml-4">
              {Array.from({ length: episodeCount }, (_, i) => (
                <CarouselItem key={i} className="pl-4 basis-[78%] sm:basis-[48%] md:basis-[36%] lg:basis-[24%]">
                  <button
                    type="button"
                    className={`episode-card${episode === i + 1 ? ' selected' : ''}`}
                    onClick={() => setEpisode(i + 1)}
                    aria-label={`Preview episode ${i + 1}`}
                    aria-pressed={episode === i + 1}
                  >
                    <img src={show.image} alt="" width={512} height={288} />
                    <span>Episode {i + 1}</span>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious variant="glass" className="left-0 border-border bg-card/90" />
            <CarouselNext variant="glass" className="right-0 border-border bg-card/90" />
          </Carousel>
        </section>
        <div className="mt-14">
          <Shelf title="More stories to fall for" items={shows.filter((s) => s.id !== show.id).slice(0, 6)} />
        </div>
      </main>
    </PageLayout>
  );
}
