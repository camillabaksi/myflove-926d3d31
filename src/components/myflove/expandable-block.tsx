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
import { ArrowRight, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MyFloveIcon, type MyFloveTone } from "@/components/myflove";
import { areaProps, type AreaId } from "@/lib/areas";

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
  /** Områdets färgidentitet – se src/lib/areas.ts. */
  area?: AreaId;
  /**
   * Widget-läge: komprimerad vy visar ENDAST stor ikon/illustration +
   * ETT stort värde (status) + eventuellt en mycket kort etikett.
   * Rubrik, underrubrik och all övrig information flyttas till den
   * expanderade vyn. Tänk widget – inte informationskort.
   */
  widget?: boolean;
  /** Mycket kort etikett under värdet i widget-läge, t.ex. "Flow". */
  label?: string;
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
  area,
  widget = false,
  label,
  className,
  "data-testid": dataTestId,
  children,
}: ExpandableBlockProps) {
  const [open, setOpen] = React.useState(false);
  const ariaLabel = titleText ?? (typeof title === "string" ? title : "block");
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  // Bakåtknappen (t.ex. Android) stänger det expanderade kortet i stället för
  // att lämna sidan. Ett tillfälligt history-läge läggs till medan kortet är
  // öppet och tas bort igen när det stängs.
  React.useEffect(() => {
    if (!open) return;
    const onPop = () => setOpen(false);
    window.history.pushState({ myfloveExpanded: ariaLabel }, "");
    window.addEventListener("popstate", onPop);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      if (window.history.state?.myfloveExpanded === ariaLabel) window.history.back();
    };
  }, [open, ariaLabel]);

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
      {...areaProps(area)}
      className={cn(
        "flex min-w-0 flex-col rounded-3xl border border-border/60 shadow-soft transition-shadow",
        area && "area-border",
        open ? "col-span-full w-full shadow-lifted" : "min-h-[9rem]",
        surface ? SURFACE[surface] : "bg-card",
        className,
      )}
    >
      <button
        type="button"
        ref={triggerRef}
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? `Minimera ${ariaLabel}` : `Öppna ${ariaLabel}`}
        className={cn(
          "press relative flex w-full min-w-0 flex-col gap-2 rounded-3xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          widget && !open
            ? "items-center justify-center gap-1.5 px-3 py-6 text-center"
            : !open
              ? "items-center gap-2.5 p-4 text-center sm:p-5"
              : "p-3 sm:p-5",
        )}
      >
        {widget && !open ? (
          <>
            {/* Widget-läge: stor ikon + ETT värde + ev. kort etikett. Inget mer. */}
            <span aria-hidden="true" className="grid place-items-center text-3xl leading-none">
              {visual ??
                (icon && (
                  <MyFloveIcon
                    icon={icon}
                    tone={tone}
                    size="lg"
                    className={area ? "area-bg-soft area-text" : undefined}
                  />
                ))}
            </span>
            {status != null && (
              <span className="font-display text-3xl font-bold leading-none text-ink">
                {status}
              </span>
            )}
            {(label ?? (typeof title === "string" ? title : null)) && (
              <span className="text-xs font-medium text-muted-foreground">
                {label ?? (title as string)}
              </span>
            )}
          </>
        ) : (
          <>
            <div className="flex min-w-0 items-start gap-2.5">
              {visual ??
                (icon && (
                  <MyFloveIcon
                    icon={icon}
                    tone={tone}
                    size="sm"
                    className={area ? "area-bg-soft area-text" : undefined}
                  />
                ))}
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-bold leading-tight text-ink">{title}</h2>
                {subtitle && (
                  <p
                    className={cn("mt-0.5 text-xs text-muted-foreground", !open && "line-clamp-2")}
                  >
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
              <div className="font-display text-3xl font-bold leading-none text-ink">{status}</div>
            )}
            {!open && summary != null && (
              <div className="line-clamp-2 text-sm text-muted-foreground">{summary}</div>
            )}
          </>
        )}
      </button>

      {open && (
        <div className="min-w-0 w-full space-y-4 border-t border-border/50 p-3 animate-fade-in motion-reduce:animate-none sm:p-5">
          {widget && (
            <div className="space-y-0.5">
              <h2 className="font-display text-base font-bold leading-tight text-ink">{title}</h2>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      )}
    </section>
  );
}

export default ExpandableBlock;
