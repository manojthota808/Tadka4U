import { useState, useRef, useEffect, useId, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { shows, type Show } from "@/api";
import { useShelfCoordinator } from "@/frontend/context";
import { ShowCard } from "./ShowCard";
import { Poster } from "./Poster";

export interface ShelfProps {
  id?: string;
  title: string;
  icon?: ReactNode;
  items?: Show[];
  subtitle?: string;
  ranked?: boolean;
  autoplay?: boolean;
  delay?: number;
}

export function Shelf({
  id: propId,
  title,
  icon,
  items = shows.slice(0, 6),
  subtitle,
  ranked = false,
  autoplay = true,
  delay = 2400,
}: ShelfProps) {
  const generatedId = useId();
  const id = propId ?? `shelf-${generatedId.replace(/:/g, "")}`;
  const sectionRef = useRef<HTMLElement>(null);
  const [api, setApi] = useState<CarouselApi>();

  const hasMultipleItems = (items?.length ?? 0) > 1;
  const canLoop = (items?.length ?? 0) > 3;
  const shouldAutoplay = autoplay && hasMultipleItems;

  const coordinator = useShelfCoordinator();
  const isActive = coordinator.isCoordinated
    ? coordinator.activeId === id
    : shouldAutoplay;

  const autoplayPlugin = useRef(
    shouldAutoplay
      ? Autoplay({
          delay,
          stopOnInteraction: false,
          stopOnMouseEnter: true,
          playOnInit: !coordinator.isCoordinated,
        })
      : undefined,
  );
  const plugins =
    shouldAutoplay && autoplayPlugin.current
      ? [autoplayPlugin.current]
      : undefined;

  useEffect(() => {
    if (!coordinator.isCoordinated || !api) return;
    try {
      const ap = api.plugins()?.autoplay;
      if (!ap) return;

      if (isActive && shouldAutoplay) {
        ap.play();
      } else {
        ap.stop();
      }
    } catch {
      // Safe guard against unmounted or disposed embla plugins
    }
  }, [isActive, api, coordinator.isCoordinated, shouldAutoplay]);

  useEffect(() => {
    if (!coordinator.isCoordinated || !sectionRef.current) return;
    return coordinator.register({
      id,
      element: sectionRef.current,
      play: () => {
        try {
          if (shouldAutoplay) {
            api?.plugins()?.autoplay?.play();
          }
        } catch (_err) {
          // Ignore carousel autoplay errors when unmounted
        }
      },
      stop: () => {
        try {
          api?.plugins()?.autoplay?.stop();
        } catch (_err) {
          // Ignore carousel autoplay errors when unmounted
        }
      },
    });
  }, [id, api, coordinator, shouldAutoplay]);

  if (!items || items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`shelf ${isActive ? "is-active" : ""}`}
      onMouseEnter={() => {
        if (coordinator.isCoordinated) {
          coordinator.setActiveId(id);
        }
      }}
    >
      <div className="section-heading">
        <div>
          <h2>
            {icon}
            {title}
            {coordinator.isCoordinated && isActive && (
              <span
                className="shelf-active-badge"
                title="Auto-scrolling showcase in view"
              >
                <span className="shelf-active-dot" />
                In focus
              </span>
            )}
          </h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        <Link to="/explore">
          View all
          <ChevronRight />
        </Link>
      </div>
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: canLoop, duration: 20 }}
        plugins={plugins}
        className="shelf-carousel"
      >
        <CarouselContent className="-ml-4">
          {items.map((s, i) => (
            <CarouselItem
              key={s.id}
              className={
                ranked
                  ? "pl-4 basis-[78%] sm:basis-[48%] md:basis-[36%] lg:basis-[28%]"
                  : "pl-4 basis-[62%] sm:basis-[40%] md:basis-[30%] lg:basis-[22%]"
              }
            >
              {ranked ? (
                <article className="rank-card">
                  <span className="rank-number">{i + 1}</span>
                  <Poster show={s} />
                </article>
              ) : (
                <ShowCard show={s} />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        {hasMultipleItems && (
          <>
            <CarouselPrevious
              variant="glass"
              className="left-0 border-border bg-card/90"
            />
            <CarouselNext
              variant="glass"
              className="right-0 border-border bg-card/90"
            />
          </>
        )}
      </Carousel>
    </section>
  );
}
