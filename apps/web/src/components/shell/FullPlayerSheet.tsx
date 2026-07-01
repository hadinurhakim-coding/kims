"use client";

import {
  AlertCircle,
  Check,
  Download,
  Heart,
  ListPlus,
  Loader2,
  Pause,
  Play,
  Plus,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useAudio } from "@/context/AudioContext";
import { useFavorites } from "@/context/FavoritesContext";
import { usePlaylists } from "@/context/PlaylistContext";
import { CreatePlaylistModal } from "@/components/playlist/CreatePlaylistModal";

export interface FullPlayerSheetProps {
  onClose: () => void;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function FullPlayerSheet({ onClose }: FullPlayerSheetProps) {
  const {
    currentTrack,
    isPlaying,
    isLoadingAudio,
    duration,
    currentTime,
    isReady,
    togglePlayPause,
    seek,
  } = useAudio();
  const {
    playlists,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    isTrackInPlaylist,
  } = usePlaylists();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);

  if (!currentTrack) return null;

  const isDisabled = !isReady || isLoadingAudio;
  const isTrackFavorite = isFavorite(currentTrack.id);
  const hasSeekableDuration = isReady && duration > 0;
  const PlayPauseIcon = isPlaying ? Pause : Play;

  function handleFavorite() {
    if (!currentTrack) return;
    void toggleFavorite(currentTrack.id);
  }

  function handlePlaylistToggle(playlistId: string) {
    if (!currentTrack) return;

    if (isTrackInPlaylist(playlistId, currentTrack.id)) {
      void removeTrackFromPlaylist(playlistId, currentTrack.id);
      return;
    }

    void addTrackToPlaylist(playlistId, currentTrack.id);
  }

  async function handleCreatePlaylist(name: string) {
    await createPlaylist(name);
    setIsCreatePlaylistOpen(false);
  }

  async function handleDownload() {
    if (!currentTrack || isDownloading) return;

    setIsDownloading(true);
    setDownloadError(false);

    try {
      const response = await fetch(`/api/v1/tracks/${currentTrack.id}/download`);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const data = (await response.json()) as { url?: unknown };
      if (typeof data.url !== "string" || data.url === "") {
        throw new Error("Invalid download response");
      }

      const link = document.createElement("a");
      link.href = data.url;
      link.download = `${currentTrack.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      setDownloadError(true);
      window.setTimeout(() => setDownloadError(false), 3000);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="full-player-title"
        className="fixed inset-0 z-[70] lg:hidden"
      >
        <button
          type="button"
          aria-label="Dismiss full player"
          onClick={onClose}
          className="absolute inset-0 h-full w-full bg-black/40"
        />

        <section className="absolute bottom-0 left-0 right-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-10px_28px_rgba(0,0,0,0.18)]">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                Now Playing
              </p>
              <h2
                id="full-player-title"
                className="truncate text-sm font-bold text-[var(--color-text-primary)]"
              >
                {currentTrack.title}
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close full player"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5">
            <div className="mx-auto flex w-full max-w-md flex-col gap-5">
              <div className="mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-[18px] bg-[var(--color-border)] shadow-[0_12px_28px_color-mix(in_srgb,var(--color-text-primary)_14%,transparent)]">
                <Image
                  src={currentTrack.cover}
                  alt={currentTrack.title}
                  width={280}
                  height={280}
                  sizes="(max-width: 767px) 280px, 320px"
                  className="h-full w-full object-cover"
                  priority
                />
              </div>

              <div className="text-center">
                <h3 className="truncate text-xl font-extrabold text-[var(--color-text-primary)]">
                  {currentTrack.title}
                </h3>
                <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]">
                  {currentTrack.type} &middot; {currentTrack.mood}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[var(--radius-md)] bg-[var(--color-background)] px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase text-[var(--color-text-muted)]">
                    License
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-[var(--color-text-primary)]">
                    {currentTrack.licenseLabel}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-background)] px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase text-[var(--color-text-muted)]">
                    Duration
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                    {currentTrack.duration}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <input
                  aria-label={`Seek ${currentTrack.title}`}
                  type="range"
                  min={0}
                  max={hasSeekableDuration ? duration : 0}
                  step={1}
                  value={hasSeekableDuration ? Math.min(currentTime, duration) : 0}
                  disabled={!hasSeekableDuration}
                  onChange={(event) => seek(Number(event.target.value))}
                  className="h-6 w-full accent-[var(--color-accent-primary)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
                />
                <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-muted)]">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  aria-label={
                    isLoadingAudio
                      ? "Loading audio"
                      : isPlaying
                        ? `Pause ${currentTrack.title}`
                        : `Play ${currentTrack.title}`
                  }
                  disabled={isDisabled}
                  onClick={togglePlayPause}
                  className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-[var(--color-surface)] shadow-[0_10px_20px_color-mix(in_srgb,var(--color-accent-primary)_24%,transparent)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                >
                  {isLoadingAudio ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : (
                    <PlayPauseIcon
                      className={[
                        "h-7 w-7",
                        isPlaying ? "" : "fill-[var(--color-surface)]",
                      ].join(" ")}
                    />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-label={
                    isTrackFavorite
                      ? `Remove ${currentTrack.title} from favorites`
                      : `Add ${currentTrack.title} to favorites`
                  }
                  onClick={handleFavorite}
                  className={[
                    "flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]",
                    isTrackFavorite
                      ? "text-[var(--color-danger)]"
                      : "text-[var(--color-text-primary)]",
                  ].join(" ")}
                >
                  <Heart
                    className="h-4 w-4"
                    fill={isTrackFavorite ? "var(--color-danger)" : "none"}
                  />
                  <span>{isTrackFavorite ? "Saved" : "Save"}</span>
                </button>
                <button
                  type="button"
                  aria-label={
                    downloadError
                      ? "Download failed, try again"
                      : isDownloading
                        ? `Downloading ${currentTrack.title}`
                        : `Download ${currentTrack.title}`
                  }
                  disabled={isDownloading}
                  onClick={handleDownload}
                  className={[
                    "flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold transition-colors hover:bg-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]",
                    downloadError
                      ? "text-[var(--color-danger)]"
                      : "text-[var(--color-text-primary)]",
                  ].join(" ")}
                >
                  {downloadError ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Download</span>
                </button>
              </div>

              <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-3 py-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                      Playlists
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Add this track to a collection
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Create playlist"
                    onClick={() => setIsCreatePlaylistOpen(true)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-accent-primary)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                {playlists.length === 0 ? (
                  <div className="flex items-center gap-3 px-3 py-4 text-sm text-[var(--color-text-muted)]">
                    <ListPlus className="h-5 w-5 shrink-0" />
                    <span>Create a playlist to save this track into one.</span>
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto py-1">
                    {playlists.map((playlist) => {
                      const isAdded = isTrackInPlaylist(
                        playlist.id,
                        currentTrack.id,
                      );

                      return (
                        <button
                          key={playlist.id}
                          type="button"
                          aria-label={`${isAdded ? "Remove" : "Add"} ${currentTrack.title} ${isAdded ? "from" : "to"} ${playlist.name}`}
                          onClick={() => handlePlaylistToggle(playlist.id)}
                          className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent-primary)]"
                        >
                          <span className="truncate">{playlist.name}</span>
                          {isAdded ? (
                            <Check className="h-4 w-4 shrink-0 text-[var(--color-accent-primary)]" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        </section>
      </div>

      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onConfirm={handleCreatePlaylist}
        onCancel={() => setIsCreatePlaylistOpen(false)}
      />
    </>
  );
}
