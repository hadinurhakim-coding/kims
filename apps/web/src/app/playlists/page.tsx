"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListMusic, Plus } from "lucide-react";
import { CatalogLayout } from "@/components/catalog/CatalogLayout";
import { PageHeader } from "@/components/catalog/PageHeader";
import { CreatePlaylistModal } from "@/components/playlist/CreatePlaylistModal";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { AppShell } from "@/components/shell/AppShell";
import { RightPanel } from "@/components/shell/RightPanel";
import { usePlaylists } from "@/context/PlaylistContext";
import { useTracks } from "@/context/TracksContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function PlaylistsPage() {
  const { isChecking } = useAuthGuard();
  const router = useRouter();
  const { playlists, createPlaylist, deletePlaylist } = usePlaylists();
  const { tracks } = useTracks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleCreatePlaylist(name: string) {
    const playlist = await createPlaylist(name);

    setIsModalOpen(false);
    router.push(`/playlists/${playlist.id}`);
  }

  async function handleDeletePlaylist(id: string) {
    await deletePlaylist(id);
  }

  if (isChecking) return null;

  return (
    <AppShell
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      rightPanel={<RightPanel recentTracks={[]} />}
      bottomPlayer={null}
    >
      <div className="mx-auto w-full max-w-6xl px-4 pb-6 pt-6 md:px-6 lg:px-8">
        <CatalogLayout
          pageHeader={
            <PageHeader
              title="Playlists"
              trackCount={playlists.length}
              actions={
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Playlist</span>
                </button>
              }
            />
          }
        >
          {playlists.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
              <ListMusic className="h-16 w-16 text-[var(--color-text-muted)]" />
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  No playlists yet
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Create a playlist to organize your tracks
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              >
                Create Playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {playlists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  tracks={tracks}
                  onClick={(nextPlaylist) =>
                    router.push(`/playlists/${nextPlaylist.id}`)
                  }
                  onDelete={handleDeletePlaylist}
                />
              ))}
            </div>
          )}
        </CatalogLayout>

        <CreatePlaylistModal
          isOpen={isModalOpen}
          onConfirm={handleCreatePlaylist}
          onCancel={() => setIsModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}
