import { Link, useRouterState } from "@tanstack/react-router";
import {
  Search,
  Home,
  Compass,
  Bookmark,
  Film,
  Mail,
  Crown,
} from "lucide-react";
import { Show, UserButton, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Brand } from "./Brand";
import { useShows } from "@/api";
import { useAccount } from "@/frontend/context";
import { NotificationBell } from "../notifications";

const nav = [
  { label: "Home", to: "/" as const, icon: Home },
  { label: "Explore", to: "/explore" as const, icon: Compass },
  { label: "Originals", to: "/originals" as const, icon: Film },
  { label: "My List", to: "/my-list" as const, icon: Bookmark },
  { label: "Plans", to: "/plans" as const, icon: Crown },
  { label: "Contact", to: "/contact" as const, icon: Mail },
];

export function Header() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useUser();
  const allShows = useShows();
  const { isVip, plan } = useAccount();
  const userEmail =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim() || "";
  const isAdmin = userEmail === "thotamanojnaidu@gmail.com";

  // New releases to display in notification drawer
  const newReleases = allShows.filter((s) => s.isCustom || s.badge === "NEW");

  return (
    <>
      <header className="site-header">
        <Brand />
        <nav className="nav-links">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={path === n.to ? "active" : ""}
            >
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

          <NotificationBell recentShows={newReleases} />

          {/* VIP Badge or Get VIP Button */}
          {isVip ? (
            <Link
              to="/plans"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider hover:border-amber-400 transition-all shadow-sm"
              title={`Active ${plan} VIP Membership`}
            >
              <Crown className="size-3.5 fill-amber-400 text-amber-400 animate-pulse" />
              <span>VIP Active</span>
            </Link>
          ) : (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden lg:inline-flex text-xs font-bold border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-1.5 h-8 rounded-full"
            >
              <Link to="/plans">
                <Crown className="size-3.5 text-amber-400 fill-amber-400/20" />
                <span>Get VIP</span>
              </Link>
            </Button>
          )}

          <Show when="signed-out">
            <Button variant="cinema" className="signin" asChild>
              <Link to="/sign-in/$">Sign in</Link>
            </Button>
            <Button
              variant="glass"
              className="signin hidden sm:inline-flex"
              asChild
            >
              <Link to="/sign-up/$">Sign up</Link>
            </Button>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-white border border-border/50"
                  asChild
                >
                  <Link to="/admin">Studio</Link>
                </Button>
              )}
              <UserButton />
            </div>
          </Show>
        </div>
      </header>
      <nav className="mobile-nav">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className={path === n.to ? "active" : ""}>
            <n.icon />
            {n.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
