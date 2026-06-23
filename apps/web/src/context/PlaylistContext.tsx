"use client";

import type { Track } from "@/data/tracks";
import { useAuth } from "@/context/AuthContext";
import {
  apiRequest,
  mapAPITrack,
  type APIPlaylist,
  type APIPlaylistDetail,
  type APIPlaylistListResponse,
} from "@/lib/api";
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
  updatedAt?: string;
}

export interface PlaylistContextValue {
  playlists: Playlist[];
  createPlaylist: (name: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  getPlaylistTracks: (playlistId: string) => Track[];
  isTrackInPlaylist: (playlistId: string, trackId: string) => boolean;
}

const PlaylistContext = createContext<PlaylistContextValue | null>(null);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasLoaded: authHasLoaded } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<Record<string, Track[]>>(
    {},
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPlaylists() {
      if (!authHasLoaded) return;
      if (!isAuthenticated) {
        setPlaylists([]);
        setPlaylistTracks({});
        return;
      }

      try {
        const response =
          await apiRequest<APIPlaylistListResponse>("/playlists");
        const details = await Promise.all(
          response.playlists.map((playlist) =>
            apiRequest<APIPlaylistDetail>(`/playlists/${playlist.id}`),
          ),
        );

        if (!isMounted) return;

        setPlaylists(details.map(mapAPIPlaylistDetail));
        setPlaylistTracks(
          Object.fromEntries(
            details.map((detail) => [
              detail.id,
              detail.tracks.map(mapAPITrack),
            ]),
          ),
        );
      } catch {
        if (isMounted) {
          setPlaylists([]);
          setPlaylistTracks({});
        }
      }
    }

    void loadPlaylists();

    return () => {
      isMounted = false;
    };
  }, [authHasLoaded, isAuthenticated]);

  const createPlaylist = useCallback(async (name: string) => {
    const playlist = mapAPIPlaylist(
      await apiRequest<APIPlaylist>("/playlists", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    );

    setPlaylists((currentPlaylists) => [playlist, ...currentPlaylists]);
    setPlaylistTracks((currentTracks) => ({
      ...currentTracks,
      [playlist.id]: [],
    }));

    return playlist;
  }, []);

  const deletePlaylist = useCallback(async (id: string) => {
    const previousPlaylists = playlists;
    const previousTracks = playlistTracks;

    setPlaylists((currentPlaylists) =>
      currentPlaylists.filter((playlist) => playlist.id !== id),
    );
    setPlaylistTracks((currentTracks) => {
      const nextTracks = { ...currentTracks };
      delete nextTracks[id];
      return nextTracks;
    });

    try {
      await apiRequest(`/playlists/${id}`, { method: "DELETE" });
    } catch {
      setPlaylists(previousPlaylists);
      setPlaylistTracks(previousTracks);
    }
  }, [playlistTracks, playlists]);

  const addTrackToPlaylist = useCallback(
    async (playlistId: string, trackId: string) => {
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

      try {
        await apiRequest(`/playlists/${playlistId}/tracks`, {
          method: "POST",
          body: JSON.stringify({ track_id: trackId }),
        });
        const detail = await apiRequest<APIPlaylistDetail>(
          `/playlists/${playlistId}`,
        );
        setPlaylistTracks((currentTracks) => ({
          ...currentTracks,
          [playlistId]: detail.tracks.map(mapAPITrack),
        }));
      } catch {
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
      }
    },
    [],
  );

  const removeTrackFromPlaylist = useCallback(
    async (playlistId: string, trackId: string) => {
      const previousTracks = playlistTracks;

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
      setPlaylistTracks((currentTracks) => ({
        ...currentTracks,
        [playlistId]:
          currentTracks[playlistId]?.filter((track) => track.id !== trackId) ??
          [],
      }));

      try {
        await apiRequest(`/playlists/${playlistId}/tracks/${trackId}`, {
          method: "DELETE",
        });
      } catch {
        setPlaylistTracks(previousTracks);
        setPlaylists((currentPlaylists) =>
          currentPlaylists.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  trackIds: previousTracks[playlistId]?.map((track) => track.id) ?? [],
                }
              : playlist,
          ),
        );
      }
    },
    [playlistTracks],
  );

  const getPlaylistTracks = useCallback(
    (playlistId: string) => playlistTracks[playlistId] ?? [],
    [playlistTracks],
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

function mapAPIPlaylist(playlist: APIPlaylist): Playlist {
  return {
    id: playlist.id,
    name: playlist.name,
    trackIds: [],
    createdAt: playlist.created_at,
    updatedAt: playlist.updated_at,
  };
}

function mapAPIPlaylistDetail(detail: APIPlaylistDetail): Playlist {
  return {
    id: detail.id,
    name: detail.name,
    trackIds: detail.tracks.map((track) => track.id),
    createdAt: detail.created_at,
    updatedAt: detail.updated_at,
  };
}
