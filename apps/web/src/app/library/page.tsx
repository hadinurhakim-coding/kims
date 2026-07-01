"use client";

import { useMemo, useState } from "react";
import { Clock3, Heart, Library, ListMusic, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CatalogLayout } from "@/components/catalog/CatalogLayout";
import { FilterChips } from "@/components/catalog/FilterChips";
import { AppShell } from "@/components/shell/AppShell";
import { BottomPlayer } from "@/components/shell/BottomPlayer";
import { RightPanel } from "@/components/shell/RightPanel";
import { useAudio } from "@/context/AudioContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useHistory } from "@/context/HistoryContext";
import { type Playlist, usePlaylists } from "@/context/PlaylistContext";
import { useTracks } from "@/context/TracksContext";
import type { Track } from "@/data/tracks";
import { useAuthGuard } from "@/hooks/useAuthGuard";

type LibraryFilter = "All" | "Favorites" | "Playlists" | "Recent";

const libraryFilters: LibraryFilter[] = [
  "All",
  "Favorites",
  "Playlists",
  "Recent",
];

function formatRelativeTime(isoDate: string): string {
  const played = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - played.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hrs ago`;

  return played.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function EmptyLibraryState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof Library;
  title: string;
  body: string;
  action?: {
    href: string;
    label: string;
  };
}) {
  return (
    <div className="flex min-h-[124px] flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-center">
      <Icon className="h-8 w-8 text-[var(--color-text-muted)]" />
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="text-sm leading-5 text-[var(--color-text-muted)]">
          {body}
        </p>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="min-h-11 rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function SectionHeader({
  title,
  count,
  href,
}: {
  title: string;
  count: number;
  href?: string;
}) {
  const label = count === 1 ? "item" : "items";

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">
          {title}
        </h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          {count} {label}
        </p>
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 rounded-[var(--radius-full)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_8%,var(--color-surface))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
        >
          View all
        </Link>
      ) : null}
    </div>
  );
}

function LibraryTrackRow({
  track,
  isFavorite,
  isPlaying,
  supportingText,
  onPlay,
  onFavorite,
}: {
  track: Track;
  isFavorite: boolean;
  isPlaying: boolean;
  supportingText?: string;
  onPlay: (track: Track) => void;
  onFavorite: (track: Track) => void;
}) {
  const PlayIcon = isPlaying ? Pause : Play;

  return (
    <div className="flex min-h-[64px] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2">
      <Image
        src={track.cover}
        alt={track.title}
        width={48}
        height={48}
        sizes="48px"
        className="h-12 w-12 shrink-0 rounded-[var(--radius-md)] object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold leading-5 text-[var(--color-text-primary)]">
          {track.title}
        </div>
        <div className="truncate text-xs leading-4 text-[var(--color-text-muted)]">
          {supportingText ?? `${track.type} · ${track.mood}`}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`${isPlaying ? "Pause" : "Play"} ${track.title}`}
          onClick={() => onPlay(track)}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
        >
          <PlayIcon className="h-5 w-5 fill-current" />
        </button>
        <button
          type="button"
          aria-label={`${isFavorite ? "Remove" : "Add"} ${track.title} ${isFavorite ? "from" : "to"} favorites`}
          onClick={() => onFavorite(track)}
          className={[
            "flex h-11 w-11 items-center justify-center rounded-[var(--radius-full)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
            isFavorite
              ? "text-[var(--color-danger)]"
              : "text-[var(--color-text-muted)]",
          ].join(" ")}
        >
          <Heart
            className="h-5 w-5"
            fill={isFavorite ? "var(--color-danger)" : "none"}
          />
        </button>
      </div>
    </div>
  );
}

function LibraryPlaylistRow({
  playlist,
  tracks,
  onOpen,
}: {
  playlist: Playlist;
  tracks: Track[];
  onOpen: (playlist: Playlist) => void;
}) {
  const coverTracks = playlist.trackIds
    .slice(0, 4)
    .map((id) => tracks.find((track) => track.id === id))
    .filter((track): track is Track => Boolean(track));
  const trackLabel = playlist.trackIds.length === 1 ? "track" : "tracks";

  return (
    <button
      type="button"
      onClick={() => onOpen(playlist)}
      className="flex min-h-[64px] w-full items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-left transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
    >
      <div className="grid h-12 w-12 shrink-0 grid-cols-2 grid-rows-2 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-border)]">
        {coverTracks.length === 0 ? (
          <div className="col-span-2 row-span-2 flex items-center justify-center text-[var(--color-text-muted)]">
            <ListMusic className="h-5 w-5" />
          </div>
        ) : (
          Array.from({ length: 4 }, (_, index) => {
            const track = coverTracks[index];

            return track ? (
              <Image
                key={track.id}
                src={track.cover}
                alt=""
                width={24}
                height={24}
                sizes="24px"
                className="h-6 w-6 object-cover"
              />
            ) : (
              <div
                key={`playlist-cover-${playlist.id}-${index}`}
                className="h-6 w-6 bg-[var(--color-border)]"
              />
            );
          })
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold leading-5 text-[var(--color-text-primary)]">
          {playlist.name}
        </div>
        <div className="truncate text-xs leading-4 text-[var(--color-text-muted)]">
          {playlist.trackIds.length} {trackLabel}
        </div>
      </div>
    </button>
  );
}

export default function LibraryPage() {
  const { isChecking } = useAuthGuard();
  const router = useRouter();
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const { favoritedIds, isFavorite, toggleFavorite } = useFavorites();
  const { history } = useHistory();
  const { playlists } = usePlaylists();
  const { tracks } = useTracks();
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const trackById = useMemo(
    () => new Map(tracks.map((track) => [track.id, track])),
    [tracks],
  );

  const favoritedTracks = useMemo(
    () =>
      [...favoritedIds]
        .map((id) => trackById.get(id))
        .filter((track): track is Track => Boolean(track)),
    [favoritedIds, trackById],
  );

  const recentEntries = useMemo(() => {
    const seenTrackIds = new Set<string>();

    return history
      .filter((entry) => {
        if (seenTrackIds.has(entry.trackId)) return false;
        seenTrackIds.add(entry.trackId);
        return trackById.has(entry.trackId);
      })
      .slice(0, 8)
      .map((entry) => ({
        entry,
        track: trackById.get(entry.trackId) as Track,
      }));
  }, [history, trackById]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleFavoritedTracks = useMemo(
    () =>
      normalizedQuery === ""
        ? favoritedTracks
        : favoritedTracks.filter(
            (track) =>
              track.title.toLowerCase().includes(normalizedQuery) ||
              track.type.toLowerCase().includes(normalizedQuery) ||
              track.mood.toLowerCase().includes(normalizedQuery),
          ),
    [favoritedTracks, normalizedQuery],
  );
  const visiblePlaylists = useMemo(
    () =>
      normalizedQuery === ""
        ? playlists
        : playlists.filter((playlist) =>
            playlist.name.toLowerCase().includes(normalizedQuery),
          ),
    [normalizedQuery, playlists],
  );
  const visibleRecentEntries = useMemo(
    () =>
      normalizedQuery === ""
        ? recentEntries
        : recentEntries.filter(
            ({ track }) =>
              track.title.toLowerCase().includes(normalizedQuery) ||
              track.type.toLowerCase().includes(normalizedQuery) ||
              track.mood.toLowerCase().includes(normalizedQuery),
          ),
    [normalizedQuery, recentEntries],
  );

  const totalVisibleItems =
    visibleFavoritedTracks.length +
    visiblePlaylists.length +
    visibleRecentEntries.length;
  const shouldShowFavorites =
    activeFilter === "All" || activeFilter === "Favorites";
  const shouldShowPlaylists =
    activeFilter === "All" || activeFilter === "Playlists";
  const shouldShowRecent = activeFilter === "All" || activeFilter === "Recent";
  const isSearching = normalizedQuery !== "";

  function handlePlayTrack(track: Track) {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
      return;
    }

    playTrack(track);
  }

  if (isChecking) return null;

  return (
    <AppShell
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      rightPanel={
        <RightPanel
          recentTracks={recentEntries.map(({ track }) => track)}
          onSelect={playTrack}
        />
      }
      bottomPlayer={
        currentTrack ? (
          <BottomPlayer onFavorite={(track) => toggleFavorite(track.id)} />
        ) : null
      }
    >
      <div
        className={[
          "mx-auto w-full max-w-6xl px-4 pt-6 md:px-6 lg:px-8",
          currentTrack ? "pb-40" : "pb-24 lg:pb-6",
        ].join(" ")}
      >
        <CatalogLayout
          pageHeader={
            <header className="border-b border-[var(--color-border)] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    Library
                  </h1>
                  <p className="mt-1 text-sm leading-5 text-[var(--color-text-muted)]">
                    Saved tracks, sound effects, playlists, and recent activity.
                  </p>
                </div>
                <span className="shrink-0 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1 text-sm text-[var(--color-text-muted)]">
                  {totalVisibleItems} items
                </span>
              </div>
            </header>
          }
          filterChips={
            <FilterChips
              options={libraryFilters}
              value={activeFilter}
              onChange={(value) => setActiveFilter(value as LibraryFilter)}
              label="Collection"
            />
          }
        >
          <div className="flex flex-col gap-6">
            {shouldShowFavorites ? (
              <section className="flex flex-col gap-3">
                <SectionHeader
                  title="Favorites"
                  count={visibleFavoritedTracks.length}
                  href="/favorites"
                />
                {visibleFavoritedTracks.length === 0 ? (
                  <EmptyLibraryState
                    icon={Heart}
                    title={
                      isSearching
                        ? "No saved items match your search"
                        : "No favorites yet"
                    }
                    body={
                      isSearching
                        ? "Try another track, mood, or sound type."
                        : "Tap the heart on music or sound effects to keep them here."
                    }
                    action={
                      isSearching
                        ? undefined
                        : { href: "/", label: "Explore catalog" }
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {visibleFavoritedTracks.slice(0, 6).map((track) => (
                      <LibraryTrackRow
                        key={track.id}
                        track={track}
                        isFavorite={isFavorite(track.id)}
                        isPlaying={currentTrack?.id === track.id && isPlaying}
                        onPlay={handlePlayTrack}
                        onFavorite={(nextTrack) => toggleFavorite(nextTrack.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {shouldShowPlaylists ? (
              <section className="flex flex-col gap-3">
                <SectionHeader
                  title="Playlists"
                  count={visiblePlaylists.length}
                  href="/playlists"
                />
                {visiblePlaylists.length === 0 ? (
                  <EmptyLibraryState
                    icon={ListMusic}
                    title={
                      isSearching
                        ? "No playlists match your search"
                        : "No playlists yet"
                    }
                    body={
                      isSearching
                        ? "Try searching by playlist name."
                        : "Create playlists to group music, SFX, and creator assets."
                    }
                    action={
                      isSearching
                        ? undefined
                        : { href: "/playlists", label: "Create playlist" }
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {visiblePlaylists.slice(0, 6).map((playlist) => (
                      <LibraryPlaylistRow
                        key={playlist.id}
                        playlist={playlist}
                        tracks={tracks}
                        onOpen={(nextPlaylist) =>
                          router.push(`/playlists/${nextPlaylist.id}`)
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {shouldShowRecent ? (
              <section className="flex flex-col gap-3">
                <SectionHeader
                  title="Recent activity"
                  count={visibleRecentEntries.length}
                  href="/history"
                />
                {visibleRecentEntries.length === 0 ? (
                  <EmptyLibraryState
                    icon={Clock3}
                    title={
                      isSearching
                        ? "No recent activity matches your search"
                        : "No recent activity yet"
                    }
                    body={
                      isSearching
                        ? "Recent tracks and effects matching your query will appear here."
                        : "Tracks and sound effects you play will show up here."
                    }
                    action={
                      isSearching
                        ? undefined
                        : { href: "/", label: "Start listening" }
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {visibleRecentEntries.map(({ entry, track }) => (
                      <LibraryTrackRow
                        key={entry.id}
                        track={track}
                        isFavorite={isFavorite(track.id)}
                        isPlaying={currentTrack?.id === track.id && isPlaying}
                        supportingText={`${track.type} · ${formatRelativeTime(
                          entry.playedAt,
                        )}`}
                        onPlay={handlePlayTrack}
                        onFavorite={(nextTrack) => toggleFavorite(nextTrack.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : null}
          </div>
        </CatalogLayout>
      </div>
    </AppShell>
  );
}
