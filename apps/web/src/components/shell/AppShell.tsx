"use client";

import { cloneElement, isValidElement, useState, type ReactNode } from "react";
import { useAudio } from "@/context/AudioContext";
import { MobileBottomNav } from "./MobileBottomNav";
import { PageTransition } from "./PageTransition";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

type AppShellProps = {
  children: ReactNode;
  rightPanel?: ReactNode;
  bottomPlayer?: ReactNode;
  searchQuery?: string;
  onSearch?: (value: string) => void;
};

export function AppShell({
  children,
  rightPanel,
  bottomPlayer,
  searchQuery,
  onSearch,
}: AppShellProps) {
  const { currentTrack } = useAudio();
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const mobileAwareBottomPlayer =
    bottomPlayer && rightPanel && isValidElement(bottomPlayer)
      ? cloneElement(bottomPlayer, {
          onOpenDetails: () => setIsMobilePanelOpen(true),
        } as { onOpenDetails: () => void })
      : bottomPlayer;

  return (
    <div className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[var(--color-background)] text-[var(--color-text-primary)] lg:h-screen lg:overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[var(--radius-full)] focus:bg-[var(--color-surface)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--color-accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
      >
        Skip to main content
      </a>

      <aside
        aria-label="Sidebar"
        className="fixed left-0 top-0 z-30 hidden h-screen w-[220px] border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block"
      >
        <Sidebar />
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)] lg:left-[220px]">
        <TopBar searchQuery={searchQuery} onSearch={onSearch} />
      </header>

      <div
        className={[
          "min-h-screen pt-16 lg:ml-[220px] lg:mr-[280px] lg:pb-0",
          currentTrack ? "pb-40" : "pb-20",
        ].join(" ")}
      >
        <main
          id="main-content"
          className="min-h-[calc(100vh-136px)] bg-[var(--color-background)] lg:h-[calc(100vh-4rem)] lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"
        >
          <PageTransition>{children}</PageTransition>
        </main>

        <aside
          aria-label="Supplementary panel"
          className="hidden min-h-[280px] border-t border-[var(--color-border)] bg-[var(--color-surface)] lg:fixed lg:right-0 lg:top-0 lg:z-30 lg:block lg:h-screen lg:w-[280px] lg:border-t-0"
        >
          {rightPanel}
        </aside>
      </div>

      {currentTrack && bottomPlayer ? (
        <footer aria-label="Music player" className="relative">
          {mobileAwareBottomPlayer}
        </footer>
      ) : null}

      {rightPanel && isMobilePanelOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Now playing details"
          className="fixed inset-0 z-[70] lg:hidden"
        >
          <button
            type="button"
            aria-label="Close details"
            onClick={() => setIsMobilePanelOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/40"
          />
          <section className="absolute bottom-0 left-0 right-0 max-h-[82dvh] overflow-hidden rounded-t-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-10px_28px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Now Playing
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Details and recent tracks
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobilePanelOpen(false)}
                className="flex h-11 items-center justify-center rounded-[var(--radius-full)] px-4 text-sm font-semibold text-[var(--color-accent-primary)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(82dvh-65px)] overflow-y-auto">
              {rightPanel}
            </div>
          </section>
        </div>
      ) : null}

      <MobileBottomNav />
    </div>
  );
}
