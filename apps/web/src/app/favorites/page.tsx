"use client";

import { useEffect, useMemo, useState } from "react";
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
import { AppShell } from "@/components/shell/AppShell";
import { BottomPlayer } from "@/components/shell/BottomPlayer";
import { RightPanel } from "@/components/shell/RightPanel";
import { useFavorites } from "@/context/FavoritesContext";
import { tracks } from "@/data/tracks";
import type { Track } from "@/data/tracks";

export default function FavoritesPage() {
  const { favoritedIds, isFavorite, toggleFavorite } = useFavorites();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const favoritedTracks = useMemo(
    () =>
      [...favoritedIds]
        .map((id) => tracks.find((track) => track.id === id))
        .filter((track): track is Track => Boolean(track)),
    [favoritedIds],
  );

  const availableTypes = useMemo(
    () => [...new Set(favoritedTracks.map((track) => track.type as string))],
    [favoritedTracks],
  );

  const filteredTracks = useMemo(() => {
    const orderedIds = [...favoritedIds];
    const typeFilteredTracks =
      activeFilter === "All"
        ? favoritedTracks
        : favoritedTracks.filter((track) => track.type === activeFilter);

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
  }, [favoritedIds, activeFilter, favoritedTracks, sortKey, sortOrder]);

  useEffect(() => {
    if (activeFilter !== "All" && !availableTypes.includes(activeFilter)) {
      setActiveFilter("All");
    }
  }, [activeFilter, availableTypes, favoritedTracks.length]);

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
              title="Favorites"
              trackCount={filteredTracks.length}
              actions={undefined}
            />
          }
          filterChips={
            <FilterChips
              options={["All", ...availableTypes]}
              value={activeFilter}
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
                  onSelect={playTrack}
                  onFavorite={(nextTrack) => toggleFavorite(nextTrack.id)}
                  onPreview={toggleTrackPreview}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </CatalogLayout>
      </div>
    </AppShell>
  );
}
