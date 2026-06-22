"use client";

import { tracks } from "@/data/tracks";
import type { Track } from "@/data/tracks";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: string;
}

export interface PlaylistContextValue {
  playlists: Playlist[];
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  getPlaylistTracks: (playlistId: string) => Track[];
  isTrackInPlaylist: (playlistId: string, trackId: string) => boolean;
}

const PlaylistContext = createContext<PlaylistContextValue | null>(null);
const storageKey = "kims-playlists";

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(storageKey);

        if (stored) {
          setPlaylists(JSON.parse(stored) as Playlist[]);
        }
      } catch {
        setPlaylists([]);
      } finally {
        setHasLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(playlists));
    } catch {
      // Ignore unavailable storage.
    }
  }, [playlists, hasLoaded]);

  const createPlaylist = useCallback((name: string) => {
    const playlist: Playlist = {
      id: crypto.randomUUID(),
      name,
      trackIds: [],
      createdAt: new Date().toISOString(),
    };

    setPlaylists((currentPlaylists) => [...currentPlaylists, playlist]);

    return playlist;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists((currentPlaylists) =>
      currentPlaylists.filter((playlist) => playlist.id !== id),
    );
  }, []);

  const addTrackToPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      setPlaylists((currentPlaylists) =>
        currentPlaylists.map((playlist) => {
          if (
            playlist.id !== playlistId ||
            playlist.trackIds.includes(trackId)
          ) {
            return playlist;
          }

          return {
            ...playlist,
            trackIds: [...playlist.trackIds, trackId],
          };
        }),
      );
    },
    [],
  );

  const removeTrackFromPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      setPlaylists((currentPlaylists) =>
        currentPlaylists.map((playlist) =>
          playlist.id === playlistId
            ? {
                ...playlist,
                trackIds: playlist.trackIds.filter((id) => id !== trackId),
              }
            : playlist,
        ),
      );
    },
    [],
  );

  const getPlaylistTracks = useCallback(
    (playlistId: string) => {
      const playlist = playlists.find(
        (currentPlaylist) => currentPlaylist.id === playlistId,
      );

      if (!playlist) return [];

      return playlist.trackIds
        .map((trackId) => tracks.find((track) => track.id === trackId))
        .filter((track): track is Track => Boolean(track));
    },
    [playlists],
  );

  const isTrackInPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      const playlist = playlists.find(
        (currentPlaylist) => currentPlaylist.id === playlistId,
      );

      return playlist?.trackIds.includes(trackId) ?? false;
    },
    [playlists],
  );

  const value = useMemo(
    () => ({
      playlists,
      createPlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      getPlaylistTracks,
      isTrackInPlaylist,
    }),
    [
      playlists,
      createPlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      getPlaylistTracks,
      isTrackInPlaylist,
    ],
  );

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
}

export const usePlaylists = () => {
  const ctx = useContext(PlaylistContext);

  if (!ctx) {
    throw new Error("usePlaylists must be used within PlaylistProvider");
  }

  return ctx;
};
