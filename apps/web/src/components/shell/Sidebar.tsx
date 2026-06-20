"use client";

import {
  Clock,
  Compass,
  Film,
  Heart,
  History,
  ListMusic,
  LogOut,
  Music,
  Music2,
  Sparkles,
  User,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { useFavorites } from "@/context/FavoritesContext";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    label: "MENU",
    items: [
      { label: "Explore", href: "/", icon: Compass },
      { label: "Music", href: "/music", icon: Music },
      { label: "Sound Effects", href: "/sfx", icon: Waves },
      { label: "Lofi", href: "/lofi", icon: Sparkles },
      { label: "Cinematic", href: "/cinematic", icon: Film },
    ],
  },
  {
    label: "LIBRARY",
    items: [
      { label: "Recent", href: "/recent", icon: Clock },
      { label: "Favorites", href: "/favorites", icon: Heart },
      { label: "Playlists", href: "/playlists", icon: ListMusic },
      { label: "History", href: "/history", icon: History },
    ],
  },
  {
    label: "SETTING",
    items: [
      { label: "Account", href: "/account", icon: User },
      { label: "Logout", href: "#", icon: LogOut },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { favoritedIds } = useFavorites();

  return (
    <nav
      aria-label="Main navigation"
      className="flex h-full flex-col bg-[var(--color-surface)] px-4 py-5"
    >
      <Link
        href="#"
        className="mb-8 flex items-center gap-2 rounded-[var(--radius-md)] text-lg font-bold text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-primary)] text-[var(--color-surface)]">
          <Music2 className="h-4 w-4" />
        </span>
        <span>KIMS</span>
      </Link>

      <div className="flex flex-1 flex-col gap-7">
        {sections.map((section) => (
          <section key={section.label}>
            <h2 className="mb-3 px-3 text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">
              {section.label}
            </h2>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.href !== "#" && pathname === item.href;

                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={[
                        "flex h-10 items-center gap-3 rounded-[var(--radius-md)] border-l-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]",
                        isActive
                          ? "border-[var(--color-accent-primary)] bg-[color-mix(in_srgb,var(--color-accent-primary)_6%,var(--color-surface))] text-[var(--color-accent-primary)]"
                          : "border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-background)]",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.href === "/favorites" && favoritedIds.size > 0 ? (
                        <span className="ml-auto flex min-w-[18px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] px-1.5 text-xs font-semibold leading-[18px] text-[var(--color-surface)]">
                          {favoritedIds.size}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}
