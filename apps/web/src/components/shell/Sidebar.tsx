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
import type { ComponentType } from "react";

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    label: "MENU",
    items: [
      { label: "Explore", icon: Compass, active: true },
      { label: "Music", icon: Music },
      { label: "Sound Effects", icon: Waves },
      { label: "Lofi", icon: Sparkles },
      { label: "Cinematic", icon: Film },
    ],
  },
  {
    label: "LIBRARY",
    items: [
      { label: "Recent", icon: Clock },
      { label: "Favorites", icon: Heart },
      { label: "Playlists", icon: ListMusic },
      { label: "History", icon: History },
    ],
  },
  {
    label: "SETTING",
    items: [
      { label: "Account", icon: User },
      { label: "Logout", icon: LogOut },
    ],
  },
];

export function Sidebar() {
  return (
    <nav className="flex h-full flex-col bg-[var(--color-surface)] px-4 py-5">
      <Link
        href="#"
        className="mb-8 flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]"
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

                return (
                  <li key={item.label}>
                    <Link
                      href="#"
                      className={[
                        "flex h-10 items-center gap-3 rounded-[var(--radius-md)] border-l-2 px-3 text-sm font-medium transition-colors",
                        item.active
                          ? "border-[var(--color-accent-primary)] text-[var(--color-accent-primary)]"
                          : "border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-background)]",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
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
