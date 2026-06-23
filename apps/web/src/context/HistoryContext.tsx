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
import { useAuth } from "@/context/AuthContext";
import {
  apiRequest,
  type APIHistoryListResponse,
} from "@/lib/api";

export interface HistoryEntry {
  id: string;
  trackId: string;
  playedAt: string;
  playCount: number;
}

export interface HistoryContextValue {
  history: HistoryEntry[];
  recordPlay: (trackId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  removeFromHistory: (entryId: string) => Promise<void>;
  getTrackHistory: (trackId: string) => HistoryEntry[];
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasLoaded: authHasLoaded } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      if (!authHasLoaded) return;
      if (!isAuthenticated) {
        setHistory([]);
        return;
      }

      try {
        const response = await apiRequest<APIHistoryListResponse>(
          "/history?limit=200&offset=0",
        );

        if (isMounted) {
          setHistory(
            response.history.map((entry) => ({
              id: entry.entry_id,
              trackId: entry.id,
              playedAt: entry.played_at,
              playCount: entry.play_count,
            })),
          );
        }
      } catch {
        if (isMounted) {
          setHistory([]);
        }
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [authHasLoaded, isAuthenticated]);

  const refreshHistory = useCallback(async () => {
    const response = await apiRequest<APIHistoryListResponse>(
      "/history?limit=200&offset=0",
    );

    setHistory(
      response.history.map((entry) => ({
        id: entry.entry_id,
        trackId: entry.id,
        playedAt: entry.played_at,
        playCount: entry.play_count,
      })),
    );
  }, []);

  const recordPlay = useCallback(
    async (trackId: string) => {
      if (!isAuthenticated) return;

      await apiRequest("/history", {
        method: "POST",
        body: JSON.stringify({ track_id: trackId }),
      });
      await refreshHistory();
    },
    [isAuthenticated, refreshHistory],
  );

  const clearHistory = useCallback(async () => {
    setHistory([]);

    try {
      await apiRequest("/history", { method: "DELETE" });
    } catch {
      await refreshHistory();
    }
  }, [refreshHistory]);

  const removeFromHistory = useCallback(async (entryId: string) => {
    const previousHistory = history;
    setHistory((currentHistory) =>
      currentHistory.filter((entry) => entry.id !== entryId),
    );

    try {
      await apiRequest(`/history/${entryId}`, { method: "DELETE" });
    } catch {
      setHistory(previousHistory);
    }
  }, [history]);

  const getTrackHistory = useCallback(
    (trackId: string) => history.filter((entry) => entry.trackId === trackId),
    [history],
  );

  const value = useMemo(
    () => ({
      history,
      recordPlay,
      clearHistory,
      removeFromHistory,
      getTrackHistory,
    }),
    [history, recordPlay, clearHistory, removeFromHistory, getTrackHistory],
  );

  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
}

export const useHistory = () => {
  const ctx = useContext(HistoryContext);

  if (!ctx) {
    throw new Error("useHistory must be used within HistoryProvider");
  }

  return ctx;
};
