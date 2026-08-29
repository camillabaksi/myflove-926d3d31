/**
 * ExpandableBlock – MyFloves mönster för "komprimerat → maximerat".
 *
 * Komprimerat läge visar bara ikon, rubrik, en kort sammanfattning och en
 * diskret pil som visar att kortet går att öppna. Vid tryck öppnas SAMMA
 * innehåll i en maximerad vy ovanpå sidan – användaren stannar kvar på sidan,
 * scrollpositionen ligger kvar och kortet återgår till komprimerat läge när
 * vyn stängs. Androids bakåtknapp stänger den maximerade vyn först.
 *
 * Ingen data-, store- eller navigationslogik ändras – detta är enbart
 * presentation.
 */
import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X, type LucideIcon } from "lucide-react";
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
  /** Hela innehållet – visas i den maximerade vyn. */
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
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const scrollPositionRef = React.useRef(0);

  const openBlock = React.useCallback(() => {
    scrollPositionRef.current = window.scrollY;
    setOpen(true);
  }, []);

  // Bakåtknappen (t.ex. Android) stänger den maximerade vyn i stället för
  // att lämna sidan. Vi lägger bara till ett tillfälligt history-läge medan
  // vyn är öppen och tar bort det igen när den stängs.
  React.useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const onPop = () => setOpen(false);
    window.history.pushState({ myfloveExpanded: label }, "");
    window.addEventListener("popstate", onPop);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (window.history.state?.myfloveExpanded === label) window.history.back();
      trigger?.focus({ preventScroll: true });
      window.scrollTo(0, scrollPositionRef.current);
    };
  }, [open, label]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={openBlock}
        aria-expanded={open}
        aria-label={`Öppna ${label}`}
        data-testid={dataTestId}
        className={cn(
          "press flex min-h-[7rem] w-full min-w-0 flex-col gap-2 rounded-3xl border border-border/60 p-3 text-left shadow-soft transition-shadow hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5",
          surface ? SURFACE[surface] : "bg-card",
          className,
        )}
      >
        <div className="flex min-w-0 items-start gap-2.5">
          {visual ?? (icon && <MyFloveIcon icon={icon} tone={tone} size="sm" />)}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-bold leading-tight text-ink">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <ChevronRight
            size={18}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-muted-foreground"
          />
        </div>

        {status != null && (
          <div className="font-display text-lg font-bold leading-tight text-ink">{status}</div>
        )}
        {summary != null && (
          <div className="line-clamp-2 text-sm text-muted-foreground">{summary}</div>
        )}
      </button>

      {open &&
        // Portal till <body>: annars kan en ancestor med transform/filter
        // (t.ex. sidans fade-animation) göra "fixed" relativ till gridcellen
        // och det maximerade blocket ärver kolumnbredden.
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="fixed inset-0 z-50 flex h-[100dvh] w-screen max-w-none flex-col overflow-x-hidden bg-background/80 backdrop-blur-sm animate-fade-in motion-reduce:animate-none"
          >
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default"
            />
            <div className="relative mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden p-2 sm:p-4">
              <div
                className={cn(
                  "flex min-h-0 w-full flex-1 flex-col rounded-3xl border border-border/60 shadow-lifted animate-scale-in motion-reduce:animate-none",
                  surface ? SURFACE[surface] : "bg-card",
                )}
              >
                <div className="flex items-start gap-3 border-b border-border/50 p-4">
                  {visual ?? (icon && <MyFloveIcon icon={icon} tone={tone} size="sm" />)}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-bold leading-tight text-ink">
                      {title}
                    </h2>
                    {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
                  </div>
                  <button
                    type="button"
                    ref={closeRef}
                    onClick={() => setOpen(false)}
                    aria-label="Stäng"
                    className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className="min-w-0 w-full flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4">
                  {children}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default ExpandableBlock;
