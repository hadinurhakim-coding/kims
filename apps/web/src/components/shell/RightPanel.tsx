"use client";

import { useAudio } from "@/context/AudioContext";
import type { Track } from "@/data/tracks";
import { ChevronRight, Music, Music2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

export interface RightPanelProps {
  recentTracks: Track[];
  onSelect?: (track: Track) => void;
}

const licenseBadgeClasses: Record<Track["licenseLabel"], string> = {
  "No Attribution": "bg-[var(--color-accent-teal)]",
  "Commercial Use": "bg-[var(--color-accent-primary)]",
  "Attribution Required": "bg-[var(--color-text-muted)]",
};

export function RightPanel({ recentTracks, onSelect }: RightPanelProps) {
  const { currentTrack, isPlaying } = useAudio();
  const [activeCategory, setActiveCategory] = useState("All");
  const availableCategories = useMemo(
    () => ["All", ...new Set(recentTracks.map((track) => track.type))],
    [recentTracks],
  );
  const effectiveActiveCategory = availableCategories.includes(activeCategory)
    ? activeCategory
    : "All";

  const filteredTracks =
    effectiveActiveCategory === "All"
      ? recentTracks
      : recentTracks.filter((track) => track.type === effectiveActiveCategory);
  const safeTracks = filteredTracks.filter(
    (track, index, self) =>
      index === self.findIndex((currentTrack) => currentTrack.id === track.id),
  );

  return (
    <div
      aria-label="Recent listened panel"
      className="h-full overflow-y-auto overscroll-none border-l border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-5 pt-0 lg:pt-16"
    >
      {currentTrack ? (
        <div className="-mx-4 overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <Image
              src={currentTrack.cover}
              alt={currentTrack.title}
              fill
              sizes="280px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.58)_0%,transparent_60%)]" />

            <div className="absolute right-3 top-3 flex items-center gap-2 rounded-[var(--radius-full)] bg-[color-mix(in_srgb,var(--color-text-primary)_46%,transparent)] px-2.5 py-1.5 text-[var(--color-surface)]">
              <Music2 className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px] font-semibold leading-none">
                Now Playing
              </span>
              {isPlaying ? (
                <span
                  aria-label="Playing"
                  className="flex h-3.5 items-end gap-0.5"
                  role="img"
                >
                  <span
                    className="bar-animate w-[2px] rounded-full bg-[var(--color-surface)]"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="bar-animate w-[2px] rounded-full bg-[var(--color-surface)]"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="bar-animate w-[2px] rounded-full bg-[var(--color-surface)]"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              ) : null}
            </div>

            <div
              className="absolute bottom-0 left-0 right-0 m-2 rounded-[18px] border border-[color-mix(in_srgb,var(--color-surface)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-text-primary)_58%,transparent)] px-3 py-2.5 shadow-[var(--shadow-md)]"
              style={{
                backdropFilter: "blur(18px) saturate(150%)",
                WebkitBackdropFilter: "blur(18px) saturate(150%)",
              }}
            >
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold leading-tight text-[var(--color-surface)]">
                    {currentTrack.title}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-[color-mix(in_srgb,var(--color-surface)_72%,transparent)]">
                    {currentTrack.type} &middot; {currentTrack.mood}
                  </div>
                </div>
                <span
                  className={[
                    "inline-flex max-w-[46%] shrink-0 justify-center rounded-[var(--radius-full)] px-2 py-1 text-[10px] font-bold leading-none text-[var(--color-surface)] shadow-[0_0_14px_color-mix(in_srgb,var(--color-accent-teal)_30%,transparent)]",
                    licenseBadgeClasses[currentTrack.licenseLabel],
                  ].join(" ")}
                >
                  <span className="truncate">{currentTrack.licenseLabel}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          aria-live="polite"
          className="-mx-4 mb-4 flex min-h-[180px] flex-col items-center justify-center border-b border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center shadow-[0_10px_18px_-18px_var(--color-text-primary)]"
        >
          <Music className="mb-3 h-12 w-12 text-[var(--color-text-muted)]" />
          <p className="text-sm font-medium text-[var(--color-text-muted)]">
            Select a track to see details
          </p>
        </div>
      )}

      <div className="-mx-4 mt-3 px-4 pb-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              Library
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Recently played tracks
            </p>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
          >
            Recent
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label="Filter recent tracks by category"
        className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 py-3"
      >
        {availableCategories.map((category) => {
          const isActive = category === effectiveActiveCategory;

          return (
            <button
              key={category}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveCategory(category)}
              className={[
                "shrink-0 rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
                isActive
                  ? "bg-[var(--color-border)] text-[var(--color-text-primary)]"
                  : "bg-[var(--color-background)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]",
              ].join(" ")}
            >
              {category}
            </button>
          );
        })}
      </div>

      {recentTracks.length === 0 ? (
        <div
          aria-live="polite"
          className="flex min-h-[320px] flex-col items-center justify-center text-center"
        >
          <Music className="mb-4 h-14 w-14 text-[var(--color-text-muted)]" />
          <p className="text-sm font-medium text-[var(--color-text-muted)]">
            No recent tracks yet
          </p>
        </div>
      ) : safeTracks.length === 0 ? (
        <div
          aria-live="polite"
          className="flex min-h-[320px] flex-col items-center justify-center text-center"
        >
          <Music className="mb-4 h-14 w-14 text-[var(--color-text-muted)]" />
          <p className="text-sm font-medium text-[var(--color-text-muted)]">
            No {effectiveActiveCategory} tracks yet
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {safeTracks.map((track) => (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => onSelect?.(track)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] p-2 text-left transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
              >
                <Image
                  src={track.cover}
                  alt={track.title}
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-[var(--radius-lg)] object-cover"
                />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">
                    {track.title}
                  </span>
                  <span className="block truncate text-xs text-[var(--color-text-muted)]">
                    {track.type} &middot; {track.mood}
                  </span>
                </span>

                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
