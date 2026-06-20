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

export interface FavoritesContextValue {
  favoritedIds: Set<string>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const storageKey = "kims-favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        setFavoritedIds(new Set(JSON.parse(stored) as string[]));
      }
    } catch {
      setFavoritedIds(new Set());
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify([...favoritedIds]));
    } catch {
      // Ignore unavailable storage.
    }
  }, [favoritedIds, hasLoaded]);

  const toggleFavorite = useCallback((id: string) => {
    setFavoritedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }

      return nextIds;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favoritedIds.has(id),
    [favoritedIds],
  );

  const value = useMemo(
    () => ({
      favoritedIds,
      toggleFavorite,
      isFavorite,
    }),
    [favoritedIds, toggleFavorite, isFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);

  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }

  return ctx;
};
