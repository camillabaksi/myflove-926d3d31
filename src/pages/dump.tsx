import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Brain, NotebookPen } from "lucide-react";
import { track } from "@/lib/analytics";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import QuickflowCapture from "@/components/quickflow-capture";
import QuickflowImageImport from "@/components/quickflow-image-import";
import QuickflowPriority from "@/components/quickflow-priority";
import QuickflowList from "@/components/quickflow-list";
import InsightQuickflowHint from "@/components/insight-quickflow-hint";
import CollapsibleSection from "@/components/collapsible-section";
import QuickflowRulesSettings from "@/components/quickflow-rules-settings";
import WhyHint from "@/components/why-hint";
import { useLang } from "@/hooks/use-language";
import { PaceableStones } from "@/components/paceable/paceable-stones";
import { ThoughtsIcon } from "@/components/paceable/navigation-icons";
import { BookEntrances } from "@/components/notebook/book-navigation";

/**
 * QuickFlow = få ut saker ur huvudet → Flow delar upp → du granskar →
 * Flow föreslår en ordning → du godkänner. EN ingång, inga parallella flöden.
 * Kalender bestämmer NÄR – QuickFlow bestämmer bara ordning.
 */
export default function Dump() {
  const { t } = useLang();
  useEffect(() => {
    track("quickflow_opened", { source: "sida" });
  }, []);

  return (
    <Layout>
      <MyFlovePageGrid className="pace-next-page pace-next-capture">
        <MyFloveWide>
          <div className="space-y-8">
            <BookEntrances />
            <section className="pop-in space-y-5" aria-labelledby="thoughts-title">
              <header className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="mb-3 grid h-9 w-9 place-items-center rounded-2xl bg-lavender text-ink" aria-hidden><ThoughtsIcon size={20} /></span>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t("Fånga")}</p>
                  <h1 id="thoughts-title" className="mt-1 pace-next-title pace-editorial text-3xl text-ink">{t("Vad har du i huvudet?")}</h1>
                  <p className="mt-1 text-base text-muted-foreground">{t("Skriv eller säg det som det är.")}</p>
                </div>
                <PaceableStones compact tactile className="pace-stones-contained h-12 w-24 shrink-0 [&_.pace-stones-img]:absolute [&_.pace-stones-img]:right-0 [&_.pace-stones-img]:!w-[76px] [&_.pace-stones-img]:!max-w-none" />
              </header>
              <div className="space-y-4">
                <QuickflowCapture appearance="paceable" />
                <QuickflowImageImport
                  appearance="paceable"
                  whySlot={
                    <WhyHint label="quickflow" appearance="inline">
                      {t(
                        "När huvudet är fullt ska det vara lätt att få nästa steg utan att behöva planera allt själv. Inga tider eller deadlines skapas här – det gör du i kalendern när du vill.",
                      )}
                    </WhyHint>
                  }
                />
              </div>
            </section>

            {/* Allt som redan är ur huvudet ligger kvar – men ur vägen tills du vill se det. */}
            <CollapsibleSection
              id="quickflow-det-du-fatt-ur"
              defaultCollapsed
              title={t("Det du fått ur huvudet")}
              description={t(
                "Förslagen är sorterade efter viktighet, brådska och din kapacitet. Du bestämmer alltid själv.",
              )}
              className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-soft"
              headingClassName="text-base font-semibold text-ink"
            >
              <div className="space-y-8 pt-2">
                <QuickflowPriority />

                <InsightQuickflowHint />
                <QuickflowList />

                <Link
                  to="/anteckningar"
                  className="surface-card mt-4 flex items-center gap-3 p-4 text-left hover:border-primary/40"
                >
                  <NotebookPen size={20} className="text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">
                      {t("Anteckningar & idébank")}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {t("Tankar utan krav bor i en egen del under Pace.")}
                    </span>
                  </span>
                </Link>

                <CollapsibleSection
                  title={
                    <span className="flex items-center gap-2">
                      <Brain size={20} /> {t("Mina sorteringsregler")}
                    </span>
                  }
                  id="QuickFlow-regler"
                  headingClassName="font-semibold"
                  className="pt-4"
                >
                  <QuickflowRulesSettings />
                </CollapsibleSection>
              </div>
            </CollapsibleSection>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
