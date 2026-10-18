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
import { Link } from "wouter";
import { ArrowRight, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MyFloveIcon, type MyFloveTone } from "@/components/myflove";
import { areaProps, type AreaId } from "@/lib/areas";
import { setCollapsed, useCollapsible, useSectionId } from "@/lib/collapse-store";

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
  /**
   * Om href sätts är hela det komprimerade kortet en länk som navigerar –
   * som Mitt batteri-kortet. Expansion används då inte; fullständigt
   * innehåll bor på målsidan.
   */
  href?: string;
  /** Körs när länkkortet trycks (t.ex. spårning). */
  onNavigate?: () => void;
  className?: string;
  /** Kompakt, enhetlig historikrad i Mitt batteri. */
  historyStyle?: boolean;
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
  href,
  onNavigate,
  className,
  historyStyle = false,
  "data-testid": dataTestId,
  children,
}: ExpandableBlockProps) {
  const ariaLabel = titleText ?? (typeof title === "string" ? title : "block");
  const sectionId = useSectionId(href ? null : `expandable::${ariaLabel}`);
  const { collapsed, toggle: toggleCollapsed } = useCollapsible(sectionId, true);
  const open = !collapsed;
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  // Bakåtknappen (t.ex. Android) stänger det expanderade kortet i stället för
  // att lämna sidan. Ett tillfälligt history-läge läggs till medan kortet är
  // öppet och tas bort igen när det stängs.
  React.useEffect(() => {
    if (!open) return;
    const containsNavigation = sectionRef.current?.querySelector("a[href]") != null;
    const onPop = () => {
      if (sectionId) setCollapsed(sectionId, true, true);
    };
    const openedPath = window.location.pathname;

    // Menykort med riktiga länkar ska följa routerns vanliga historik. Ett
    // extra history-läge här kan annars hinna backa bort navigationen när
    // kortet avmonteras. Vanliga innehållskort behåller Android-bakåt för
    // att kollapsa på plats.
    if (!containsNavigation) {
      window.history.pushState({ myfloveExpanded: ariaLabel }, "");
      window.addEventListener("popstate", onPop);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sectionId) setCollapsed(sectionId, true, true);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      if (!containsNavigation) window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      // Rensa bara det tillfälliga history-läget om vi fortfarande är kvar på
      // samma sida. Om kortet avmonteras för att en länk inuti navigerade
      // vidare får vi INTE hoppa tillbaka – då ogörs navigationen.
      if (
        !containsNavigation &&
        window.history.state?.myfloveExpanded === ariaLabel &&
        window.location.pathname === openedPath
      ) {
        window.history.back();
      }
    };
  }, [open, ariaLabel, sectionId]);

  const toggle = () => {
    if (open) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus({ preventScroll: true });
        sectionRef.current?.scrollIntoView({ block: "nearest" });
      });
    }
    toggleCollapsed();
  };

  /**
   * Komprimerat innehåll. Smala kort (t.ex. mobilens tvåkolumnsrutnät)
   * staplar innehållet, men så fort kortet får utrymme (container ≥ 28rem)
   * läggs ikon, text och status på EN horisontell rad i stället för ett
   * högt "torn". Ren presentation – ingen logik ändras.
   */
  const compact = historyStyle ? (
    <>
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-base font-semibold text-ink">{title}</span>
        {subtitle && <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{subtitle}</span>}
        {summary != null && <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{summary}</span>}
      </span>
      <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
    </>
  ) : (
    <>
      <span aria-hidden="true" className="grid shrink-0 place-items-center">
        {visual ??
          (icon && (
            <MyFloveIcon
              icon={icon}
              tone={tone}
              size="lg"
              className={cn("rounded-full", area && "area-bg-soft area-text")}
            />
          ))}
      </span>
      <div className="min-w-0 @min-[28rem]:flex-1">
        <h2 className="font-display text-base font-bold leading-tight text-ink">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {(status != null || summary != null) && (
        <div className="w-full space-y-1 border-t border-border/50 pt-3 @min-[28rem]:w-auto @min-[28rem]:max-w-[45%] @min-[28rem]:shrink-0 @min-[28rem]:border-0 @min-[28rem]:pt-0 @min-[28rem]:text-right">
          {status != null && (
            <div
              className={cn(
                "font-display text-2xl font-bold leading-tight",
                area ? "area-text" : "text-ink",
              )}
            >
              {status}
            </div>
          )}
          {summary != null && (
            <div className="line-clamp-2 text-sm text-muted-foreground">{summary}</div>
          )}
        </div>
      )}
      <span
        aria-hidden="true"
        className={cn(
          "absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full @min-[28rem]:static @min-[28rem]:shrink-0",
          area ? "area-bg-soft area-text" : "bg-card/70 text-muted-foreground",
        )}
      >
        <ArrowRight size={15} />
      </span>
    </>
  );

  const compactLayout =
    "press relative flex w-full min-w-0 flex-col items-center gap-2.5 rounded-3xl p-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5 @min-[28rem]:flex-row @min-[28rem]:items-center @min-[28rem]:gap-4 @min-[28rem]:text-left";

  // Länkläge: hela kortet navigerar (som Mitt batteri-kortet). Samma
  // komprimerade design, men ingen expansion.
  if (href) {
    return (
      <section
        ref={sectionRef}
        data-pace-expandable="true"
        data-pace-widget={Boolean(widget)}
        data-testid={dataTestId}
        data-expanded="false"
        {...areaProps(area)}
        className={cn(
          "@container flex min-w-0 flex-col rounded-3xl border border-border/60 shadow-soft transition-shadow hover:shadow-lifted",
          area && "area-border",
          "min-h-[9rem] @min-[20rem]:min-h-0",
          surface ? SURFACE[surface] : "bg-card",
          className,
        )}
      >
        <Link
          href={href}
          onClick={onNavigate}
          aria-label={`Öppna ${ariaLabel}`}
          className={cn(compactLayout, "flex-1")}
        >
          {compact}
        </Link>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      data-pace-expandable="true"
        data-pace-widget={Boolean(widget)}
      data-testid={dataTestId}
      data-expanded={open ? "true" : "false"}
      {...areaProps(area)}
      className={cn(
        "@container flex min-w-0 flex-col rounded-3xl border border-border/60 shadow-soft transition-shadow",
        area && "area-border",
        historyStyle ? "w-full border-0 bg-[#F5EDF7]/30 shadow-none" : open ? "col-span-full w-full shadow-lifted" : "min-h-[9rem] @min-[20rem]:min-h-0",
        !historyStyle && (surface ? SURFACE[surface] : "bg-card"),
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
          historyStyle ? "min-h-11 flex-row items-center justify-between gap-3 rounded-2xl px-3 py-3" : widget && !open
            ? "items-center justify-center gap-1.5 px-3 py-6 text-center @min-[20rem]:flex-row @min-[20rem]:justify-start @min-[20rem]:gap-3 @min-[20rem]:px-4 @min-[20rem]:py-4 @min-[20rem]:text-left"
            : !open
              ? compactLayout
              : "p-3 sm:p-5",
        )}
      >
        {widget && !open ? (
          <>
            {/* Widget-läge: stor ikon + ETT värde + ev. kort etikett. Inget mer. */}
            <span
              aria-hidden="true"
              className="grid shrink-0 place-items-center text-3xl leading-none"
            >
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
              <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">
                {label ?? (title as string)}
              </span>
            )}
          </>
        ) : !open ? (
          compact
        ) : historyStyle ? (
          <span className="flex w-full items-center justify-between gap-3">
            <span className="font-sans text-base font-semibold text-ink">{title}</span>
            <ChevronDown size={18} aria-hidden="true" className="shrink-0 rotate-180 text-muted-foreground" />
          </span>
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
                {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
              </div>
              <ChevronDown
                size={18}
                aria-hidden="true"
                className="mt-0.5 shrink-0 rotate-180 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none"
              />
            </div>
          </>
        )}
      </button>

      {open && (
        <div className={cn("min-w-0 w-full space-y-4 p-3 animate-fade-in motion-reduce:animate-none", !historyStyle && "border-t border-border/50 sm:p-5")}>
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
