"use client";

import { useMemo, useState } from "react";
import { CatalogLayout } from "@/components/catalog/CatalogLayout";
import { EmptySearch } from "@/components/catalog/EmptySearch";
import { FilterChips } from "@/components/catalog/FilterChips";
import { PageHeader } from "@/components/catalog/PageHeader";
import {
  SortControls,
  type SortKey,
  type SortOrder,
} from "@/components/catalog/SortControls";
import { TrackItem } from "@/components/catalog/TrackItem";
import { EmptyFavorites } from "@/components/favorites/EmptyFavorites";
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

export default function FavoritesPage() {
  const { isChecking } = useAuthGuard();
  const { favoritedIds, isFavorite, toggleFavorite } = useFavorites();
  const { history } = useHistory();
  const { createPlaylist } = usePlaylists();
  const { tracks } = useTracks();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const favoritedTracks = useMemo(
    () =>
      [...favoritedIds]
        .map((id) => tracks.find((track) => track.id === id))
        .filter((track): track is Track => Boolean(track)),
    [favoritedIds, tracks],
  );

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

  const availableTypes = useMemo(
    () => [...new Set(favoritedTracks.map((track) => track.type as string))],
    [favoritedTracks],
  );
  const selectedFilter =
    activeFilter === "All" || availableTypes.includes(activeFilter)
      ? activeFilter
      : "All";

  const filteredTracks = useMemo(() => {
    const orderedIds = [...favoritedIds];
    const typeFilteredTracks =
      selectedFilter === "All"
        ? favoritedTracks
        : favoritedTracks.filter((track) => track.type === selectedFilter);

    const sortedTracks =
      sortKey === "default"
        ? [...typeFilteredTracks].sort(
            (firstTrack, secondTrack) =>
              orderedIds.indexOf(secondTrack.id) -
              orderedIds.indexOf(firstTrack.id),
          )
        : [...typeFilteredTracks].sort((firstTrack, secondTrack) => {
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
              return firstTrack.licenseLabel.localeCompare(
                secondTrack.licenseLabel,
              );
            }

            return 0;
          });

    return sortOrder === "desc" ? sortedTracks.reverse() : sortedTracks;
  }, [favoritedIds, selectedFilter, favoritedTracks, sortKey, sortOrder]);

  function parseDuration(duration: string) {
    const [minutes, seconds] = duration.split(":").map(Number);

    return minutes * 60 + seconds;
  }

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

  async function handleCreatePlaylist(name: string) {
    await createPlaylist(name);
    setIsModalOpen(false);
  }

  if (isChecking) return null;

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
              title="Favorites"
              trackCount={filteredTracks.length}
              actions={undefined}
            />
          }
          filterChips={
            <FilterChips
              options={["All", ...availableTypes]}
              value={selectedFilter}
              onChange={setActiveFilter}
              label="Type"
            />
          }
          sortControls={
            <SortControls
              options={["default", "duration", "mood", "license"]}
              onSortChange={handleSortChange}
            />
          }
        >
          {favoritedTracks.length === 0 ? (
            <EmptyFavorites />
          ) : filteredTracks.length === 0 ? (
            <EmptySearch
              query={activeFilter}
              onClear={() => setActiveFilter("All")}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {filteredTracks.map((track, index) => (
                <TrackItem
                  key={track.id}
                  track={{ ...track, isFavorite: isFavorite(track.id) }}
                  rank={index + 1}
                  isSelected={selectedTrack?.id === track.id}
                  isPlaying={currentTrack?.id === track.id && isPlaying}
                  onSelect={handlePlayTrack}
                  onFavorite={(nextTrack) => toggleFavorite(nextTrack.id)}
                  onPreview={toggleTrackPreview}
                  onCreatePlaylist={() => setIsModalOpen(true)}
                />
              ))}
            </div>
          )}
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
