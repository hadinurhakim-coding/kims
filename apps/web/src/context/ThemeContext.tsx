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

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mounted: boolean;
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (theme: ThemePreference) => void;
  toggleTheme: () => void;
};

const storageKey = "kims-theme";
const preferences: ThemePreference[] = ["light", "dark", "system"];

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";

  try {
    const storedTheme = window.localStorage.getItem(storageKey);
    return isThemePreference(storedTheme) ? storedTheme : "system";
  } catch {
    return "system";
  }
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;

  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute("content", resolvedTheme);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>(getInitialPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const resolvedTheme =
    themePreference === "system" ? systemTheme : themePreference;

  const setThemePreference = useCallback((theme: ThemePreference) => {
    setThemePreferenceState(theme);

    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // The UI can still switch theme if storage is unavailable.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreferenceState((currentTheme) => {
      const currentIndex = preferences.indexOf(currentTheme);
      const nextTheme = preferences[(currentIndex + 1) % preferences.length];

      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {
        // The UI can still switch theme if storage is unavailable.
      }

      return nextTheme;
    });
  }, []);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function handleChange() {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      document.documentElement.classList.remove("no-transition");
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const value = useMemo(
    () => ({
      mounted,
      themePreference,
      resolvedTheme,
      setThemePreference,
      toggleTheme,
    }),
    [mounted, themePreference, resolvedTheme, setThemePreference, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return ctx;
}
