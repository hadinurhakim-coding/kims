"use client";

import type { Track } from "@/data/tracks";
import { Heart, Play } from "lucide-react";
import Image from "next/image";

export interface HeroSectionProps {
  track: Track;
  onPlay?: (track: Track) => void;
  onFavorite?: (track: Track) => void;
}

const licenseBadgeClasses: Record<Track["licenseLabel"], string> = {
  "No Attribution": "bg-[var(--color-accent-teal)]",
  "Commercial Use": "bg-[var(--color-accent-primary)]",
  "Attribution Required": "bg-[var(--color-text-muted)]",
};

export function HeroSection({
  track,
  onPlay,
  onFavorite,
}: HeroSectionProps) {
  return (
    <section className="flex flex-col items-center gap-6 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)] md:flex-row md:justify-between md:p-8">
      <div className="order-2 flex w-full flex-col justify-center md:order-1">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Featured Track
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
          {track.title}
        </h1>
        <div className="mt-2 text-sm text-[var(--color-text-muted)]">
          {track.type} &middot; {track.mood}
        </div>

        <span
          className={[
            "mt-4 w-fit rounded-[var(--radius-full)] px-3 py-1 text-xs font-medium text-[var(--color-surface)]",
            licenseBadgeClasses[track.licenseLabel],
          ].join(" ")}
        >
          {track.licenseLabel}
        </span>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            aria-label={`Play ${track.title}`}
            onClick={() => onPlay?.(track)}
            className="flex h-11 items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] px-5 text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          >
            <Play className="h-4 w-4 fill-[var(--color-surface)]" />
            <span>Play Now</span>
          </button>

          <button
            type="button"
            aria-label={`Favorite ${track.title}`}
            onClick={() => onFavorite?.(track)}
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          >
            <Heart
              className={[
                "h-5 w-5",
                track.isFavorite
                  ? "fill-[var(--color-danger)] text-[var(--color-danger)]"
                  : "fill-none",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      <Image
        src={track.cover}
        alt=""
        width={200}
        height={200}
        loading="eager"
        priority
        className="order-1 h-[200px] w-[200px] shrink-0 rounded-[var(--radius-lg)] object-cover md:order-2"
      />
    </section>
  );
}
