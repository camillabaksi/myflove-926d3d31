import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { FlowMascot } from "@/components/flow-mascot";
import { useLang } from "@/hooks/use-language";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { useImpactCheckin } from "@/hooks/use-impact-checkin";
import { useCycle } from "@/hooks/use-cycle";
import { ORK_LEVELS, orkFromValue10 } from "@/lib/ork";
import type { ImpactKind } from "@/lib/impact-checkin";
import { track } from "@/lib/analytics";
import CollapsibleSection from "@/components/collapsible-section";

/** Ett kort urval av befintliga påverkanstyper – resten finns kvar i Mitt batteri. */
const QUICK_IMPACTS: { id: ImpactKind; label: string; emoji: string }[] = [
  { id: "somn", label: "Dålig sömn", emoji: "🌙" },
  { id: "overbelastat", label: "Stress eller mental belastning", emoji: "🧠" },
  { id: "oro", label: "Något har hänt", emoji: "🌧️" },
  { id: "familj", label: "Familj/barn tar mycket energi", emoji: "👨‍👧" },
  { id: "sjuk", label: "Sjuk eller krasslig", emoji: "🤒" },
  { id: "smarta", label: "Smärta", emoji: "🩹" },
  { id: "trott", label: "Svårt att fokusera", emoji: "🪫" },
  { id: "annat", label: "Annat", emoji: "✨" },
];

/**
 * Steg 01 – Hur mår du?
 *
 * Ork först, påverkan sedan (frivilligt). Sparar i befintlig data:
 * useQuickCheckin (energy_logs) och useImpactCheckin. Ingen ny datamodell.
 */
export default function HowAreYou() {
  const { t } = useLang();
  const { energyValue, logEnergy } = useQuickCheckin();
  const { impact, logImpact } = useImpactCheckin();
  const { cycle } = useCycle();
  const [ork, setOrk] = useState<number | null>(energyValue ?? null);
  const [kinds, setKinds] = useState<ImpactKind[]>(impact?.kinds ?? []);
  const [done, setDone] = useState(false);

  useEffect(() => {
    track("step1_opened", { source: "hur-mar-du" });
  }, []);

  const options = cycle?.enabled
    ? [
        ...QUICK_IMPACTS,
        { id: "halsa" as ImpactKind, label: "Min cykel påverkar mig", emoji: "🌸" },
      ]
    : QUICK_IMPACTS;

  const chooseOrk = (value10: number) => {
    setOrk(value10);
    logEnergy(value10);
    track("battery_logged", { source: "hur-mar-du", method: "ork" });
  };

  const toggleKind = (id: ImpactKind) =>
    setKinds((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));

  const save = () => {
    if (kinds.length > 0) {
      logImpact(kinds, "mattligt", "nu");
      track("impact_logged", { source: "hur-mar-du", count: kinds.length });
    }
    setDone(true);
  };

  const orkLabel = orkFromValue10(ork)?.label ?? null;

  return (
    <Layout>
      <MyFlovePageGrid className="gap-5">
        <MyFloveWide className="min-w-0">
          <div className="flex items-start gap-3">
            <FlowMascot size="sm" mood="calm" className="mt-0.5 shrink-0 flow-alive" alt="" />
            <div>
              <h1 className="text-2xl font-bold text-ink">{t("Hur mår du?")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("Så vet vi vad du har att jobba med idag.")}
              </p>
            </div>
          </div>
        </MyFloveWide>

        <MyFloveWide className="min-w-0">
          <CollapsibleSection
            id="how-are-you-energy"
            title={
              <span>
                <span aria-hidden>🔋</span> {t("Hur mycket ork har du idag?")}
              </span>
            }
            headingClassName="text-base font-semibold"
            className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
          >
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ORK_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => chooseOrk(level.value10)}
                  aria-pressed={ork === level.value10}
                  className={`press flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border text-sm font-medium ${
                    ork === level.value10
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-ink hover:border-primary"
                  }`}
                >
                  <span aria-hidden>{level.dot}</span>
                  {t(level.label)}
                </button>
              ))}
            </div>
          </CollapsibleSection>
        </MyFloveWide>

        <MyFloveWide className="min-w-0">
          <CollapsibleSection
            id="how-are-you-impact"
            title={
              <span>
                <span aria-hidden>🌿</span> {t("Vad påverkar dig idag?")}
              </span>
            }
            headingClassName="text-base font-semibold"
            description={t("Du kan välja flera – och du behöver inte välja något alls.")}
            className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft"
          >
            <div className="mt-3 flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleKind(option.id)}
                  aria-pressed={kinds.includes(option.id)}
                  className={`press min-h-11 rounded-full px-4 text-sm font-medium ${
                    kinds.includes(option.id)
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-ink hover:border-primary"
                  }`}
                >
                  <span aria-hidden>{option.emoji}</span> {t(option.label)}
                </button>
              ))}
            </div>
          </CollapsibleSection>
        </MyFloveWide>

        <MyFloveWide className="min-w-0 space-y-3">
          <button
            type="button"
            onClick={save}
            disabled={ork == null}
            className="press flex min-h-14 w-full items-center justify-center gap-2 rounded-3xl bg-primary px-5 text-base font-semibold text-primary-foreground shadow-lifted disabled:opacity-50"
          >
            <Check size={18} aria-hidden /> {t("Spara")}
          </button>

          {done && (
            <div className="rounded-3xl border border-border/60 bg-lavender/25 p-5 shadow-soft">
              <p className="text-sm text-ink">
                {t("Bra. Nu vet vi lite mer om vad du har att jobba med idag.")}
                {orkLabel ? ` (${t("Ork")}: ${t(orkLabel)})` : ""}
              </p>
              <Link
                href="/idag"
                onClick={() => track("step2_opened", { source: "hur-mar-du" })}
                className="press mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                {t("Vad händer idag?")} <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            <Link href="/mitt-batteri" className="underline underline-offset-2">
              {t("Mer om din energi och dina mönster")}
            </Link>
          </p>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
