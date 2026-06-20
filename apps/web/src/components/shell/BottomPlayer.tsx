"use client";

import type { Track } from "@/data/tracks";
import {
  Heart,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import Image from "next/image";

export interface BottomPlayerProps {
  track: Track | null;
  isPlaying?: boolean;
  isFavorite?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onShuffle?: () => void;
  onRepeat?: () => void;
  onFavorite?: (track: Track) => void;
}

const iconButtonClasses =
  "flex h-9 w-9 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";

export function BottomPlayer({
  track,
  isPlaying = false,
  isFavorite = false,
  onPlayPause,
  onNext,
  onPrevious,
  onShuffle,
  onRepeat,
  onFavorite,
}: BottomPlayerProps) {
  const isDisabled = track === null;
  const PlayPauseIcon = isPlaying ? Pause : Play;

  return (
    <div
      className="fixed bottom-4 left-3 right-3 z-50 grid h-[72px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.65)] px-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] md:left-6 md:right-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,480px)_minmax(0,1fr)] md:px-5 lg:left-[268px] lg:right-[304px]"
      style={{
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {track ? (
          <Image
            src={track.cover}
            alt={track.title}
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-[var(--radius-md)] object-cover"
          />
        ) : (
          <div className="h-11 w-11 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-border)]" />
        )}

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {track?.title ?? "No track selected"}
          </div>
          <div className="truncate text-xs text-[var(--color-text-muted)]">
            {track ? (
              <>
                {track.type} &middot; {track.mood}
              </>
            ) : (
              "Select a track"
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          disabled={isDisabled}
          onClick={() => {
            if (track) {
              onFavorite?.(track);
            }
          }}
          className={[
            "flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--radius-full)] transition-all duration-150 hover:scale-110 hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
            isFavorite
              ? "text-[var(--color-danger)]"
              : "text-[var(--color-text-muted)]",
          ].join(" ")}
        >
          <Heart
            className="h-4 w-4"
            fill={isFavorite ? "var(--color-danger)" : "none"}
            stroke="currentColor"
          />
        </button>
      </div>

      <div className="flex min-w-0 flex-col items-center gap-1">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            aria-label="Shuffle"
            disabled={isDisabled}
            onClick={onShuffle}
            className={iconButtonClasses}
          >
            <Shuffle className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Previous track"
            disabled={isDisabled}
            onClick={onPrevious}
            className={iconButtonClasses}
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={isDisabled}
            onClick={onPlayPause}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          >
            <PlayPauseIcon
              className={[
                "h-5 w-5",
                isPlaying ? "" : "fill-[var(--color-surface)]",
              ].join(" ")}
            />
          </button>
          <button
            type="button"
            aria-label="Next track"
            disabled={isDisabled}
            onClick={onNext}
            className={iconButtonClasses}
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Repeat"
            disabled={isDisabled}
            onClick={onRepeat}
            className={iconButtonClasses}
          >
            <Repeat className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden w-full items-center gap-2 md:flex">
          <span className="w-8 text-xs text-[var(--color-text-muted)]">
            0:42
          </span>
          <div
            role="progressbar"
            aria-valuenow={30}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 flex-1 rounded-[var(--radius-full)] bg-[var(--color-border)]"
          >
            <div className="h-full w-[30%] rounded-[var(--radius-full)] bg-[var(--color-accent-primary)]" />
          </div>
          <span className="w-10 text-right text-xs text-[var(--color-text-muted)]">
            {track?.duration ?? "0:00"}
          </span>
        </div>
      </div>

      <div className="hidden items-center justify-end gap-3 md:flex">
        <button
          type="button"
          aria-label="Volume"
          disabled={isDisabled}
          className={iconButtonClasses}
        >
          <Volume2 className="h-4 w-4" />
        </button>
        <input
          aria-label="Volume"
          type="range"
          min="0"
          max="100"
          defaultValue="80"
          disabled={isDisabled}
          className="w-24 accent-[var(--color-accent-primary)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
        />
      </div>
    </div>
  );
}
