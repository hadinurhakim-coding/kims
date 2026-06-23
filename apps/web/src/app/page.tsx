"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptySearch } from "@/components/catalog/EmptySearch";
import { FilterChips } from "@/components/catalog/FilterChips";
import { HeroSection } from "@/components/catalog/HeroSection";
import { SkeletonHero } from "@/components/catalog/SkeletonHero";
import { SkeletonTrackItem } from "@/components/catalog/SkeletonTrackItem";
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

export default function HomePage() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { history } = useHistory();
  const { createPlaylist } = usePlaylists();
  const { tracks, featuredTrack: initialFeaturedTrack, hasLoaded } = useTracks();
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const [activeFilter, setActiveFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const featuredTrack = initialFeaturedTrack
    ? {
        ...initialFeaturedTrack,
        isFavorite: isFavorite(initialFeaturedTrack.id),
      }
    : null;

  const visibleTracks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return tracks.filter((track) => {
      const matchesFilter =
        activeFilter === "All" ||
        track.type === activeFilter ||
        track.licenseLabel === activeFilter ||
        track.mood === activeFilter;

      const matchesSearch =
        normalizedQuery === "" ||
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.mood.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery, tracks]);

  const hasEmptySearch =
    searchQuery.trim() !== "" && visibleTracks.length === 0;

  const recentTracks = useMemo(
    () =>
      history
        .filter(
          (entry, index, self) =>
            index === self.findIndex((item) => item.trackId === entry.trackId),
        )
        .slice(0, 10)
        .map((entry) =>
          tracks.find((track) => track.id === entry.trackId),
        )
        .filter((track): track is Track => Boolean(track)),
    [history, tracks],
  );

  function handlePlayTrack(track: Track) {
    playTrack(track);
  }

  function toggleTrackPreview(track: Track) {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
      return;
    }

    handlePlayTrack(track);
  }

  function handleDownload(track: Track) {
    console.log("Download track", track);
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
          "mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 md:px-6 lg:px-8",
          currentTrack ? "pb-36" : "pb-6",
        ].join(" ")}
      >
        {isLoading || !hasLoaded || !featuredTrack ? (
          <SkeletonHero />
        ) : (
          <HeroSection
            track={featuredTrack}
            onPlay={handlePlayTrack}
            onFavorite={(track) => toggleFavorite(track.id)}
          />
        )}

        <FilterChips onChange={setActiveFilter} />

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Top Hits
          </h2>

          <div className="flex flex-col gap-2">
            {isLoading ? (
              Array.from({ length: 5 }, (_, index) => (
                <SkeletonTrackItem key={index} />
              ))
            ) : hasEmptySearch ? (
              <EmptySearch
                query={searchQuery}
                onClear={() => setSearchQuery("")}
              />
            ) : (
              visibleTracks.map((track, index) => (
                <TrackItem
                  key={track.id}
                  track={{ ...track, isFavorite: isFavorite(track.id) }}
                  rank={index + 1}
                  isSelected={currentTrack?.id === track.id}
                  isPlaying={currentTrack?.id === track.id && isPlaying}
                  onSelect={handlePlayTrack}
                  onFavorite={(nextTrack) => toggleFavorite(nextTrack.id)}
                  onPreview={toggleTrackPreview}
                  onDownload={handleDownload}
                  onCreatePlaylist={() => setIsModalOpen(true)}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <CreatePlaylistModal
        isOpen={isModalOpen}
        onConfirm={handleCreatePlaylist}
        onCancel={() => setIsModalOpen(false)}
      />
    </AppShell>
  );
}
