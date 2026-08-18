import { useState } from "react";
import { SlidersHorizontal, Check, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { HOME_SECTIONS, useHiddenHomeSections, useHomeSectionOrder } from "@/lib/home-sections";

/**
 * Låter dig välja vad som faktiskt syns på hemskärmen – och i vilken ordning.
 * Valet sparas tills du ändrar det igen.
 */
export default function HomeCustomize() {
  const [open, setOpen] = useState(false);
  const { isHidden, toggle, showAll, reset } = useHiddenHomeSections();
  const { order, move, resetOrder } = useHomeSectionOrder();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const sections = order
    .map((id) => HOME_SECTIONS.find((s) => s.id === id))
    .filter((s): s is (typeof HOME_SECTIONS)[number] => Boolean(s));

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
            Kryssa i det du vill se. Dra i handtaget – eller använd pilarna – för att ändra
            ordningen. Det du kryssar ur försvinner bara från hemskärmen – inget tas bort.
          </p>
          <div className="grid gap-2">
            {sections.map((section, index) => {
              const visible = !isHidden(section.id);
              const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
              return (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverIndex(index);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) move(dragIndex, index);
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={`flex items-center gap-2 rounded-2xl border p-2 transition-colors ${
                    visible ? "border-primary/40 bg-primary/5" : "border-border bg-background/60"
                  } ${isOver ? "border-primary ring-2 ring-primary/30" : ""} ${
                    dragIndex === index ? "opacity-60" : ""
                  }`}
                >
                  <span
                    className="cursor-grab text-muted-foreground active:cursor-grabbing"
                    aria-hidden="true"
                  >
                    <GripVertical size={16} />
                  </span>

                  <button
                    type="button"
                    onClick={() => toggle(section.id)}
                    aria-pressed={visible}
                    className="flex flex-1 items-start gap-3 text-left min-w-0"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        visible
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      }`}
                    >
                      {visible && <Check size={13} aria-hidden="true" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">{section.label}</span>
                      <span className="block text-xs text-muted-foreground">{section.hint}</span>
                    </span>
                  </button>

                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      onClick={() => move(index, index - 1)}
                      disabled={index === 0}
                      aria-label={`Flytta ${section.label} uppåt`}
                      className="rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, index + 1)}
                      disabled={index === sections.length - 1}
                      aria-label={`Flytta ${section.label} nedåt`}
                      className="rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={showAll}
              className="text-xs text-primary hover:underline"
            >
              Visa allt
            </button>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted-foreground hover:underline"
            >
              Återställ till lugnt läge
            </button>
            <button
              type="button"
              onClick={resetOrder}
              className="text-xs text-muted-foreground hover:underline"
            >
              Återställ ordningen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
