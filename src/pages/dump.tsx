import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { NotebookPen, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics";
import Layout from "@/components/layout";
import { MyFloveBlock, MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import QuickflowCapture from "@/components/quickflow-capture";
import QuickflowPriority from "@/components/quickflow-priority";
import QuickflowList from "@/components/quickflow-list";
import InsightQuickflowHint from "@/components/insight-quickflow-hint";
import CollapsibleSection from "@/components/collapsible-section";
import QuickflowRulesSettings from "@/components/quickflow-rules-settings";
import WhyHint from "@/components/why-hint";
import { useLang } from "@/hooks/use-language";

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
      <MyFlovePageGrid>
        <MyFloveWide>
          <div className="space-y-8">
            <MyFloveBlock
              title={t("Vad behöver du få ur huvudet?")}
              subtitle={t("Skriv eller prata fritt. Flow sorterar och hjälper dig prioritera.")}
              eyebrow="QuickFlow"
              icon={Sparkles}
              tone="sun"
              surface="sun"
              className="pop-in"
            >
              <div className="space-y-4">
                <p className="leading-relaxed text-muted-foreground">
                  {t(
                    "Dumpa allt som snurrar – Flow delar upp det i separata saker och föreslår en ordning utifrån viktighet, brådska och ditt batteri. Du bestämmer alltid själv.",
                  )}
                </p>
                <QuickflowCapture />
                <WhyHint label="quickflow">
                  {t(
                    "När huvudet är fullt ska det vara lätt att få nästa steg utan att behöva planera allt själv. Inga tider eller deadlines skapas här – det gör du i kalendern när du vill.",
                  )}
                </WhyHint>
              </div>
            </MyFloveBlock>

            <QuickflowPriority />

            <InsightQuickflowHint />
            <QuickflowList />

            <Link
              to="/anteckningar"
              className="surface-card mt-4 flex items-center gap-3 p-4 text-left hover:border-primary/40"
            >
              <NotebookPen size={20} className="text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{t("Anteckningar & idébank")}</span>
                <span className="block text-sm text-muted-foreground">
                  {t("Tankar utan krav bor i en egen del under Flow.")}
                </span>
              </span>
            </Link>

            <CollapsibleSection
              title={
                <span className="flex items-center gap-2">
                  <Sparkles size={20} /> {t("Mina sorteringsregler")}
                </span>
              }
              id="QuickFlow-regler"
              headingClassName="font-semibold"
              className="pt-4"
            >
              <QuickflowRulesSettings />
            </CollapsibleSection>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
