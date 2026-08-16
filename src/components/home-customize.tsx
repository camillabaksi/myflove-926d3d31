import { useState } from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import { HOME_SECTIONS, useHiddenHomeSections } from "@/lib/home-sections";

/**
 * Låter dig välja vad som faktiskt syns på hemskärmen.
 * Valet sparas tills du ändrar det igen.
 */
export default function HomeCustomize() {
  const [open, setOpen] = useState(false);
  const { isHidden, toggle, showAll, reset } = useHiddenHomeSections();

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <SlidersHorizontal size={14} aria-hidden="true" />
        Anpassa hemskärmen
      </button>

      {open && (
        <div className="surface-card p-4 space-y-3 animate-fade-in">
          <p className="text-xs text-muted-foreground">
            Kryssa i det du vill se. Det du kryssar ur försvinner bara från hemskärmen – inget tas bort.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {HOME_SECTIONS.map((section) => {
              const visible = !isHidden(section.id);
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => toggle(section.id)}
                  aria-pressed={visible}
                  className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
                    visible ? "border-primary/40 bg-primary/5" : "border-border bg-background/60"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      visible ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {visible && <Check size={13} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{section.label}</span>
                    <span className="block text-xs text-muted-foreground">{section.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <button type="button" onClick={showAll} className="text-xs text-primary hover:underline">
              Visa allt
            </button>
            <button type="button" onClick={reset} className="text-xs text-muted-foreground hover:underline">
              Återställ till lugnt läge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
