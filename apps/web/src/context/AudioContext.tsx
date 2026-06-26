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
import WaveSurfer from "wavesurfer.js";

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

export function AudioProvider({ children }: { children: ReactNode }) {
  const { recordPlay } = useHistory();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const currentTrackRef = useRef<Track | null>(null);
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
    if (typeof window === "undefined" || !containerRef.current) return;

    const waveSurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "transparent",
      progressColor: "transparent",
      height: 0,
      barWidth: 0,
    });

    waveSurfer.setVolume(volumeRef.current);
    waveSurferRef.current = waveSurfer;

    waveSurfer.on("ready", () => {
      setDuration(waveSurfer.getDuration());
      setIsReady(true);
      void waveSurfer.play();
      setIsPlaying(true);
    });

    waveSurfer.on("audioprocess", () => {
      setCurrentTime(waveSurfer.getCurrentTime());
    });

    waveSurfer.on("finish", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    waveSurfer.on("error", (error) => {
      setIsReady(false);
      console.error("WaveSurfer error", error);
    });

    return () => {
      waveSurfer.destroy();
      waveSurferRef.current = null;
    };
  }, []);

  const playTrack = useCallback((track: Track) => {
    const waveSurfer = waveSurferRef.current;

    if (!waveSurfer) return;

    if (currentTrackRef.current?.id === track.id) {
      void waveSurfer.play();
      setIsPlaying(true);
      return;
    }

    setCurrentTrack(track);
    setIsReady(false);
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    if (!isPlayableAudioSource(track.audioSrc)) {
      setIsReady(false);
      return;
    }

    void waveSurfer
      .load(track.audioSrc)
      .then(() => {
        void recordPlay(track.id);
      })
      .catch(() => {
        setIsReady(false);
        setIsPlaying(false);
      });
  }, [recordPlay]);

  const togglePlayPause = useCallback(() => {
    const waveSurfer = waveSurferRef.current;

    if (!waveSurfer || !isReady) return;

    if (waveSurfer.isPlaying()) {
      waveSurfer.pause();
      setIsPlaying(false);
      return;
    }

    void waveSurfer.play();
    setIsPlaying(true);
  }, [isReady]);

  const setVolume = useCallback((nextVolume: number) => {
    const normalizedVolume = Math.min(1, Math.max(0, nextVolume));

    setVolumeState(normalizedVolume);
    volumeRef.current = normalizedVolume;
    waveSurferRef.current?.setVolume(normalizedVolume);
  }, []);

  const seek = useCallback(
    (seconds: number) => {
      const waveSurfer = waveSurferRef.current;

      if (!waveSurfer || !isReady || duration <= 0) return;

      waveSurfer.seekTo(Math.min(1, Math.max(0, seconds / duration)));
      setCurrentTime(seconds);
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
      <div ref={containerRef} aria-hidden="true" style={{ display: "none" }} />
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
