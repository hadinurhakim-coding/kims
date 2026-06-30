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
    <section className="explore-compact-hero relative isolate overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_88%_42%,rgba(106,155,204,0.24),transparent_26%),radial-gradient(circle_at_12%_8%,rgba(230,125,34,0.18),transparent_24%),linear-gradient(112deg,#141413_0%,#0D0D0D_58%,#141413_100%)] p-4 text-[#F5E6D3] shadow-[0_18px_42px_rgba(13,13,13,0.28)] md:p-6">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(20,20,19,0.12),rgba(20,20,19,0.02)_62%)]" />
      <div className="explore-compact-hero-inner flex flex-col items-center gap-5 md:flex-row md:justify-between md:gap-8">
        <div className="order-2 flex w-full flex-col justify-center md:order-1">
          <div className="mb-2 text-xs font-black uppercase tracking-wide text-[#FFB38A] drop-shadow-sm md:text-sm">
            {eyebrow}
          </div>
          <h1 className="explore-compact-hero-title max-w-2xl text-3xl font-black leading-tight text-[#F5E6D3] drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)] md:text-5xl">
            {track.title}
          </h1>
          <div className="explore-compact-hero-meta mt-2 text-base font-medium text-[#F5E6D3]/80 md:text-xl">
            {track.type} &middot; {track.mood}
          </div>
          {supportingText ? (
            <p className="explore-compact-hero-support mt-1 max-w-2xl text-sm leading-6 text-[#F5E6D3]/78 md:text-lg">
              {supportingText}
            </p>
          ) : null}

          <span className="explore-compact-hero-badge mt-4 w-fit rounded-[var(--radius-full)] border border-[#E8E6DC]/20 bg-[#FAF9F5]/8 px-3 py-1 text-sm font-black text-[#F5E6D3] drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] md:text-lg">
            {track.licenseLabel}
          </span>

          <div className="explore-compact-hero-actions mt-5 flex items-center gap-3">
            <button
              type="button"
              aria-label={`Play ${track.title}`}
              onClick={() => onPlay?.(track)}
              className="flex h-12 items-center gap-3 rounded-[var(--radius-full)] bg-[#E67D22] px-6 text-sm font-black text-[#0D0D0D] shadow-[0_12px_28px_rgba(230,125,34,0.32)] transition hover:bg-[#FFB38A] hover:shadow-[0_16px_36px_rgba(230,125,34,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5E6D3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141413] md:h-14 md:px-8 md:text-base"
            >
              <Play className="h-5 w-5 fill-[#0D0D0D]" />
              <span>Play Now</span>
            </button>

            <button
              type="button"
              aria-label={`Favorite ${track.title}`}
              onClick={() => onFavorite?.(track)}
              className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-full)] border border-[#E8E6DC]/24 bg-[#FAF9F5]/8 text-[#F5E6D3]/85 backdrop-blur transition hover:bg-[#FAF9F5]/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5E6D3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141413] md:h-14 md:w-14"
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

        <div className="explore-compact-hero-art order-1 shrink-0 rounded-[24px] bg-[#FAF9F5]/8 p-2 shadow-[0_0_34px_rgba(217,119,87,0.2),0_18px_44px_rgba(0,0,0,0.28)] ring-1 ring-[#E8E6DC]/18 md:order-2">
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
