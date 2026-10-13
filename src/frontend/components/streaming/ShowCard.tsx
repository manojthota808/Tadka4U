import { Link } from "@tanstack/react-router";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/frontend/context";
import type { Show } from "@/api";
import { Poster } from "./Poster";

export function ShowCard({ show }: { show: Show }) {
  const { saved, toggle } = useAccount();
  return (
    <article className="show-card">
      <Poster show={show} />
      <Button
        variant="ghost"
        size="icon"
        className="save-card"
        aria-label={`${saved.includes(show.id) ? "Remove" : "Save"} ${show.title}`}
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
