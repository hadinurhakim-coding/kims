"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface CreatePlaylistModalProps {
  isOpen: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function CreatePlaylistModal({
  isOpen,
  onConfirm,
  onCancel,
}: CreatePlaylistModalProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedName = name.trim();

  useEffect(() => {
    if (!isOpen) {
      setName("");
      return;
    }

    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
        return;
      }

      if (event.key === "Enter" && trimmedName !== "") {
        onConfirm(trimmedName);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, onConfirm, trimmedName]);

  if (!isOpen) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onCancel}
        className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] backdrop-blur-[4px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-playlist-title"
        className="fixed left-1/2 top-1/2 z-[51] w-[400px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-center justify-between gap-4">
          <h2
            id="create-playlist-title"
            className="text-lg font-bold text-[var(--color-text-primary)]"
          >
            New Playlist
          </h2>
          <button
            type="button"
            aria-label="Close create playlist dialog"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-6 block text-sm font-medium text-[var(--color-text-muted)]">
          Playlist name
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={50}
            placeholder="My awesome playlist"
            className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          />
        </label>

        <div className="mt-2 text-right text-xs text-[var(--color-text-muted)]">
          {name.length}/50
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={trimmedName === ""}
            onClick={() => {
              if (trimmedName !== "") {
                onConfirm(trimmedName);
              }
            }}
            className="rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
          >
            Create
          </button>
        </div>
      </div>
    </>
  );
}
