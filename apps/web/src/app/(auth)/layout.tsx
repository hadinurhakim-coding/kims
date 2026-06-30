"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useTracks } from "@/context/TracksContext";

const featurePills = [
  "🎵 Free Forever",
  "📦 No Attribution",
  "⚡ Instant Download",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { tracks } = useTracks();
  const coverItems =
    tracks.length > 0
      ? Array.from({ length: 12 }, (_, index) => tracks[index % tracks.length])
      : [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <aside className="relative hidden w-[45%] overflow-hidden lg:block">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-4">
          {coverItems.map((track, index) => (
            <div key={`${track.id}-${index}`} className="relative">
              <Image
                src={track.cover}
                alt=""
                fill
                sizes="15vw"
                loading="eager"
                priority={index === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-[rgba(0,0,0,0.55)] backdrop-blur-[8px]" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-10 text-center">
          <div className="flex items-center justify-center gap-2 text-[var(--color-surface)]">
            <Image
              src="/KIMS_logo.svg"
              alt="KIMS"
              width={72}
              height={72}
              className="h-[72px] w-[72px] shrink-0 object-contain"
            />
            <span className="flex flex-col text-left text-2xl font-extrabold uppercase leading-none tracking-normal">
              <span>KIMS</span>
              <span>MUSIC</span>
            </span>
          </div>

          <p className="mt-4 text-sm italic text-[rgba(255,255,255,0.8)]">
            Free music for every creator
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {featurePills.map((pill) => (
              <span
                key={pill}
                className="rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.2)] px-3 py-1.5 text-xs font-medium text-[var(--color-surface)] backdrop-blur-sm"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex h-full w-full flex-col bg-[var(--color-background)] lg:w-[55%]">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <Image
              src="/KIMS_logo.svg"
              alt="KIMS"
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 object-contain"
            />
            <span className="flex flex-col text-left text-lg font-extrabold uppercase leading-none tracking-normal text-[var(--color-text-primary)]">
              <span>KIMS</span>
              <span>MUSIC</span>
            </span>
          </div>

          <div className="mx-auto w-full max-w-[400px]">{children}</div>
        </div>

        <p className="px-6 pb-6 text-center text-xs text-[var(--color-text-muted)]">
          © 2026 KIMS · Kim&apos;s Music Station
        </p>
      </main>
    </div>
  );
}
