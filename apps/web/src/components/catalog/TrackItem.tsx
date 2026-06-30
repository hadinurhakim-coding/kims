"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  Check,
  Download,
  Heart,
  ListPlus,
  Loader2,
  Minus,
  Pause,
  Play,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { useAudio } from "@/context/AudioContext";
import { usePlaylists } from "@/context/PlaylistContext";
import type { Track } from "../../data/tracks";

export interface TrackItemProps {
  track: Track;
  rank: number;
  isSelected?: boolean;
  isPlaying?: boolean;
  onSelect?: (track: Track) => void;
  onFavorite?: (track: Track) => void;
  onPreview?: (track: Track) => void;
  onRemove?: (track: Track) => void;
  onCreatePlaylist?: () => void;
}

const licenseBadgeClasses: Record<Track["licenseLabel"], string> = {
  "No Attribution": "bg-[var(--color-accent-teal)]",
  "Commercial Use": "bg-[var(--color-accent-primary)]",
  "Attribution Required": "bg-[var(--color-text-muted)]",
};

const durationBadgeClasses: Record<
  ReturnType<typeof getDurationCategory>,
  string
> = {
  Short: "bg-[var(--color-border)] text-[var(--color-text-muted)]",
  Medium: "bg-[var(--color-accent-teal)] text-[var(--color-surface)]",
  Long: "bg-[var(--color-accent-primary)] text-[var(--color-surface)]",
};

function getDurationCategory(duration: string): "Short" | "Medium" | "Long" {
  const [min, sec] = duration.split(":").map(Number);
  const total = min * 60 + sec;

  if (total < 60) return "Short";
  if (total <= 180) return "Medium";
  return "Long";
}

export function TrackItem({
  track,
  rank,
  isSelected = false,
  isPlaying = false,
  onSelect,
  onFavorite,
  onPreview,
  onRemove,
  onCreatePlaylist,
}: TrackItemProps) {
  const pathname = usePathname();
  const {
    playlists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    isTrackInPlaylist,
  } = usePlaylists();
  const { currentTrack, isLoadingAudio } = useAudio();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isLoadingTrack = isLoadingAudio && currentTrack?.id === track.id;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsDropdownOpen(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    function handlePointerDown(event: globalThis.MouseEvent) {
      if (
        event.target instanceof Node &&
        !dropdownRef.current?.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  function handleAction(
    event: MouseEvent<HTMLButtonElement>,
    callback?: (track: Track) => void,
  ) {
    event.stopPropagation();
    callback?.(track);
  }

  function handlePlaylistToggle(playlistId: string) {
    if (isTrackInPlaylist(playlistId, track.id)) {
      void removeTrackFromPlaylist(playlistId, track.id);
      return;
    }

    void addTrackToPlaylist(playlistId, track.id);
  }

  async function handleDownload(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    setDownloadError(false);

    try {
      const res = await fetch(`/api/v1/tracks/${track.id}/download`);
      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        console.error(
          "[DOWNLOAD] Failed with status:",
          res.status,
          "body:",
          errorBody,
        );
        throw new Error(errorBody?.error ?? "Download failed");
      }

      const data = (await res.json()) as { url?: unknown };
      if (typeof data.url !== "string" || data.url === "") {
        throw new Error("Invalid download response");
      }

      const link = document.createElement("a");
      link.href = data.url;
      link.download = `${track.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      setDownloadError(true);
      window.setTimeout(() => setDownloadError(false), 3000);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div
      role="row"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`Select ${track.title}`}
      onClick={() => onSelect?.(track)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(track);
        }
      }}
      className={[
        "group grid min-h-16 cursor-pointer grid-cols-[28px_44px_minmax(0,1fr)_auto] items-center gap-2 rounded-[var(--radius-md)] border-l-2 px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] md:grid-cols-[32px_48px_minmax(0,1fr)_auto_64px_auto] md:gap-4",
        isSelected
          ? "border-[var(--color-accent-primary)] bg-[color-mix(in_srgb,var(--color-accent-primary)_8%,var(--color-surface))]"
          : "border-transparent bg-[var(--color-surface)] hover:bg-[var(--color-background)]",
      ].join(" ")}
    >
      <span className="row-span-2 w-7 text-sm font-medium text-[var(--color-text-muted)] md:row-span-1 md:w-8">
        #{rank}
      </span>

      <Image
        src={track.cover}
        alt={track.title}
        width={44}
        height={44}
        className="row-span-2 h-11 w-11 rounded-[var(--radius-md)] object-cover md:row-span-1 md:h-12 md:w-12"
      />

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
          {track.title}
        </div>
        <div className="truncate text-xs text-[var(--color-text-muted)]">
          {track.type} &middot; {track.mood}
        </div>
      </div>

      <div className="col-start-3 row-start-2 hidden flex-wrap items-center gap-2 md:col-start-auto md:row-start-auto md:flex">
        <span
          className={[
            "w-fit rounded-[var(--radius-full)] px-3 py-1 text-xs font-medium text-[var(--color-surface)]",
            licenseBadgeClasses[track.licenseLabel],
          ].join(" ")}
        >
          {track.licenseLabel}
        </span>
        {track.type === "SFX" ? (
          <span
            className={[
              "w-fit rounded-[var(--radius-full)] px-3 py-1 text-xs font-medium",
              durationBadgeClasses[getDurationCategory(track.duration)],
            ].join(" ")}
          >
            {getDurationCategory(track.duration)}
          </span>
        ) : null}
      </div>

      <span className="hidden w-16 text-left text-sm text-[var(--color-text-muted)] md:col-start-auto md:block md:text-right">
        {track.duration}
      </span>

      <div className="col-start-4 row-span-2 row-start-1 flex items-center gap-1 md:col-start-auto md:row-span-1 md:row-start-auto">
        <button
          type="button"
          aria-label={`Favorite ${track.title}`}
          onClick={(event) => handleAction(event, onFavorite)}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] md:h-9 md:w-9"
        >
          <Heart
            className={[
              "h-4 w-4",
              track.isFavorite
                ? "fill-[var(--color-danger)] text-[var(--color-danger)]"
                : "fill-none",
            ].join(" ")}
          />
        </button>
        <button
          type="button"
          aria-label={`${isLoadingTrack ? "Loading" : isPlaying ? "Pause" : "Play"} ${track.title}`}
          disabled={isLoadingTrack}
          onClick={(event) => handleAction(event, onPreview)}
          className={[
            "flex h-8 w-8 items-center justify-center rounded-[var(--radius-full)] transition-all duration-150 hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] md:h-9 md:w-9",
            isPlaying || isLoadingTrack
              ? "animate-pulse text-[var(--color-accent-primary)] ring-2 ring-[var(--color-accent-primary)] ring-offset-1 ring-offset-[var(--color-surface)]"
              : "text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-primary)]",
          ].join(" ")}
        >
          {isLoadingTrack ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5 fill-[var(--color-accent-primary)] transition-all duration-150" />
          ) : (
            <Play className="h-4 w-4 transition-all duration-150 group-hover:h-5 group-hover:w-5" />
          )}
        </button>
        <button
          type="button"
          aria-label={
            downloadError
              ? "Download failed, try again"
              : isDownloading
                ? `Downloading ${track.title}`
                : `Download ${track.title}`
          }
          disabled={isDownloading}
          onClick={handleDownload}
          className={[
            "hidden h-9 w-9 items-center justify-center rounded-[var(--radius-full)] transition-colors hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] md:flex",
            downloadError
              ? "text-[var(--color-danger)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)]",
          ].join(" ")}
        >
          {downloadError ? (
            <AlertCircle className="h-4 w-4" />
          ) : isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </button>
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            aria-label={`Add ${track.title} to playlist`}
            aria-expanded={isDropdownOpen}
            onClick={(event) => {
              event.stopPropagation();
              setIsDropdownOpen((isOpen) => !isOpen);
            }}
            className="hidden h-9 w-9 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] md:flex"
          >
            <ListPlus className="h-4 w-4" />
          </button>

          {isDropdownOpen ? (
            <div className="absolute right-0 top-full z-20 mt-2 min-w-[200px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
              <div className="px-3 py-2 text-xs font-medium text-[var(--color-text-muted)]">
                Add to playlist
              </div>

              {playlists.length > 0 ? (
                <>
                  <div className="h-px bg-[var(--color-border)]" />
                  <div className="max-h-[200px] overflow-y-auto py-1">
                    {playlists.map((playlist) => {
                      const isAdded = isTrackInPlaylist(playlist.id, track.id);

                      return (
                        <button
                          key={playlist.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handlePlaylistToggle(playlist.id);
                          }}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent-primary)]"
                        >
                          <span className="truncate">{playlist.name}</span>
                          {isAdded ? (
                            <Check className="h-4 w-4 shrink-0 text-[var(--color-accent-primary)]" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <div className="h-px bg-[var(--color-border)]" />
                </>
              ) : null}

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsDropdownOpen(false);
                  onCreatePlaylist?.();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-[var(--color-accent-primary)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent-primary)]"
              >
                <Plus className="h-4 w-4" />
                <span>New Playlist</span>
              </button>
            </div>
          ) : null}
        </div>
        {onRemove ? (
          <button
            type="button"
            aria-label={`Remove ${track.title} from playlist`}
            onClick={(event) => handleAction(event, onRemove)}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-surface))] hover:text-[var(--color-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          >
            <Minus className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
