"use client";

import { useMemo, useState } from "react";
import { CinematicHero } from "@/components/cinematic/CinematicHero";
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
import { AppShell } from "@/components/shell/AppShell";
import { BottomPlayer } from "@/components/shell/BottomPlayer";
import { RightPanel } from "@/components/shell/RightPanel";
import { useFavorites } from "@/context/FavoritesContext";
import {
  featuredCinematicTrack,
  tracks,
} from "@/data/tracks";
import type { Track } from "@/data/tracks";

export default function CinematicPage() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [searchQuery, setSearchQuery] = useState("");

  const cinematicTracks = useMemo(
    () => tracks.filter((track) => track.type === "Cinematic"),
    [],
  );

  const moods = useMemo(
    () => [...new Set(cinematicTracks.map((track) => track.mood))],
    [cinematicTracks],
  );

  const featuredTrack = {
    ...featuredCinematicTrack,
    isFavorite: isFavorite(featuredCinematicTrack.id),
  };

  const filteredTracks = useMemo(() => {
    const baseTracks = tracks.filter((track) => track.type === "Cinematic");
    const moodFilteredTracks =
      activeFilter === "All"
        ? baseTracks
        : baseTracks.filter((track) => track.mood === activeFilter);

    const sortedTracks =
      sortKey === "default"
        ? [...moodFilteredTracks]
        : [...moodFilteredTracks].sort((firstTrack, secondTrack) => {
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
  }, [activeFilter, sortKey, sortOrder]);

  const sectionLabel =
    activeFilter === "All"
      ? "All Cinematic"
      : `${activeFilter} Cinematic`;

  function parseDuration(duration: string) {
    const [minutes, seconds] = duration.split(":").map(Number);

    return minutes * 60 + seconds;
  }

  function handleSortChange(nextSortKey: SortKey, nextSortOrder: SortOrder) {
    setSortKey(nextSortKey);
    setSortOrder(nextSortOrder);
  }

  function addRecentTrack(trackToAdd: Track) {
    setRecentTracks((tracks) => [
      trackToAdd,
      ...tracks.filter((track) => track.id !== trackToAdd.id),
    ].slice(0, 10));
  }

  function playTrack(track: Track) {
    setSelectedTrack(track);
    setCurrentTrack(track);
    setIsPlaying(true);
    addRecentTrack(track);
  }

  function toggleTrackPreview(track: Track) {
    setSelectedTrack(track);

    if (currentTrack?.id === track.id) {
      setIsPlaying((playing) => !playing);
      return;
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    addRecentTrack(track);
  }

  function handleDownload(track: Track) {
    console.log("Download track", track);
  }

  return (
    <AppShell
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      rightPanel={
        <RightPanel recentTracks={recentTracks} onSelect={playTrack} />
      }
      bottomPlayer={
        currentTrack ? (
          <BottomPlayer
            track={{
              ...currentTrack,
              isFavorite: isFavorite(currentTrack.id),
            }}
            isPlaying={isPlaying}
            isFavorite={isFavorite(currentTrack.id)}
            onPlayPause={() => setIsPlaying((playing) => !playing)}
            onNext={() => undefined}
            onPrevious={() => undefined}
            onShuffle={() => undefined}
            onRepeat={() => undefined}
            onFavorite={(track) => toggleFavorite(track.id)}
          />
        ) : null
      }
    >
      <div
        className={[
          "mx-auto w-full max-w-6xl px-4 pt-6 md:px-6 lg:px-8",
          currentTrack ? "pb-24" : "pb-6",
        ].join(" ")}
      >
        <CatalogLayout
          pageHeader={
            <PageHeader
              title="Cinematic"
              trackCount={filteredTracks.length}
              actions={undefined}
            />
          }
          filterChips={
            <FilterChips
              options={["All", ...moods]}
              value={activeFilter}
              onChange={setActiveFilter}
              label="Mood"
            />
          }
          sortControls={
            <SortControls
              options={["default", "duration", "mood", "license"]}
              onSortChange={handleSortChange}
            />
          }
        >
          <div className="flex flex-col gap-6">
            <CinematicHero
              track={featuredTrack}
              onPlay={() => playTrack(featuredTrack)}
              onFavorite={(track) => toggleFavorite(track.id)}
            />

            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                {sectionLabel}
              </h2>

              <div className="flex flex-col gap-2">
                {activeFilter !== "All" && filteredTracks.length === 0 ? (
                  <EmptySearch
                    query={activeFilter}
                    onClear={() => setActiveFilter("All")}
                  />
                ) : (
                  filteredTracks.map((track, index) => (
                    <TrackItem
                      key={track.id}
                      track={{ ...track, isFavorite: isFavorite(track.id) }}
                      rank={index + 1}
                      isSelected={selectedTrack?.id === track.id}
                      isPlaying={currentTrack?.id === track.id && isPlaying}
                      onSelect={playTrack}
                      onFavorite={(nextTrack) => toggleFavorite(nextTrack.id)}
                      onPreview={toggleTrackPreview}
                      onDownload={handleDownload}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        </CatalogLayout>
      </div>
    </AppShell>
  );
}
