import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";

export type ShelfItem = {
  id: string;
  element: HTMLElement;
  play: () => void;
  stop: () => void;
};

export type ShelfCoordinatorContextType = {
  register: (item: ShelfItem) => () => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  isCoordinated: boolean;
};

export const ShelfCoordinatorContext =
  createContext<ShelfCoordinatorContextType>({
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
      if (typeof window === "undefined") return;

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
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
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
    <ShelfCoordinatorContext.Provider
      value={{ register, activeId, setActiveId, isCoordinated: true }}
    >
      {children}
    </ShelfCoordinatorContext.Provider>
  );
}

export const useShelfCoordinator = () => useContext(ShelfCoordinatorContext);
