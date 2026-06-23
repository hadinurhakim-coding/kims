import { Music2 } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const featurePills = [
  "🎵 Free Forever",
  "📦 No Attribution",
  "⚡ Instant Download",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <aside className="relative hidden w-[45%] overflow-hidden lg:block">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-4">
          {Array.from({ length: 12 }, (_, index) => {
            const seed = index + 1;

            return (
              <div key={seed} className="relative">
                <Image
                  src="/placeholder-cover.png"
                  alt=""
                  fill
                  sizes="15vw"
                  loading={index === 0 ? "eager" : undefined}
                  priority={index === 0}
                  className="object-cover"
                />
              </div>
            );
          })}
        </div>

        <div className="absolute inset-0 bg-[rgba(0,0,0,0.55)] backdrop-blur-[8px]" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-10 text-center">
          <div className="flex items-center gap-3 text-[var(--color-surface)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent-primary)]">
              <Music2 className="h-6 w-6" />
            </span>
            <span className="text-3xl font-bold">KIMS</span>
          </div>

          <p className="mt-4 text-sm italic text-[rgba(255,255,255,0.8)]">
            Free music for every creator
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {featurePills.map((pill) => (
              <span
                key={pill}
                className="rounded-[var(--radius-full)] bg-[rgba(255,255,255,0.2)] px-3 py-1.5 text-xs font-medium text-[var(--color-surface)] backdrop-blur-sm"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex h-full w-full flex-col bg-[var(--color-background)] lg:w-[55%]">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-primary)] text-[var(--color-surface)]">
              <Music2 className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold text-[var(--color-text-primary)]">
              KIMS
            </span>
          </div>

          <div className="mx-auto w-full max-w-[400px]">{children}</div>
        </div>

        <p className="px-6 pb-6 text-center text-xs text-[var(--color-text-muted)]">
          © 2026 KIMS · Kim&apos;s Music Station
        </p>
      </main>
    </div>
  );
}
