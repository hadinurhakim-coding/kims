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

type RecommendationResult = {
  track: Track;
  reason: string;
};

function incrementScore<TKey>(
  scores: Map<TKey, number>,
  key: TKey,
  amount: number,
) {
  scores.set(key, (scores.get(key) ?? 0) + amount);
}

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

  const recommendation = useMemo<RecommendationResult | null>(() => {
    if (visibleTracks.length === 0) return null;

    const trackById = new Map(tracks.map((track) => [track.id, track]));
    const playCountByTrack = new Map<string, number>();
    const typeScores = new Map<Track["type"], number>();
    const moodScores = new Map<string, number>();
    const licenseScores = new Map<Track["licenseLabel"], number>();
    const sfxCategoryScores = new Map<NonNullable<Track["sfxCategory"]>, number>();

    history.forEach((entry, index) => {
      const track = trackById.get(entry.trackId);
      if (!track) return;

      const weight = Math.max(1, entry.playCount);
      const recencyBoost = Math.max(0, 3 - index);
      const historyWeight = weight + recencyBoost;

      playCountByTrack.set(
        track.id,
        (playCountByTrack.get(track.id) ?? 0) + weight,
      );
      incrementScore(typeScores, track.type, historyWeight);
      incrementScore(moodScores, track.mood, historyWeight);
      incrementScore(licenseScores, track.licenseLabel, Math.max(1, weight));

      if (track.sfxCategory) {
        incrementScore(sfxCategoryScores, track.sfxCategory, historyWeight);
      }
    });

    favoritedIds.forEach((trackId) => {
      const track = trackById.get(trackId);
      if (!track) return;

      incrementScore(typeScores, track.type, 4);
      incrementScore(moodScores, track.mood, 4);
      incrementScore(licenseScores, track.licenseLabel, 3);

      if (track.sfxCategory) {
        incrementScore(sfxCategoryScores, track.sfxCategory, 3);
      }
    });

    const hasPersonalSignal = history.length > 0 || favoritedIds.size > 0;
    if (!hasPersonalSignal) {
      return {
        track: visibleTracks[0],
        reason:
          activeFilter === "All"
            ? "Fresh pick from the catalog."
            : `Fresh pick from ${activeFilter}.`,
      };
    }

    const scoreTrack = (candidate: Track) => {
      const playCount = playCountByTrack.get(candidate.id) ?? 0;
      let score = 0;

      score += (typeScores.get(candidate.type) ?? 0) * 3;
      score += (moodScores.get(candidate.mood) ?? 0) * 2;
      score += licenseScores.get(candidate.licenseLabel) ?? 0;

      if (candidate.sfxCategory) {
        score += (sfxCategoryScores.get(candidate.sfxCategory) ?? 0) * 2;
      }

      if (favoritedIds.has(candidate.id)) {
        score += 5;
      }

      score -= Math.min(playCount * 4, 16);

      if (currentTrack?.id === candidate.id && visibleTracks.length > 1) {
        score -= 20;
      }

      return score;
    };

    const [recommendedTrack] = [...visibleTracks].sort((left, right) => {
      const scoreDifference = scoreTrack(right) - scoreTrack(left);
      if (scoreDifference !== 0) return scoreDifference;

      const leftPlays = playCountByTrack.get(left.id) ?? 0;
      const rightPlays = playCountByTrack.get(right.id) ?? 0;

      return leftPlays - rightPlays;
    });

    const reasons = [
      {
        text: `Because you often play ${recommendedTrack.type}.`,
        score: typeScores.get(recommendedTrack.type) ?? 0,
      },
      {
        text: `Because ${recommendedTrack.mood} tracks match your listening.`,
        score: moodScores.get(recommendedTrack.mood) ?? 0,
      },
      {
        text: `Based on your ${recommendedTrack.licenseLabel} favorites.`,
        score: licenseScores.get(recommendedTrack.licenseLabel) ?? 0,
      },
    ];

    if (recommendedTrack.sfxCategory) {
      reasons.push({
        text: `Because you use ${recommendedTrack.sfxCategory} sound effects.`,
        score: sfxCategoryScores.get(recommendedTrack.sfxCategory) ?? 0,
      });
    }

    if (favoritedIds.has(recommendedTrack.id)) {
      reasons.push({
        text: "One of your saved tracks, ready to revisit.",
        score: 4,
      });
    }

    const reason =
      reasons.sort((left, right) => right.score - left.score)[0]?.text ??
      "Picked from your listening and favorites.";

    return { track: recommendedTrack, reason };
  }, [
    activeFilter,
    currentTrack?.id,
    favoritedIds,
    history,
    tracks,
    visibleTracks,
  ]);

  const featuredTrack = recommendation
    ? {
        ...recommendation.track,
        isFavorite: isFavorite(recommendation.track.id),
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
          "explore-compact-stack mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 md:px-6 lg:px-8",
          currentTrack ? "pb-40" : "pb-6",
        ].join(" ")}
      >
        {!hasLoaded ? (
          <SkeletonHero />
        ) : featuredTrack ? (
          <HeroSection
            track={featuredTrack}
            eyebrow="Recommended For You"
            supportingText={recommendation?.reason}
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
