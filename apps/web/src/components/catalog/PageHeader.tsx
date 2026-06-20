import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  trackCount: number;
  actions?: ReactNode;
}

export function PageHeader({ title, trackCount, actions }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {title}
        </h1>
        <span className="rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1 text-sm text-[var(--color-text-muted)]">
          {trackCount} tracks
        </span>
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
