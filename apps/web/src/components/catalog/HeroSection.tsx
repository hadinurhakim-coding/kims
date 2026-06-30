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
    <section className="explore-compact-hero relative isolate overflow-hidden rounded-[18px] bg-[linear-gradient(112deg,#141413_0%,#0D0D0D_58%,#141413_100%)] p-3 text-[#F5E6D3] shadow-[0_8px_18px_rgba(13,13,13,0.18)] md:rounded-[26px] md:bg-[radial-gradient(circle_at_88%_42%,rgba(106,155,204,0.24),transparent_26%),radial-gradient(circle_at_12%_8%,rgba(230,125,34,0.18),transparent_24%),linear-gradient(112deg,#141413_0%,#0D0D0D_58%,#141413_100%)] md:p-6 md:shadow-[0_18px_42px_rgba(13,13,13,0.28)]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(20,20,19,0.12),rgba(20,20,19,0.02)_62%)]" />
      <div className="explore-compact-hero-inner grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 md:flex md:flex-row md:justify-between md:gap-8">
        <div className="order-2 flex w-full flex-col justify-center md:order-1">
          <div className="mb-1 text-[10px] font-black uppercase leading-none tracking-wide text-[#FFB38A] drop-shadow-sm md:mb-2 md:text-sm">
            {eyebrow}
          </div>
          <h1 className="explore-compact-hero-title max-w-2xl truncate text-lg font-black leading-6 text-[#F5E6D3] drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)] md:whitespace-normal md:text-5xl md:leading-tight">
            {track.title}
          </h1>
          <div className="explore-compact-hero-meta mt-1 truncate text-xs font-medium text-[#F5E6D3]/80 md:mt-2 md:text-xl">
            {track.type} &middot; {track.mood}
          </div>
          {supportingText ? (
            <p className="explore-compact-hero-support mt-0.5 max-w-2xl truncate text-xs leading-5 text-[#F5E6D3]/78 md:mt-1 md:whitespace-normal md:text-lg md:leading-6">
              {supportingText}
            </p>
          ) : null}

          <span className="explore-compact-hero-badge mt-2 hidden w-fit rounded-[var(--radius-full)] border border-[#E8E6DC]/20 bg-[#FAF9F5]/8 px-3 py-1 text-sm font-black text-[#F5E6D3] sm:inline-flex md:mt-4 md:text-lg md:drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            {track.licenseLabel}
          </span>

          <div className="explore-compact-hero-actions mt-2 flex items-center gap-2 md:mt-5 md:gap-3">
            <button
              type="button"
              aria-label={`Play ${track.title}`}
              onClick={() => onPlay?.(track)}
              className="flex h-10 items-center gap-2 rounded-[var(--radius-full)] bg-[#E67D22] px-4 text-sm font-black text-[#0D0D0D] shadow-[0_6px_14px_rgba(230,125,34,0.22)] transition hover:bg-[#FFB38A] hover:shadow-[0_10px_24px_rgba(230,125,34,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5E6D3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141413] md:h-14 md:gap-3 md:px-8 md:text-base"
            >
              <Play className="h-4 w-4 fill-[#0D0D0D] md:h-5 md:w-5" />
              <span>Play Now</span>
            </button>

            <button
              type="button"
              aria-label={`Favorite ${track.title}`}
              onClick={() => onFavorite?.(track)}
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-full)] border border-[#E8E6DC]/24 bg-[#FAF9F5]/8 text-[#F5E6D3]/85 backdrop-blur transition hover:bg-[#FAF9F5]/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5E6D3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141413] md:h-14 md:w-14"
            >
              <Heart
                className={[
                  "h-5 w-5 md:h-6 md:w-6",
                  track.isFavorite
                    ? "fill-[var(--color-danger)] text-[var(--color-danger)]"
                    : "fill-none",
                ].join(" ")}
              />
            </button>
          </div>
        </div>

        <div className="explore-compact-hero-art order-1 shrink-0 rounded-[16px] bg-[#FAF9F5]/8 p-0 shadow-[0_8px_18px_rgba(0,0,0,0.18)] ring-1 ring-[#E8E6DC]/18 md:order-2 md:rounded-[24px] md:p-2 md:shadow-[0_0_34px_rgba(217,119,87,0.2),0_18px_44px_rgba(0,0,0,0.28)]">
          <Image
            src={track.cover}
            alt=""
            width={220}
            height={220}
            loading="eager"
            priority
            sizes="(max-width: 767px) 80px, 220px"
            className="explore-compact-hero-cover h-20 w-20 rounded-[12px] object-cover md:h-[220px] md:w-[220px] md:rounded-[20px]"
          />
        </div>
      </div>
    </section>
  );
}
