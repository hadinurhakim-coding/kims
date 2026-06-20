"use client";

import type { Track } from "@/data/tracks";
import { MoodCard } from "@/components/lofi/MoodCard";

export interface MoodCollectionsProps {
  lofiTracks: Track[];
  activeMood: string;
  onMoodSelect?: (mood: string) => void;
  onShowAll?: () => void;
}

export function MoodCollections({
  lofiTracks,
  activeMood,
  onMoodSelect,
  onShowAll,
}: MoodCollectionsProps) {
  const moods = [...new Set(lofiTracks.map((track) => track.mood))];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
          Mood Collections
        </h2>
        <button
          type="button"
          onClick={onShowAll}
          className="rounded-[var(--radius-full)] px-3 py-1 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          Show All
        </button>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-1 left-0 z-10 w-10 bg-gradient-to-r from-[var(--color-background)] to-transparent backdrop-blur-[2px] transition-opacity duration-200" />
        <div className="pointer-events-none absolute inset-y-1 right-0 z-10 w-10 bg-gradient-to-l from-[var(--color-background)] to-transparent backdrop-blur-[2px] transition-opacity duration-200" />

        <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto p-1">
          {moods.map((mood) => (
            <div
              key={mood}
              className="relative z-0 snap-start hover:z-20 focus-within:z-20"
            >
              <MoodCard
                mood={mood}
                trackCount={
                  lofiTracks.filter((track) => track.mood === mood).length
                }
                isActive={mood === activeMood}
                onClick={onMoodSelect}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
