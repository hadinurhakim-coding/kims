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
  type APIFavoriteListResponse,
} from "@/lib/api";

export interface FavoritesContextValue {
  favoritedIds: Set<string>;
  toggleFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasLoaded: authHasLoaded } = useAuth();
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    async function loadFavorites() {
      if (!authHasLoaded) return;
      if (!isAuthenticated) {
        setFavoritedIds(new Set());
        return;
      }

      try {
        const response =
          await apiRequest<APIFavoriteListResponse>("/favorites");

        if (isMounted) {
          setFavoritedIds(
            new Set(response.favorites.map((track) => track.id)),
          );
        }
      } catch {
        if (isMounted) {
          setFavoritedIds(new Set());
        }
      }
    }

    void loadFavorites();

    return () => {
      isMounted = false;
    };
  }, [authHasLoaded, isAuthenticated]);

  const toggleFavorite = useCallback(async (id: string) => {
    let shouldAdd = false;

    setFavoritedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
        shouldAdd = true;
      }

      return nextIds;
    });

    try {
      if (shouldAdd) {
        await apiRequest("/favorites", {
          method: "POST",
          body: JSON.stringify({ track_id: id }),
        });
      } else {
        await apiRequest(`/favorites/${id}`, { method: "DELETE" });
      }
    } catch {
      setFavoritedIds((currentIds) => {
        const nextIds = new Set(currentIds);

        if (shouldAdd) {
          nextIds.delete(id);
        } else {
          nextIds.add(id);
        }

        return nextIds;
      });
    }
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
