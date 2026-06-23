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
  hasLoaded: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const accessTokenKey = "kims-auth-access-token";
const refreshTokenKey = "kims-auth-refresh-token";
const userKey = "kims-auth-user";
const legacyMockStorageKey = "kims-auth-mock";
const apiBasePath = "/api/v1";

async function parseAPIError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

async function requestAuth(path: string, payload: unknown) {
  const response = await fetch(`${apiBasePath}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseAPIError(response, "Authentication failed"));
  }

  return (await response.json()) as AuthResponse;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        localStorage.removeItem(legacyMockStorageKey);

        const storedAccessToken = localStorage.getItem(accessTokenKey);
        const storedUser = localStorage.getItem(userKey);

        if (!storedAccessToken || !storedUser) {
          setIsAuthenticated(false);
          setUser(null);
          setAccessToken(null);
          return;
        }

        setAccessToken(storedAccessToken);
        setUser(JSON.parse(storedUser) as AuthUser);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
        setUser(null);
        setAccessToken(null);
      } finally {
        setHasLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const persistAuth = useCallback((auth: AuthResponse) => {
    setIsAuthenticated(true);
    setUser(auth.user);
    setAccessToken(auth.access_token);

    try {
      localStorage.setItem(accessTokenKey, auth.access_token);
      localStorage.setItem(refreshTokenKey, auth.refresh_token);
      localStorage.setItem(userKey, JSON.stringify(auth.user));
    } catch {
      // Ignore unavailable storage.
    }
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      persistAuth(await requestAuth("/auth/login", payload));
    },
    [persistAuth],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      persistAuth(await requestAuth("/auth/register", payload));
    },
    [persistAuth],
  );

  const logout = useCallback(async () => {
    const currentAccessToken = accessToken;

    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);

    try {
      localStorage.removeItem(accessTokenKey);
      localStorage.removeItem(refreshTokenKey);
      localStorage.removeItem(userKey);
      localStorage.removeItem(legacyMockStorageKey);
    } catch {
      // Ignore unavailable storage.
    }

    if (!currentAccessToken) return;

    try {
      await fetch(`${apiBasePath}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
        },
      });
    } catch {
      // Local logout should still complete if the network request fails.
    }
  }, [accessToken]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      hasLoaded,
      user,
      accessToken,
      login,
      register,
      logout,
    }),
    [isAuthenticated, hasLoaded, user, accessToken, login, register, logout],
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
