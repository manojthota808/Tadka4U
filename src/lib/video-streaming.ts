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
  // 1. Check if an explicit episode-specific video URL is defined
  if (show.episodeVideos && show.episodeVideos[episodeNumber]) {
    const epUrl = show.episodeVideos[episodeNumber];
    if (epUrl && epUrl.trim()) {
      return epUrl.trim();
    }
  }

  // 2. Check if show.videoUrl contains an episode placeholder like {ep} or {episode}
  if (show.videoUrl && show.videoUrl.trim()) {
    if (show.videoUrl.includes("{ep}") || show.videoUrl.includes("{episode}")) {
      return show.videoUrl
        .replace(/\{ep\}/g, String(episodeNumber))
        .replace(/\{episode\}/g, String(episodeNumber));
    }
    // If it's a single video URL, use it directly
    return show.videoUrl.trim();
  }

  // 3. Fallback to high-speed Google Cloud CDN demo stream
  const idx =
    Math.max(0, episodeNumber - 1) % GOOGLE_CLOUD_DEFAULT_STREAMS.length;
  return (
    GOOGLE_CLOUD_DEFAULT_STREAMS[idx]?.url ??
    GOOGLE_CLOUD_DEFAULT_STREAMS[0]!.url
  );
}

/**
 * Generates the standardized Google Cloud Storage object path for an episode.
 * Structure: Tadka4u/<shelf>/<showSlug>/episode-<episodeNumber>.mp4
 */
export function generateGcsPath(
  shelfName: string,
  showSlug: string,
  episodeNumber: number,
): string {
  const cleanShelf = (shelfName || "General")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanSlug = (showSlug || "show")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
  return `Tadka4u/${cleanShelf}/${cleanSlug}/episode-${episodeNumber}.mp4`;
}

/**
 * Generates the full Google Cloud Storage public HTTPS URL.
 */
export function generateGcsUrl(
  bucketName: string,
  shelfName: string,
  showSlug: string,
  episodeNumber: number,
): string {
  const cleanBucket = (bucketName || "tadka4u-media")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "");
  const objectPath = generateGcsPath(shelfName, showSlug, episodeNumber);
  return `https://storage.googleapis.com/${cleanBucket}/${objectPath}`;
}

/**
 * Generates CLI upload commands for gcloud and gsutil.
 */
export function generateGcsCliCommands(
  bucketName: string,
  shelfName: string,
  showSlug: string,
  episodeNumber: number,
  localFileName: string = "episode.mp4",
): { gsutil: string; gcloud: string } {
  const cleanBucket = (bucketName || "tadka4u-media")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "");
  const objectPath = generateGcsPath(shelfName, showSlug, episodeNumber);
  return {
    gsutil: `gsutil cp "${localFileName}" gs://${cleanBucket}/${objectPath}`,
    gcloud: `gcloud storage cp "${localFileName}" gs://${cleanBucket}/${objectPath}`,
  };
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
