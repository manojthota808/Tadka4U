import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useState,
  useRef,
  useId,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { useUser } from "@clerk/react";
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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout, pageHead } from "@/frontend";
import { catalogApi, useShows, genres, type Show } from "@/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () =>
    pageHead(
      "Admin Studio · Publish Shows",
      "Manage streaming titles, upload posters, and publish content to Tadka4U without touching code.",
    ),
  component: AdminPage,
});

const QUICK_BADGES = [
  "NEW",
  "TRENDING",
  "NEW EPISODES",
  "EXCLUSIVE",
  "ORIGINAL",
  "POPULAR",
];

const PRESET_GENRES = [
  "Romance",
  "Thriller",
  "Drama",
  "Horror",
  "Comedy",
  "Action",
  "Mystery",
];

const SUPABASE_SQL_SNIPPET = `-- Run this in your Supabase SQL Editor to enable persistent cloud sync
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
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Row Level Security policies
alter table public.shows enable row level security;

-- Anyone can browse shows
create policy "Public shows read" on public.shows
  for select using (true);

-- Anyone with the client key can insert/delete (or restrict by auth.uid())
create policy "Allow insert on shows" on public.shows
  for insert with check (true);

create policy "Allow delete on shows" on public.shows
  for delete using (true);
`;

function AdminPage() {
  const { user, isLoaded, isSignedIn } = useUser();
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
  const [episodes, setEpisodes] = useState("4");
  const [rating, setRating] = useState("4.8");
  const [badge, setBadge] = useState("NEW");
  const [description, setDescription] = useState("");
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPublishedId, setLastPublishedId] = useState<string | null>(null);

  // Catalog Manager State
  const [catalogSearch, setCatalogSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // 1. Authorization Check
  // Check against VITE_ADMIN_EMAILS (comma separated), or allow signed-in user if unset
  const configuredAdminEmails = (
    (typeof import.meta !== "undefined" &&
      import.meta.env?.["VITE_ADMIN_EMAILS"]) ||
    ""
  )
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  const userEmail =
    user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const hasConfiguredList = configuredAdminEmails.length > 0;
  const isAuthorized =
    isSignedIn &&
    (!hasConfiguredList ||
      configuredAdminEmails.includes(userEmail) ||
      user?.publicMetadata?.["role"] === "admin");

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
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

    setIsSubmitting(true);
    try {
      const { show, error } = await catalogApi.publishShow(
        {
          title,
          genre: finalGenre,
          image: finalImage,
          episodes: Number(episodes) || 4,
          badge: badge.trim() || undefined,
          description:
            description.trim() || "A captivating short drama on Tadka4U.",
          rating: rating.trim() || "4.8",
        },
        selectedFile,
      );

      if (error || !show) {
        toast.error(error?.message || "Failed to publish show.");
        return;
      }

      toast.success(`"${show.title}" published successfully!`, {
        description: "It is now live immediately on Home and Explore.",
      });

      setLastPublishedId(show.id);

      // Reset form
      setTitle("");
      setDescription("");
      clearImage();
      setEpisodes("4");
      setRating("4.8");
      setBadge("NEW");
    } catch (err) {
      toast.error("An unexpected error occurred while publishing.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete show handler
  const handleDeleteShow = async (id: string, showTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${showTitle}"?`)) {
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
              Tadka4U Studio allows authorized administrators to upload artwork,
              publish new short dramas, and manage the live streaming catalog.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="cinema"
                size="lg"
                className="w-full sm:w-auto px-8"
                asChild
              >
                <Link to="/sign-in/$" search={{ redirect_url: "/admin" }}>
                  Sign in with Admin Account
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
              Restricted Area
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Signed in as{" "}
              <strong className="text-foreground">{userEmail}</strong>. This
              email is not listed in the authorized administrator group.
            </p>
            <div className="p-4 bg-secondary/50 rounded-lg text-xs text-muted-foreground text-left mb-6 font-mono">
              To grant access, add this email to your environment configuration:
              <div className="text-primary mt-1 select-all font-semibold">
                VITE_ADMIN_EMAILS={userEmail}
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" asChild>
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
  const filteredCatalogShows = allShows.filter(
    (s) =>
      s.title.toLowerCase().includes(catalogSearch.toLowerCase().trim()) ||
      s.genre.toLowerCase().includes(catalogSearch.toLowerCase().trim()),
  );

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
                          Supports PNG, JPG, WebP · Portrait 2:3 ratio
                          recommended
                        </p>
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
                  <label className="text-xs font-semibold text-foreground">
                    Genre *
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
                    {PRESET_GENRES.map((g) => (
                      <option
                        key={g}
                        value={g}
                        className="bg-card text-foreground"
                      >
                        {g}
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

                <div className="mt-5 p-3 rounded-xl bg-secondary/30 border border-border/40 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    When published, this title is added to the catalog and
                    appears on the <strong>Home</strong> and{" "}
                    <strong>Explore</strong> screens instantly.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CATALOG MANAGER ================= */}
        {activeTab === "catalog" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/60 rounded-xl p-4">
              <div className="relative w-full sm:w-80">
                <Search className="size-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter shows by title or genre…"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>
                  Showing {filteredCatalogShows.length} of {allShows.length}{" "}
                  titles
                </span>
              </div>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-lg">
              <div className="divide-y divide-border/40">
                {filteredCatalogShows.map((s) => (
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
                        <div className="text-xs text-muted-foreground flex items-center gap-2.5 mt-1">
                          <span>{s.genre}</span>
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

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-xs text-muted-foreground hover:text-white"
                      >
                        <Link
                          to="/show/$showId"
                          params={{ showId: s.id }}
                          target="_blank"
                        >
                          <ExternalLink className="size-3.5 mr-1" />
                          View
                        </Link>
                      </Button>

                      {s.isCustom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === s.id}
                          onClick={() => handleDeleteShow(s.id, s.title)}
                          className="text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          {deletingId === s.id ? "Deleting…" : "Delete"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredCatalogShows.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-xs">
                    No shows match your search "{catalogSearch}".
                  </div>
                )}
              </div>
            </div>
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
          </div>
        )}
      </main>
    </PageLayout>
  );
}
