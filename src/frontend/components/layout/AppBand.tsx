import { Play, Apple } from "lucide-react";
import { toast } from "sonner";

export function AppBand() {
  return (
    <section className="app-band">
      <div>
        <h2>Big stories. Any screen.</h2>
        <p>Your next obsession is always a tap away. Get the Tadka4U app.</p>
      </div>
      <div className="app-downloads">
        <a
          className="store-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            toast.info("Tadka4U Google Play download link coming soon!");
          }}
          aria-label="Google Play download coming soon"
        >
          <Play />
          <span>
            <small>GET IT ON</small>
            <strong>Google Play</strong>
          </span>
        </a>
        <a
          className="store-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            toast.info("Tadka4U App Store download link coming soon!");
          }}
          aria-label="App Store download coming soon"
        >
          <Apple />
          <span>
            <small>DOWNLOAD ON THE</small>
            <strong>App Store</strong>
          </span>
        </a>
      </div>
    </section>
  );
}
