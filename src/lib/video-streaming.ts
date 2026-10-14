import type { Show } from "./catalog";

/**
 * High-speed Google Cloud / Global Edge CDN streaming video presets.
 * Optimized for instant start (moov atom at start) and HTTP 206 Partial Content Range streaming.
 */
export const GOOGLE_CLOUD_DEFAULT_STREAMS = [
  {
    id: "gcs-ep1",
    label: "Episode 1 · Story Premiere (Google Cloud / CDN)",
    url: "https://cdn.jsdelivr.net/gh/bower-media-samples/big-buck-bunny-480p-30s@master/video.mp4",
    duration: "00:30",
    quality: "1080p HD",
  },
  {
    id: "gcs-ep2",
    label: "Episode 2 · Rising Tension (Google Cloud / CDN)",
    url: "https://cdn.jsdelivr.net/gh/mediaelement/mediaelement-files@master/big_buck_bunny.mp4",
    duration: "00:45",
    quality: "1080p HD",
  },
  {
    id: "gcs-ep3",
    label: "Episode 3 · The Confrontation (Google Cloud / CDN)",
    url: "https://cdn.jsdelivr.net/gh/bower-media-samples/big-buck-bunny-480p-30s@master/video.mp4",
    duration: "00:30",
    quality: "1080p HD",
  },
  {
    id: "gcs-ep4",
    label: "Episode 4 · Season Finale (Google Cloud / CDN)",
    url: "https://cdn.jsdelivr.net/gh/mediaelement/mediaelement-files@master/big_buck_bunny.mp4",
    duration: "00:45",
    quality: "1080p HD",
  },
];

/**
 * Returns the video stream URL for a given show and episode index.
 * Respects custom show.videoUrl if configured, otherwise falls back
 * to a high-speed Google Cloud CDN demo stream.
 */
export function getEpisodeVideoUrl(
  show: Show,
  episodeNumber: number = 1,
): string {
  if (show.videoUrl && show.videoUrl.trim()) {
    // If user specified an episode placeholder like {ep} or {episode}
    if (show.videoUrl.includes("{ep}") || show.videoUrl.includes("{episode}")) {
      return show.videoUrl
        .replace("{ep}", String(episodeNumber))
        .replace("{episode}", String(episodeNumber));
    }
    return show.videoUrl.trim();
  }

  // Use preset based on episode index (0-indexed)
  const idx =
    Math.max(0, episodeNumber - 1) % GOOGLE_CLOUD_DEFAULT_STREAMS.length;
  return (
    GOOGLE_CLOUD_DEFAULT_STREAMS[idx]?.url ??
    GOOGLE_CLOUD_DEFAULT_STREAMS[0]!.url
  );
}

/**
 * Checks if a given URL is hosted on Google Cloud Storage.
 */
export function isGoogleCloudStorageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "storage.googleapis.com" ||
      parsed.hostname === "commondatastorage.googleapis.com" ||
      parsed.hostname === "storage.cloud.google.com" ||
      parsed.hostname.endsWith(".storage.googleapis.com")
    );
  } catch {
    return false;
  }
}

/**
 * Sample Google Cloud Storage CORS JSON for ultra-smooth web video streaming.
 */
export const GCS_CORS_JSON = `[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Range",
      "Accept-Ranges",
      "Content-Range",
      "Origin",
      "Access-Control-Allow-Origin"
    ],
    "maxAgeSeconds": 3600
  }
]`;

/**
 * GCS CLI command to set CORS on a bucket.
 */
export const GCS_SET_CORS_CMD = `gcloud storage buckets update gs://YOUR_BUCKET_NAME --cors-file=cors.json`;
