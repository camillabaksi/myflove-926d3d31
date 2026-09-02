/**
 * Diskret markering av investerar-/demokontot. Använder befintliga tokens
 * och stör varken layout, bottennav eller safe-area.
 */
export default function DemoBanner({ isDemo }: { isDemo: boolean }) {
  if (!isDemo) return null;

  return (
    <div className="flex justify-center px-3 pt-2" role="status" aria-live="polite">
      <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
        Demokonto
        <span aria-hidden className="opacity-60">
          ·
        </span>
        <span className="font-medium normal-case tracking-normal">Exempeldata</span>
      </span>
    </div>
  );
}
