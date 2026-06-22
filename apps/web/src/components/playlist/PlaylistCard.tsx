"use client";

import type { Playlist } from "@/context/PlaylistContext";
import type { Track } from "@/data/tracks";
import { Music, X } from "lucide-react";
import Image from "next/image";
import type { MouseEvent } from "react";

export interface PlaylistCardProps {
  playlist: Playlist;
  tracks: Track[];
  onClick?: (playlist: Playlist) => void;
  onDelete?: (id: string) => void;
}

export function PlaylistCard({
  playlist,
  tracks,
  onClick,
  onDelete,
}: PlaylistCardProps) {
  const coverTracks = playlist.trackIds
    .slice(0, 4)
    .map((id) => tracks.find((track) => track.id === id))
    .filter(Boolean) as Track[];
  const trackLabel = playlist.trackIds.length === 1 ? "track" : "tracks";
  const createdAt = new Date(playlist.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onDelete?.(playlist.id);
  }

  return (
    <div className="group relative w-[160px]">
      <button
        type="button"
        onClick={() => onClick?.(playlist)}
        className="flex w-full flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] text-left shadow-[var(--shadow-md)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[var(--shadow-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <div className="grid h-[160px] w-[160px] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-border)]">
          {coverTracks.length === 0 ? (
            <div className="flex h-[160px] w-[160px] items-center justify-center bg-[var(--color-border)] text-[var(--color-text-muted)]">
              <Music className="h-10 w-10" />
            </div>
          ) : (
            <div className="grid h-[160px] w-[160px] grid-cols-2 grid-rows-2">
              {Array.from({ length: 4 }, (_, index) => {
                const track = coverTracks[index];

                return track ? (
                  <Image
                    key={track.id}
                    src={`https://picsum.photos/seed/${track.id}/80/80`}
                    alt=""
                    width={80}
                    height={80}
                    className="h-20 w-20 object-cover"
                  />
                ) : (
                  <div
                    key={`placeholder-${index}`}
                    className="h-20 w-20 bg-[var(--color-border)]"
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1 px-1 pb-1">
          <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {playlist.name}
          </div>
          <div className="truncate text-xs text-[var(--color-text-muted)]">
            {playlist.trackIds.length} {trackLabel} &middot; {createdAt}
          </div>
        </div>
      </button>

      <button
        type="button"
        aria-label={`Delete ${playlist.name}`}
        onClick={handleDelete}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-danger)] text-[var(--color-surface)] opacity-0 shadow-[var(--shadow-sm)] transition-opacity duration-200 hover:bg-[color-mix(in_srgb,var(--color-danger)_84%,var(--color-text-primary))] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
