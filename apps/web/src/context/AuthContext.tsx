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

export interface AuthContextValue {
  isAuthenticated: boolean;
  mockLogin: () => void;
  mockLogout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const storageKey = "kims-auth-mock";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      setIsAuthenticated(localStorage.getItem(storageKey) === "true");
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  const mockLogin = useCallback(() => {
    setIsAuthenticated(true);

    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      // Ignore unavailable storage.
    }
  }, []);

  const mockLogout = useCallback(() => {
    setIsAuthenticated(false);

    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore unavailable storage.
    }
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      mockLogin,
      mockLogout,
    }),
    [isAuthenticated, mockLogin, mockLogout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
};
