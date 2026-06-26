"use client";

import { useMemo, useState } from "react";
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
  const { favoritedIds, isFavorite, toggleFavorite } = useFavorites();
  const { history } = useHistory();
  const { createPlaylist } = usePlaylists();
  const { tracks, hasLoaded } = useTracks();
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const recommendedTrack = useMemo(() => {
    if (visibleTracks.length === 0) return null;

    const trackById = new Map(tracks.map((track) => [track.id, track]));
    const playCountByTrack = new Map<string, number>();
    const typeScores = new Map<Track["type"], number>();
    const moodScores = new Map<string, number>();
    const licenseScores = new Map<Track["licenseLabel"], number>();
    const sfxCategoryScores = new Map<NonNullable<Track["sfxCategory"]>, number>();

    history.forEach((entry) => {
      const track = trackById.get(entry.trackId);
      if (!track) return;

      const weight = Math.max(1, entry.playCount);
      playCountByTrack.set(
        track.id,
        (playCountByTrack.get(track.id) ?? 0) + weight,
      );
      typeScores.set(track.type, (typeScores.get(track.type) ?? 0) + weight);
      moodScores.set(track.mood, (moodScores.get(track.mood) ?? 0) + weight);

      if (track.sfxCategory) {
        sfxCategoryScores.set(
          track.sfxCategory,
          (sfxCategoryScores.get(track.sfxCategory) ?? 0) + weight,
        );
      }
    });

    favoritedIds.forEach((trackId) => {
      const track = trackById.get(trackId);
      if (!track) return;

      typeScores.set(track.type, (typeScores.get(track.type) ?? 0) + 3);
      moodScores.set(track.mood, (moodScores.get(track.mood) ?? 0) + 3);
      licenseScores.set(
        track.licenseLabel,
        (licenseScores.get(track.licenseLabel) ?? 0) + 2,
      );

      if (track.sfxCategory) {
        sfxCategoryScores.set(
          track.sfxCategory,
          (sfxCategoryScores.get(track.sfxCategory) ?? 0) + 2,
        );
      }
    });

    const hasPersonalSignal = history.length > 0 || favoritedIds.size > 0;
    if (!hasPersonalSignal) return visibleTracks[0];

    return visibleTracks.reduce((bestTrack, track) => {
      const scoreTrack = (candidate: Track) => {
        const playCount = playCountByTrack.get(candidate.id) ?? 0;
        let score = 0;

        score += typeScores.get(candidate.type) ?? 0;
        score += moodScores.get(candidate.mood) ?? 0;
        score += licenseScores.get(candidate.licenseLabel) ?? 0;

        if (candidate.sfxCategory) {
          score += sfxCategoryScores.get(candidate.sfxCategory) ?? 0;
        }

        if (favoritedIds.has(candidate.id)) {
          score += 2;
        }

        score -= Math.min(playCount * 4, 12);

        if (currentTrack?.id === candidate.id) {
          score -= 10;
        }

        return score;
      };

      return scoreTrack(track) > scoreTrack(bestTrack) ? track : bestTrack;
    }, visibleTracks[0]);
  }, [currentTrack?.id, favoritedIds, history, tracks, visibleTracks]);

  const featuredTrack = recommendedTrack
    ? {
        ...recommendedTrack,
        isFavorite: isFavorite(recommendedTrack.id),
      }
    : null;

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
          currentTrack ? "pb-40" : "pb-6",
        ].join(" ")}
      >
        {!hasLoaded ? (
          <SkeletonHero />
        ) : featuredTrack ? (
          <HeroSection
            track={featuredTrack}
            eyebrow="Recommended For You"
            onPlay={handlePlayTrack}
            onFavorite={(track) => toggleFavorite(track.id)}
          />
        ) : (
          <section className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-6 py-10 text-center shadow-[var(--shadow-md)]">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              No tracks available
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              We could not load the catalog right now. Please try again later.
            </p>
          </section>
        )}

        <FilterChips onChange={setActiveFilter} />

        <section className="mb-9 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Top Hits
          </h2>

          <div className="flex flex-col gap-2">
            {!hasLoaded ? (
              Array.from({ length: 5 }, (_, index) => (
                <SkeletonTrackItem key={index} />
              ))
            ) : visibleTracks.length === 0 && searchQuery.trim() === "" ? (
              <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-6 py-10 text-center text-sm text-[var(--color-text-muted)]">
                Track catalog is currently unavailable.
              </div>
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
