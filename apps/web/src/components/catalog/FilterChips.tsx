"use client";

import { useState } from "react";

export interface FilterChipsProps {
  options?: string[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
}

const defaultChips = [
  "All",
  "Lofi",
  "Cinematic",
  "SFX",
  "Loop",
  "No Attribution",
  "Commercial Use",
];

export function FilterChips({
  options,
  value,
  onChange,
  label,
}: FilterChipsProps) {
  const [activeChip, setActiveChip] = useState("All");
  const chips = options ?? defaultChips;
  const isControlled = value !== undefined;
  const selectedChip = value ?? activeChip;

  function handleSelect(nextValue: string) {
    if (!isControlled) {
      setActiveChip(nextValue);
    }

    onChange?.(nextValue);
  }

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          {label}
        </span>
      ) : null}

      <div
        role="group"
        aria-label="Filter tracks by category"
        className="scrollbar-hide -mx-4 flex flex-nowrap gap-2 overflow-x-auto overflow-y-visible px-4 py-1 overscroll-x-contain md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:py-0"
      >
        {chips.map((chip) => {
          const isActive = chip === selectedChip;

          return (
            <button
              key={chip}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleSelect(chip)}
              className={[
                "min-h-10 shrink-0 rounded-[var(--radius-full)] border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] md:px-4 md:py-2",
                isActive
                  ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)] text-[var(--color-surface)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_8%,var(--color-surface))]",
              ].join(" ")}
            >
              {chip}
            </button>
          );
        })}
      </div>
    </div>
  );
}
