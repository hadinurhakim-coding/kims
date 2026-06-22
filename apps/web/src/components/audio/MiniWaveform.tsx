"use client";

import { useAudio } from "@/context/AudioContext";
import type { Track } from "@/data/tracks";
import { useEffect, useMemo, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

export interface MiniWaveformProps {
  track: Track | null;
}

const waveformColors: Record<string, string> = {
  Lofi: "#2563EB",
  Cinematic: "#7C3AED",
  SFX: "#0D9488",
  Music: "#2563EB",
};

const loadingBars = Array.from({ length: 8 }, (_, index) => index);

function withOpacity(color: string, opacity: number) {
  const normalizedOpacity = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");

  return `${color}${normalizedOpacity}`;
}

export function MiniWaveform({ track }: MiniWaveformProps) {
  const { currentTime, duration, isReady } = useAudio();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const isDestroyedRef = useRef(false);
  const waveformColor = waveformColors[track?.type ?? "Music"];

  const waveColor = useMemo(
    () => withOpacity(waveformColor, 0.25),
    [waveformColor],
  );
  const progressColor = useMemo(
    () => withOpacity(waveformColor, 0.9),
    [waveformColor],
  );
  const loadingColor = useMemo(
    () => withOpacity(waveformColor, 0.3),
    [waveformColor],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    isDestroyedRef.current = false;

    const waveSurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      height: 32,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      interact: false,
    });

    waveSurfer.setVolume(0);
    waveSurfer.on("ready", () => {
      try {
        if (isDestroyedRef.current) return;
      } catch {
        // Ignore event errors while the visual waveform is tearing down.
      }
    });
    waveSurfer.on("audioprocess", () => {
      try {
        if (isDestroyedRef.current) return;
      } catch {
        // Ignore event errors while the visual waveform is tearing down.
      }
    });
    waveSurfer.on("finish", () => {
      try {
        if (isDestroyedRef.current) return;
      } catch {
        // Ignore event errors while the visual waveform is tearing down.
      }
    });
    waveSurfer.on("error", () => {
      try {
        if (isDestroyedRef.current) return;
      } catch {
        // Ignore event errors while the visual waveform is tearing down.
      }
    });
    waveSurferRef.current = waveSurfer;

    return () => {
      isDestroyedRef.current = true;

      try {
        const waveSurferToDestroy = waveSurferRef.current;

        waveSurferToDestroy?.stop();
        waveSurferToDestroy?.unAll();
        setTimeout(() => {
          try {
            waveSurferToDestroy?.destroy();

            if (waveSurferRef.current === waveSurferToDestroy) {
              waveSurferRef.current = null;
            }
          } catch {
            // Ignore destroy errors on unmount.
          }
        }, 100);
      } catch {
        // Ignore stop errors on unmount.
      }
    };
  }, []);

  useEffect(() => {
    const waveSurfer = waveSurferRef.current;

    if (isDestroyedRef.current || !waveSurfer) return;

    waveSurfer.setOptions({
      waveColor,
      progressColor,
      barRadius: 2,
      interact: false,
    });
  }, [progressColor, waveColor]);

  useEffect(() => {
    const waveSurfer = waveSurferRef.current;

    if (isDestroyedRef.current || !waveSurfer || !track) return;

    waveSurfer.setVolume(0);
    void waveSurfer.load(track.audioSrc).catch(() => {
      // Ignore load aborts while the visual waveform is tearing down.
    });
  }, [track]);

  useEffect(() => {
    const waveSurfer = waveSurferRef.current;

    if (isDestroyedRef.current || !waveSurfer || !isReady || !duration) return;

    try {
      waveSurfer.seekTo(currentTime / duration);
    } catch {
      // Ignore seek errors while the visual waveform is tearing down.
    }
  }, [currentTime, duration, isReady]);

  if (!track) {
    return <div className="h-8 w-full bg-transparent" />;
  }

  return (
    <div className="relative h-8 w-full overflow-hidden bg-transparent">
      <div ref={containerRef} className="h-full w-full" aria-hidden="true" />

      {!isReady ? (
        <div className="absolute inset-0 flex items-center justify-center gap-1">
          {loadingBars.map((bar) => (
            <div
              key={bar}
              className="h-5 w-0.5 animate-pulse rounded-full"
              style={{ backgroundColor: loadingColor }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
