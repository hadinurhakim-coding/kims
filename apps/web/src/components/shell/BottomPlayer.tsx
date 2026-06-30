"use client";

import { useAudio } from "@/context/AudioContext";
import { useFavorites } from "@/context/FavoritesContext";
import type { Track } from "@/data/tracks";
import type { MouseEvent } from "react";
import {
  Heart,
  Loader2,
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
  onFavorite?: (track: Track) => void;
  onOpenDetails?: () => void;
}

const iconButtonClasses =
  "flex h-8 w-8 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";

export function BottomPlayer({ onFavorite, onOpenDetails }: BottomPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    isLoadingAudio,
    duration,
    currentTime,
    volume,
    isReady,
    togglePlayPause,
    setVolume,
  } = useAudio();
  const { isFavorite } = useFavorites();
  const isDisabled = !isReady || isLoadingAudio;
  const isTrackFavorite = currentTrack ? isFavorite(currentTrack.id) : false;
  const PlayPauseIcon = isPlaying ? Pause : Play;
  const progressWidth =
    duration > 0 ? `${(currentTime / duration) * 100}%` : "0%";

  function formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);

    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function stopPlayerClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  return (
    <div
      role={onOpenDetails ? "button" : undefined}
      tabIndex={onOpenDetails ? 0 : undefined}
      aria-label={onOpenDetails ? "Open now playing details" : undefined}
      onClick={onOpenDetails}
      onKeyDown={(event) => {
        if (!onOpenDetails) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenDetails();
        }
      }}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 grid min-h-[64px] cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-[14px] border border-[color-mix(in_srgb,var(--color-border)_80%,transparent)] bg-[var(--color-player-background)] px-3 py-2 shadow-[0_6px_18px_color-mix(in_srgb,var(--color-text-primary)_10%,transparent)] md:bottom-1 md:left-6 md:right-6 md:min-h-[68px] md:grid-cols-[minmax(0,1fr)_minmax(280px,480px)_minmax(0,1fr)] md:gap-3 md:bg-[color-mix(in_srgb,var(--color-player-background)_76%,transparent)] md:px-4 md:py-0.5 md:shadow-[0_8px_32px_color-mix(in_srgb,var(--color-text-primary)_14%,transparent)] md:[-webkit-backdrop-filter:blur(20px)_saturate(180%)] md:[backdrop-filter:blur(20px)_saturate(180%)] lg:left-[268px] lg:right-[304px]"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {currentTrack ? (
          <Image
            src={currentTrack.cover}
            alt={currentTrack.title}
            width={40}
            height={40}
            sizes="40px"
            className={[
              "h-10 w-10 shrink-0 rounded-[var(--radius-md)] object-cover",
              isLoadingAudio ? "animate-pulse" : "",
            ].join(" ")}
          />
        ) : (
          <div className="h-10 w-10 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-border)]" />
        )}

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-5 text-[var(--color-text-primary)]">
            {currentTrack?.title ?? "No track selected"}
          </div>
          <div className="truncate text-xs leading-4 text-[var(--color-text-muted)]">
            {currentTrack ? (
              <>
                {currentTrack.type} &middot; {currentTrack.mood}
              </>
            ) : (
              "Select a track"
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label={
            isTrackFavorite ? "Remove from favorites" : "Add to favorites"
          }
          disabled={!currentTrack}
          onClick={(event) => {
            stopPlayerClick(event);
            if (currentTrack) {
              onFavorite?.(currentTrack);
            }
          }}
          className={[
            "flex h-11 w-11 cursor-pointer items-center justify-center rounded-[var(--radius-full)] transition-colors duration-150 hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] md:h-8 md:w-8 md:hover:scale-110",
            isTrackFavorite
              ? "text-[var(--color-danger)]"
              : "text-[var(--color-text-muted)]",
          ].join(" ")}
        >
          <Heart
            className="h-5 w-5 md:h-4 md:w-4"
            fill={isTrackFavorite ? "var(--color-danger)" : "none"}
            stroke="currentColor"
          />
        </button>
      </div>

      <div className="flex min-w-0 flex-col items-center gap-1">
        <div className="flex items-center justify-center gap-0.5">
          <button
            type="button"
            aria-label="Shuffle"
            disabled={isDisabled}
            onClick={stopPlayerClick}
            className={`${iconButtonClasses} hidden md:flex`}
          >
            <Shuffle className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Previous track"
            disabled={isDisabled}
            onClick={stopPlayerClick}
            className={`${iconButtonClasses} hidden md:flex`}
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={isLoadingAudio ? "Loading audio" : isPlaying ? "Pause" : "Play"}
            disabled={isDisabled}
            onClick={(event) => {
              stopPlayerClick(event);
              togglePlayPause();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] md:h-9 md:w-9"
          >
            {isLoadingAudio ? (
              <Loader2 className="h-5 w-5 animate-spin md:h-4 md:w-4" />
            ) : (
              <PlayPauseIcon
                className={[
                  "h-5 w-5 md:h-4 md:w-4",
                  isPlaying ? "" : "fill-[var(--color-surface)]",
                ].join(" ")}
              />
            )}
          </button>
          <button
            type="button"
            aria-label="Next track"
            disabled={isDisabled}
            onClick={stopPlayerClick}
            className={`${iconButtonClasses} hidden md:flex`}
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Repeat"
            disabled={isDisabled}
            onClick={stopPlayerClick}
            className={`${iconButtonClasses} hidden md:flex`}
          >
            <Repeat className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden w-full items-center gap-2 md:flex">
          <span className="w-8 text-xs leading-4 text-[var(--color-text-muted)]">
            {formatTime(currentTime)}
          </span>
          <div
            role="progressbar"
            aria-valuenow={duration > 0 ? (currentTime / duration) * 100 : 0}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 flex-1 rounded-[var(--radius-full)] bg-[var(--color-border)]"
          >
            <div
              className="h-full rounded-[var(--radius-full)] bg-[var(--color-accent-primary)]"
              style={{ width: progressWidth }}
            />
          </div>
          <span className="w-10 text-right text-xs leading-4 text-[var(--color-text-muted)]">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="hidden items-center justify-end gap-2.5 md:flex">
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
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          onClick={(event) => event.stopPropagation()}
          disabled={isDisabled}
          className="w-24 accent-[var(--color-accent-primary)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
        />
      </div>
    </div>
  );
}
