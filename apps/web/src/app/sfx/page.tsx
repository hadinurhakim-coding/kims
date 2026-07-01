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
import { AppShell } from "@/components/shell/AppShell";
import { BottomPlayer } from "@/components/shell/BottomPlayer";
import { RightPanel } from "@/components/shell/RightPanel";
import { SfxSoundboard } from "@/components/sfx/SfxSoundboard";
import { useAudio } from "@/context/AudioContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useHistory } from "@/context/HistoryContext";
import { useTracks } from "@/context/TracksContext";
import type { Track } from "@/data/tracks";

export default function SfxPage() {
  const { toggleFavorite } = useFavorites();
  const { history } = useHistory();
  const { tracks } = useTracks();
  const {
    currentTrack,
    isPlaying,
    isLoadingAudio,
    playTrack,
    seek,
    togglePlayPause,
  } = useAudio();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const sfxTracks = useMemo(
    () => tracks.filter((track) => track.type === "SFX"),
    [tracks],
  );

  const sfxCategories = useMemo(
    () => [
      "All",
      ...new Set(
        sfxTracks
          .filter((track) => track.sfxCategory !== undefined)
          .map((track) => track.sfxCategory as string),
      ),
    ],
    [sfxTracks],
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
    const baseTracks = sfxTracks;
    const filteredTracks =
      activeFilter === "All"
        ? baseTracks
        : baseTracks.filter((track) => track.sfxCategory === activeFilter);

    const sortedTracks =
      sortKey === "default"
        ? [...filteredTracks]
        : [...filteredTracks].sort((firstTrack, secondTrack) => {
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

            return (firstTrack.sfxCategory ?? "").localeCompare(
              secondTrack.sfxCategory ?? "",
            );
          });

    return sortOrder === "desc" ? sortedTracks.reverse() : sortedTracks;
  }, [activeFilter, sfxTracks, sortKey, sortOrder]);

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
    playTrack(track);
  }

  function triggerSoundEffect(track: Track) {
    if (currentTrack?.id === track.id) {
      seek(0);

      if (!isPlaying) {
        togglePlayPause();
      }

      return;
    }

    playTrack(track);
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
              title="Sound Effects"
              trackCount={visibleTracks.length}
              actions={undefined}
            />
          }
          filterChips={
            <FilterChips
              options={sfxCategories}
              value={activeFilter}
              onChange={setActiveFilter}
              label="Category"
            />
          }
          sortControls={
            <SortControls
              options={["default", "duration", "license", "category"]}
              onSortChange={handleSortChange}
            />
          }
        >
          <div className="flex flex-col gap-4">
            <SfxSoundboard
              tracks={visibleTracks}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
              isLoadingTrackId={
                isLoadingAudio && currentTrack ? currentTrack.id : undefined
              }
              onTrigger={triggerSoundEffect}
            />

            <div className="flex flex-col gap-2">
              {activeFilter !== "All" && visibleTracks.length === 0 ? (
                <EmptySearch
                  query={activeFilter}
                  onClear={() => setActiveFilter("All")}
                />
              ) : activeFilter === "All" && visibleTracks.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    No sound effects in database
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">
                    Add SFX tracks from the admin/API catalog and they will
                    appear here.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </CatalogLayout>
      </div>
    </AppShell>
  );
}
