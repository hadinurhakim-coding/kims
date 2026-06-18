const featuredTracks = [
  {
    title: "Late Night Lofi",
    type: "Lofi beat",
    mood: "Warm",
    duration: "2:48",
  },
  {
    title: "Wide Horizon",
    type: "Cinematic",
    mood: "Hopeful",
    duration: "3:12",
  },
  {
    title: "Soft Interface Click",
    type: "SFX",
    mood: "Clean",
    duration: "0:02",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 md:py-16">
        <header className="flex flex-col gap-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Kim&apos;s Music Station
          </p>
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Find copyright-safe sounds for your next video.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--muted)]">
              Browse lofi beats, cinematic background music, loops, and sound
              effects built for creators. The MVP catalog starts small so every
              track is easy to preview, save, and download.
            </p>
          </div>
          <form className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3 md:grid-cols-[1fr_auto_auto]">
            <label className="sr-only" htmlFor="catalog-search">
              Search tracks
            </label>
            <input
              id="catalog-search"
              className="min-h-12 rounded-md border border-[var(--border)] px-4 text-base"
              placeholder="Search lofi, cinematic, SFX..."
              type="search"
            />
            <button
              className="min-h-12 rounded-md bg-[var(--accent)] px-5 font-semibold text-[var(--accent-foreground)]"
              type="submit"
            >
              Search
            </button>
            <button
              className="min-h-12 rounded-md border border-[var(--border)] px-5 font-semibold"
              type="button"
            >
              Filters
            </button>
          </form>
        </header>

        <section aria-labelledby="featured-tracks">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="featured-tracks" className="text-2xl font-bold">
                Featured tracks
              </h2>
              <p className="mt-1 text-[var(--muted)]">
                Placeholder catalog cards for the Step 1 scaffold.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredTracks.map((track) => (
              <article
                className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5"
                key={track.title}
              >
                <div className="mb-5 h-20 rounded-md bg-slate-100" />
                <p className="text-sm font-semibold text-[var(--accent)]">
                  {track.type}
                </p>
                <h3 className="mt-2 text-xl font-bold">{track.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {track.mood} mood · {track.duration}
                </p>
                <button
                  className="mt-5 w-full rounded-md border border-[var(--border)] px-4 py-3 font-semibold"
                  type="button"
                >
                  Preview
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
