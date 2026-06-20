"use client";

import type { Track } from "@/data/tracks";
import { ChevronRight, Music } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

export interface RightPanelProps {
  recentTracks: Track[];
  onSelect?: (track: Track) => void;
}

export function RightPanel({ recentTracks, onSelect }: RightPanelProps) {
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

  return (
    <div
      aria-label="Recent listened panel"
      className="h-full overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-5 pt-16"
    >
      <div className="-mx-4 px-4 pb-0 pt-2">
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
      ) : filteredTracks.length === 0 ? (
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
          {filteredTracks.map((track) => (
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
