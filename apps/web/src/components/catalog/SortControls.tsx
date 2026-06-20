"use client";

import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { useState } from "react";

export type SortKey = "default" | "duration" | "mood" | "license" | "category";
export type SortOrder = "asc" | "desc";

export interface SortControlsProps {
  options?: SortKey[];
  onSortChange?: (sort: SortKey, order: SortOrder) => void;
}

const sortOptions: Array<{ label: string; value: SortKey }> = [
  { label: "Default", value: "default" },
  { label: "Duration", value: "duration" },
  { label: "Mood", value: "mood" },
  { label: "License", value: "license" },
  { label: "Category", value: "category" },
];

export function SortControls({ options, onSortChange }: SortControlsProps) {
  const [activeSort, setActiveSort] = useState<SortKey>("default");
  const [order, setOrder] = useState<SortOrder>("asc");
  const visibleOptions = options
    ? sortOptions.filter((option) => options.includes(option.value))
    : sortOptions.filter((option) => option.value !== "category");
  const OrderIcon = order === "asc" ? ArrowUpAZ : ArrowDownAZ;

  function handleSortChange(sort: SortKey) {
    setActiveSort(sort);
    onSortChange?.(sort, order);
  }

  function handleOrderChange() {
    const nextOrder = order === "asc" ? "desc" : "asc";

    setOrder(nextOrder);
    onSortChange?.(activeSort, nextOrder);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--color-text-muted)]">Sort by</span>
        {visibleOptions.map((option) => {
          const isActive = option.value === activeSort;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleSortChange(option.value)}
              className={[
                "rounded-[var(--radius-full)] border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
                isActive
                  ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)] text-[var(--color-surface)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-background)]",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label={`Sort ${order === "asc" ? "descending" : "ascending"}`}
        onClick={handleOrderChange}
        className={[
          "flex h-9 w-9 items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
          order === "desc"
            ? "text-[var(--color-accent-primary)]"
            : "text-[var(--color-text-muted)]",
        ].join(" ")}
      >
        <OrderIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
