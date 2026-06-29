"use client";

import type { Track } from "@/data/tracks";
import { useHistory } from "@/context/HistoryContext";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface AudioContextValue {
  currentTrack: Track | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isReady: boolean;
  playTrack: (track: Track) => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  seek: (seconds: number) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

function isPlayableAudioSource(source: string) {
  return (
    source.startsWith("/") ||
    source.startsWith("http://") ||
    source.startsWith("https://")
  );
}

function isExpectedPlaybackInterruption(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "NotAllowedError" || error.name === "AbortError")
  );
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const { recordPlay } = useHistory();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<Track | null>(null);
  const playRequestRef = useRef(0);
  const volumeRef = useRef(0.8);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volumeState, setVolumeState] = useState(0.8);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const audioElement = audio;
    audioElement.volume = volumeRef.current;

    function handleLoadedMetadata() {
      setDuration(
        Number.isFinite(audioElement.duration) ? audioElement.duration : 0,
      );
      setIsReady(true);
    }

    function handleTimeUpdate() {
      setCurrentTime(audioElement.currentTime);
    }

    function handlePlay() {
      setIsPlaying(true);
    }

    function handlePause() {
      setIsPlaying(false);
    }

    function handleEnded() {
      setIsPlaying(false);
      setCurrentTime(0);
    }

    function handleError() {
      setIsReady(false);
      setIsPlaying(false);
      console.warn("Audio playback error", audioElement.error);
    }

    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("durationchange", handleLoadedMetadata);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("error", handleError);

    return () => {
      audioElement.pause();
      audioElement.removeAttribute("src");
      audioElement.load();
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("durationchange", handleLoadedMetadata);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("error", handleError);
    };
  }, []);

  const playAudio = useCallback(async (audio: HTMLAudioElement) => {
    try {
      await audio.play();
      setIsPlaying(true);
      return true;
    } catch (error) {
      setIsPlaying(false);

      if (!isExpectedPlaybackInterruption(error)) {
        console.warn("Audio play was interrupted", error);
      }

      return false;
    }
  }, []);

  const playTrack = useCallback(
    (track: Track) => {
      const audio = audioRef.current;
      const playRequest = playRequestRef.current + 1;
      playRequestRef.current = playRequest;

      if (!audio) return;

      if (currentTrackRef.current?.id === track.id) {
        void playAudio(audio);
        return;
      }

      setCurrentTrack(track);
      setIsReady(false);
      setIsPlaying(false);
      setDuration(0);
      setCurrentTime(0);

      if (!isPlayableAudioSource(track.audioSrc)) {
        return;
      }

      audio.pause();
      audio.currentTime = 0;
      audio.src = track.audioSrc;
      audio.load();

      void playAudio(audio).then((didPlay) => {
        if (didPlay && playRequestRef.current === playRequest) {
          void recordPlay(track.id);
        }
      });
    },
    [playAudio, recordPlay],
  );

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;

    if (!audio || !isReady) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    void playAudio(audio);
  }, [isReady, playAudio]);

  const setVolume = useCallback((nextVolume: number) => {
    const normalizedVolume = Math.min(1, Math.max(0, nextVolume));

    setVolumeState(normalizedVolume);
    volumeRef.current = normalizedVolume;

    if (audioRef.current) {
      audioRef.current.volume = normalizedVolume;
    }
  }, []);

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;

      if (!audio || !isReady || duration <= 0) return;

      const nextTime = Math.min(duration, Math.max(0, seconds));
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [duration, isReady],
  );

  const value = useMemo(
    () => ({
      currentTrack,
      isPlaying,
      duration,
      currentTime,
      volume: volumeState,
      isReady,
      playTrack,
      togglePlayPause,
      setVolume,
      seek,
    }),
    [
      currentTrack,
      isPlaying,
      duration,
      currentTime,
      volumeState,
      isReady,
      playTrack,
      togglePlayPause,
      setVolume,
      seek,
    ],
  );

  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" style={{ display: "none" }} />
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const ctx = useContext(AudioContext);

  if (!ctx) {
    throw new Error("useAudio must be used within AudioProvider");
  }

  return ctx;
};
