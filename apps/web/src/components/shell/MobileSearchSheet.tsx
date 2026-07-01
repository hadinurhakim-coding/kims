"use client";

import Image from "next/image";
import {
  Clock3,
  Loader2,
  Pause,
  Play,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useAudio } from "@/context/AudioContext";
import { useTracks } from "@/context/TracksContext";
import type { Track } from "@/data/tracks";

export interface MobileSearchSheetProps {
  isOpen: boolean;
  initialQuery: string;
  onClose: () => void;
  onQueryChange?: (value: string) => void;
}

const RECENT_SEARCHES_KEY = "kims-mobile-recent-searches";
const MAX_RECENT_SEARCHES = 6;
const MAX_VISIBLE_RESULTS = 30;

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function getSearchableText(track: Track) {
  return [
    track.title,
    track.type,
    track.mood,
    track.licenseLabel,
    track.sfxCategory ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function matchesFilter(value: string, filter: string) {
  return filter === "All" || value === filter;
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        {label}
      </div>
      <div
        aria-label={`Filter search by ${label.toLowerCase()}`}
        className="scrollbar-hide flex gap-2 overflow-x-auto overflow-y-visible px-4 pb-1 overscroll-x-contain"
      >
        {options.map((option) => {
          const isActive = option === value;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(option)}
              className={[
                "min-h-10 shrink-0 rounded-[var(--radius-full)] border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
                isActive
                  ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)] text-[var(--color-surface)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_8%,var(--color-surface))]",
              ].join(" ")}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchResultRow({
  track,
  isCurrent,
  isPlaying,
  isLoading,
  onPlay,
}: {
  track: Track;
  isCurrent: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: (track: Track) => void;
}) {
  return (
    <div
      data-search-result
      className={[
        "grid min-h-[68px] grid-cols-[48px_minmax(0,1fr)_44px] items-center gap-3 rounded-[var(--radius-md)] border px-2.5 py-2",
        isCurrent
          ? "border-[var(--color-accent-primary)] bg-[color-mix(in_srgb,var(--color-accent-primary)_8%,var(--color-surface))]"
          : "border-[var(--color-border)] bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <Image
        src={track.cover}
        alt=""
        width={48}
        height={48}
        sizes="48px"
        className="h-12 w-12 rounded-[var(--radius-md)] object-cover"
      />

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold leading-5 text-[var(--color-text-primary)]">
          {track.title}
        </div>
        <div className="truncate text-xs leading-5 text-[var(--color-text-muted)]">
          {track.type} &middot; {track.mood} &middot; {track.licenseLabel}
        </div>
        <div className="text-xs leading-4 text-[var(--color-text-muted)]">
          {track.duration}
        </div>
      </div>

      <button
        type="button"
        aria-label={`${isLoading ? "Loading" : isCurrent && isPlaying ? "Pause" : "Play"} ${track.title}`}
        disabled={isLoading}
        onClick={() => onPlay(track)}
        className={[
          "flex h-11 w-11 items-center justify-center rounded-[var(--radius-full)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
          isCurrent && isPlaying
            ? "bg-[var(--color-accent-primary)] text-[var(--color-surface)]"
            : "bg-[var(--color-background)] text-[var(--color-text-primary)] hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_10%,var(--color-background))]",
          isLoading ? "cursor-not-allowed opacity-70" : "",
        ].join(" ")}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isCurrent && isPlaying ? (
          <Pause className="h-5 w-5 fill-current" />
        ) : (
          <Play className="h-5 w-5 fill-current" />
        )}
      </button>
    </div>
  );
}

export function MobileSearchSheet({
  isOpen,
  initialQuery,
  onClose,
  onQueryChange,
}: MobileSearchSheetProps) {
  const { tracks, hasLoaded } = useTracks();
  const { currentTrack, isPlaying, isLoadingAudio, playTrack, togglePlayPause } =
    useAudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState("All");
  const [moodFilter, setMoodFilter] = useState("All");
  const [licenseFilter, setLicenseFilter] = useState("All");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    try {
      const storedValue = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      const parsedValue = storedValue ? JSON.parse(storedValue) : [];

      if (Array.isArray(parsedValue)) {
        const nextRecentSearches = parsedValue.filter(
          (value): value is string =>
            typeof value === "string" && value.trim() !== "",
        );

        window.setTimeout(() => {
          if (isMounted) {
            setRecentSearches(nextRecentSearches);
          }
        }, 0);
      }
    } catch {
      window.setTimeout(() => {
        if (isMounted) {
          setRecentSearches([]);
        }
      }, 0);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const typeOptions = useMemo(
    () => ["All", ...getUniqueValues(tracks.map((track) => track.type))],
    [tracks],
  );

  const moodOptions = useMemo(
    () => ["All", ...getUniqueValues(tracks.map((track) => track.mood))],
    [tracks],
  );

  const licenseOptions = useMemo(
    () => [
      "All",
      ...getUniqueValues(tracks.map((track) => track.licenseLabel)),
    ],
    [tracks],
  );

  const hasActiveFilters =
    typeFilter !== "All" || moodFilter !== "All" || licenseFilter !== "All";
  const normalizedQuery = normalizeSearchValue(query);

  const filteredTracks = useMemo(() => {
    const results = tracks.filter((track) => {
      const matchesQuery =
        normalizedQuery === "" ||
        getSearchableText(track).includes(normalizedQuery);

      return (
        matchesQuery &&
        matchesFilter(track.type, typeFilter) &&
        matchesFilter(track.mood, moodFilter) &&
        matchesFilter(track.licenseLabel, licenseFilter)
      );
    });

    return results.slice(0, MAX_VISIBLE_RESULTS);
  }, [licenseFilter, moodFilter, normalizedQuery, tracks, typeFilter]);

  function persistRecentSearches(nextRecentSearches: string[]) {
    setRecentSearches(nextRecentSearches);

    try {
      window.localStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(nextRecentSearches),
      );
    } catch {
      // Recent searches are local-only convenience data.
    }
  }

  function rememberSearch(value: string) {
    const nextValue = value.trim();

    if (nextValue === "") return;

    const dedupedSearches = recentSearches.filter(
      (recentSearch) =>
        recentSearch.toLowerCase() !== nextValue.toLowerCase(),
    );

    persistRecentSearches(
      [nextValue, ...dedupedSearches].slice(0, MAX_RECENT_SEARCHES),
    );
  }

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    onQueryChange?.(nextQuery);
  }

  function clearQuery() {
    updateQuery("");
    inputRef.current?.focus();
  }

  function clearFilters() {
    setTypeFilter("All");
    setMoodFilter("All");
    setLicenseFilter("All");
  }

  function handleQueryKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      rememberSearch(query);
    }
  }

  function handleRecentSearchClick(value: string) {
    updateQuery(value);
    inputRef.current?.focus();
  }

  function handlePlay(track: Track) {
    rememberSearch(query);

    if (currentTrack?.id === track.id) {
      togglePlayPause();
      return;
    }

    playTrack(track);
  }

  if (!isOpen) return null;

  return (
    <div
      id="mobile-search-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-search-title"
      className="fixed inset-0 z-50 flex bg-[var(--color-background)] sm:hidden"
    >
      <div className="flex min-h-0 w-full flex-col">
        <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-3 pt-[calc(0.875rem+env(safe-area-inset-top))]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2
                id="mobile-search-title"
                className="text-lg font-semibold text-[var(--color-text-primary)]"
              >
                Search
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Find tracks, effects, moods, and licenses.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close search"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              ref={inputRef}
              aria-label="Search catalog"
              type="search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              onKeyDown={handleQueryKeyDown}
              placeholder="Search tracks, sound effects, moods..."
              className="h-12 w-full rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-background)] pl-11 pr-12 text-base text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={clearQuery}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <section className="space-y-3 border-b border-[var(--color-border)] py-3">
            <div className="flex items-center justify-between gap-3 px-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                <SlidersHorizontal className="h-4 w-4 text-[var(--color-accent-primary)]" />
                Filters
              </div>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-10 rounded-[var(--radius-full)] px-3 text-sm font-semibold text-[var(--color-accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
                >
                  Reset
                </button>
              ) : null}
            </div>

            <FilterRow
              label="Type"
              options={typeOptions}
              value={typeFilter}
              onChange={setTypeFilter}
            />
            <FilterRow
              label="Mood"
              options={moodOptions}
              value={moodFilter}
              onChange={setMoodFilter}
            />
            <FilterRow
              label="License"
              options={licenseOptions}
              value={licenseFilter}
              onChange={setLicenseFilter}
            />
          </section>

          {recentSearches.length > 0 ? (
            <section className="border-b border-[var(--color-border)] py-3">
              <div className="mb-2 flex items-center gap-2 px-4 text-sm font-semibold text-[var(--color-text-primary)]">
                <Clock3 className="h-4 w-4 text-[var(--color-text-muted)]" />
                Recent searches
              </div>
              <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-1 overscroll-x-contain">
                {recentSearches.map((recentSearch) => (
                  <button
                    key={recentSearch}
                    type="button"
                    onClick={() => handleRecentSearchClick(recentSearch)}
                    className="min-h-10 max-w-[220px] shrink-0 truncate rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                  >
                    {recentSearch}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Results
                </h3>
                <p aria-live="polite" className="text-xs text-[var(--color-text-muted)]">
                  {hasLoaded
                    ? `${filteredTracks.length} match${filteredTracks.length === 1 ? "" : "es"}`
                    : "Loading catalog..."}
                </p>
              </div>
            </div>

            {!hasLoaded ? (
              <div className="flex min-h-32 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)]">
                Loading catalog...
              </div>
            ) : filteredTracks.length > 0 ? (
              <div className="space-y-2">
                {filteredTracks.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;

                  return (
                    <SearchResultRow
                      key={track.id}
                      track={track}
                      isCurrent={isCurrent}
                      isPlaying={isCurrent && isPlaying}
                      isLoading={isLoadingAudio && isCurrent}
                      onPlay={handlePlay}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 text-center">
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                  No results found
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Try another keyword or reset the filters.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
