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

export interface HistoryEntry {
  id: string;
  trackId: string;
  playedAt: string;
  playCount: number;
}

export interface HistoryContextValue {
  history: HistoryEntry[];
  recordPlay: (trackId: string) => void;
  clearHistory: () => void;
  removeFromHistory: (entryId: string) => void;
  getTrackHistory: (trackId: string) => HistoryEntry[];
}

const HistoryContext = createContext<HistoryContextValue | null>(null);
const storageKey = "kims-history";
const recentPlayWindowMs = 1_800_000;
const maxHistoryEntries = 200;

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        setHistory((JSON.parse(stored) as HistoryEntry[]).slice(0, 200));
      }
    } catch {
      setHistory([]);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(history.slice(0, maxHistoryEntries)),
      );
    } catch {
      // Ignore unavailable storage.
    }
  }, [history, hasLoaded]);

  const recordPlay = useCallback((trackId: string) => {
    setHistory((currentHistory) => {
      const now = Date.now();
      const playedAt = new Date(now).toISOString();
      const recent = currentHistory.find(
        (entry) =>
          entry.trackId === trackId &&
          now - new Date(entry.playedAt).getTime() < recentPlayWindowMs,
      );

      if (recent) {
        return currentHistory
          .map((entry) =>
            entry.id === recent.id
              ? {
                  ...entry,
                  playedAt,
                  playCount: entry.playCount + 1,
                }
              : entry,
          )
          .slice(0, maxHistoryEntries);
      }

      return [
        {
          id: crypto.randomUUID(),
          trackId,
          playedAt,
          playCount: 1,
        },
        ...currentHistory,
      ].slice(0, maxHistoryEntries);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeFromHistory = useCallback((entryId: string) => {
    setHistory((currentHistory) =>
      currentHistory.filter((entry) => entry.id !== entryId),
    );
  }, []);

  const getTrackHistory = useCallback(
    (trackId: string) =>
      history.filter((entry) => entry.trackId === trackId),
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
