export function SkeletonTrackItem() {
  const blockClass = "animate-pulse bg-[var(--color-border)]";

  return (
    <div className="grid min-h-[60px] grid-cols-[24px_48px_minmax(0,1fr)_auto] items-center gap-2 rounded-[var(--radius-md)] border-l-2 border-transparent bg-[var(--color-surface)] px-2.5 py-1.5 md:min-h-16 md:grid-cols-[32px_48px_minmax(0,1fr)_auto_64px_auto] md:gap-4 md:px-3 md:py-2">
      <div className={`${blockClass} row-span-2 h-4 w-6 rounded-[var(--radius-sm)] md:row-span-1 md:w-8`} />

      <div className={`${blockClass} row-span-2 h-12 w-12 rounded-[var(--radius-md)] md:row-span-1`} />

      <div className="min-w-0 space-y-2">
        <div className={`${blockClass} h-[14px] w-[140px] rounded-[var(--radius-sm)]`} />
        <div className={`${blockClass} h-3 w-[90px] rounded-[var(--radius-sm)]`} />
      </div>

      <div className={`${blockClass} hidden h-6 w-20 rounded-[var(--radius-full)] md:col-start-auto md:block`} />

      <div className={`${blockClass} hidden h-4 w-10 rounded-[var(--radius-sm)] md:col-start-auto md:block md:justify-self-end`} />

      <div className="col-start-4 row-span-2 row-start-1 flex items-center gap-1 md:col-start-auto md:row-span-1 md:row-start-auto md:gap-2">
        <div className={`${blockClass} h-11 w-11 rounded-[var(--radius-full)] md:h-6 md:w-6`} />
        <div className={`${blockClass} h-11 w-11 rounded-[var(--radius-full)] md:h-6 md:w-6`} />
        <div className={`${blockClass} hidden h-6 w-6 rounded-[var(--radius-full)] md:block`} />
      </div>
    </div>
  );
}
