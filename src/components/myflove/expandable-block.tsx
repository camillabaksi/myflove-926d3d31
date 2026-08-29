/**
 * ExpandableBlock – MyFloves mönster för "komprimerat → maximerat".
 *
 * Komprimerat läge visar bara ikon, rubrik, en kort sammanfattning och en
 * diskret pil som visar att kortet går att öppna. Vid tryck expanderar SAMMA
 * kort i sidans befintliga flöde: det tar hela innehållsbredden (col-span-full)
 * och visar sitt fullständiga innehåll. Ingen ny sida, ingen modal, ingen
 * route – kortet växer på plats och kollapsar tillbaka till exakt samma ruta.
 *
 * Ingen data-, store- eller navigationslogik ändras – detta är enbart
 * presentation.
 */
import * as React from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MyFloveIcon, type MyFloveTone } from "@/components/myflove";

const SURFACE: Record<MyFloveTone, string> = {
  lavender: "bg-lavender/60",
  blush: "bg-blush/50",
  mint: "bg-mint/50",
  sky: "bg-sky/50",
  sun: "bg-sun/50",
  plain: "bg-card",
};

export interface ExpandableBlockProps {
  /** Rubrik – kort och i du-form. */
  title: React.ReactNode;
  /** Rubrik som ren text för aria-label när title innehåller element. */
  titleText?: string;
  /** En mening som förklarar vad blocket är till för. */
  subtitle?: React.ReactNode;
  /** Viktigaste värdet/statusen – syns i det komprimerade kortet. */
  status?: React.ReactNode;
  /** 1–2 rader sammanfattning i komprimerat läge. */
  summary?: React.ReactNode;
  icon?: LucideIcon;
  /** Egen ikon/illustration i stället för lucide-ikon. */
  visual?: React.ReactNode;
  tone?: MyFloveTone;
  surface?: MyFloveTone;
  className?: string;
  "data-testid"?: string;
  /** Hela innehållet – visas när kortet är expanderat. */
  children?: React.ReactNode;
}

export function ExpandableBlock({
  title,
  titleText,
  subtitle,
  status,
  summary,
  icon,
  visual,
  tone = "lavender",
  surface,
  className,
  "data-testid": dataTestId,
  children,
}: ExpandableBlockProps) {
  const [open, setOpen] = React.useState(false);
  const label = titleText ?? (typeof title === "string" ? title : "block");
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  // Bakåtknappen (t.ex. Android) stänger det expanderade kortet i stället för
  // att lämna sidan. Ett tillfälligt history-läge läggs till medan kortet är
  // öppet och tas bort igen när det stängs.
  React.useEffect(() => {
    if (!open) return;
    const onPop = () => setOpen(false);
    window.history.pushState({ myfloveExpanded: label }, "");
    window.addEventListener("popstate", onPop);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      if (window.history.state?.myfloveExpanded === label) window.history.back();
    };
  }, [open, label]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (!next) {
        // Kollaps: håll kvar kortet i vy så att sidan inte hoppar.
        requestAnimationFrame(() => {
          triggerRef.current?.focus({ preventScroll: true });
          sectionRef.current?.scrollIntoView({ block: "nearest" });
        });
      }
      return next;
    });
  };

  return (
    <section
      ref={sectionRef}
      data-testid={dataTestId}
      data-expanded={open ? "true" : "false"}
      className={cn(
        "flex min-w-0 flex-col rounded-3xl border border-border/60 shadow-soft transition-shadow",
        open ? "col-span-full w-full shadow-lifted" : "min-h-[7rem]",
        surface ? SURFACE[surface] : "bg-card",
        className,
      )}
    >
      <button
        type="button"
        ref={triggerRef}
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? `Minimera ${label}` : `Öppna ${label}`}
        className="press flex w-full min-w-0 flex-col gap-2 rounded-3xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
      >
        <div className="flex min-w-0 items-start gap-2.5">
          {visual ?? (icon && <MyFloveIcon icon={icon} tone={tone} size="sm" />)}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-bold leading-tight text-ink">{title}</h2>
            {subtitle && (
              <p className={cn("mt-0.5 text-xs text-muted-foreground", !open && "line-clamp-2")}>
                {subtitle}
              </p>
            )}
          </div>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={cn(
              "mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
              !open && "-rotate-90",
            )}
          />
        </div>

        {!open && status != null && (
          <div className="font-display text-lg font-bold leading-tight text-ink">{status}</div>
        )}
        {!open && summary != null && (
          <div className="line-clamp-2 text-sm text-muted-foreground">{summary}</div>
        )}
      </button>

      {open && (
        <div className="min-w-0 w-full space-y-4 border-t border-border/50 p-3 animate-fade-in motion-reduce:animate-none sm:p-5">
          {children}
        </div>
      )}
    </section>
  );
}

export default ExpandableBlock;
