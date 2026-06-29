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

function getHistorySessionKey(isoDate: string) {
  const date = new Date(isoDate);
  const day = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  const hour = date.getHours();
  const session =
    hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  return `${day}|${session}`;
}

function mapAPIHistory(response: APIHistoryListResponse): HistoryEntry[] {
  return response.history.map((entry) => ({
    id: entry.entry_id,
    trackId: entry.id,
    playedAt: entry.played_at,
    playCount: entry.play_count,
  }));
}

function getEntryBucketKey(entry: HistoryEntry) {
  return `${entry.trackId}|${getHistorySessionKey(entry.playedAt)}`;
}

function mergeHistoryEntries(
  serverEntries: HistoryEntry[],
  currentEntries: HistoryEntry[],
) {
  const serverKeys = new Set(serverEntries.map(getEntryBucketKey));
  const recentPlayedAt = Date.now() - 120_000;
  const pendingEntries = currentEntries.filter(
    (entry) =>
      !serverKeys.has(getEntryBucketKey(entry)) &&
      (entry.id.startsWith("optimistic-") ||
        new Date(entry.playedAt).getTime() >= recentPlayedAt),
  );

  return [...pendingEntries, ...serverEntries].sort(
    (firstEntry, secondEntry) =>
      new Date(secondEntry.playedAt).getTime() -
      new Date(firstEntry.playedAt).getTime(),
  );
}

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
          setHistory(mapAPIHistory(response));
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
    const serverHistory = mapAPIHistory(response);

    setHistory((currentHistory) =>
      mergeHistoryEntries(serverHistory, currentHistory),
    );
  }, []);

  const recordPlay = useCallback(
    async (trackId: string) => {
      if (!isAuthenticated) return;

      const now = new Date().toISOString();
      setHistory((currentHistory) => {
        const currentSessionKey = getHistorySessionKey(now);
        const existingEntry = currentHistory.find(
          (entry) =>
            entry.trackId === trackId &&
            getHistorySessionKey(entry.playedAt) === currentSessionKey,
        );
        if (!existingEntry) {
          return [
            {
              id: `optimistic-${trackId}-${Date.now()}`,
              trackId,
              playedAt: now,
              playCount: 1,
            },
            ...currentHistory,
          ];
        }

        return currentHistory.map((entry) =>
          entry.id === existingEntry.id
            ? {
                ...entry,
                playedAt: now,
                playCount: entry.playCount + 1,
              }
            : entry,
        );
      });

      try {
        await apiRequest("/history", {
          method: "POST",
          body: JSON.stringify({ track_id: trackId }),
        });
        await refreshHistory();
      } catch (error) {
        console.warn("Failed to record play history", error);
      }
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
