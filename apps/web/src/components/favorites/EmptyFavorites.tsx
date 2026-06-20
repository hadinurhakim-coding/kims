"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

export interface EmptyFavoritesProps {
  onExplore?: () => void;
}

export function EmptyFavorites({ onExplore }: EmptyFavoritesProps) {
  const router = useRouter();

  function handleExplore() {
    if (onExplore) {
      onExplore();
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
      <Heart
        className="h-16 w-16 text-[var(--color-danger)]"
        strokeWidth={1.5}
      />
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
          No favorites yet
        </h2>
        <p className="max-w-[280px] text-sm text-[var(--color-text-muted)]">
          Start exploring and heart the tracks you love
        </p>
      </div>
      <button
        type="button"
        onClick={handleExplore}
        className="rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        Explore Tracks
      </button>
    </div>
  );
}
