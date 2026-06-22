"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Trash2 } from "lucide-react";
import { CatalogLayout } from "@/components/catalog/CatalogLayout";
import { EmptySearch } from "@/components/catalog/EmptySearch";
import { FilterChips } from "@/components/catalog/FilterChips";
import { PageHeader } from "@/components/catalog/PageHeader";
import { HistoryItem } from "@/components/history/HistoryItem";
import { AppShell } from "@/components/shell/AppShell";
import { BottomPlayer } from "@/components/shell/BottomPlayer";
import { RightPanel } from "@/components/shell/RightPanel";
import { useAudio } from "@/context/AudioContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useHistory, type HistoryEntry } from "@/context/HistoryContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { tracks } from "@/data/tracks";
import type { Track } from "@/data/tracks";

type TimeBlock =
  | "Today Morning"
  | "Today Afternoon"
  | "Today Evening"
  | "Yesterday"
  | "Earlier This Week"
  | "Older";

type HistoryEntryWithTrack = HistoryEntry & {
  track: Track;
};

const timeBlocks: TimeBlock[] = [
  "Today Morning",
  "Today Afternoon",
  "Today Evening",
  "Yesterday",
  "Earlier This Week",
  "Older",
];

function getTimeBlock(isoDate: string): TimeBlock {
  const played = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - played.getTime()) / 86_400_000,
  );

  if (diffDays === 0) {
    const hour = played.getHours();

    if (hour < 12) return "Today Morning";
    if (hour < 17) return "Today Afternoon";
    return "Today Evening";
  }

  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 6) return "Earlier This Week";
  return "Older";
}

export default function HistoryPage() {
  const { isChecking } = useAuthGuard();
  const router = useRouter();
  const { toggleFavorite } = useFavorites();
  const { history, clearHistory, removeFromHistory } = useHistory();
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const historyEntries = useMemo(
    () =>
      history
        .map((entry) => {
          const track = tracks.find(
            (currentTrack) => currentTrack.id === entry.trackId,
          );

          return track ? { ...entry, track } : null;
        })
        .filter((entry): entry is HistoryEntryWithTrack => Boolean(entry)),
    [history],
  );

  const availableTypes = useMemo(
    () => [
      ...new Set(
        history
          .map((entry) =>
            tracks.find((track) => track.id === entry.trackId),
          )
          .filter((track): track is Track => Boolean(track))
          .map((track) => track.type as string),
      ),
    ],
    [history],
  );
  const selectedFilter =
    activeFilter === "All" || availableTypes.includes(activeFilter)
      ? activeFilter
      : "All";

  const filteredEntries = useMemo(() => {
    const entries =
      selectedFilter === "All"
        ? historyEntries
        : historyEntries.filter((entry) => entry.track.type === selectedFilter);

    return [...entries].sort(
      (firstEntry, secondEntry) =>
        new Date(secondEntry.playedAt).getTime() -
        new Date(firstEntry.playedAt).getTime(),
    );
  }, [selectedFilter, historyEntries]);

  const groupedEntries = useMemo(
    () =>
      timeBlocks
        .map((block) => ({
          block,
          entries: filteredEntries.filter(
            (entry) => getTimeBlock(entry.playedAt) === block,
          ),
        }))
        .filter((group) => group.entries.length > 0),
    [filteredEntries],
  );

  const recentTracks = useMemo(
    () => historyEntries.slice(0, 10).map((entry) => entry.track),
    [historyEntries],
  );

  function handlePlayTrack(track: Track) {
    playTrack(track);
  }

  function handleClearHistory() {
    if (!confirm("Clear all history? This cannot be undone.")) return;

    clearHistory();
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
          currentTrack ? "pb-36" : "pb-6",
        ].join(" ")}
      >
        <CatalogLayout
          pageHeader={
            <PageHeader
              title="History"
              trackCount={filteredEntries.length}
              actions={
                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={history.length === 0}
                  className="flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-danger)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-danger)] transition-all duration-150 hover:bg-[var(--color-danger)] hover:text-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All</span>
                </button>
              }
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
        >
          {history.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
              <Clock className="h-16 w-16 text-[var(--color-text-muted)]" />
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  No history yet
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Tracks you play will appear here
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
          ) : filteredEntries.length === 0 && selectedFilter !== "All" ? (
            <EmptySearch
              query={selectedFilter}
              onClear={() => setActiveFilter("All")}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {groupedEntries.map((group) => (
                <section key={group.block} className="flex flex-col gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {group.block}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {group.entries.map((entry) => (
                      <HistoryItem
                        key={entry.id}
                        entry={entry}
                        track={entry.track}
                        isPlaying={
                          currentTrack?.id === entry.trackId && isPlaying
                        }
                        onPlay={handlePlayTrack}
                        onFavorite={(track) => toggleFavorite(track.id)}
                        onRemove={removeFromHistory}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </CatalogLayout>
      </div>
    </AppShell>
  );
}
