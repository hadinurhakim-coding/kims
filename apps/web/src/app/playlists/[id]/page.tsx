"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Music, Play, Shuffle, Trash2 } from "lucide-react";
import { CatalogLayout } from "@/components/catalog/CatalogLayout";
import { PageHeader } from "@/components/catalog/PageHeader";
import {
  SortControls,
  type SortKey,
  type SortOrder,
} from "@/components/catalog/SortControls";
import { TrackItem } from "@/components/catalog/TrackItem";
import { CreatePlaylistModal } from "@/components/playlist/CreatePlaylistModal";
import { AppShell } from "@/components/shell/AppShell";
import { BottomPlayer } from "@/components/shell/BottomPlayer";
import { RightPanel } from "@/components/shell/RightPanel";
import { useAudio } from "@/context/AudioContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useHistory } from "@/context/HistoryContext";
import { usePlaylists } from "@/context/PlaylistContext";
import { useTracks } from "@/context/TracksContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { Track } from "@/data/tracks";

function parseDuration(duration: string) {
  const [minutes, seconds] = duration.split(":").map(Number);

  return minutes * 60 + seconds;
}

export default function PlaylistDetailPage() {
  const { isChecking } = useAuthGuard();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const playlistId = params.id;
  const {
    playlists,
    createPlaylist,
    getPlaylistTracks,
    deletePlaylist,
    removeTrackFromPlaylist,
  } = usePlaylists();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { history } = useHistory();
  const { tracks } = useTracks();
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const playlist = playlists.find(
    (currentPlaylist) => currentPlaylist.id === playlistId,
  );

  const sortedTracks = useMemo(() => {
    const currentPlaylist = playlists.find(
      (nextPlaylist) => nextPlaylist.id === playlistId,
    );

    if (!currentPlaylist) return [];

    const baseTracks = getPlaylistTracks(currentPlaylist.id);

    if (sortKey === "default") {
      return sortOrder === "desc" ? [...baseTracks].reverse() : baseTracks;
    }

    const sortedTracks = [...baseTracks].sort((firstTrack, secondTrack) => {
      if (sortKey === "duration") {
        return (
          parseDuration(firstTrack.duration) -
          parseDuration(secondTrack.duration)
        );
      }

      if (sortKey === "mood") {
        return firstTrack.mood.localeCompare(secondTrack.mood);
      }

      if (sortKey === "license") {
        return firstTrack.licenseLabel.localeCompare(secondTrack.licenseLabel);
      }

      return 0;
    });

    return sortOrder === "desc" ? sortedTracks.reverse() : sortedTracks;
  }, [getPlaylistTracks, playlistId, playlists, sortKey, sortOrder]);

  const coverTracks = useMemo(() => {
    if (!playlist) return [];

    return getPlaylistTracks(playlist.id).slice(0, 4);
  }, [getPlaylistTracks, playlist]);

  const recentTracks = useMemo(
    () =>
      history
        .filter(
          (entry, index, self) =>
            index === self.findIndex((item) => item.trackId === entry.trackId),
        )
        .slice(0, 10)
        .map((entry) => tracks.find((track) => track.id === entry.trackId))
        .filter((track): track is Track => Boolean(track)),
    [history, tracks],
  );

  function handleSortChange(nextSortKey: SortKey, nextSortOrder: SortOrder) {
    setSortKey(nextSortKey);
    setSortOrder(nextSortOrder);
  }

  function handlePlayTrack(track: Track) {
    setSelectedTrack(track);
    playTrack(track);
  }

  function toggleTrackPreview(track: Track) {
    setSelectedTrack(track);

    if (currentTrack?.id === track.id) {
      togglePlayPause();
      return;
    }

    handlePlayTrack(track);
  }

  function handlePlayAll() {
    if (sortedTracks.length === 0) return;

    handlePlayTrack(sortedTracks[0]);
  }

  function handleShuffle() {
    if (sortedTracks.length === 0) return;

    const shuffledTracks = [...sortedTracks].sort(() => Math.random() - 0.5);

    handlePlayTrack(shuffledTracks[0]);
  }

  async function handleDeletePlaylist() {
    if (!playlist) return;

    await deletePlaylist(playlist.id);
    router.push("/playlists");
  }

  async function handleRemoveTrack(track: Track) {
    if (!playlist) return;

    await removeTrackFromPlaylist(playlist.id, track.id);
  }

  async function handleCreatePlaylist(name: string) {
    await createPlaylist(name);
    setIsModalOpen(false);
  }

  if (isChecking) return null;

  if (!playlist) {
    return (
      <AppShell
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        rightPanel={
          <RightPanel recentTracks={recentTracks} onSelect={handlePlayTrack} />
        }
        bottomPlayer={null}
      >
        <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 pb-6 pt-6 text-center md:px-6 lg:px-8">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            Playlist not found
          </p>
          <button
            type="button"
            onClick={() => router.push("/playlists")}
            className="rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            Back to Playlists
          </button>
        </div>
      </AppShell>
    );
  }

  const createdAt = new Date(playlist.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const trackLabel = sortedTracks.length === 1 ? "track" : "tracks";

  return (
    <AppShell
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      rightPanel={
        <RightPanel recentTracks={recentTracks} onSelect={handlePlayTrack} />
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
          currentTrack ? "pb-40" : "pb-6",
        ].join(" ")}
      >
        <CatalogLayout
          pageHeader={
            <PageHeader
              title={playlist.name}
              trackCount={sortedTracks.length}
              actions={
                <button
                  type="button"
                  onClick={handleDeletePlaylist}
                  className="flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-danger)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-surface))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Playlist</span>
                </button>
              }
            />
          }
          sortControls={
            <SortControls
              options={["default", "duration", "mood", "license"]}
              onSortChange={handleSortChange}
            />
          }
        >
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-6 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)] md:flex-row md:items-center md:p-6">
              <div className="grid h-[240px] w-[240px] shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-border)]">
                {coverTracks.length === 0 ? (
                  <div className="flex h-[240px] w-[240px] items-center justify-center text-[var(--color-text-muted)]">
                    <Music className="h-16 w-16" />
                  </div>
                ) : (
                  <div className="grid h-[240px] w-[240px] grid-cols-2 grid-rows-2">
                    {Array.from({ length: 4 }, (_, index) => {
                      const track = coverTracks[index];

                      return track ? (
                        <Image
                          key={track.id}
                          src={track.cover}
                          alt=""
                          width={120}
                          height={120}
                          className="h-[120px] w-[120px] object-cover"
                        />
                      ) : (
                        <div
                          key={`placeholder-${index}`}
                          className="h-[120px] w-[120px] bg-[var(--color-border)]"
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                    Playlist
                  </span>
                  <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
                    {playlist.name}
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {sortedTracks.length} {trackLabel} &middot; {createdAt}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePlayAll}
                    disabled={sortedTracks.length === 0}
                    className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                  >
                    <Play className="h-4 w-4 fill-[var(--color-surface)]" />
                    <span>Play All</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShuffle}
                    disabled={sortedTracks.length === 0}
                    className="flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                  >
                    <Shuffle className="h-4 w-4" />
                    <span>Shuffle</span>
                  </button>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Tracks
              </h2>

              {sortedTracks.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
                  <Music className="h-16 w-16 text-[var(--color-text-muted)]" />
                  <div className="flex flex-col items-center gap-2">
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                      No tracks in this playlist yet
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Add tracks from the catalog
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                  >
                    Explore Tracks
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sortedTracks.map((track, index) => (
                    <TrackItem
                      key={track.id}
                      track={{ ...track, isFavorite: isFavorite(track.id) }}
                      rank={index + 1}
                      isSelected={selectedTrack?.id === track.id}
                      isPlaying={currentTrack?.id === track.id && isPlaying}
                      onSelect={handlePlayTrack}
                      onFavorite={(nextTrack) => toggleFavorite(nextTrack.id)}
                      onPreview={toggleTrackPreview}
                      onRemove={handleRemoveTrack}
                      onCreatePlaylist={() => setIsModalOpen(true)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </CatalogLayout>
      </div>

      <CreatePlaylistModal
        isOpen={isModalOpen}
        onConfirm={handleCreatePlaylist}
        onCancel={() => setIsModalOpen(false)}
      />
    </AppShell>
  );
}
