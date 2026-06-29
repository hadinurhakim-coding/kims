"use client";

import { Heart, Pause, Play, X } from "lucide-react";
import Image from "next/image";
import { useFavorites } from "@/context/FavoritesContext";
import type { HistoryEntry } from "@/context/HistoryContext";
import type { Track } from "@/data/tracks";

export interface HistoryItemProps {
  entry: HistoryEntry;
  track: Track;
  isPlaying?: boolean;
  onPlay?: (track: Track) => void;
  onFavorite?: (track: Track) => void;
  onRemove?: (entryId: string) => void;
}

function formatRelativeTime(isoDate: string): string {
  const played = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - played.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hrs ago`;

  return played.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HistoryItem({
  entry,
  track,
  isPlaying = false,
  onPlay,
  onFavorite,
  onRemove,
}: HistoryItemProps) {
  const { isFavorite } = useFavorites();
  const isFavorited = isFavorite(track.id);
  const PlayIcon = isPlaying ? Pause : Play;

  return (
    <div className="group flex min-h-16 items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 transition-colors hover:bg-[var(--color-background)]">
      <Image
        src={track.cover}
        alt={track.title}
        width={48}
        height={48}
        className="h-12 w-12 shrink-0 rounded-[var(--radius-md)] object-cover"
      />

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
          {track.title}
        </div>
        <div className="truncate text-xs text-[var(--color-text-muted)]">
          {track.type} &middot; {track.mood}
        </div>
      </div>

      {entry.playCount > 1 ? (
        <span
          title={`Played ${entry.playCount} times`}
          className="rounded-[var(--radius-full)] bg-[var(--color-background)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]"
        >
          &times;{entry.playCount}
        </span>
      ) : null}

      <span className="w-20 shrink-0 text-right text-xs text-[var(--color-text-muted)]">
        {formatRelativeTime(entry.playedAt)}
      </span>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label={`${isPlaying ? "Pause" : "Play"} ${track.title}`}
          onClick={() => onPlay?.(track)}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
        >
          <PlayIcon
            className={[
              "h-4 w-4",
              isPlaying ? "text-[var(--color-accent-primary)]" : "",
            ].join(" ")}
          />
        </button>

        <button
          type="button"
          aria-label={`${isFavorited ? "Remove from" : "Add to"} favorites`}
          onClick={() => onFavorite?.(track)}
          className={[
            "flex h-9 w-9 items-center justify-center rounded-[var(--radius-full)] transition-colors hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
            isFavorited
              ? "text-[var(--color-danger)]"
              : "text-[var(--color-text-muted)]",
          ].join(" ")}
        >
          <Heart
            className="h-4 w-4"
            fill={isFavorited ? "var(--color-danger)" : "none"}
          />
        </button>

        {onRemove ? (
          <button
            type="button"
            aria-label={`Remove ${track.title} from history`}
            onClick={() => onRemove(entry.id)}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-surface))] hover:text-[var(--color-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
