export function SkeletonHero() {
  const blockClass = "animate-pulse bg-[var(--color-border)]";

  return (
    <section className="flex flex-col items-center gap-6 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-md)] md:flex-row md:justify-between md:p-8">
      <div className="order-2 flex w-full flex-col justify-center md:order-1">
        <div className={`${blockClass} h-[10px] w-20 rounded-[var(--radius-sm)]`} />
        <div className={`${blockClass} mt-4 h-[30px] w-[200px] rounded-[var(--radius-sm)]`} />
        <div className={`${blockClass} mt-3 h-[14px] w-[120px] rounded-[var(--radius-sm)]`} />
        <div className={`${blockClass} mt-4 h-6 w-[90px] rounded-[var(--radius-full)]`} />

        <div className="mt-6 flex items-center gap-3">
          <div className={`${blockClass} h-11 w-32 rounded-[var(--radius-full)]`} />
          <div className={`${blockClass} h-11 w-11 rounded-[var(--radius-full)]`} />
        </div>
      </div>

      <div className={`${blockClass} order-1 h-[200px] w-[200px] shrink-0 rounded-[var(--radius-lg)] md:order-2`} />
    </section>
  );
}
