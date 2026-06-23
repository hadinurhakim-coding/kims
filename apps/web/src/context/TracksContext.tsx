"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Track } from "@/data/tracks";
import {
  apiRequest,
  mapAPITrack,
  type APIListTracksResponse,
} from "@/lib/api";

export interface TracksContextValue {
  tracks: Track[];
  featuredTrack: Track | null;
  cinematicTracks: Track[];
  featuredCinematicTrack: Track | null;
  hasLoaded: boolean;
  refreshTracks: () => Promise<void>;
}

const TracksContext = createContext<TracksContextValue | null>(null);

export function TracksProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const refreshTracks = useCallback(async () => {
    const response = await apiRequest<APIListTracksResponse>(
      "/tracks?limit=100&offset=0",
    );
    setTracks(response.tracks.map(mapAPITrack));
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadTracks() {
      try {
        const response = await apiRequest<APIListTracksResponse>(
          "/tracks?limit=100&offset=0",
        );

        if (isMounted) {
          setTracks(response.tracks.map(mapAPITrack));
        }
      } catch {
        if (isMounted) {
          setTracks([]);
        }
      } finally {
        if (isMounted) {
          setHasLoaded(true);
        }
      }
    }

    void loadTracks();

    return () => {
      isMounted = false;
    };
  }, []);

  const cinematicTracks = useMemo(
    () => tracks.filter((track) => track.type === "Cinematic"),
    [tracks],
  );

  const value = useMemo(
    () => ({
      tracks,
      featuredTrack: tracks[0] ?? null,
      cinematicTracks,
      featuredCinematicTrack: cinematicTracks[0] ?? null,
      hasLoaded,
      refreshTracks,
    }),
    [tracks, cinematicTracks, hasLoaded, refreshTracks],
  );

  return (
    <TracksContext.Provider value={value}>{children}</TracksContext.Provider>
  );
}

export const useTracks = () => {
  const ctx = useContext(TracksContext);

  if (!ctx) {
    throw new Error("useTracks must be used within TracksProvider");
  }

  return ctx;
};
