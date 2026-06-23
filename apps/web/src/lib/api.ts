import type { Track } from "@/data/tracks";

const apiBasePath = "/api/v1";
const accessTokenKey = "kims-auth-access-token";

export type APITrack = {
  id: string;
  title: string;
  type: Track["type"];
  mood: string;
  sfx_category?: Track["sfxCategory"] | null;
  duration: string;
  license_label: Track["licenseLabel"];
  cover_url: string;
  audio_url: string;
};

export type APIListTracksResponse = {
  tracks: APITrack[];
  total: number;
  limit: number;
  offset: number;
};

export type APIFavoriteListResponse = {
  favorites: APITrack[];
  total: number;
};

export type APIPlaylist = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type APIPlaylistTrack = APITrack & {
  position: number;
  added_at: string;
};

export type APIPlaylistListResponse = {
  playlists: APIPlaylist[];
  total: number;
};

export type APIPlaylistDetail = APIPlaylist & {
  tracks: APIPlaylistTrack[];
  total: number;
};

export type APIHistoryTrack = APITrack & {
  entry_id: string;
  play_count: number;
  played_at: string;
};

export type APIHistoryListResponse = {
  history: APIHistoryTrack[];
  total: number;
};

export function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(accessTokenKey);
}

export function mapAPITrack(track: APITrack): Track {
  return {
    id: track.id,
    title: track.title,
    type: track.type,
    mood: track.mood,
    sfxCategory: track.sfx_category ?? undefined,
    duration: track.duration,
    licenseLabel: track.license_label,
    cover: track.cover_url,
    isFavorite: false,
    audioSrc: track.audio_url,
  };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
) {
  const headers = new Headers(options.headers);
  const token = getStoredAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBasePath}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(await parseAPIError(response, "Request failed"));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function parseAPIError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}
