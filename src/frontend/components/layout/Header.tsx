import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Home, Compass, Bookmark, Film, Mail } from "lucide-react";
import { Show, UserButton } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Brand } from "./Brand";

const nav = [
  { label: "Home", to: "/" as const, icon: Home },
  { label: "Explore", to: "/explore" as const, icon: Compass },
  { label: "Originals", to: "/originals" as const, icon: Film },
  { label: "My List", to: "/my-list" as const, icon: Bookmark },
  { label: "Contact", to: "/contact" as const, icon: Mail },
];

export function Header() {
  const path = useRouterState({ select: (s) => s.location.pathname });

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
