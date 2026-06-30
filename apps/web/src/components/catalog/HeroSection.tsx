"use client";

import type { Track } from "@/data/tracks";
import { Heart, Play } from "lucide-react";
import Image from "next/image";

export interface HeroSectionProps {
  track: Track;
  eyebrow?: string;
  supportingText?: string;
  onPlay?: (track: Track) => void;
  onFavorite?: (track: Track) => void;
}

export function HeroSection({
  track,
  eyebrow = "Featured Track",
  supportingText,
  onPlay,
  onFavorite,
}: HeroSectionProps) {
  return (
    <section className="explore-compact-hero relative isolate overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_86%_46%,rgba(78,122,211,0.42),transparent_25%),linear-gradient(110deg,#170d2c_0%,#0d1641_45%,#073659_100%)] p-4 text-white shadow-[0_18px_42px_rgba(15,23,42,0.24)] md:p-6">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.18),transparent_62%)]" />
      <div className="explore-compact-hero-inner flex flex-col items-center gap-5 md:flex-row md:justify-between md:gap-8">
        <div className="order-2 flex w-full flex-col justify-center md:order-1">
          <div className="mb-2 text-xs font-black uppercase tracking-wide text-white/90 drop-shadow-sm md:text-sm">
            {eyebrow}
          </div>
          <h1 className="explore-compact-hero-title max-w-2xl text-3xl font-black leading-tight text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)] md:text-5xl">
            {track.title}
          </h1>
          <div className="explore-compact-hero-meta mt-2 text-base font-medium text-white/82 md:text-xl">
            {track.type} &middot; {track.mood}
          </div>
          {supportingText ? (
            <p className="explore-compact-hero-support mt-1 max-w-2xl text-sm leading-6 text-white/82 md:text-lg">
              {supportingText}
            </p>
          ) : null}

          <span className="explore-compact-hero-badge mt-4 w-fit text-sm font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] md:text-lg">
            {track.licenseLabel}
          </span>

          <div className="explore-compact-hero-actions mt-5 flex items-center gap-3">
            <button
              type="button"
              aria-label={`Play ${track.title}`}
              onClick={() => onPlay?.(track)}
              className="flex h-12 items-center gap-3 rounded-[var(--radius-full)] bg-[#1478ff] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(20,120,255,0.4)] transition hover:bg-[#0b68e5] hover:shadow-[0_16px_36px_rgba(20,120,255,0.48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1a44] md:h-14 md:px-8 md:text-base"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>Play Now</span>
            </button>

            <button
              type="button"
              aria-label={`Favorite ${track.title}`}
              onClick={() => onFavorite?.(track)}
              className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-full)] border border-white/28 bg-white/5 text-white/85 backdrop-blur transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1a44] md:h-14 md:w-14"
            >
              <Heart
                className={[
                  "h-6 w-6",
                  track.isFavorite
                    ? "fill-[var(--color-danger)] text-[var(--color-danger)]"
                    : "fill-none",
                ].join(" ")}
              />
            </button>
          </div>
        </div>

        <div className="explore-compact-hero-art order-1 shrink-0 rounded-[24px] bg-white/8 p-2 shadow-[0_0_34px_rgba(112,145,230,0.58),0_18px_44px_rgba(0,0,0,0.28)] ring-1 ring-white/14 md:order-2">
          <Image
            src={track.cover}
            alt=""
            width={220}
            height={220}
            loading="eager"
            priority
            className="explore-compact-hero-cover h-[170px] w-[170px] rounded-[20px] object-cover md:h-[220px] md:w-[220px]"
          />
        </div>
      </div>
    </section>
  );
}
