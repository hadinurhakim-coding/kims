"use client";

import type { Track } from "@/data/tracks";
import { Heart, Play } from "lucide-react";
import Image from "next/image";

export interface CinematicHeroProps {
  track: Track;
  onPlay?: (track: Track) => void;
  onFavorite?: (track: Track) => void;
}

const licenseBadgeClasses: Record<Track["licenseLabel"], string> = {
  "No Attribution": "bg-[rgba(13,148,136,0.24)]",
  "Commercial Use": "bg-[rgba(37,99,235,0.24)]",
  "Attribution Required": "bg-[rgba(255,255,255,0.16)]",
};

export function CinematicHero({
  track,
  onPlay,
  onFavorite,
}: CinematicHeroProps) {
  return (
    <section className="relative h-[320px] w-full overflow-hidden rounded-[var(--radius-lg)]">
      <Image
        src="/placeholder-cover.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 900px, 100vw"
        className="absolute inset-0 object-cover"
        priority
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.1)_100%)]" />

      <div className="relative z-10 flex h-full max-w-xl flex-col justify-center px-6 py-8 md:px-10">
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/60">
          Featured Collection
        </div>
        <h1 className="text-4xl font-bold text-white">{track.title}</h1>
        <div className="mt-3 text-sm text-white/70">{track.mood}</div>

        <span
          className={[
            "mt-5 w-fit rounded-[var(--radius-full)] border border-white/35 px-3 py-1 text-xs font-medium text-white",
            licenseBadgeClasses[track.licenseLabel],
          ].join(" ")}
        >
          {track.licenseLabel}
        </span>

        <div className="mt-7 flex items-center gap-3">
          <button
            type="button"
            aria-label={`Play ${track.title}`}
            onClick={() => onPlay?.(track)}
            className="flex h-11 items-center gap-2 rounded-[var(--radius-full)] bg-white px-5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <Play className="h-4 w-4 fill-[var(--color-text-primary)]" />
            <span>Play Now</span>
          </button>

          <button
            type="button"
            aria-label={`Favorite ${track.title}`}
            onClick={() => onFavorite?.(track)}
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-full)] border border-white/60 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
    </section>
  );
}
