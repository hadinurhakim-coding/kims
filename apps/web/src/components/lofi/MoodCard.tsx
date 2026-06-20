"use client";

export interface MoodCardProps {
  mood: string;
  trackCount: number;
  isActive?: boolean;
  onClick?: (mood: string) => void;
}

const moodStyles: Record<
  string,
  {
    gradient: string;
    emoji: string;
    text: string;
    count: string;
  }
> = {
  Chill: {
    gradient: "from-blue-100 to-blue-200",
    emoji: "☕",
    text: "text-gray-700",
    count: "text-gray-700/70",
  },
  Dark: {
    gradient: "from-gray-700 to-gray-900",
    emoji: "🌑",
    text: "text-white",
    count: "text-white/70",
  },
  Rainy: {
    gradient: "from-slate-400 to-slate-600",
    emoji: "🌧️",
    text: "text-white",
    count: "text-white/70",
  },
  "Late Night": {
    gradient: "from-indigo-800 to-purple-900",
    emoji: "🌙",
    text: "text-white",
    count: "text-white/70",
  },
  Dreamy: {
    gradient: "from-pink-100 to-purple-200",
    emoji: "✨",
    text: "text-gray-700",
    count: "text-gray-700/70",
  },
  Nostalgic: {
    gradient: "from-amber-100 to-orange-200",
    emoji: "🍂",
    text: "text-gray-700",
    count: "text-gray-700/70",
  },
};

const fallbackStyle = {
  gradient: "from-blue-100 to-blue-200",
  emoji: "♪",
  text: "text-gray-700",
  count: "text-gray-700/70",
};

export function MoodCard({
  mood,
  trackCount,
  isActive = false,
  onClick,
}: MoodCardProps) {
  const style = moodStyles[mood] ?? fallbackStyle;

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onClick?.(mood)}
      className={[
        "flex h-[140px] w-[120px] cursor-pointer flex-col items-center justify-between rounded-[var(--radius-lg)] bg-gradient-to-br p-4 text-center transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
        style.gradient,
        isActive
          ? "ring-2 ring-[var(--color-accent-primary)] ring-offset-2 ring-offset-[var(--color-background)]"
          : "",
      ].join(" ")}
    >
      <span className="text-4xl leading-none" aria-hidden="true">
        {style.emoji}
      </span>
      <span className={`text-lg font-bold ${style.text}`}>{mood}</span>
      <span className={`text-sm font-medium ${style.count}`}>
        {trackCount} tracks
      </span>
    </button>
  );
}
