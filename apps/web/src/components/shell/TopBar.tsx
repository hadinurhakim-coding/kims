"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePlaylists } from "@/context/PlaylistContext";

export interface TopBarProps {
  searchQuery?: string;
  onSearch?: (value: string) => void;
}

const routeTitles: Record<string, string> = {
  "/": "Discover",
  "/music": "Music",
  "/sfx": "Sound Effects",
  "/lofi": "Lofi",
  "/cinematic": "Cinematic",
  "/favorites": "Favorites",
  "/playlists": "Playlists",
  "/history": "History",
};

export function TopBar({ searchQuery = "", onSearch }: TopBarProps) {
  const pathname = usePathname();
  const { playlists } = usePlaylists();
  const playlistId = pathname.startsWith("/playlists/")
    ? pathname.split("/")[2]
    : null;
  const playlist = playlistId
    ? playlists.find((currentPlaylist) => currentPlaylist.id === playlistId)
    : null;
  const title =
    pathname === "/playlists"
      ? "Playlists"
      : playlistId
        ? playlist?.name ?? "Playlist"
        : routeTitles[pathname] ?? "Discover";

  return (
    <div className="flex h-full items-center gap-4 px-4 md:px-6">
      <div className="shrink-0 text-xl font-semibold text-[var(--color-text-primary)]">
        {title}
      </div>

      <div className="relative mx-auto hidden w-full max-w-xl sm:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          aria-label="Search library"
          type="search"
          value={searchQuery}
          onChange={(event) => onSearch?.(event.target.value)}
          placeholder="Search tracks, sound effects, moods..."
          className="h-10 w-full rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-11 pr-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
        >
          <Bell className="h-5 w-5" />
        </button>

        <button
          type="button"
          aria-label="User menu"
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-border)] text-sm font-semibold text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
        >
          KM
        </button>
      </div>
    </div>
  );
}
