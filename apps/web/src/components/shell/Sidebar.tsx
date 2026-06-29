"use client";

import {
  Compass,
  Film,
  Heart,
  History,
  ListMusic,
  LogIn,
  LogOut,
  MoreHorizontal,
  Music,
  Music2,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useHistory } from "@/context/HistoryContext";
import { usePlaylists } from "@/context/PlaylistContext";

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
      { label: "Favorites", href: "/favorites", icon: Heart },
      { label: "Playlists", href: "/playlists", icon: ListMusic },
      { label: "History", href: "/history", icon: History },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();
  const { favoritedIds } = useFavorites();
  const { history } = useHistory();
  const { playlists } = usePlaylists();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const visibleSections =
    user?.role === "admin"
      ? [
          ...sections,
          {
            label: "ADMIN",
            items: [{ label: "Admin", href: "/admin", icon: ShieldCheck }],
          },
        ]
      : sections;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsDropdownOpen(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    function handleMouseDown(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !accountDropdownRef.current?.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

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

      <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto pr-1 [mask-image:linear-gradient(to_bottom,black_calc(100%_-_24px),transparent_100%)]">
        {visibleSections.map((section) => (
          <section key={section.label}>
            <h2 className="mb-3 px-3 text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">
              {section.label}
            </h2>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/playlists"
                    ? pathname === "/playlists" ||
                      pathname.startsWith("/playlists/")
                    : item.href !== "#" && pathname === item.href;

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
                      {item.href === "/playlists" && playlists.length > 0 ? (
                        <span className="ml-auto flex min-w-[18px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] px-1.5 text-xs font-semibold leading-[18px] text-[var(--color-surface)]">
                          {playlists.length}
                        </span>
                      ) : null}
                      {item.href === "/history" && history.length > 0 ? (
                        <span className="ml-auto flex min-w-[18px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] px-1.5 text-xs font-semibold leading-[18px] text-[var(--color-surface)]">
                          {history.length > 99 ? "99+" : history.length}
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

      <section className="relative shrink-0 overflow-visible">
        <div className="my-2 border-t border-[var(--color-border)]" />

        {isAuthenticated ? (
          <div ref={accountDropdownRef} className="relative">
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-xs font-semibold text-[var(--color-surface)]">
                  KM
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">
                    {user?.name ?? "KIMS User"}
                  </span>
                  <span className="block truncate text-xs text-[var(--color-text-muted)]">
                    {user?.email ?? "Signed in"}
                  </span>
                </span>
              </div>

              <button
                type="button"
                aria-label="Account options"
                aria-expanded={isDropdownOpen}
                onClick={() => setIsDropdownOpen((isOpen) => !isOpen)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {isDropdownOpen ? (
              <div className="absolute bottom-full left-0 z-30 mb-2 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[var(--shadow-lg)]">
                <button
                  type="button"
                  onClick={() => {
                    router.push("/account");
                    setIsDropdownOpen(false);
                  }}
                  className="flex h-10 w-full items-center gap-3 px-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent-primary)]"
                >
                  <UserCircle2 className="h-4 w-4" />
                  <span>Account</span>
                </button>

                <div className="my-1 border-t border-[var(--color-border)]" />

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setIsDropdownOpen(false);
                    router.push("/login");
                  }}
                  className="flex h-10 w-full items-center gap-3 px-3 text-sm font-medium text-[var(--color-danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-surface))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-danger)]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="px-3 text-center">
            <p className="mb-3 text-xs italic text-[var(--color-text-muted)]">
              You are not signed in
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="mt-3 text-xs font-semibold text-[var(--color-accent-primary)] transition-colors hover:text-[color-mix(in_srgb,var(--color-accent-primary)_82%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
            >
              Create Account
            </button>
          </div>
        )}
      </section>
    </nav>
  );
}
