import { SearchX } from "lucide-react";

export interface EmptySearchProps {
  query: string;
  onClear?: () => void;
}

export function EmptySearch({ query, onClear }: EmptySearchProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-6 py-10 text-center">
      <SearchX className="h-16 w-16 text-[var(--color-text-muted)]" />
      <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
        No tracks found
      </h3>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        Try a different keyword or filter
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 rounded-[var(--radius-full)] border border-[var(--color-accent-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-accent-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_8%,var(--color-surface))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
      >
        Clear Search
        <span className="sr-only"> for {query}</span>
      </button>
    </div>
  );
}
