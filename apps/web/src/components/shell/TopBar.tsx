"use client";

import { Bell, Moon, Search, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePlaylists } from "@/context/PlaylistContext";
import { useTheme } from "@/context/ThemeContext";

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
  "/admin": "Admin",
};

export function TopBar({ searchQuery = "", onSearch }: TopBarProps) {
  const pathname = usePathname();
  const { playlists } = usePlaylists();
  const { mounted, resolvedTheme, themePreference, toggleTheme } = useTheme();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
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
  const showDarkThemeIcon = mounted && resolvedTheme === "dark";

  return (
    <div className="relative flex h-full items-center gap-3 px-4 md:gap-4 md:px-6">
      <div className="min-w-0 shrink text-xl font-semibold text-[var(--color-text-primary)]">
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
        {onSearch ? (
          <button
            type="button"
            aria-label="Search"
            aria-expanded={isMobileSearchOpen}
            onClick={() => setIsMobileSearchOpen((isOpen) => !isOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] sm:hidden"
          >
            <Search className="h-5 w-5" />
          </button>
        ) : null}

        <button
          type="button"
          aria-label={
            mounted ? `Theme is ${themePreference}. Switch theme` : "Toggle theme"
          }
          onClick={toggleTheme}
          className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] sm:h-10 sm:min-w-0 sm:px-2.5"
        >
          {showDarkThemeIcon ? (
            <Moon className="h-4 w-4 text-[var(--color-accent-primary)]" />
          ) : (
            <Sun className="h-4 w-4 text-[var(--color-accent-primary)]" />
          )}
          <span className="hidden sm:inline">
            {mounted
              ? themePreference === "system"
                ? "System"
                : themePreference === "dark"
                  ? "Dark"
                  : "Light"
              : null}
          </span>
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="hidden h-10 w-10 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] sm:flex"
        >
          <Bell className="h-5 w-5" />
        </button>

        <button
          type="button"
          aria-label="User menu"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-border)] text-sm font-semibold text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] sm:h-10 sm:w-10"
        >
          KM
        </button>
      </div>

      {isMobileSearchOpen && onSearch ? (
        <div className="absolute left-3 right-3 top-[calc(100%+0.5rem)] z-50 sm:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              aria-label="Search library"
              type="search"
              value={searchQuery}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search tracks..."
              className="h-11 w-full rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-11 pr-4 text-sm text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] outline-none placeholder:text-[var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
