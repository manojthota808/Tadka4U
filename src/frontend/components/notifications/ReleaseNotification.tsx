import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Play, Check, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Show } from "@/lib/catalog";

/**
 * Plays a subtle, pleasant audio chime using Web Audio API when new content drops.
 */
export function playNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Autoplay restrictions or unsupported
  }
}

/**
 * Requests native desktop/mobile notification permission from the browser.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window))
    return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const res = await Notification.requestPermission();
    return res === "granted";
  } catch {
    return false;
  }
}

/**
 * Triggers interactive Netflix-style in-app toast & native desktop alert for a new show.
 */
export function triggerNewReleaseNotification(show: Show) {
  if (typeof window === "undefined") return;

  // Don't show toast if user is inside the admin publishing studio to avoid duplicate alerts
  const isAdminStudio = window.location.pathname.startsWith("/admin");

  if (!isAdminStudio) {
    playNotificationChime();

    toast.custom(
      (t) => (
        <div className="flex items-center gap-3.5 p-3.5 bg-[#121217]/95 border border-primary/40 rounded-2xl shadow-2xl backdrop-blur-xl text-white max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="relative size-14 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-black/40">
            <img
              src={show.image}
              alt={show.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                Just Released
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white truncate m-0 tracking-tight">
              {show.title}
            </h4>
            <p className="text-[11px] text-white/60 truncate m-0">
              {show.genre} · {show.episodes} Episodes · 1080p HD
            </p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <a
              href={`/show/${show.id}`}
              onClick={() => toast.dismiss(t)}
              className="px-3 py-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-center shadow-md shadow-primary/25 cursor-pointer"
            >
              Watch
            </a>
          </div>
        </div>
      ),
      { duration: 8000 },
    );
  }

  // Native Web Notification
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        const notif = new Notification(`🎬 New on Tadka4U: ${show.title}`, {
          body: `${show.genre} · ${show.description ? show.description.slice(0, 90) : "Stream all episodes now!"}`,
          icon: show.image,
          badge: "/favicon.png",
          tag: `tadka4u-release-${show.id}`,
        });
        notif.onclick = () => {
          window.focus();
          window.location.href = `/show/${show.id}`;
        };
      } catch (e) {
        console.warn("[Catalog] Native notification notice:", e);
      }
    }
  }
}

interface NotificationBellProps {
  recentShows?: Show[];
}

/**
 * Top header notification bell with active release indicator and dropdown popover.
 */
export function NotificationBell({ recentShows = [] }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission === "granted";
    }
    return false;
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleEnableAlerts = async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    if (granted) {
      toast.success(
        "Desktop notifications enabled! You'll be alerted when new shows drop.",
      );
    }
  };

  const newReleases = recentShows.slice(0, 4);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-white/80 hover:text-white hover:bg-white/10"
        title="Notifications & New Releases"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="size-5" />
        {newReleases.length > 0 && (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 p-2 bg-[#121217]/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                New Releases & Alerts
              </span>
            </div>
            {!hasPermission &&
              typeof window !== "undefined" &&
              "Notification" in window && (
                <button
                  type="button"
                  onClick={handleEnableAlerts}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="size-3" />
                  Enable Alerts
                </button>
              )}
          </div>

          {/* Release List */}
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {newReleases.length === 0 ? (
              <div className="text-center py-6 text-xs text-white/50">
                You're all caught up! No new releases yet.
              </div>
            ) : (
              newReleases.map((s) => (
                <Link
                  key={s.id}
                  to="/show/$showId"
                  params={{ showId: s.id }}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors group"
                >
                  <div className="relative size-12 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black">
                    <img
                      src={s.image}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="size-4 fill-white text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {s.badge || "NEW"}
                      </span>
                      <span className="text-white/30 text-[10px]">·</span>
                      <span className="text-[10px] text-white/50">
                        {s.genre}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white group-hover:text-primary transition-colors truncate">
                      {s.title}
                    </div>
                    <div className="text-[10px] text-white/40 truncate">
                      {s.episodes} episodes · High Definition
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
