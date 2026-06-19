"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[220px] border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
        <Sidebar />
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)] lg:left-[220px]">
        <TopBar />
      </header>

      <div className="min-h-screen pb-[72px] pt-16 md:pb-[72px] lg:ml-[220px] lg:mr-[280px]">
        <main className="min-h-[calc(100vh-136px)] overflow-y-auto bg-[var(--color-background)]">
          {children}
        </main>

        <aside className="min-h-[280px] border-t border-[var(--color-border)] bg-[var(--color-surface)] lg:fixed lg:right-0 lg:top-0 lg:z-30 lg:h-screen lg:w-[280px] lg:border-l lg:border-t-0" />
      </div>

      <footer className="sticky bottom-0 left-0 right-0 z-50 h-[72px] border-t border-[var(--color-border)] bg-[var(--color-player-background)] shadow-[var(--shadow-player)] md:fixed" />
    </div>
  );
}
