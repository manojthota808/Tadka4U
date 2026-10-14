import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type MouseEvent,
} from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Sparkles,
  Cloud,
  Tv,
  Check,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getEpisodeVideoUrl,
  isGoogleCloudStorageUrl,
  GOOGLE_CLOUD_DEFAULT_STREAMS,
} from "@/lib/video-streaming";
import type { Show } from "@/lib/catalog";

export interface VideoPlayerProps {
  show: Show;
  episodeNumber: number;
  totalEpisodes?: number;
  onSelectEpisode?: (ep: number) => void;
  onClose?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  show,
  episodeNumber,
  totalEpisodes = show.episodes || 4,
  onSelectEpisode,
  onClose,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [useFallbackStream, setUseFallbackStream] = useState(false);
  const [nextCountdown, setNextCountdown] = useState<number | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Compute active video source URL
  const primaryUrl = getEpisodeVideoUrl(show, episodeNumber);
  const fallbackUrl =
    GOOGLE_CLOUD_DEFAULT_STREAMS[
      (episodeNumber - 1) % GOOGLE_CLOUD_DEFAULT_STREAMS.length
    ]?.url ?? GOOGLE_CLOUD_DEFAULT_STREAMS[0]!.url;
  const currentVideoUrl = useFallbackStream ? fallbackUrl : primaryUrl;
  const isGcs = isGoogleCloudStorageUrl(currentVideoUrl);

  // Reset states on episode change
  useEffect(() => {
    setHasError(false);
    setUseFallbackStream(false);
    setNextCountdown(null);
    setCurrentTime(0);
    setDuration(0);
    setBufferedEnd(0);
    setIsPlaying(false);

    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = 0;
      vid.load();
      // Smoothly start playback
      vid
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay policy might pause until user interaction
          setIsPlaying(false);
        });
    }
  }, [episodeNumber, show.id]);

  // Video event handlers
  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setCurrentTime(vid.currentTime);

    // Track buffered range
    if (vid.buffered.length > 0) {
      try {
        const lastBuffered = vid.buffered.end(vid.buffered.length - 1);
        setBufferedEnd(lastBuffered);
      } catch {
        // no-op
      }
    }
  };

  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setDuration(vid.duration);
    setIsBuffering(false);
    setHasError(false);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (episodeNumber < totalEpisodes) {
      // Start auto-advance countdown
      setNextCountdown(5);
    }
  };

  // Next episode countdown timer
  useEffect(() => {
    if (nextCountdown === null) return;
    if (nextCountdown <= 0) {
      setNextCountdown(null);
      if (onSelectEpisode && episodeNumber < totalEpisodes) {
        onSelectEpisode(episodeNumber + 1);
      }
      return;
    }

    const timer = setTimeout(() => {
      setNextCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [nextCountdown, episodeNumber, totalEpisodes, onSelectEpisode]);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      vid.pause();
      setIsPlaying(false);
    }
    setNextCountdown(null);
  }, []);

  const seekRelative = useCallback((delta: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    const newTime = Math.min(
      Math.max(0, vid.currentTime + delta),
      vid.duration || 0,
    );
    vid.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const toggleMute = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isMuted) {
      vid.muted = false;
      setIsMuted(false);
      vid.volume = volume > 0 ? volume : 1;
    } else {
      vid.muted = true;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const handleVolumeChange = useCallback(
    (newVol: number) => {
      const vid = videoRef.current;
      if (!vid) return;
      setVolume(newVol);
      vid.volume = newVol;
      if (newVol > 0 && isMuted) {
        vid.muted = false;
        setIsMuted(false);
      }
    },
    [isMuted],
  );

  const setSpeed = (rate: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      try {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fallback
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {
        // Fallback
      }
    }
  }, []);

  // Picture in Picture
  const togglePiP = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await vid.requestPictureInPicture();
      }
    } catch {
      // Not supported or permission denied
    }
  };

  // Mouse inactivity controls hide/show
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 2600);
    }
  }, [isPlaying]);

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack keystrokes if typing inside inputs
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          seekRelative(-5);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          seekRelative(5);
          break;
        case "arrowup":
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case "arrowdown":
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "escape":
          if (isFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
          break;
      }
      resetHideTimer();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlay,
    seekRelative,
    toggleMute,
    handleVolumeChange,
    toggleFullscreen,
    isFullscreen,
    volume,
    resetHideTimer,
  ]);

  // Click on scrubber progress bar to seek
  const handleScrubberClick = (e: MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    const vid = videoRef.current;
    if (!bar || !vid || !duration) return;

    const rect = bar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    vid.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
      className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl group select-none ${
        isFullscreen ? "rounded-none border-none" : ""
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={currentVideoUrl}
        poster={show.image}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onEnded={handleVideoEnded}
        onError={() => {
          setIsBuffering(false);
          setHasError(true);
        }}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Top Overlay Banner: Show Title & Episode Controls (Fullscreen Mode) */}
      {isFullscreen && (
        <div
          className={`absolute top-0 left-0 right-0 p-4 sm:p-5 flex items-center justify-between z-30 bg-gradient-to-b from-black/85 via-black/45 to-transparent transition-opacity duration-300 ${
            showControls || !isPlaying
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary text-white shadow-sm">
                TADKA4U
              </span>
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight drop-shadow-md">
                {show.title}
              </span>
              <span className="text-white/40">·</span>
              <span className="text-xs text-white/90 font-medium">
                Episode {episodeNumber}
              </span>
            </div>

            <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-white/70 bg-white/10 px-2 py-0.5 rounded border border-white/15 backdrop-blur-md">
              1080p HD
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <Button
                variant="glass"
                size="sm"
                onClick={onClose}
                className="text-xs h-8 px-3 rounded-full bg-black/50 hover:bg-black/70 text-white/90 border-white/20 backdrop-blur-md gap-1.5"
              >
                <X className="size-3.5" />
                <span>Close</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Center Big Play/Pause & Buffering Spinner */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 bg-black/20 backdrop-blur-xs">
          <div className="size-14 rounded-full border-3 border-primary border-t-transparent animate-spin mb-3 shadow-lg" />
          <span className="text-xs text-white/80 font-medium tracking-wide">
            Loading…
          </span>
        </div>
      )}

      {/* Center Play Button on Pause */}
      {!isPlaying && !isBuffering && !hasError && nextCountdown === null && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer bg-black/30 backdrop-blur-[2px]"
        >
          <div className="size-20 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-2xl shadow-primary/40 transform transition-transform group-hover:scale-105 active:scale-95 border border-white/20">
            <Play className="size-9 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Next Episode Auto-advance Overlay */}
      {nextCountdown !== null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/85 backdrop-blur-md p-6 text-center">
          <div className="size-16 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center mb-3">
            <Sparkles className="size-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            Episode {episodeNumber} Finished!
          </h3>
          <p className="text-sm text-white/80 mb-4 max-w-sm">
            Starting{" "}
            <strong className="text-primary">
              Episode {episodeNumber + 1}
            </strong>{" "}
            automatically in{" "}
            <span className="font-mono text-lg font-bold text-white">
              {nextCountdown}s
            </span>
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="cinema"
              onClick={() => {
                setNextCountdown(null);
                if (onSelectEpisode) onSelectEpisode(episodeNumber + 1);
              }}
              className="gap-2 text-xs"
            >
              <Play className="size-3.5 fill-current" />
              Play Episode {episodeNumber + 1} Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNextCountdown(null)}
              className="text-xs text-white border-white/20"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Error Fallback Banner */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/90 p-6 text-center">
          <div className="size-14 rounded-full bg-destructive/20 text-destructive border border-destructive/30 flex items-center justify-center mb-3">
            <AlertCircle className="size-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">
            Video Source Notice
          </h3>
          <p className="text-xs text-white/70 max-w-md mb-4 leading-relaxed">
            The configured video URL could not be streamed directly (it may have
            CORS restrictions or require public read permissions in your Google
            Cloud Storage bucket).
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Button
              variant="cinema"
              size="sm"
              onClick={() => {
                setHasError(false);
                setUseFallbackStream(true);
              }}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Switch to Backup HD Stream
            </Button>
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs text-white border-white/20"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-30 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div
          ref={progressBarRef}
          onClick={handleScrubberClick}
          className="relative w-full h-2 group/scrubber cursor-pointer mb-3 rounded-full bg-white/20 overflow-hidden flex items-center"
        >
          {/* Buffer Progress */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-white/30 transition-all duration-150"
            style={{ width: `${bufferPercent}%` }}
          />
          {/* Played Progress */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-primary shadow-sm shadow-primary/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Control Buttons Row */}
        <div className="flex items-center justify-between gap-3 text-white">
          {/* Left: Playback & Seek */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="size-9 rounded-xl bg-white/10 hover:bg-primary text-white flex items-center justify-center transition-all cursor-pointer"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? (
                <Pause className="size-4 fill-white" />
              ) : (
                <Play className="size-4 fill-white ml-0.5" />
              )}
            </button>

            {/* Rewind 10s */}
            <button
              type="button"
              onClick={() => seekRelative(-10)}
              className="size-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Rewind 10s (Left Arrow)"
            >
              <RotateCcw className="size-4" />
            </button>

            {/* Fast-Forward 10s */}
            <button
              type="button"
              onClick={() => seekRelative(10)}
              className="size-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Fast Forward 10s (Right Arrow)"
            >
              <RotateCw className="size-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                type="button"
                onClick={toggleMute}
                className="size-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="size-4 text-destructive" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-14 sm:w-20 h-1 accent-primary bg-white/30 rounded-lg cursor-pointer"
                title="Volume"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-[11px] sm:text-xs text-white/80 font-mono tracking-tight ml-1">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/40 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Episodes, Quality, Speed, PiP, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Episode Step Buttons */}
            {onSelectEpisode && (
              <div className="flex items-center gap-1 bg-white/10 rounded-xl p-0.5 border border-white/10">
                <button
                  type="button"
                  disabled={episodeNumber <= 1}
                  onClick={() => onSelectEpisode(episodeNumber - 1)}
                  className="size-7 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-colors cursor-pointer"
                  title="Previous Episode"
                >
                  <SkipBack className="size-3.5" />
                </button>
                <span className="text-[10px] font-semibold px-1.5 text-white/90">
                  Ep {episodeNumber}/{totalEpisodes}
                </span>
                <button
                  type="button"
                  disabled={episodeNumber >= totalEpisodes}
                  onClick={() => onSelectEpisode(episodeNumber + 1)}
                  className="size-7 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center transition-colors cursor-pointer"
                  title="Next Episode"
                >
                  <SkipForward className="size-3.5" />
                </button>
              </div>
            )}

            {/* Speed Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 py-1 w-24 bg-card/95 border border-border/80 rounded-xl shadow-2xl backdrop-blur-md z-50 text-xs">
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setSpeed(rate)}
                      className={`w-full px-3 py-1.5 text-left text-[11px] flex items-center justify-between hover:bg-secondary/60 cursor-pointer ${
                        playbackRate === rate
                          ? "text-primary font-bold"
                          : "text-white/80"
                      }`}
                    >
                      <span>{rate}x</span>
                      {playbackRate === rate && (
                        <Check className="size-3 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP Button */}
            <button
              type="button"
              onClick={togglePiP}
              className="size-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer hidden sm:flex"
              title="Picture in Picture"
            >
              <Tv className="size-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="size-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? (
                <Minimize className="size-4" />
              ) : (
                <Maximize className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
