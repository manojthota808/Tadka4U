import { Link, useRouterState } from '@tanstack/react-router';
import { createContext, useContext, useEffect, useState, useRef, useCallback, useId, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { Search, ChevronRight, Plus, Check, Home, Compass, Bookmark, Film, Apple, Play, LogOut, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { supabase } from '@/integrations/supabase/client';
import { shows, type Show } from '@/lib/catalog';
import { toast } from 'sonner';

const AccountContext = createContext<{ user: User | null; saved: string[]; toggle: (id: string) => void }>({
  user: null,
  saved: [],
  toggle: () => {},
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    try {
      const apply = (u: User | null) => {
        if (active) setUser(u);
      };
      supabase.auth.getSession().then(({ data }) => apply(data.session?.user ?? null));
      const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session?.user ?? null));
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      /* Catalog still works when Cloud auth is not configured. */
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!user) {
      setSaved([]);
      return;
    }
    supabase
      .from('watchlist')
      .select('show_id')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (active) {
          setSaved(data?.map((s) => s.show_id) ?? []);
          if (error) toast.error('Your list could not load. Please try again.');
        }
      });
    return () => {
      active = false;
    };
  }, [user]);

  const toggle = async (id: string) => {
    if (!user) {
      toast('Sign in to save your favorites', {
        action: { label: 'Sign in', onClick: () => { window.location.href = '/auth'; } },
      });
      return;
    }
    const exists = saved.includes(id);
    const { error } = exists
      ? await supabase.from('watchlist').delete().eq('user_id', user.id).eq('show_id', id)
      : await supabase.from('watchlist').insert({ user_id: user.id, show_id: id });
    if (error) {
      toast.error('Could not update your list. Please try again.');
      return;
    }
    setSaved((old) => (exists ? old.filter((s) => s !== id) : [...old, id]));
    toast.success(exists ? 'Removed from My List' : 'Added to My List');
  };

  return <AccountContext.Provider value={{ user, saved, toggle }}>{children}</AccountContext.Provider>;
}

export const useAccount = () => useContext(AccountContext);

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Tadka4U home">
      <span className="brand-word">TADKA</span>
      <span className="brand-word">4U</span>
    </Link>
  );
}

const nav = [
  { label: 'Home', to: '/' as const, icon: Home },
  { label: 'Explore', to: '/explore' as const, icon: Compass },
  { label: 'Originals', to: '/originals' as const, icon: Film },
  { label: 'My List', to: '/my-list' as const, icon: Bookmark },
  { label: 'Contact', to: '/contact' as const, icon: Mail },
];

export function Header() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAccount();
  return (
    <>
      <header className="site-header">
        <Brand />
        <nav className="nav-links">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={path === n.to ? 'active' : ''}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Button variant="ghost" size="icon" asChild title="Search shows">
            <Link to="/explore">
              <Search className="size-5" />
            </Link>
          </Button>
          {user ? (
            <Button
              variant="glass"
              className="signin"
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) toast.error('Could not sign out');
              }}
              title="Sign out"
            >
              <LogOut />
              Sign out
            </Button>
          ) : (
            <Button variant="cinema" className="signin" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </header>
      <nav className="mobile-nav">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className={path === n.to ? 'active' : ''}>
            <n.icon />
            {n.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export function Poster({ show }: { show: Show }) {
  return (
    <Link to="/show/$showId" params={{ showId: show.id }} className="poster" aria-label={`View ${show.title}`}>
      <img src={show.image} alt={`${show.title} cinematic poster`} width={512} height={1024} loading="lazy" />
      {show.badge && <span className={`poster-badge ${show.badge === 'TRENDING' ? 'gold' : ''}`}>{show.badge}</span>}
      <span className="poster-title">
        <small>TADKA4U ORIGINAL</small>
        {show.title}
      </span>
    </Link>
  );
}

export function ShowCard({ show }: { show: Show }) {
  const { saved, toggle } = useAccount();
  return (
    <article className="show-card">
      <Poster show={show} />
      <Button
        variant="ghost"
        size="icon"
        className="save-card"
        aria-label={`${saved.includes(show.id) ? 'Remove' : 'Save'} ${show.title}`}
        onClick={() => toggle(show.id)}
      >
        {saved.includes(show.id) ? <Check /> : <Plus />}
      </Button>
      <div className="card-info">
        <h3>
          <Link to="/show/$showId" params={{ showId: show.id }}>
            {show.title}
          </Link>
        </h3>
        <p>
          {show.genre}
          <span className="mx-1.5">·</span>
          {show.episodes} Episodes
        </p>
      </div>
    </article>
  );
}

type ShelfItem = {
  id: string;
  element: HTMLElement;
  play: () => void;
  stop: () => void;
};

type ShelfCoordinatorContextType = {
  register: (item: ShelfItem) => () => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  isCoordinated: boolean;
};

const ShelfCoordinatorContext = createContext<ShelfCoordinatorContextType>({
  register: () => () => {},
  activeId: null,
  setActiveId: () => {},
  isCoordinated: false,
});

export function ShelfCoordinator({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const itemsRef = useRef<Map<string, ShelfItem>>(new Map());

  const register = useCallback((item: ShelfItem) => {
    itemsRef.current.set(item.id, item);
    return () => {
      itemsRef.current.delete(item.id);
    };
  }, []);

  useEffect(() => {
    let ticking = false;

    const evaluate = () => {
      ticking = false;
      if (typeof window === 'undefined') return;

      const vh = window.innerHeight;
      const vCenter = vh / 2;

      // When at the top looking at hero banner, keep all shelves paused
      if (window.scrollY < 200) {
        setActiveId(null);
        return;
      }

      let bestId: string | null = null;
      let minDistance = Infinity;

      itemsRef.current.forEach((item, id) => {
        const rect = item.element.getBoundingClientRect();
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(vh, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        // Require at least 140px visible on screen
        if (visibleHeight >= 140) {
          const itemCenter = rect.top + rect.height / 2;
          const dist = Math.abs(itemCenter - vCenter);
          if (dist < minDistance) {
            minDistance = dist;
            bestId = id;
          }
        }
      });

      setActiveId(bestId);
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(evaluate);
      }
    };

    evaluate();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  useEffect(() => {
    itemsRef.current.forEach((item, id) => {
      if (id === activeId) {
        item.play();
      } else {
        item.stop();
      }
    });
  }, [activeId]);

  return (
    <ShelfCoordinatorContext.Provider value={{ register, activeId, setActiveId, isCoordinated: true }}>
      {children}
    </ShelfCoordinatorContext.Provider>
  );
}

export const useShelfCoordinator = () => useContext(ShelfCoordinatorContext);

export function Shelf({
  id: propId,
  title,
  icon,
  items = shows.slice(0, 6),
  subtitle,
  ranked = false,
  autoplay = true,
  delay = 2400,
}: {
  id?: string;
  title: string;
  icon?: ReactNode;
  items?: Show[];
  subtitle?: string;
  ranked?: boolean;
  autoplay?: boolean;
  delay?: number;
}) {
  const generatedId = useId();
  const id = propId ?? `shelf-${generatedId.replace(/:/g, '')}`;
  const sectionRef = useRef<HTMLElement>(null);
  const [api, setApi] = useState<CarouselApi>();

  const coordinator = useShelfCoordinator();
  const isActive = coordinator.isCoordinated ? coordinator.activeId === id : autoplay;

  const autoplayPlugin = useRef(
    autoplay
      ? Autoplay({
          delay,
          stopOnInteraction: false,
          stopOnMouseEnter: true,
          playOnInit: !coordinator.isCoordinated,
        })
      : undefined
  );
  const plugins = autoplayPlugin.current ? [autoplayPlugin.current] : undefined;

  useEffect(() => {
    if (!coordinator.isCoordinated || !api) return;
    const ap = api.plugins()?.autoplay;
    if (!ap) return;
    if (isActive) {
      ap.play();
    } else {
      ap.stop();
    }
  }, [isActive, api, coordinator.isCoordinated]);

  useEffect(() => {
    if (!coordinator.isCoordinated || !sectionRef.current) return;
    return coordinator.register({
      id,
      element: sectionRef.current,
      play: () => {
        try {
          api?.plugins()?.autoplay?.play();
        } catch {}
      },
      stop: () => {
        try {
          api?.plugins()?.autoplay?.stop();
        } catch {}
      },
    });
  }, [id, api, coordinator]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`shelf ${isActive ? 'is-active' : ''}`}
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
              <span className="shelf-active-badge" title="Auto-scrolling showcase in view">
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
        opts={{ align: 'start', loop: true, duration: 20 }}
        plugins={plugins}
        className="shelf-carousel"
      >
        <CarouselContent className="-ml-4">
          {items.map((s, i) => (
            <CarouselItem
              key={s.id}
              className={
                ranked
                  ? 'pl-4 basis-[78%] sm:basis-[48%] md:basis-[36%] lg:basis-[28%]'
                  : 'pl-4 basis-[62%] sm:basis-[40%] md:basis-[30%] lg:basis-[22%]'
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
        <CarouselPrevious variant="glass" className="left-0 border-border bg-card/90" />
        <CarouselNext variant="glass" className="right-0 border-border bg-card/90" />
      </Carousel>
    </section>
  );
}
export function AppBand(){return <section className="app-band"><div><h2>Big stories. Any screen.</h2><p>Your next obsession is always a tap away. Get the Tadka4U app.</p></div><div className="app-downloads"><a className="store-link" href="#" onClick={(e)=>{e.preventDefault();toast.info('Tadka4U Google Play download link coming soon!')}} aria-label="Google Play download coming soon"><Play/><span><small>GET IT ON</small><strong>Google Play</strong></span></a><a className="store-link" href="#" onClick={(e)=>{e.preventDefault();toast.info('Tadka4U App Store download link coming soon!')}} aria-label="App Store download coming soon"><Apple/><span><small>DOWNLOAD ON THE</small><strong>App Store</strong></span></a></div></section>}
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand-wrap">
        <Brand />
        <p className="footer-credit">
          Site designed and developed by{' '}
          <Link to="/contact" className="creator-link">
            Manoj Thota
          </Link>
        </p>
      </div>
      <p className="footer-disclaimer">
        © 2026 Tadka4U. All artwork and stories are illustrative.
      </p>
      <div className="footer-links">
        <Link to="/about">About us</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
      </div>
    </footer>
  );
}
export function PageLayout({children}:{children:ReactNode}){return <div className="page-shell"><Header/>{children}<Footer/></div>}
export function pageHead(title:string,description:string){return {meta:[{title:`${title} | Tadka4U`},{name:'description',content:description},{property:'og:title',content:`${title} | Tadka4U`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}}
