/**
 * MyFlove-blocket – appens ENDA kortmönster.
 *
 * Alla sidor ska använda <MyFloveBlock> i stället för egna kortvarianter, så
 * att rundningar, padding, skuggor, rubriker och minimering ser likadana ut
 * överallt. Blocket bygger vidare på befintliga tokens (--radius, shadow-soft,
 * surface-card) och befintlig minimerings-persistens (useCollapsible).
 *
 * Ett block kan innehålla: ikon, rubrik, underrubrik, viktigast först,
 * sekundärt efter, en tydlig CTA i foten och expandera/minimera.
 */
import * as React from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollapsible } from "@/lib/collapse-store";
import { areaProps, type AreaId } from "@/lib/areas";
import { MyFloveIcon, type MyFloveTone } from "@/components/myflove";

export interface MyFloveBlockProps {
  /** Rubrik – kort och i du-form. */
  title: React.ReactNode;
  /** En mening som förklarar vad blocket är till för. */
  subtitle?: React.ReactNode;
  /** Liten etikett ovanför rubriken, t.ex. "LOGGA". */
  eyebrow?: React.ReactNode;
  /** Ikon i rubrikraden – samma ikonsystem som resten av appen. */
  icon?: LucideIcon;
  /** Färgton på ikonrutan. */
  tone?: MyFloveTone;
  /** Knapp eller liknande längst till höger i rubrikraden. */
  action?: React.ReactNode;
  /** Viktigaste statusen – syns även när blocket är minimerat. */
  status?: React.ReactNode;
  /** Tydlig CTA eller länk längst ner i blocket. */
  footer?: React.ReactNode;
  /** Låt användaren minimera/maximera. Läget sparas per sida (befintlig store). */
  collapsible?: boolean;
  /** Eget id om rubriken inte är unik på sidan. */
  collapseId?: string;
  defaultCollapsed?: boolean;
  /** Mjuk pastellton i stället för vit kortyta. */
  surface?: MyFloveTone;
  /** Områdets färgidentitet – se src/lib/areas.ts. */
  area?: AreaId;
  /** Låt blocket spänna över båda kolumnerna i ett MyFloveBlockGrid. */
  span?: boolean;

  className?: string;
  bodyClassName?: string;
  "data-testid"?: string;
  children?: React.ReactNode;
}

const SURFACE: Record<MyFloveTone, string> = {
  lavender: "bg-lavender/60",
  blush: "bg-blush/50",
  mint: "bg-mint/50",
  sky: "bg-sky/50",
  sun: "bg-sun/50",
  plain: "bg-card",
};

export function MyFloveBlock({
  title,
  subtitle,
  eyebrow,
  icon,
  tone = "lavender",
  action,
  status,
  footer,
  collapsible = false,
  collapseId,
  defaultCollapsed = false,
  surface,
  area,
  span,
  className,
  bodyClassName,
  "data-testid": dataTestId,
  children,
}: MyFloveBlockProps) {
  const key = collapseId ?? (typeof title === "string" ? title : "block");
  const storeId = collapsible ? `myflove-block::${key.slice(0, 60)}` : null;
  const { collapsed, toggle } = useCollapsible(storeId, defaultCollapsed);

  const heading = (
    <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
      {icon && (
        <MyFloveIcon
          icon={icon}
          tone={tone}
          size="sm"
          className={area ? "area-bg-soft area-text" : undefined}
        />
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <span className="mb-1 inline-flex rounded-pill bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            {eyebrow}
          </span>
        )}
        <h2 className="font-display text-base font-bold leading-tight text-ink line-clamp-1">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{subtitle}</p>}
        {status && collapsed && <div className="mt-1.5 text-sm text-ink line-clamp-1">{status}</div>}
      </div>
      {collapsible && (
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={cn(
            "shrink-0 self-center text-muted-foreground transition-transform duration-200",
            collapsed && "-rotate-90",
          )}
        />
      )}
    </div>
  );

  return (
    <section
      data-testid={dataTestId}
      {...areaProps(area)}
      data-expanded={!collapsed}
      className={cn(
        "flex min-w-0 h-full flex-col gap-3 rounded-3xl border-2 border-border/60 p-3 shadow-soft sm:gap-4 sm:p-5",
        area && "area-border",
        surface ? SURFACE[surface] : "bg-card",
        span && "col-span-full",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {collapsible ? (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            title={collapsed ? "Visa mer" : "Minimera"}
            className="press flex min-w-0 flex-1 items-start"
          >
            {heading}
          </button>
        ) : (
          heading
        )}
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {!collapsed && children && (
        <div className={cn("min-w-0 space-y-3", bodyClassName)}>{children}</div>
      )}

      {!collapsed && footer && <div className="mt-auto pt-1">{footer}</div>}
    </section>
  );
}

/**
 * Responsivt rutnät för block – två kolumner på mobil, fler på större
 * skärmar. Block som behöver mer plats (eller är expanderade) spänner
 * över hela raden via col-span-full.
 */
export function MyFloveBlockGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0 [&>*:has([data-expanded='true'])]:col-span-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Sidlayout för hela appen – två kolumner på mobil, tre på md och fyra
 * på xl. Innehåll som behöver mer plats wrappas i <MyFloveWide>, och
 * expanderade block tar hela raden automatiskt.
 */
export function MyFlovePageGrid({
  className,
  style,
  area,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  /** Områdets färgidentitet – se src/lib/areas.ts. */
  area?: AreaId;
  children: React.ReactNode;
}) {
  return (
    <div
      style={style}
      {...areaProps(area)}
      className={cn(
        "grid min-w-0 grid-cols-2 items-stretch gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4 [&>*]:min-w-0 [&>*:has([data-expanded='true'])]:col-span-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Innehåll som behöver mer plats i ett MyFlovePageGrid.
 * `span="full"` (standard) tar hela raden, `span="wide"` tar två kolumner
 * på stora skärmar så att layouten kan variera i storlek och kännas levande.
 */
export function MyFloveWide({
  className,
  style,
  span = "full",
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { span?: "full" | "wide" }) {
  return (
    <div
      {...rest}
      style={style}
      className={cn(
        "min-w-0",
        span === "wide" ? "col-span-full xl:col-span-2" : "col-span-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Liten statsruta inuti ett block – stort tal, liten etikett. */
export function MyFloveStat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "lavender",
  className,
  children,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: MyFloveTone;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1.5 rounded-2xl border border-border/50 p-3 sm:p-4",
        SURFACE[tone],
        className,
      )}
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        {Icon && <Icon size={15} strokeWidth={2.2} aria-hidden="true" className="text-primary" />}
        {label}
      </span>
      {value != null && (
        <span className="font-display text-2xl font-bold leading-none text-ink sm:text-3xl">
          {value}
        </span>
      )}
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
