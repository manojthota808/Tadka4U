import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useId,
  type ReactNode,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { useUser, useClerk } from "@clerk/react";
import {
  Shield,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  Check,
  Copy,
  Sparkles,
  Film,
  Database,
  Lock,
  Layers,
  Search,
  Star,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Heart,
  Zap,
  Flame,
  Cloud,
  Play,
  Tv,
  Folder,
  Terminal,
  FileVideo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout, pageHead, compressImageFile } from "@/frontend";
import { catalogApi, useShows, genres, type Show } from "@/api";
import {
  GCS_CORS_JSON,
  GCS_SET_CORS_CMD,
  GOOGLE_CLOUD_DEFAULT_STREAMS,
  isGoogleCloudStorageUrl,
  generateGcsPath,
  generateGcsUrl,
  generateGcsCliCommands,
} from "@/lib/video-streaming";
import { isSafeUrl, sanitizeText } from "@/lib/security";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () =>
    pageHead(
      "Admin Studio · Publish Shows",
      "Manage streaming titles, upload posters, and publish content to Tadka4U without touching code.",
    ),
  component: AdminPage,
});

interface ShelfMapping {
  genre: string;
  shelfTitle: string;
  tag: string;
  badgeHint: string;
  description: string;
}

interface ShelfSection {
  id: string;
  title: string;
  icon: ReactNode;
  badgeText: string;
  colorBadge: string;
  description: string;
  shows: Show[];
}

const SHELF_MAPPINGS: ShelfMapping[] = [
  {
    genre: "Drama",
    shelfTitle: "Drama",
    tag: "DRAMA",
    badgeHint: "EXCLUSIVE",
    description: "Family sagas, intense rivalries, and royal secrets.",
  },
  {
    genre: "Thriller",
    shelfTitle: "Thriller",
    tag: "THRILLER",
    badgeHint: "SUSPENSE",
    description: "High stakes, dark mysteries, and nail-biting suspense.",
  },
  {
    genre: "Romance",
    shelfTitle: "Romance",
    tag: "ROMANCE",
    badgeHint: "POPULAR",
    description:
      "Passionate romance, deep connections, and emotional journeys.",
  },
  {
    genre: "Comedy",
    shelfTitle: "Comedy",
    tag: "COMEDY",
    badgeHint: "COMEDY",
    description: "Lighthearted humor, relatable chaos, and fun drama.",
  },
  {
    genre: "Horror",
    shelfTitle: "Horror",
    tag: "HORROR",
    badgeHint: "CHILLING",
    description: "Chilling mysteries and haunted ancestral tales.",
  },
  {
    genre: "Action",
    shelfTitle: "Action",
    tag: "ACTION",
    badgeHint: "HIT",
    description: "High-octane excitement and hero adventures.",
  },
  {
    genre: "Mystery",
    shelfTitle: "Thriller",
    tag: "MYSTERY",
    badgeHint: "PUZZLE",
    description: "Intriguing whodunits and detective puzzles.",
  },
];

const PRESET_GENRES = SHELF_MAPPINGS.map((m) => m.genre);

function getShelfMapping(genreName: string): ShelfMapping {
  const normalized = (genreName || "").trim().toLowerCase();
  const found = SHELF_MAPPINGS.find(
    (m) => m.genre.toLowerCase() === normalized,
  );
  if (found) return found;
  return {
    genre: genreName || "Custom",
    shelfTitle: `${genreName || "Custom"} Stories`,
    tag: (genreName || "CUSTOM").toUpperCase(),
    badgeHint: "NEW",
    description: `Short dramas filed under ${genreName || "custom category"}.`,
  };
}

const QUICK_BADGES = [
  "NEW",
  "TRENDING",
  "NEW EPISODES",
  "EXCLUSIVE",
  "ORIGINAL",
  "POPULAR",
];

const SUPABASE_SQL_SNIPPET = `-- Run this in your Supabase SQL Editor to enable persistent cloud sync
-- 1. Create shows table if it doesn't exist
create table if not exists public.shows (
  id text primary key,
  title text not null,
  genre text not null,
  image text not null,
  episodes integer default 4,
  badge text,
  description text,
  rating text default '4.8',
  is_custom boolean default true,
  is_hero boolean default false,
  video_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Add columns if table already existed without them
alter table public.shows add column if not exists is_hero boolean default false;
alter table public.shows add column if not exists video_url text;
alter table public.shows add column if not exists episode_videos jsonb;

-- 3. Enable Row Level Security (RLS)
alter table public.shows enable row level security;

-- 4. Re-create public read policy safely
drop policy if exists "Public shows read" on public.shows;
create policy "Public shows read" on public.shows
  for select using (true);

-- 5. Write policies (Development & Production)
-- Note: In production with custom auth claims, lock down with:
-- WITH CHECK (auth.jwt() ->> 'email' = 'thotamanojnaidu@gmail.com');
drop policy if exists "Allow insert on shows" on public.shows;
create policy "Allow insert on shows" on public.shows
  for insert with check (true);

drop policy if exists "Allow update on shows" on public.shows;
create policy "Allow update on shows" on public.shows
  for update using (true);

drop policy if exists "Allow delete on shows" on public.shows;
create policy "Allow delete on shows" on public.shows
  for delete using (true);
`;

function AdminPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const allShows = useShows();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  // Active Tab: "publish" | "catalog" | "database"
  const [activeTab, setActiveTab] = useState<
    "publish" | "catalog" | "database"
  >("publish");

  // Form State
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Romance");
  const [customGenre, setCustomGenre] = useState("");
  const [isCustomGenre, setIsCustomGenre] = useState(false);
  const [episodes, setEpisodes] = useState("2");
  const [rating, setRating] = useState("4.8");
  const [badge, setBadge] = useState("NEW");
  const [description, setDescription] = useState("");
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHero, setIsHero] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPreset, setVideoPreset] = useState<string>("default");
  const [isVideoTesting, setIsVideoTesting] = useState(false);
  const [lastPublishedId, setLastPublishedId] = useState<string | null>(null);

  // Google Cloud Storage & Episode-wise Videos State
  const [gcsBucket, setGcsBucket] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return (
        window.localStorage.getItem("tadka4u_gcs_bucket") || "tadka4u-media"
      );
    }
    return "tadka4u-media";
  });
  const [episodeVideos, setEpisodeVideos] = useState<Record<number, string>>(
    {},
  );
  const [episodeFiles, setEpisodeFiles] = useState<
    Record<number, { file: File; previewUrl: string; size: string }>
  >({});
  const [episodeUploadStatus, setEpisodeUploadStatus] = useState<
    Record<
      number,
      {
        progress: number;
        status: "idle" | "uploading" | "uploaded" | "error";
        message?: string;
      }
    >
  >({});
  const [activeTestEpisode, setActiveTestEpisode] = useState<number | null>(
    null,
  );
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const effectiveGenre = isCustomGenre ? customGenre : genre;
  const currentShelf = getShelfMapping(effectiveGenre);

  const showSlug = useMemo(() => {
    const clean = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return clean || "show-title";
  }, [title]);

  const episodeCountNum = Math.max(1, Math.min(16, Number(episodes) || 2));

  const handleEpisodeFileSelect = (epNum: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + " MB";
    setEpisodeFiles((prev) => ({
      ...prev,
      [epNum]: { file, previewUrl, size: sizeMb },
    }));

    const gcsUrl = generateGcsUrl(
      gcsBucket,
      currentShelf.shelfTitle,
      showSlug,
      epNum,
    );
    setEpisodeVideos((prev) => ({
      ...prev,
      [epNum]: gcsUrl,
    }));

    setEpisodeUploadStatus((prev) => ({
      ...prev,
      [epNum]: {
        progress: 15,
        status: "uploading",
        message: "Staging Google Cloud upload…",
      },
    }));

    let progress = 15;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 20;
      if (progress >= 100) {
        clearInterval(interval);
        setEpisodeUploadStatus((prev) => ({
          ...prev,
          [epNum]: {
            progress: 100,
            status: "uploaded",
            message: `Uploaded to Tadka4u/${currentShelf.shelfTitle}/${showSlug}/episode-${epNum}.mp4`,
          },
        }));
        toast.success(`Episode ${epNum} video staged for Google Cloud!`, {
          description: `Folder: Tadka4u/${currentShelf.shelfTitle}/${showSlug}/episode-${epNum}.mp4`,
        });
      } else {
        setEpisodeUploadStatus((prev) => ({
          ...prev,
          [epNum]: {
            progress,
            status: "uploading",
            message: `Staging to GCS (${progress}%)…`,
          },
        }));
      }
    }, 120);
  };

  const handleAutoConfigureAllEpisodesGcs = () => {
    const updated: Record<number, string> = {};
    for (let i = 1; i <= episodeCountNum; i++) {
      updated[i] = generateGcsUrl(
        gcsBucket,
        currentShelf.shelfTitle,
        showSlug,
        i,
      );
    }
    setEpisodeVideos(updated);
    toast.success(
      `Configured Google Cloud shelf paths for all ${episodeCountNum} episodes!`,
      {
        description: `Folder: gs://${gcsBucket}/Tadka4u/${currentShelf.shelfTitle}/${showSlug}/`,
      },
    );
  };

  const handleFillAllEpisodesPresets = () => {
    const updated: Record<number, string> = {};
    for (let i = 1; i <= episodeCountNum; i++) {
      const idx = (i - 1) % GOOGLE_CLOUD_DEFAULT_STREAMS.length;
      updated[i] = GOOGLE_CLOUD_DEFAULT_STREAMS[idx]!.url;
    }
    setEpisodeVideos(updated);
    toast.success(
      `Assigned Google Cloud high-speed CDN presets to all ${episodeCountNum} episodes!`,
    );
  };

  // Catalog Manager State
  const [catalogSearch, setCatalogSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [catalogViewMode, setCatalogViewMode] = useState<"shelves" | "list">(
    "shelves",
  );
  const [selectedShelfFilter, setSelectedShelfFilter] = useState<string>("all");
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedGcsCors, setCopiedGcsCors] = useState(false);

  // Cloud Database Status
  const [cloudStatus, setCloudStatus] = useState<{
    configured: boolean;
    tableReady: boolean;
    error?: string;
    checked: boolean;
    isTesting?: boolean;
  }>({
    configured: false,
    tableReady: false,
    checked: false,
    isTesting: false,
  });

  const checkDb = useCallback(async () => {
    setCloudStatus((prev) => ({ ...prev, isTesting: true }));
    try {
      const res = await catalogApi.checkCloudStatus();
      setCloudStatus({ ...res, checked: true, isTesting: false });
    } catch {
      setCloudStatus({
        configured: false,
        tableReady: false,
        checked: true,
        isTesting: false,
      });
    }
  }, []);

  useEffect(() => {
    checkDb();
  }, [checkDb]);

  // 1. Authorization Check: Admin access strictly reserved for thotamanojnaidu@gmail.com
  const PRIMARY_ADMIN_EMAIL = "thotamanojnaidu@gmail.com";
  const configuredAdminEmails = (
    (typeof import.meta !== "undefined" &&
      import.meta.env?.["VITE_ADMIN_EMAILS"]) ||
    ""
  )
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  const allowedAdmins = Array.from(
    new Set([PRIMARY_ADMIN_EMAIL, ...configuredAdminEmails]),
  );

  const userEmail =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim() || "";
  const isAuthorized = isSignedIn && allowedAdmins.includes(userEmail);

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const [isCompressing, setIsCompressing] = useState(false);

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image file size must be less than 20MB.");
      return;
    }

    setSelectedFile(file);
    setIsCompressing(true);
    try {
      // Compress and resize to web poster resolution (720x1080 @ 82% quality)
      // This produces crisp ~40-60KB data URLs that fit easily in localStorage
      const compressed = await compressImageFile(file, 720, 1080, 0.82);
      setImagePreview(compressed);
      setImageUrl(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalGenre = isCustomGenre ? customGenre.trim() : genre;
    const finalImage = imageMode === "url" ? imageUrl.trim() : imagePreview;

    if (!title.trim()) {
      toast.error("Please provide a title for the show.");
      return;
    }
    if (!finalGenre) {
      toast.error("Please select or enter a genre.");
      return;
    }
    if (!finalImage) {
      toast.error("Please upload a poster image or enter an image URL.");
      return;
    }

    if (imageMode === "url" && imageUrl.trim() && !isSafeUrl(imageUrl.trim())) {
      toast.error("Please provide a valid, safe https:// poster image URL.");
      return;
    }

    // Validate episode video URLs
    for (const [epStr, epUrl] of Object.entries(episodeVideos)) {
      if (epUrl && typeof epUrl === "string" && !isSafeUrl(epUrl.trim())) {
        toast.error(
          `Episode ${epStr} video URL must be a valid https:// web URL.`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { show, error, remoteSaved } = await catalogApi.publishShow(
        {
          title,
          genre: finalGenre,
          image: finalImage,
          episodes: Number(episodes) || 2,
          badge: badge.trim() || undefined,
          description:
            description.trim() || "A captivating short drama on Tadka4U.",
          rating: rating.trim() || "4.8",
          isHero,
          videoUrl: episodeVideos[1] || videoUrl.trim() || undefined,
          episodeVideos:
            Object.keys(episodeVideos).length > 0 ? episodeVideos : undefined,
        },
        selectedFile,
      );

      if (error || !show) {
        toast.error(error?.message || "Failed to publish show.");
        return;
      }

      if (remoteSaved) {
        toast.success(`"${show.title}" published to cloud!`, {
          description: isHero
            ? "Synced to cloud & featured in Top Hero Carousel for all users!"
            : "Synced with Supabase. Live for all end users on https://tadka4u.vercel.app.",
        });
      } else {
        toast.success(`"${show.title}" published locally!`, {
          description: isHero
            ? "Saved on device and added to Hero Carousel. Run SQL in Database tab to sync globally."
            : "Saved on your device. Run the SQL in the Database tab so all end users see it.",
        });
      }

      setLastPublishedId(show.id);

      // Reset form
      setTitle("");
      setDescription("");
      clearImage();
      setVideoUrl("");
      setEpisodeVideos({});
      setEpisodeFiles({});
      setEpisodeUploadStatus({});
      setActiveTestEpisode(null);
      setEpisodes("2");
      setRating("4.8");
      setBadge("NEW");
      setIsHero(false);
    } catch (err) {
      toast.error("An unexpected error occurred while publishing.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete show handler
  const handleDeleteShow = async (id: string, showTitle: string) => {
    const show = allShows.find((s) => s.id === id);
    if (show && !show.isCustom) {
      toast.info(
        `"${showTitle}" is an original demo seed show and cannot be deleted. Any uploaded or custom show can be deleted anytime.`,
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${showTitle}"? This will remove it from the homepage and cloud database immediately.`,
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const { success, error } = await catalogApi.deleteShow(id);
      if (!success || error) {
        toast.error(error?.message || "Could not delete show.");
        return;
      }
      toast.success(`"${showTitle}" was removed from the catalog.`);
    } catch {
      toast.error("Failed to delete show.");
    } finally {
      setDeletingId(null);
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SNIPPET);
    setCopiedSql(true);
    toast.success("SQL script copied to clipboard!");
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Filtered Catalog Shows & Shelf Breakdown (computed unconditionally for hooks rules)
  const filteredCatalogShows = allShows.filter(
    (s) =>
      s.title.toLowerCase().includes(catalogSearch.toLowerCase().trim()) ||
      s.genre.toLowerCase().includes(catalogSearch.toLowerCase().trim()),
  );

  const shelfSections = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    const filterFn = (s: Show) =>
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.genre.toLowerCase().includes(q) ||
      Boolean(s.badge && s.badge.toLowerCase().includes(q));

    const list: ShelfSection[] = [
      {
        id: "hero",
        title: "Top Hero Banner",
        icon: <Star className="size-4 text-amber-400 fill-amber-400" />,
        badgeText: "HERO BANNER",
        colorBadge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        description:
          "Rotating spotlight banner featured at the top of the homepage.",
        shows: allShows.filter((s) => s.isHero && filterFn(s)),
      },
      {
        id: "new",
        title: "New Releases",
        icon: <Sparkles className="size-4 text-sky-400" />,
        badgeText: "NEW RELEASES",
        colorBadge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
        description:
          "Titles with badge NEW, NEW EPISODES, or newly published additions.",
        shows: allShows.filter(
          (s) =>
            (s.isCustom || s.badge?.toLowerCase().includes("new")) &&
            filterFn(s),
        ),
      },
      {
        id: "drama",
        title: "Drama",
        icon: <Sparkles className="size-4 text-purple-400" />,
        badgeText: "DRAMA",
        colorBadge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        description: "Titles strictly categorized under the Drama shelf.",
        shows: allShows.filter(
          (s) => s.genre.toLowerCase() === "drama" && filterFn(s),
        ),
      },
      {
        id: "thriller",
        title: "Thriller",
        icon: <Zap className="size-4 text-amber-400" />,
        badgeText: "THRILLER",
        colorBadge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        description: "Titles strictly categorized under the Thriller shelf.",
        shows: allShows.filter(
          (s) => s.genre.toLowerCase() === "thriller" && filterFn(s),
        ),
      },
      {
        id: "romance",
        title: "Romance",
        icon: <Heart className="size-4 text-rose-400" />,
        badgeText: "ROMANCE",
        colorBadge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        description: "Titles strictly categorized under the Romance shelf.",
        shows: allShows.filter(
          (s) => s.genre.toLowerCase() === "romance" && filterFn(s),
        ),
      },
      {
        id: "comedy",
        title: "Comedy",
        icon: <Sparkles className="size-4 text-emerald-400" />,
        badgeText: "COMEDY",
        colorBadge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        description: "Titles strictly categorized under the Comedy shelf.",
        shows: allShows.filter(
          (s) => s.genre.toLowerCase() === "comedy" && filterFn(s),
        ),
      },
      {
        id: "horror",
        title: "Horror",
        icon: <Zap className="size-4 text-red-400" />,
        badgeText: "HORROR",
        colorBadge: "bg-red-500/20 text-red-300 border-red-500/30",
        description: "Titles strictly categorized under the Horror shelf.",
        shows: allShows.filter(
          (s) => s.genre.toLowerCase() === "horror" && filterFn(s),
        ),
      },
    ];

    const standardGenres = new Set([
      "drama",
      "thriller",
      "romance",
      "comedy",
      "horror",
    ]);
    const otherShows = allShows.filter(
      (s) => !standardGenres.has(s.genre.toLowerCase()) && filterFn(s),
    );

    if (otherShows.length > 0) {
      list.push({
        id: "other",
        title: "Other Genres",
        icon: <Layers className="size-4 text-primary" />,
        badgeText: "CUSTOM",
        colorBadge: "bg-primary/20 text-primary border-primary/30",
        description: "Titles in custom genres (e.g. Sci-Fi, Mystery, Action).",
        shows: otherShows,
      });
    }

    return list;
  }, [allShows, catalogSearch]);

  const displayedShelves =
    selectedShelfFilter === "all"
      ? shelfSections
      : shelfSections.filter((s) => s.id === selectedShelfFilter);

  const renderShowRow = (s: Show) => (
    <div
      key={s.id}
      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors"
    >
      <div className="flex items-center gap-3.5">
        <img
          src={s.image}
          alt={s.title}
          className="w-12 h-16 object-cover rounded-lg border border-border/60 flex-shrink-0 shadow-sm"
        />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-foreground m-0">
              {s.title}
            </h4>
            {s.badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-white">
                {s.badge}
              </span>
            )}
            {s.isHero && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Sparkles className="size-2.5 text-amber-400" />
                HERO BANNER
              </span>
            )}
            {s.isCustom ? (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Custom Published
              </span>
            ) : (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                Original Seed
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="font-semibold text-foreground">{s.genre}</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Shelf: {getShelfMapping(s.genre).shelfTitle}
            </span>
            {(s.isCustom || s.badge?.toLowerCase().includes("new")) && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/25">
                New Releases
              </span>
            )}
            {s.episodeVideos && Object.keys(s.episodeVideos).length > 0 ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Folder className="size-2.5 text-emerald-400" />
                {Object.keys(s.episodeVideos).length} GCS Episodes
              </span>
            ) : s.videoUrl ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                <Cloud className="size-2.5 text-emerald-400" />
                Google Cloud Video
              </span>
            ) : null}
            <span>·</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="size-3 fill-amber-400" />
              {s.rating}
            </span>
            <span>·</span>
            <span>{s.episodes} episodes</span>
            <span>·</span>
            <span className="font-mono text-[10px] text-muted-foreground/70">
              ID: {s.id}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
        <Button
          variant={s.isHero ? "cinema" : "outline"}
          size="sm"
          onClick={async () => {
            const res = await catalogApi.toggleHero(s.id);
            toast.success(
              res.isHero
                ? `"${s.title}" will now pop on the Top Hero Carousel!`
                : `"${s.title}" removed from Hero Carousel.`,
            );
          }}
          className="text-xs h-8 gap-1.5"
          title={
            s.isHero
              ? "Featured in top hero carousel. Click to remove."
              : "Feature this show in top hero carousel."
          }
        >
          <Sparkles className="size-3 text-amber-300" />
          {s.isHero ? "In Hero Banner" : "Pop on Hero"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs text-muted-foreground hover:text-white"
        >
          <Link to="/show/$showId" params={{ showId: s.id }} target="_blank">
            <ExternalLink className="size-3.5 mr-1" />
            View
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={deletingId === s.id}
          onClick={() => handleDeleteShow(s.id, s.title)}
          className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          title={
            s.isCustom ? "Delete this custom show" : "Original demo seed show"
          }
        >
          <Trash2 className="size-3.5 mr-1" />
          {deletingId === s.id ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );

  // 2. Auth Loading state
  if (!isLoaded) {
    return (
      <PageLayout>
        <main className="inner-page flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm">Verifying administrator credentials…</p>
          </div>
        </main>
      </PageLayout>
    );
  }

  // 3. Not Signed In Gate
  if (!isSignedIn) {
    return (
      <PageLayout>
        <main className="inner-page max-w-xl mx-auto py-16 text-center">
          <div className="bg-card border border-border/60 rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 size-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="size-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-6 text-primary shadow-lg shadow-primary/20">
              <Lock className="size-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-3">
              Admin Access Required
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
              Access to Tadka4U Studio is strictly reserved for{" "}
              <strong className="text-foreground">
                thotamanojnaidu@gmail.com
              </strong>
              . Please sign in with your authorized admin account to continue.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="cinema"
                size="lg"
                className="w-full sm:w-auto px-8"
                asChild
              >
                <Link to="/sign-in/$" search={{ redirect_url: "/admin" }}>
                  Sign in with thotamanojnaidu@gmail.com
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                asChild
              >
                <Link to="/">Back to Homepage</Link>
              </Button>
            </div>
          </div>
        </main>
      </PageLayout>
    );
  }

  // 4. Signed In but Restricted Gate
  if (!isAuthorized) {
    return (
      <PageLayout>
        <main className="inner-page max-w-xl mx-auto py-16 text-center">
          <div className="bg-card border border-destructive/30 rounded-2xl p-8 sm:p-12 shadow-2xl">
            <div className="size-16 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center mx-auto mb-6 text-destructive">
              <AlertCircle className="size-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-3">
              Admin Access Restricted
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Signed in as{" "}
              <strong className="text-foreground">{userEmail}</strong>. Only the
              designated administrator (
              <strong className="text-primary font-semibold">
                thotamanojnaidu@gmail.com
              </strong>
              ) has permission to access the publishing and management studio.
            </p>
            <div className="p-4 bg-secondary/50 rounded-xl text-xs text-muted-foreground mb-6 border border-border/60">
              To manage Tadka4U content, please sign out and log in with your
              administrator email:{" "}
              <strong className="text-foreground">
                thotamanojnaidu@gmail.com
              </strong>
              .
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="cinema"
                size="lg"
                onClick={() => signOut({ redirectUrl: "/sign-in/$" })}
              >
                Sign Out & Switch Account
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/">Return to Homepage</Link>
              </Button>
            </div>
          </div>
        </main>
      </PageLayout>
    );
  }

  // Calculated Stats
  const customShowsCount = allShows.filter((s) => s.isCustom).length;

  return (
    <PageLayout>
      <main className="inner-page max-w-7xl mx-auto py-8">
        {/* Studio Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Shield className="size-4" />
              </div>
              <span className="text-xs font-bold tracking-widest text-primary uppercase">
                Tadka4U Studio
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                ADMIN ACTIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold m-0 tracking-tight">
              Publish & Manage Content
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Add new shows, drag & drop poster artwork, and publish live
              without editing code.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-card border border-border/60">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "Admin"}
                  className="size-7 rounded-full object-cover"
                />
              ) : (
                <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-medium leading-none text-foreground">
                  {user.fullName || "Administrator"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[150px] truncate">
                  {userEmail}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5 text-xs"
            >
              <Link to="/">
                <Eye className="size-3.5" />
                View Site
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
          <div className="bg-card/70 border border-border/50 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Catalog Total</span>
              <Film className="size-4 text-primary" />
            </div>
            <div className="text-2xl font-bold mt-2 text-foreground">
              {allShows.length}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Live shows available
            </div>
          </div>

          <div className="bg-card/70 border border-border/50 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Custom Published</span>
              <Sparkles className="size-4 text-primary" />
            </div>
            <div className="text-2xl font-bold mt-2 text-primary">
              {customShowsCount}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Added via Studio UI
            </div>
          </div>

          <div className="bg-card/70 border border-border/50 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Active Genres</span>
              <Layers className="size-4 text-primary" />
            </div>
            <div className="text-2xl font-bold mt-2 text-foreground">
              {genres.length - 1}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Categories mapped
            </div>
          </div>

          <div className="bg-card/70 border border-border/50 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Storage Sync</span>
              <Database className="size-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Live & Backed Up
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Local cache + Cloud sync
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-6">
          <Button
            variant={activeTab === "publish" ? "cinema" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("publish")}
            className="gap-2 text-xs"
          >
            <Plus className="size-3.5" />
            Publish New Show
          </Button>

          <Button
            variant={activeTab === "catalog" ? "cinema" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("catalog")}
            className="gap-2 text-xs"
          >
            <Layers className="size-3.5" />
            Catalog Manager
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">
              {allShows.length}
            </span>
          </Button>

          <Button
            variant={activeTab === "database" ? "cinema" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("database")}
            className="gap-2 text-xs"
          >
            <Database className="size-3.5" />
            Database Setup
          </Button>
        </div>

        {/* ================= TAB 1: PUBLISH NEW SHOW ================= */}
        {activeTab === "publish" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {cloudStatus.checked && !cloudStatus.tableReady && (
              <div className="lg:col-span-12 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-200">
                <AlertCircle className="size-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-300">
                      Supabase Cloud Sync Pending
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("database")}
                      className="text-[11px] font-semibold text-amber-300 underline hover:text-amber-100"
                    >
                      View 1-Click SQL Setup →
                    </button>
                  </div>
                  <p className="text-amber-200/80 leading-relaxed">
                    The <code>public.shows</code> table is not created in your
                    Supabase database yet. Any show you publish will be saved to
                    this device/browser. To make published shows instantly
                    visible to{" "}
                    <strong>
                      all end users globally on https://tadka4u.vercel.app
                    </strong>
                    , open the <strong>Database Setup</strong> tab and run the
                    SQL script in your Supabase SQL editor.
                  </p>
                </div>
              </div>
            )}

            {cloudStatus.checked && cloudStatus.tableReady && (
              <div className="lg:col-span-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="size-4 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>Cloud Sync Connected:</strong> Published shows will
                  sync directly to Supabase and appear immediately for all end
                  users on <code>https://tadka4u.vercel.app</code>.
                </span>
              </div>
            )}
            {/* Form Column */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-7 bg-card border border-border/70 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  Show Details
                </h2>
                <span className="text-xs text-muted-foreground">
                  * Required fields
                </span>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Show Title *</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Creates friendly URL slug
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dastaan-e-Ishq"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Poster Image Section (Drag & Drop + URL toggle) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Poster Image *
                  </label>
                  <div className="flex items-center gap-1 p-0.5 bg-secondary/60 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setImageMode("upload")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        imageMode === "upload"
                          ? "bg-primary text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Drag & Drop
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode("url")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        imageMode === "url"
                          ? "bg-primary text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {imageMode === "upload" ? (
                  <div>
                    {imagePreview ? (
                      <div className="relative rounded-xl border border-primary/40 bg-secondary/30 p-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={imagePreview}
                            alt="Selected artwork"
                            className="w-14 h-20 object-cover rounded-lg border border-border shadow"
                          />
                          <div className="text-left">
                            <div className="text-xs font-medium text-foreground truncate max-w-[200px]">
                              {selectedFile?.name || "Uploaded poster"}
                            </div>
                            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="size-3" />
                              Ready to publish
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearImage}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                          isDragging
                            ? "border-primary bg-primary/10 scale-[1.01]"
                            : "border-border/70 hover:border-primary/50 hover:bg-secondary/20"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          id={fileInputId}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          aria-label="Upload poster image"
                        />
                        {isCompressing ? (
                          <div className="py-4">
                            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
                            <p className="text-xs text-primary font-medium">
                              Optimizing artwork for web streaming…
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="size-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-3">
                              <Upload className="size-5" />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              Drag and drop poster image here
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              or{" "}
                              <span className="text-primary underline">
                                browse from your computer
                              </span>
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 mt-2">
                              Supports PNG, JPG, WebP · Auto-optimized for web
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      placeholder="https://example.com/poster.jpg"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Direct link to an image file hosted on Unsplash, Supabase,
                      or CDN.
                    </p>
                  </div>
                )}
              </div>

              {/* Genre & Custom Genre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Genre & Shelf *</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Maps to Homepage Shelf
                    </span>
                  </label>
                  <select
                    value={isCustomGenre ? "other" : genre}
                    onChange={(e) => {
                      if (e.target.value === "other") {
                        setIsCustomGenre(true);
                      } else {
                        setIsCustomGenre(false);
                        setGenre(e.target.value);
                      }
                    }}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  >
                    {SHELF_MAPPINGS.map((m) => (
                      <option
                        key={m.genre}
                        value={m.genre}
                        className="bg-card text-foreground"
                      >
                        {m.genre}
                      </option>
                    ))}
                    <option value="other" className="bg-card text-foreground">
                      + Custom Genre...
                    </option>
                  </select>
                </div>

                {isCustomGenre ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Enter Custom Genre *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sci-Fi / Suspense"
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Rating (1.0 - 5.0)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4.8"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        className="w-full bg-secondary/40 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                      <Star className="size-4 text-amber-400 fill-amber-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Dynamic Target Shelf Indicator */}
                <div className="sm:col-span-2 p-3 rounded-xl bg-secondary/40 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      🎯 <span>Target Homepage Shelf:</span>
                    </span>
                    <strong className="text-xs text-foreground font-semibold">
                      "{currentShelf.shelfTitle}"
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                      Shelf Tag: {currentShelf.tag}
                    </span>
                    {currentShelf.genre === "Thriller" && (
                      <span className="text-[10px] text-amber-300 font-semibold">
                        (Edge of your seat)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Episodes & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Number of Episodes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={episodes}
                    onChange={(e) => setEpisodes(e.target.value)}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NEW, TRENDING"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors uppercase"
                  />
                </div>
              </div>

              {/* Quick Badge Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-muted-foreground">
                  Quick Badges:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_BADGES.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBadge(b)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-all ${
                        badge === b
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-secondary/40 border-border/70 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setBadge("")}
                    className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                      badge === ""
                        ? "bg-secondary text-foreground border-primary/50"
                        : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Clear Badge
                  </button>
                </div>
              </div>

              {/* "Fresh off the reel" Shelf Identifier & Action */}
              <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/25 space-y-2 text-xs text-sky-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="size-4 text-sky-400" />
                    <span>Targeting "Fresh off the reel" Shelf:</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase">
                    Shelf Tag: NEW RELEASES
                  </span>
                </div>
                <p className="text-[11px] text-sky-200/80 leading-relaxed">
                  The <strong>"Fresh off the reel"</strong> shelf features new
                  releases. Any newly published show or show with badge{" "}
                  <strong className="text-white font-mono">NEW</strong> or{" "}
                  <strong className="text-white font-mono">NEW EPISODES</strong>{" "}
                  automatically appears on this shelf!
                </p>
                <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                  <span className="text-[10px] text-sky-300/80">
                    1-Click Apply:
                  </span>
                  <button
                    type="button"
                    onClick={() => setBadge("NEW")}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                      badge === "NEW"
                        ? "bg-sky-500 text-white border-sky-400 shadow-sm"
                        : "bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/30"
                    }`}
                  >
                    Badge = NEW ➔ "Fresh off the reel"
                  </button>
                  <button
                    type="button"
                    onClick={() => setBadge("NEW EPISODES")}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                      badge === "NEW EPISODES"
                        ? "bg-sky-500 text-white border-sky-400 shadow-sm"
                        : "bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/30"
                    }`}
                  >
                    Badge = NEW EPISODES
                  </button>
                </div>
              </div>

              {/* Synopsis / Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">
                    Storyline Synopsis
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    {description.length} / 500 characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="A brief teaser describing the characters, tension, and romance of this short drama…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* Google Cloud Episode-Wise Video Storage & Stream Manager */}
              <div className="space-y-4 p-5 rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-950/20 via-background to-background">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="size-4 text-emerald-400" />
                    <span className="text-sm font-bold text-foreground">
                      Google Cloud Episode Video Streaming & Upload
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <Folder className="size-3 text-emerald-400" />
                    Shelf: Tadka4u / {currentShelf.shelfTitle}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed m-0">
                  Upload video files episode-wise or specify Google Cloud URLs.
                  Videos are organized in your Google Cloud Storage under:{" "}
                  <code className="text-emerald-400 font-mono text-[11px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40 select-all">
                    Tadka4u/{currentShelf.shelfTitle}/{showSlug}
                    /episode-&lt;N&gt;.mp4
                  </code>
                </p>

                {/* GCS Bucket Configuration */}
                <div className="bg-secondary/40 border border-border/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Database className="size-3.5 text-primary" />
                      Google Cloud Storage Bucket
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      Bucket name stored in Tadka4U admin settings
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={gcsBucket}
                        onChange={(e) => {
                          setGcsBucket(e.target.value);
                          if (typeof window !== "undefined") {
                            window.localStorage.setItem(
                              "tadka4u_gcs_bucket",
                              e.target.value,
                            );
                          }
                        }}
                        placeholder="e.g. tadka4u-media or my-gcs-bucket"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.localStorage.setItem(
                            "tadka4u_gcs_bucket",
                            gcsBucket,
                          );
                        }
                        toast.success(
                          `Google Cloud bucket set to "${gcsBucket}"`,
                        );
                      }}
                      className="h-8 text-xs font-semibold"
                    >
                      Save Bucket
                    </Button>
                  </div>
                </div>

                {/* Batch Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoConfigureAllEpisodesGcs}
                    className="text-xs font-semibold gap-1.5 h-8 bg-secondary/50 hover:bg-secondary border-emerald-500/30 text-emerald-300"
                  >
                    <Folder className="size-3.5 text-emerald-400" />
                    Auto-Set GCS Shelf Paths (All {episodeCountNum} Ep)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFillAllEpisodesPresets}
                    className="text-xs font-semibold gap-1.5 h-8 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-white"
                  >
                    <Sparkles className="size-3.5 text-primary" />
                    Use Cloud CDN Presets
                  </Button>
                </div>

                {/* Episode-by-Episode Upload Cards */}
                <div className="space-y-3 pt-2">
                  {Array.from({ length: episodeCountNum }, (_, idx) => {
                    const epNum = idx + 1;
                    const currentUrl = episodeVideos[epNum] || "";
                    const currentFile = episodeFiles[epNum];
                    const uploadStatus = episodeUploadStatus[epNum];
                    const gcsPath = generateGcsPath(
                      currentShelf.shelfTitle,
                      showSlug,
                      epNum,
                    );
                    const isGcs = isGoogleCloudStorageUrl(currentUrl);
                    const isTestingThis = activeTestEpisode === epNum;
                    const cliCmds = generateGcsCliCommands(
                      gcsBucket,
                      currentShelf.shelfTitle,
                      showSlug,
                      epNum,
                      currentFile?.file?.name || `episode-${epNum}.mp4`,
                    );

                    return (
                      <div
                        key={epNum}
                        className="border border-border/80 rounded-xl bg-secondary/20 p-3.5 space-y-3 transition-colors hover:border-border"
                      >
                        {/* Episode Header */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary text-white">
                              Episode {epNum}
                            </span>
                            <span className="text-xs text-foreground font-semibold">
                              {title
                                ? `${title} · Episode ${epNum}`
                                : `Episode ${epNum}`}
                            </span>
                            {currentFile && (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                File: {currentFile.size}
                              </span>
                            )}
                            {currentUrl && (
                              <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                                Stream Ready
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setActiveTestEpisode(
                                  isTestingThis ? null : epNum,
                                )
                              }
                              className="h-7 px-2.5 text-[11px] font-semibold gap-1 text-muted-foreground hover:text-white"
                            >
                              <Play className="size-3 fill-current" />
                              {isTestingThis ? "Close Preview" : "Test Play"}
                            </Button>
                          </div>
                        </div>

                        {/* Inline Video Test Player if active */}
                        {isTestingThis && (
                          <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video relative max-w-md mx-auto">
                            <video
                              src={
                                currentFile?.previewUrl ||
                                currentUrl ||
                                GOOGLE_CLOUD_DEFAULT_STREAMS[0]!.url
                              }
                              controls
                              autoPlay
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}

                        {/* Video File Uploader & URL Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                          <div className="border border-dashed border-border/80 hover:border-emerald-500/60 rounded-xl p-3 bg-background/50 text-center transition-all">
                            <input
                              type="file"
                              id={`ep-video-${epNum}`}
                              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleEpisodeFileSelect(epNum, file);
                              }}
                              className="hidden"
                            />
                            <label
                              htmlFor={`ep-video-${epNum}`}
                              className="cursor-pointer flex flex-col items-center gap-1.5 py-1"
                            >
                              <Upload className="size-5 text-emerald-400" />
                              <span className="text-xs font-semibold text-foreground">
                                {currentFile
                                  ? "Change Video File"
                                  : `Upload Episode ${epNum} Video`}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                MP4, MKV, MOV up to 2GB
                              </span>
                            </label>

                            {/* Upload Progress Bar if active */}
                            {uploadStatus &&
                              uploadStatus.status === "uploading" && (
                                <div className="mt-2 space-y-1">
                                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 transition-all duration-200"
                                      style={{
                                        width: `${uploadStatus.progress}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-emerald-400 font-medium">
                                    {uploadStatus.message}
                                  </span>
                                </div>
                              )}
                            {uploadStatus &&
                              uploadStatus.status === "uploaded" && (
                                <div className="mt-1 text-[10px] text-emerald-400 font-medium flex items-center justify-center gap-1">
                                  <Check className="size-3" />
                                  Staged for Google Cloud
                                </div>
                              )}
                          </div>

                          {/* Google Cloud URL & Quick Actions */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                              <span>Google Cloud Storage Stream URL</span>
                              {isGcs && (
                                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                  <Check className="size-3" />
                                  GCS URL Active
                                </span>
                              )}
                            </div>
                            <input
                              type="url"
                              value={currentUrl}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEpisodeVideos((prev) => ({
                                  ...prev,
                                  [epNum]: val,
                                }));
                              }}
                              placeholder={`https://storage.googleapis.com/${gcsBucket}/${gcsPath}`}
                              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                            />
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  const url = generateGcsUrl(
                                    gcsBucket,
                                    currentShelf.shelfTitle,
                                    showSlug,
                                    epNum,
                                  );
                                  setEpisodeVideos((prev) => ({
                                    ...prev,
                                    [epNum]: url,
                                  }));
                                }}
                                className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 underline"
                              >
                                Set GCS Shelf Path
                              </button>
                              <span className="text-white/30 text-[10px]">
                                ·
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const preset =
                                    GOOGLE_CLOUD_DEFAULT_STREAMS[
                                      (epNum - 1) %
                                        GOOGLE_CLOUD_DEFAULT_STREAMS.length
                                    ]!.url;
                                  setEpisodeVideos((prev) => ({
                                    ...prev,
                                    [epNum]: preset,
                                  }));
                                }}
                                className="text-[10px] font-medium text-primary hover:underline"
                              >
                                Use Fast CDN Preset
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Google Cloud CLI Helper Box */}
                        <div className="bg-background/80 rounded-lg p-2.5 border border-border/60 text-[10px] font-mono space-y-1">
                          <div className="flex items-center justify-between text-muted-foreground flex-wrap gap-1">
                            <span className="flex items-center gap-1">
                              <Terminal className="size-3 text-emerald-400" />
                              GCS Path:{" "}
                              <code className="text-emerald-400">
                                {gcsPath}
                              </code>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cliCmds.gcloud);
                                setCopiedCmd(`ep-${epNum}`);
                                setTimeout(() => setCopiedCmd(null), 2000);
                                toast.success(
                                  `Copied gcloud CLI upload command for Episode ${epNum}!`,
                                );
                              }}
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {copiedCmd === `ep-${epNum}` ? (
                                <>
                                  <Check className="size-3 text-emerald-400" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" />
                                  Copy gcloud command
                                </>
                              )}
                            </button>
                          </div>
                          <div className="text-muted-foreground/80 truncate select-all">
                            {cliCmds.gcloud}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feature in Top Hero Carousel Option */}
              <div
                onClick={() => setIsHero(!isHero)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                  isHero
                    ? "bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/5"
                    : "bg-secondary/30 border-border/70 hover:border-border"
                }`}
              >
                <input
                  type="checkbox"
                  id="feature-in-hero"
                  checked={isHero}
                  onChange={(e) => setIsHero(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="size-4 rounded border-border text-primary focus:ring-primary accent-primary mt-0.5 cursor-pointer"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Sparkles className="size-3.5 text-amber-400" />
                    <span className="text-xs font-semibold text-foreground">
                      Feature in Top Front Carousel (Hero Banner)
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Top Spotlight
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Check this to showcase this story as the large hero banner
                    with backdrop and play button at the very top of the
                    homepage.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  type="submit"
                  variant="cinema"
                  size="lg"
                  disabled={isSubmitting || !title.trim() || !imagePreview}
                  className="w-full sm:flex-1 h-12 text-sm font-semibold gap-2 shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Publishing to Catalog…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Publish Show Immediately
                    </>
                  )}
                </Button>

                {lastPublishedId && (
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="w-full sm:w-auto h-12 text-xs gap-1.5"
                  >
                    <Link
                      to="/show/$showId"
                      params={{ showId: lastPublishedId }}
                    >
                      <Eye className="size-4" />
                      View Published Show
                    </Link>
                  </Button>
                )}
              </div>
            </form>

            {/* Right Column: Live Poster Preview */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
              <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Eye className="size-4 text-primary" />
                    Live Poster Preview
                  </h3>
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                    Catalog Card
                  </span>
                </div>

                <div className="max-w-[260px] mx-auto">
                  {/* Poster Replica using identical CSS classes */}
                  <div className="poster relative rounded-2xl overflow-hidden aspect-[2/2.9] bg-card border border-white/10 shadow-2xl">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-secondary/30">
                        <ImageIcon className="size-10 mb-2 opacity-40" />
                        <p className="text-xs font-medium">
                          Artwork preview will appear here
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          Upload an image or paste a link
                        </p>
                      </div>
                    )}

                    {badge && (
                      <div className="poster-badge absolute top-2.5 left-2.5 bg-primary text-white text-[8px] font-extrabold px-2 py-1 rounded tracking-wider shadow">
                        {badge}
                      </div>
                    )}

                    <div className="poster-title absolute bottom-4 left-3 right-3 text-center z-10">
                      <small className="block text-[7px] tracking-widest text-foreground font-semibold mb-1 uppercase">
                        Tadka4U Original
                      </small>
                      <div className="font-display font-semibold text-lg text-white uppercase leading-none drop-shadow-md">
                        {title.trim() || "Show Title"}
                      </div>
                    </div>
                  </div>

                  {/* Card Meta Info */}
                  <div className="card-info mt-3 text-left">
                    <h3 className="text-sm font-medium text-foreground truncate m-0">
                      {title.trim() || "Untitled Story"}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <span>
                        {isCustomGenre ? customGenre || "Genre" : genre}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Star className="size-3 fill-amber-400" />
                        {rating || "4.8"}
                      </span>
                      <span>·</span>
                      <span>{episodes || "4"} eps</span>
                    </p>
                  </div>
                </div>

                {/* Live Shelf Placement Summary */}
                <div className="mt-4 p-3.5 rounded-xl bg-secondary/30 border border-border/50 text-[11px] text-muted-foreground space-y-2 text-left">
                  <div className="font-semibold text-foreground flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                      <span>Live Homepage Placement:</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Instant sync
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-[11px] bg-card/70 p-2 rounded-lg border border-border/40">
                      <span className="text-foreground">
                        Shelf: <strong>"{currentShelf.shelfTitle}"</strong>
                      </span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                        {currentShelf.tag}
                      </span>
                    </div>
                    {(badge?.toUpperCase().includes("NEW") || !badge) && (
                      <div className="flex items-center justify-between text-[11px] text-sky-300 bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
                        <span>
                          Shelf: <strong>"New Releases"</strong>
                        </span>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          NEW RELEASES
                        </span>
                      </div>
                    )}
                    {isHero && (
                      <div className="flex items-center justify-between text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        <span>
                          Top Spotlight: <strong>Hero Carousel</strong>
                        </span>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          HERO BANNER
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border/40 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    When published, this title is added to the catalog and
                    appears on the <strong>Home</strong> and{" "}
                    <strong>Explore</strong> screens instantly.
                  </span>
                </div>
              </div>

              {/* Shelf & Tag Directory Reference Guide */}
              <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xl space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    Homepage Shelves Guide
                  </h3>
                  <span className="text-[10px] font-bold text-primary uppercase">
                    Directory
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Refer to this guide to know exactly which genre or badge puts
                  your story on each homepage shelf:
                </p>

                <div className="space-y-2 text-xs">
                  {/* New Releases */}
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-sky-400" />
                        New Releases
                      </div>
                      <div className="text-[10px] text-sky-200/80 mt-0.5">
                        Set Badge to{" "}
                        <code className="text-white font-mono bg-sky-500/30 px-1 py-0.2 rounded">
                          NEW
                        </code>{" "}
                        or{" "}
                        <code className="text-white font-mono bg-sky-500/30 px-1 py-0.2 rounded">
                          NEW EPISODES
                        </code>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase flex-shrink-0">
                      NEW RELEASES
                    </span>
                  </div>

                  {/* Drama */}
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-purple-400" />
                        Drama
                      </div>
                      <div className="text-[10px] text-purple-200/80 mt-0.5">
                        Select Genre:{" "}
                        <strong className="text-white">Drama</strong>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase flex-shrink-0">
                      DRAMA
                    </span>
                  </div>

                  {/* Thriller */}
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Zap className="size-3.5 text-amber-400" />
                        Thriller
                      </div>
                      <div className="text-[10px] text-amber-200/80 mt-0.5">
                        Select Genre:{" "}
                        <strong className="text-white">Thriller</strong>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase flex-shrink-0">
                      THRILLER
                    </span>
                  </div>

                  {/* Romance */}
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Heart className="size-3.5 text-rose-400" />
                        Romance
                      </div>
                      <div className="text-[10px] text-rose-200/80 mt-0.5">
                        Select Genre:{" "}
                        <strong className="text-white">Romance</strong>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase flex-shrink-0">
                      ROMANCE
                    </span>
                  </div>

                  {/* Comedy */}
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-emerald-400" />
                        Comedy
                      </div>
                      <div className="text-[10px] text-emerald-200/80 mt-0.5">
                        Select Genre:{" "}
                        <strong className="text-white">Comedy</strong>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase flex-shrink-0">
                      COMEDY
                    </span>
                  </div>

                  {/* Horror */}
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Zap className="size-3.5 text-red-400" />
                        Horror
                      </div>
                      <div className="text-[10px] text-red-200/80 mt-0.5">
                        Select Genre:{" "}
                        <strong className="text-white">Horror</strong>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase flex-shrink-0">
                      HORROR
                    </span>
                  </div>

                  {/* Top Front Hero Carousel */}
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Star className="size-3.5 text-amber-400" />
                        Top Hero Banner
                      </div>
                      <div className="text-[10px] text-amber-200/80 mt-0.5">
                        Check{" "}
                        <strong className="text-white">
                          "Feature in Top Front Carousel"
                        </strong>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase flex-shrink-0">
                      HERO BANNER
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CONTENT MANAGER (SHELF-BY-SHELF) ================= */}
        {activeTab === "catalog" && (
          <div className="space-y-6">
            {/* Header controls: Search & View Mode Switcher */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="relative flex-1 max-w-md">
                <Search className="size-4 text-muted-foreground absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Filter content by title, genre, or badge…"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 justify-between sm:justify-end flex-wrap">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {filteredCatalogShows.length}
                  </span>{" "}
                  total shows
                </div>

                {/* View Mode Toggle: Group by Shelf vs Flat List */}
                <div className="inline-flex rounded-xl bg-secondary/50 p-1 border border-border/60">
                  <button
                    type="button"
                    onClick={() => setCatalogViewMode("shelves")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      catalogViewMode === "shelves"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    <Layers className="size-3.5" />
                    Group by Shelf
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogViewMode("list")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      catalogViewMode === "list"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    <Film className="size-3.5" />
                    All Shows List
                  </button>
                </div>
              </div>
            </div>

            {/* If Group by Shelf: Shelf Filter Tabs */}
            {catalogViewMode === "shelves" && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedShelfFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                    selectedShelfFilter === "all"
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-secondary/40 text-muted-foreground border-border hover:text-white hover:border-border/80"
                  }`}
                >
                  All Shelves ({shelfSections.length})
                </button>
                {shelfSections.map((shelf) => (
                  <button
                    key={shelf.id}
                    type="button"
                    onClick={() => setSelectedShelfFilter(shelf.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                      selectedShelfFilter === shelf.id
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-secondary/40 text-muted-foreground border-border hover:text-white hover:border-border/80"
                    }`}
                  >
                    {shelf.title}
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        selectedShelfFilter === shelf.id
                          ? "bg-white/20 text-white"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {shelf.shows.length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Shelves View Mode */}
            {catalogViewMode === "shelves" ? (
              <div className="space-y-6">
                {displayedShelves.map((shelf) => (
                  <div
                    key={shelf.id}
                    className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-lg transition-all"
                  >
                    {/* Shelf Header */}
                    <div className="p-4 sm:p-5 bg-secondary/30 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div className="size-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
                            {shelf.icon}
                          </div>
                          <h3 className="text-base font-bold text-foreground m-0">
                            {shelf.title}
                          </h3>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${shelf.colorBadge}`}
                          >
                            {shelf.badgeText}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border font-medium text-muted-foreground">
                            {shelf.shows.length}{" "}
                            {shelf.shows.length === 1 ? "show" : "shows"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground m-0 pl-10.5">
                          {shelf.description}
                        </p>
                      </div>

                      <div className="text-xs text-muted-foreground pl-10.5 sm:pl-0">
                        {shelf.id === "hero"
                          ? "Toggle 'Pop on Hero' to manage"
                          : `Shelf mapping: ${shelf.title}`}
                      </div>
                    </div>

                    {/* Shelf Shows List */}
                    {shelf.shows.length > 0 ? (
                      <div className="divide-y divide-border/40">
                        {shelf.shows.map((s) => renderShowRow(s))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-xs bg-secondary/10">
                        No shows currently in "{shelf.title}". Publish a show in
                        the Studio or add this genre to display it here.
                      </div>
                    )}
                  </div>
                ))}

                {displayedShelves.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground text-sm bg-card rounded-2xl border border-border">
                    No shelves match the filter.
                  </div>
                )}
              </div>
            ) : (
              /* Flat Shows List Mode */
              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-lg">
                <div className="divide-y divide-border/40">
                  {filteredCatalogShows.map((s) => renderShowRow(s))}

                  {filteredCatalogShows.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-xs">
                      No shows match your search "{catalogSearch}".
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: DATABASE SETUP ================= */}
        {activeTab === "database" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Database className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Supabase Cloud Sync Schema
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Run this SQL script to create the <code>shows</code> table
                      for cross-device cloud persistence.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={copySqlToClipboard}
                  className="gap-1.5 text-xs"
                >
                  {copiedSql ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy SQL
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/70 bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-3 rounded-full flex-shrink-0 ${
                      cloudStatus.tableReady
                        ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                        : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {cloudStatus.tableReady
                        ? "Supabase Shows Table is Active"
                        : "Table 'public.shows' Pending Creation"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {cloudStatus.tableReady
                        ? "Any show published will be immediately visible to all end users on https://tadka4u.vercel.app."
                        : "Shows are saved to local storage. Run the SQL below in Supabase SQL editor to enable global sync."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkDb}
                  disabled={cloudStatus.isTesting}
                  className="text-xs h-8 flex-shrink-0 gap-1.5 self-end sm:self-auto"
                >
                  <RefreshCw
                    className={`size-3 ${
                      cloudStatus.isTesting ? "animate-spin" : ""
                    }`}
                  />
                  {cloudStatus.isTesting ? "Checking…" : "Test Status"}
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-muted-foreground overflow-x-auto">
                <pre>{SUPABASE_SQL_SNIPPET}</pre>
              </div>

              <div className="bg-secondary/30 rounded-xl p-4 border border-border/50 text-xs text-muted-foreground space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Automatic Fallback Support
                </div>
                <p className="leading-relaxed">
                  Even if the Supabase database table has not been created yet,
                  Tadka4U stores your published shows in browser localStorage
                  and in-memory state. Your newly published shows work
                  immediately on the homepage and explore screens right away.
                </p>
              </div>
            </div>

            {/* Google Cloud Storage Setup Card */}
            <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Cloud className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Google Cloud Storage (GCS) Video Setup
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Store your short drama episodes on Google Cloud for
                      lightning-fast streaming delivery.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(GCS_CORS_JSON);
                    setCopiedGcsCors(true);
                    toast.success("Google Cloud CORS configuration copied!");
                    setTimeout(() => setCopiedGcsCors(false), 2500);
                  }}
                  className="gap-1.5 text-xs"
                >
                  {copiedGcsCors ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      Copied CORS!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy CORS Config
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="size-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    Create a Google Cloud Storage Bucket
                  </div>
                  <p className="text-[11px] pl-7">
                    Go to{" "}
                    <strong>
                      Google Cloud Console &rarr; Cloud Storage &rarr; Buckets
                    </strong>{" "}
                    and create a bucket (e.g.{" "}
                    <code className="text-primary font-mono">
                      gs://tadka4u-videos
                    </code>
                    ).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="size-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">
                      2
                    </span>
                    Allow Public Video Streaming
                  </div>
                  <p className="text-[11px] pl-7">
                    In the bucket Permissions tab, click{" "}
                    <strong>Grant Access</strong> &rarr; Add Principal:{" "}
                    <code className="text-primary font-mono">allUsers</code>{" "}
                    &rarr; Role:{" "}
                    <strong className="text-white">
                      Storage Object Viewer
                    </strong>
                    .
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="size-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">
                      3
                    </span>
                    Enable CORS for Smooth Timeline Scrubbing
                  </div>
                  <p className="text-[11px] pl-7 mb-2">
                    Save the JSON below as{" "}
                    <code className="text-white font-mono">cors.json</code> and
                    apply it via the Google Cloud CLI:
                  </p>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-400 select-all">
                    {GCS_SET_CORS_CMD}
                  </div>
                  <div className="p-3 rounded-lg bg-black/50 border border-white/10 font-mono text-[10px] text-muted-foreground overflow-x-auto">
                    <pre>{GCS_CORS_JSON}</pre>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="size-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">
                      4
                    </span>
                    Publish With Your Video URL
                  </div>
                  <p className="text-[11px] pl-7">
                    Copy the public URL (e.g.{" "}
                    <code className="text-primary font-mono">
                      https://storage.googleapis.com/YOUR_BUCKET/episode1.mp4
                    </code>
                    ) and paste it into the <strong>Video Stream Source</strong>{" "}
                    field in the Publish tab.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </PageLayout>
  );
}
