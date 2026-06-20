export function SkeletonTrackItem() {
  const blockClass = "animate-pulse bg-[var(--color-border)]";

  return (
    <div className="grid min-h-16 grid-cols-[32px_48px_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-md)] border-l-2 border-transparent bg-[var(--color-surface)] px-3 py-2 md:grid-cols-[32px_48px_minmax(0,1fr)_auto_64px_auto] md:gap-4">
      <div className={`${blockClass} h-4 w-8 rounded-[var(--radius-sm)]`} />

      <div className={`${blockClass} h-12 w-12 rounded-[var(--radius-md)]`} />

      <div className="min-w-0 space-y-2">
        <div className={`${blockClass} h-[14px] w-[140px] rounded-[var(--radius-sm)]`} />
        <div className={`${blockClass} h-3 w-[90px] rounded-[var(--radius-sm)]`} />
      </div>

      <div className={`${blockClass} col-start-3 h-6 w-20 rounded-[var(--radius-full)] md:col-start-auto`} />

      <div className={`${blockClass} col-start-3 h-4 w-10 rounded-[var(--radius-sm)] md:col-start-auto md:justify-self-end`} />

      <div className="col-start-3 flex items-center gap-2 md:col-start-auto">
        <div className={`${blockClass} h-6 w-6 rounded-[var(--radius-full)]`} />
        <div className={`${blockClass} h-6 w-6 rounded-[var(--radius-full)]`} />
        <div className={`${blockClass} h-6 w-6 rounded-[var(--radius-full)]`} />
      </div>
    </div>
  );
}
