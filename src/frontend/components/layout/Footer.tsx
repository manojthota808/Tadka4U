import { Link } from "@tanstack/react-router";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand-wrap">
        <Brand />
        <p className="footer-credit">
          Site designed and developed by{" "}
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
