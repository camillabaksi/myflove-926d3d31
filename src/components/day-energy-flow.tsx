import { useMemo } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import CollapsibleSection from "@/components/collapsible-section";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { ENERGY_KINDS, isSameDay } from "@/lib/energy-flow";
import { useLang } from "@/hooks/use-language";

/**
 * Dagens energiflöde – dagens faktiska belastning uppdelad i
 * Planerat, Vardag, Spontant och Återhämtning.
 * Poängen: en tom kalender kan ändå ha varit en tung dag.
 */
export function DayEnergyFlow({
  className,
  showLink = true,
  showHeader = true,
}: {
  className?: string;
  showLink?: boolean;
  showHeader?: boolean;
}) {
  const { t } = useLang();
  const { entries, balance, signedIn, loading } = useEnergyFlow();

  const rows = useMemo(
    () =>
      ENERGY_KINDS.map((k) => ({
        ...k,
        row: balance.byKind.find((b) => b.kind === k.id),
      })),
    [balance.byKind],
  );

  const todayCount = useMemo(
    () => entries.filter((e) => isSameDay(e.occurredAt)).length,
    [entries],
  );

  const max = Math.max(4, ...rows.map((r) => Math.abs(r.row?.net ?? 0)));

  if (!signedIn || loading) return null;

  const body = (
    <>
      {todayCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t(
            "Inget registrerat idag än. Lägg till något du gjort så syns dagens riktiga belastning här.",
          )}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map(({ id, label, emoji, hint, row }) => {
            const net = row?.net ?? 0;
            const width = `${Math.round((Math.abs(net) / max) * 100)}%`;
            return (
              <div key={id} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-ink" title={hint}>
                  <span aria-hidden className="mr-1">
                    {emoji}
                  </span>
                  {t(label)}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary/50">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      net >= 0 ? "bg-primary/70" : "bg-accent/70",
                    )}
                    style={{ width }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                  {net > 0 ? "+" : ""}
                  {net}
                </span>
              </div>
            );
          })}

          <div className="mt-3 flex items-baseline justify-between border-t border-border/50 pt-3">
            <span className="text-sm text-muted-foreground">{t("Netto idag")}</span>
            <span className="font-display text-2xl font-bold text-ink">
              {balance.net > 0 ? "+" : ""}
              {balance.net}
            </span>
          </div>

          {balance.highFrictionCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {balance.highFrictionCount}{" "}
              {t(
                "av dagens saker var tunga att komma igång med – svårighetsgrad räknas separat från energi.",
              )}
            </p>
          )}
        </div>
      )}

      {showLink && (
        <Link
          href="/energifloede"
          className="mt-3 inline-block text-sm text-primary underline-offset-2 hover:underline"
        >
          {t("Se hela energiflödet")}
        </Link>
      )}
    </>
  );

  return (
    <section
      className={cn("rounded-3xl border-2 border-border/60 bg-card p-5 shadow-soft", className)}
      aria-label={t("Energins historik idag")}
    >
      {showHeader ? (
        <CollapsibleSection
          id="energins-historik-idag"
          title={t("Energins historik idag")}
          headingClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          className="space-y-3"
          help={
            <>
              {t(
                "Mönster över vad du faktiskt gjort idag – inte din nuvarande nivå. Din energibild just nu är Mitt energibatteri. Minus betyder att det tog energi, plus att det gav.",
              )}
            </>
          }
        >
          {body}
        </CollapsibleSection>
      ) : (
        body
      )}
    </section>
  );
}

export default DayEnergyFlow;
