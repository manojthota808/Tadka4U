import { Link } from "@tanstack/react-router";
import type { Show } from "@/api";

export function Poster({ show }: { show: Show }) {
  return (
    <Link
      to="/show/$showId"
      params={{ showId: show.id }}
      className="poster"
      aria-label={`View ${show.title}`}
    >
      <img
        src={show.image}
        alt={`${show.title} cinematic poster`}
        width={512}
        height={1024}
        loading="lazy"
      />
      {show.badge && (
        <span
          className={`poster-badge ${show.badge === "TRENDING" ? "gold" : ""}`}
        >
          {show.badge}
        </span>
      )}
      <span className="poster-title">
        <small>TADKA4U ORIGINAL</small>
        {show.title}
      </span>
    </Link>
  );
}
