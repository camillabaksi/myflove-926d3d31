/**
 * MyFlove designsystem – återanvändbara byggstenar.
 * Alla sidor ska använda dessa i stället för egna varianter,
 * så att färger, rundningar, skuggor, typografi och animationer
 * blir identiska i hela appen.
 */
import * as React from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MYFLOVE_EMOJI, type MyFloveEmojiKey } from "@/lib/myflove-emoji";
import { MYFLOVE_ICON } from "@/lib/myflove-icons";
import { useCollapsible } from "@/lib/collapse-store";
import { useSmartBack } from "@/hooks/use-smart-back";
import { areaProps, type AreaId } from "@/lib/areas";
import WhyHint from "@/components/why-hint";
import { heroGradient } from "@/lib/hero-gradient";

/* ------------------------------------------------------------------ */
/* Emoji – samma storlekar och samma lilla liv överallt                */
/* ------------------------------------------------------------------ */

const EMOJI_SIZE = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-4xl",
} as const;

const ICON_PX = { xs: 14, sm: 16, md: 20, lg: 28, xl: 36 } as const;

const EMOJI_MOTION = {
  none: "",
  breathe: "breathe",
  float: "floaty",
} as const;

/**
 * Visa en emoji från den gemensamma mappningen.
 * Alltid aria-hidden (dekorativ), alltid samma line-height och rörelse.
 */
export function MyFloveEmoji({
  name,
  emoji,
  size = "md",
  motion = "none",
  className,
}: {
  name?: MyFloveEmojiKey;
  emoji?: string;
  size?: keyof typeof EMOJI_SIZE;
  motion?: keyof typeof EMOJI_MOTION;
  className?: string;
}) {
  const Icon = name ? MYFLOVE_ICON[name] : undefined;
  const shown = emoji ?? (name ? MYFLOVE_EMOJI[name] : undefined);
  if (!Icon && !shown) return null;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center leading-none",
        EMOJI_SIZE[size],
        EMOJI_MOTION[motion],
        className,
      )}
    >
      {Icon ? <Icon size={ICON_PX[size]} strokeWidth={2.2} /> : shown}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Ikon – alltid Lucide, samma storlek och stroke i hela appen         */
/* ------------------------------------------------------------------ */

export type MyFloveTone = "lavender" | "blush" | "mint" | "sky" | "sun" | "plain";

const TONE_BG: Record<MyFloveTone, string> = {
  lavender: "bg-lavender text-primary",
  blush: "bg-blush text-terracotta",
  mint: "bg-mint text-sage",
  sky: "bg-sky text-primary",
  sun: "bg-sun text-gold",
  plain: "bg-muted text-ink",
};

export function MyFloveIcon({
  icon: Icon,
  tone = "lavender",
  size = "md",
  emoji,
  className,
}: {
  icon: LucideIcon;
  tone?: MyFloveTone;
  size?: "sm" | "md" | "lg";
  emoji?: string;
  className?: string;
}) {
  const box = size === "sm" ? "w-9 h-9" : size === "lg" ? "w-14 h-14" : "w-11 h-11";
  const px = size === "sm" ? 16 : size === "lg" ? 24 : 20;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-2xl",
        box,
        TONE_BG[tone],
        className,
      )}
    >
      <Icon size={px} strokeWidth={2.2} />
      {emoji && (
        <MyFloveEmoji
          emoji={emoji}
          size="xs"
          className="absolute -right-1.5 -top-1.5 drop-shadow-sm"
        />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Knappar – samma höjd, padding, radie och typografi överallt         */
/* ------------------------------------------------------------------ */

export type MyFloveButtonVariant = "primary" | "secondary" | "tertiary" | "danger";

const BUTTON_VARIANT: Record<MyFloveButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90",
  secondary: "bg-lavender text-ink hover:bg-lavender/70",
  tertiary: "bg-transparent text-muted-foreground hover:bg-muted",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

type ButtonBaseProps = {
  variant?: MyFloveButtonVariant;
  size?: "sm" | "md";
  icon?: LucideIcon;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
};

function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: ButtonBaseProps) {
  return cn(
    "press inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
    "text-center leading-tight whitespace-normal [&_svg]:shrink-0",
    size === "sm" ? "min-h-9 px-4 py-1.5 text-sm" : "min-h-11 px-5 py-2 text-sm",
    BUTTON_VARIANT[variant],
    fullWidth && "w-full",
    className,
  );
}

export function MyFloveButton({
  variant,
  size,
  icon: Icon,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonBaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {Icon && <Icon size={16} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

export function MyFloveLinkButton({
  href,
  variant,
  size,
  icon: Icon,
  fullWidth,
  className,
  children,
}: ButtonBaseProps & { href: string }) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, fullWidth, className })}>
      {Icon && <Icon size={16} strokeWidth={2.2} />}
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Kort och sektioner – mjuka moduler                                  */
/* ------------------------------------------------------------------ */

export function MyFloveCard({
  className,
  children,
  tone,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { tone?: MyFloveTone }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/60 p-5 shadow-soft pop-in",
        tone && tone !== "plain" ? TONE_BG[tone].split(" ")[0] : "bg-card pace-app-card",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function MyFloveSection({
  title,
  emoji,
  emojiKey,
  description,
  action,
  className,
  children,
  collapsible = false,
  collapseId,
  defaultCollapsed = false,
}: {
  title: string;
  emoji?: string;
  emojiKey?: MyFloveEmojiKey;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  /** Låt användaren minimera/maximera innehållet. Valet sparas lokalt. */
  collapsible?: boolean;
  /** Eget id om rubriken inte är unik på sidan. */
  collapseId?: string;
  defaultCollapsed?: boolean;
}) {
  const [path] = useLocation();
  const storeId = collapsible ? `${path}::${(collapseId ?? title).slice(0, 60)}` : null;
  const { collapsed, toggle } = useCollapsible(storeId, defaultCollapsed);

  const heading = (
    <div className="flex min-w-0 items-start gap-2">
      {collapsible && (
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn(
            "mt-1.5 shrink-0 text-muted-foreground transition-transform duration-200",
            collapsed && "-rotate-90",
          )}
        />
      )}
      <MyFloveEmoji
        {...(emoji ? { emoji } : {})}
        {...(emojiKey ? { name: emojiKey } : {})}
        size="sm"
        className="mt-0.5"
      />
      <div className="min-w-0 text-left">
        <h2 className="font-display text-lg font-bold leading-tight text-ink">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        {collapsible ? (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            className="flex min-w-0 flex-1 items-start"
            title={collapsed ? "Visa" : "Minimera"}
          >
            {heading}
          </button>
        ) : (
          heading
        )}
        {action}
      </div>
      {(!collapsible || !collapsed) && children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sidhuvud – samma struktur på alla sekundära sidor                   */
/* ------------------------------------------------------------------ */

export function MyFloveHeader({
  title,
  emojiKey,
  emoji,
  description,
  why,
  action,
  back = false,
  backTo = "/idag",
  area,
  children,
  className,
  titleClassName,
}: {
  title: string;
  emojiKey?: MyFloveEmojiKey;
  emoji?: string;
  description?: string;
  /** Kort "Varför?"-förklaring: vad användaren får tillbaka av funktionen. */
  why?: React.ReactNode;
  action?: React.ReactNode;
  back?: boolean;
  /** Vart Tillbaka går om sidan öppnats direkt (ingen historik). */
  backTo?: string;
  /** Områdets färgidentitet – se src/lib/areas.ts. */
  area?: AreaId;
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  const goBack = useSmartBack(backTo);
  return (
    <header
      {...areaProps(area)}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 p-5 shadow-lifted page-enter",
        area ? "area-hero area-border" : "pace-app-header",
        className,
      )}
      {...(area
        ? {}
        : {
            style: { backgroundImage: heroGradient() },
          })}
    >
      <div
        className="pointer-events-none absolute -top-16 -right-12 h-32 w-32 rounded-full bg-blush opacity-50 blur-md pace-app-glow"
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        {back && (
          <button
            type="button"
            onClick={goBack}
            aria-label="Tillbaka"
            className="press mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-card/70 text-ink"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>
        )}
        <MyFloveEmoji
          {...(emoji ? { emoji } : {})}
          {...(emojiKey ? { name: emojiKey } : {})}
          size="lg"
          motion="breathe"
          className="mt-0.5"
        />

        <div className={cn("min-w-0 flex-1", titleClassName?.includes("pace-editorial") && "pace-editorial-title-spacing")}>
          <h1 className={cn("pace-app-title font-display text-2xl font-bold leading-tight text-ink sm:text-3xl", titleClassName)}>
            {title}
          </h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          {why && (
            <div className="mt-2">
              <WhyHint label={title.toLowerCase()}>{why}</WhyHint>
            </div>
          )}
        </div>

        {action}
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Chip                                                                */
/* ------------------------------------------------------------------ */

export function MyFloveChip({
  active,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "press inline-flex min-h-9 max-w-full items-center justify-center gap-1.5 rounded-pill px-4 py-1.5 text-sm font-semibold leading-tight transition-colors",
        "[&_svg]:shrink-0",
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "bg-lavender text-ink hover:bg-lavender/70",
        className,
      )}
      {...rest}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state och loading                                             */
/* ------------------------------------------------------------------ */

export function MyFloveEmptyState({
  emoji = "💜",
  title,
  description,
  action,
  className,
}: {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Kompakt och horisontell så fort det finns bredd – inget högt "torn".
        "flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border/70 bg-card/60 px-5 py-7 text-center pop-in",
        "sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-5 sm:text-left",
        className,
      )}
    >
      <MyFloveEmoji emoji={emoji} size="xl" motion="breathe" className="shrink-0" />
      <div className="min-w-0 sm:flex-1">
        <p className="font-display text-base font-bold text-ink">{title}</p>
        {description && (
          <p className="mt-0.5 max-w-prose text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function MyFloveLoading({
  label = "En sekund...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 py-10 text-center", className)}>
      <MyFloveEmoji emoji="💜" size="lg" motion="breathe" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function MyFloveSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-3xl bg-muted/70", className)} />;
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export function MyFloveProgress({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <div className="h-2.5 w-full overflow-hidden rounded-pill bg-lavender">
        <div
          className="h-full rounded-pill bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
