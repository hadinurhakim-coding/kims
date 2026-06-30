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
import { CreatePlaylistModal } from "@/components/playlist/CreatePlaylistModal";
import { AppShell } from "@/components/shell/AppShell";
import { BottomPlayer } from "@/components/shell/BottomPlayer";
import { RightPanel } from "@/components/shell/RightPanel";
import { useAudio } from "@/context/AudioContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useHistory } from "@/context/HistoryContext";
import { usePlaylists } from "@/context/PlaylistContext";
import { useTracks } from "@/context/TracksContext";
import type { Track } from "@/data/tracks";

export default function MusicPage() {
  const { isFavorite, toggleFavorite } = useFavorites();
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

  const musicTracks = useMemo(
    () => tracks.filter((track) => track.type === "Music"),
    [tracks],
  );

  const moodOptions = useMemo(
    () => ["All", ...new Set(musicTracks.map((track) => track.mood))],
    [musicTracks],
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

  const visibleTracks = useMemo(() => {
    const normalizedFilter = activeFilter.toLowerCase();
    const filteredTracks =
      normalizedFilter === "all"
        ? musicTracks
        : musicTracks.filter(
            (track) => track.mood.toLowerCase() === normalizedFilter,
          );

    if (sortKey === "default") {
      return sortOrder === "desc"
        ? [...filteredTracks].reverse()
        : filteredTracks;
    }

    const sortedTracks = [...filteredTracks].sort((firstTrack, secondTrack) => {
      if (sortKey === "duration") {
        return (
          parseDuration(firstTrack.duration) -
          parseDuration(secondTrack.duration)
        );
      }

      if (sortKey === "mood") {
        return firstTrack.mood.localeCompare(secondTrack.mood);
      }

      return firstTrack.licenseLabel.localeCompare(secondTrack.licenseLabel);
    });

    return sortOrder === "desc" ? sortedTracks.reverse() : sortedTracks;
  }, [activeFilter, musicTracks, sortKey, sortOrder]);

  function parseDuration(duration: string) {
    const [minutes, seconds] = duration.split(":").map(Number);

    return minutes * 60 + seconds;
  }

  function handleSortChange(nextSortKey: SortKey, nextSortOrder: SortOrder) {
    setSortKey(nextSortKey);
    setSortOrder(nextSortOrder);
    setActiveFilter("All");
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
              title="Music"
              trackCount={visibleTracks.length}
              actions={undefined}
            />
          }
          filterChips={
            <FilterChips
              options={moodOptions}
              value={activeFilter}
              onChange={setActiveFilter}
            />
          }
          sortControls={<SortControls onSortChange={handleSortChange} />}
        >
          <div className="flex flex-col gap-2">
            {visibleTracks.length === 0 ? (
              <EmptySearch
                query={activeFilter}
                onClear={() => setActiveFilter("All")}
              />
            ) : (
              visibleTracks.map((track, index) => (
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
              ))
            )}
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
