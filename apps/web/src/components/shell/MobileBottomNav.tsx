"use client";

import { Compass, Library, Music, Waves } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

type MobileNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
};

const mobileNavItems: MobileNavItem[] = [
  {
    label: "Explore",
    href: "/",
    icon: Compass,
    isActive: (pathname) => pathname === "/",
  },
  {
    label: "Music",
    href: "/music",
    icon: Music,
    isActive: (pathname) => pathname === "/music",
  },
  {
    label: "SFX",
    href: "/sfx",
    icon: Waves,
    isActive: (pathname) => pathname === "/sfx",
  },
  {
    label: "Library",
    href: "/favorites",
    icon: Library,
    isActive: (pathname) =>
      pathname === "/favorites" ||
      pathname === "/playlists" ||
      pathname.startsWith("/playlists/") ||
      pathname === "/history",
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile primary navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-4px_16px_color-mix(in_srgb,var(--color-text-primary)_6%,transparent)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive(pathname);

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]",
                  isActive
                    ? "bg-[color-mix(in_srgb,var(--color-accent-primary)_10%,var(--color-surface))] text-[var(--color-accent-primary)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)]",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
