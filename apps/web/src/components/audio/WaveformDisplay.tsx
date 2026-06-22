"use client";

import { useAudio } from "@/context/AudioContext";
import type { Track } from "@/data/tracks";
import { useEffect, useMemo, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

export interface WaveformDisplayProps {
  track: Track | null;
}

const waveformColors: Record<string, string> = {
  Lofi: "#2563EB",
  Cinematic: "#7C3AED",
  SFX: "#0D9488",
  Music: "#2563EB",
};

const loadingBars = ["h-7", "h-12", "h-16", "h-10", "h-14"];

function withOpacity(color: string, opacity: number) {
  const normalizedOpacity = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");

  return `${color}${normalizedOpacity}`;
}

export function WaveformDisplay({ track }: WaveformDisplayProps) {
  const { currentTrack, currentTime, duration, isReady } = useAudio();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const isDestroyedRef = useRef(false);
  const activeTrack = track ?? currentTrack;
  const waveformColor = waveformColors[activeTrack?.type ?? "Music"];

  const waveColor = useMemo(
    () => withOpacity(waveformColor, 0.3),
    [waveformColor],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    isDestroyedRef.current = false;

    const waveSurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor: waveformColor,
      height: 80,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
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
      progressColor: waveformColor,
      barRadius: 3,
      interact: false,
    });
  }, [waveColor, waveformColor]);

  useEffect(() => {
    const waveSurfer = waveSurferRef.current;

    if (isDestroyedRef.current || !waveSurfer || !activeTrack) return;

    waveSurfer.setVolume(0);
    void waveSurfer.load(activeTrack.audioSrc).catch(() => {
      // Ignore load aborts while the visual waveform is tearing down.
    });
  }, [activeTrack]);

  useEffect(() => {
    const waveSurfer = waveSurferRef.current;

    if (isDestroyedRef.current || !waveSurfer || !isReady || !duration) return;

    try {
      waveSurfer.seekTo(currentTime / duration);
    } catch {
      // Ignore seek errors while the visual waveform is tearing down.
    }
  }, [currentTime, duration, isReady]);

  return (
    <div className="relative h-20 w-full overflow-hidden rounded-lg bg-[color-mix(in_srgb,var(--color-border)_30%,transparent)]">
      <div ref={containerRef} className="h-full w-full" aria-hidden="true" />

      {!isReady ? (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          {loadingBars.map((heightClass, index) => (
            <div
              key={`${heightClass}-${index}`}
              className={[
                "w-1 rounded-full animate-pulse",
                heightClass,
              ].join(" ")}
              style={{ backgroundColor: waveColor }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
