import { Link } from "@tanstack/react-router";

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Tadka4U home">
      <span className="brand-word">TADKA</span>
      <span className="brand-word">4U</span>
    </Link>
  );
}
