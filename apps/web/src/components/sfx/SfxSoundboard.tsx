"use client";

import { Loader2, Pause, Play, Zap } from "lucide-react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useState } from "react";
import type { Track } from "@/data/tracks";

export interface SfxSoundboardProps {
  tracks: Track[];
  currentTrackId?: string;
  isPlaying: boolean;
  isLoadingTrackId?: string;
  onTrigger: (track: Track) => void;
}

function getButtonState({
  track,
  currentTrackId,
  isPlaying,
  isLoadingTrackId,
  pressedTrackId,
}: {
  track: Track;
  currentTrackId?: string;
  isPlaying: boolean;
  isLoadingTrackId?: string;
  pressedTrackId: string | null;
}) {
  const isCurrent = currentTrackId === track.id;
  const isLoading = isLoadingTrackId === track.id;
  const isPressed = pressedTrackId === track.id;

  return {
    isCurrent,
    isLoading,
    isPressed,
    isActive: isPressed || (isCurrent && isPlaying),
  };
}

export function SfxSoundboard({
  tracks,
  currentTrackId,
  isPlaying,
  isLoadingTrackId,
  onTrigger,
}: SfxSoundboardProps) {
  const [pressedTrackId, setPressedTrackId] = useState<string | null>(null);

  function releasePressedState(trackId: string) {
    window.setTimeout(() => {
      setPressedTrackId((currentTrack) =>
        currentTrack === trackId ? null : currentTrack,
      );
    }, 160);
  }

  function handlePointerDown(
    track: Track,
    event: PointerEvent<HTMLButtonElement>,
  ) {
    if (event.button !== 0) return;

    setPressedTrackId(track.id);
  }

  function handleKeyDown(
    track: Track,
    event: KeyboardEvent<HTMLButtonElement>,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      setPressedTrackId(track.id);
    }
  }

  if (tracks.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="sfx-soundboard-title"
      className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_88%,var(--color-background))] p-3 shadow-[var(--shadow-sm)] md:p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[color-mix(in_srgb,var(--color-accent-primary)_12%,var(--color-surface))] text-[var(--color-accent-primary)]">
              <Zap className="h-4 w-4" />
            </span>
            <h2
              id="sfx-soundboard-title"
              className="truncate text-base font-bold text-[var(--color-text-primary)] md:text-lg"
            >
              Soundboard
            </h2>
          </div>
        </div>
        <span className="shrink-0 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
          {tracks.length} SFX
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {tracks.map((track) => {
          const { isActive, isCurrent, isLoading, isPressed } = getButtonState({
            track,
            currentTrackId,
            isPlaying,
            isLoadingTrackId,
            pressedTrackId,
          });

          return (
            <button
              key={track.id}
              type="button"
              aria-label={`Play sound effect ${track.title}`}
              aria-pressed={isActive}
              disabled={isLoading}
              onClick={() => {
                setPressedTrackId(track.id);
                releasePressedState(track.id);
                onTrigger(track);
              }}
              onKeyDown={(event) => handleKeyDown(track, event)}
              onPointerDown={(event) => handlePointerDown(track, event)}
              onPointerLeave={() => releasePressedState(track.id)}
              onPointerUp={() => releasePressedState(track.id)}
              className={[
                "group flex min-h-[148px] flex-col items-center justify-between rounded-[var(--radius-md)] border p-3 text-center transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-wait disabled:opacity-75",
                isActive
                  ? "border-[var(--color-accent-primary)] bg-[color-mix(in_srgb,var(--color-accent-primary)_10%,var(--color-surface))] text-[var(--color-text-primary)] shadow-[0_12px_26px_color-mix(in_srgb,var(--color-accent-primary)_18%,transparent)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[color-mix(in_srgb,var(--color-accent-primary)_46%,var(--color-border))] hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_5%,var(--color-surface))]",
                isPressed ? "scale-[0.97]" : "scale-100",
              ].join(" ")}
            >
              <span
                className={[
                  "relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-full)] transition duration-150",
                  isActive
                    ? "bg-[radial-gradient(circle_at_34%_22%,var(--color-accent-hover)_0%,var(--color-accent-primary)_48%,color-mix(in_srgb,var(--color-accent-primary)_64%,var(--color-text-primary))_100%)] text-[var(--color-surface)] shadow-[inset_0_8px_18px_color-mix(in_srgb,var(--color-surface)_30%,transparent),inset_0_-12px_22px_color-mix(in_srgb,var(--color-text-primary)_28%,transparent),0_10px_24px_color-mix(in_srgb,var(--color-accent-primary)_34%,transparent)]"
                    : "bg-[radial-gradient(circle_at_34%_22%,color-mix(in_srgb,var(--color-accent-hover)_84%,var(--color-surface))_0%,var(--color-accent-primary)_52%,color-mix(in_srgb,var(--color-accent-primary)_66%,var(--color-text-primary))_100%)] text-[var(--color-surface)] shadow-[inset_0_8px_16px_color-mix(in_srgb,var(--color-surface)_32%,transparent),inset_0_-12px_22px_color-mix(in_srgb,var(--color-text-primary)_24%,transparent),0_8px_18px_color-mix(in_srgb,var(--color-text-primary)_18%,transparent)] group-hover:shadow-[inset_0_8px_16px_color-mix(in_srgb,var(--color-surface)_34%,transparent),inset_0_-12px_22px_color-mix(in_srgb,var(--color-text-primary)_22%,transparent),0_10px_24px_color-mix(in_srgb,var(--color-accent-primary)_28%,transparent)]",
                  isPressed ? "translate-y-0.5 scale-95" : "scale-100",
                ].join(" ")}
              >
                <span className="pointer-events-none absolute left-1/2 top-3 h-4 w-10 -translate-x-1/2 rounded-[var(--radius-full)] bg-[color-mix(in_srgb,var(--color-surface)_50%,transparent)] blur-[1px]" />
                <span className="pointer-events-none absolute bottom-2 h-3 w-12 rounded-[var(--radius-full)] bg-[color-mix(in_srgb,var(--color-text-primary)_14%,transparent)] blur-[2px]" />
                {isLoading ? (
                  <Loader2 className="relative h-7 w-7 animate-spin" />
                ) : isCurrent && isPlaying ? (
                  <Pause className="relative h-7 w-7 fill-current drop-shadow-[0_2px_6px_color-mix(in_srgb,var(--color-text-primary)_28%,transparent)]" />
                ) : (
                  <Play className="relative h-7 w-7 fill-current drop-shadow-[0_2px_6px_color-mix(in_srgb,var(--color-text-primary)_28%,transparent)]" />
                )}
              </span>

              <span className="mt-3 block w-full">
                <span className="block max-h-10 overflow-hidden break-words text-sm font-semibold leading-5">
                  {track.title}
                </span>
                <span className="mt-1 block truncate text-xs text-[var(--color-text-muted)]">
                  {track.sfxCategory ?? track.mood} &middot; {track.duration}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
