import type { ReactNode } from "react";

export interface CatalogLayoutProps {
  pageHeader: ReactNode;
  filterChips?: ReactNode;
  sortControls?: ReactNode;
  children: ReactNode;
}

export function CatalogLayout({
  pageHeader,
  filterChips,
  sortControls,
  children,
}: CatalogLayoutProps) {
  return (
    <section className="text-[var(--color-text-primary)]">
      {pageHeader}

      {filterChips ? <div className="mt-4">{filterChips}</div> : null}

      {sortControls ? <div className="mt-3">{sortControls}</div> : null}

      <div className="mt-4">{children}</div>
    </section>
  );
}
