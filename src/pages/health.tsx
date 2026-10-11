import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Battery, MessageCircle, Heart } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import CollapsibleSection from "@/components/collapsible-section";
import { useLang } from "@/hooks/use-language";
import { track } from "@/lib/analytics";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { HealthToolLinks } from "@/components/health-tool-links";

/**
 * ❤️ Hälsa – ett samlat hem för allt som handlar om hur du mår.
 * Sidan äger ingen egen data: den länkar vidare till de befintliga
 * vyerna (Mitt batteri, Träning och Rutiner & medicin). Energihistoriken
 * finns redan som en flik inne i Mitt batteri och är inte en egen ingång här.
 */
export default function HealthPage() {
  const { t } = useLang();
  useEffect(() => {
    track("health_viewed", { source: "sida" });
  }, []);

  return (
    <Layout>
      <MyFlovePageGrid area="halsa" className="pace-next-page pace-next-place">
        <MyFloveWide>
          <MyFloveHeader
            title="Min plats"
            titleClassName="pace-next-title pace-editorial"
            area="halsa"
            emojiKey="wellness"
            description="Din plats för energi, återhämtning och det som påverkar dagen."
            className="paceable-my-place-header shadow-soft"
          />
        </MyFloveWide>

        <MyFloveWide className="space-y-2">
          <p className="pb-1 text-sm text-muted-foreground">{t("Checka in, se dina mönster eller hitta återhämtning.")}</p>
          <Link href="/mitt-batteri" className="pace-place-entry press flex items-center gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky text-primary" aria-hidden><Battery className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="pace-place-entry-title block font-sans text-lg font-semibold text-ink">Mitt batteri</span><span className="block text-sm text-muted-foreground">{t("Logga hur du mår eller se ditt energimönster.")}</span></span>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
          <Link href="/aterhamtning" className="pace-place-entry press flex items-center gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage text-primary" aria-hidden><Heart className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="pace-place-entry-title block font-sans text-lg font-semibold text-ink">{t("Återhämtning")}</span><span className="block text-sm text-muted-foreground">{t("Välj en paus som passar just nu.")}</span></span>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
          <Link href="/assistant" className="pace-place-entry press flex items-center gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun text-primary" aria-hidden><MessageCircle className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="pace-place-entry-title block font-sans text-lg font-semibold text-ink">{t("Prata om din dag")}</span><span className="block text-sm text-muted-foreground">{t("Berätta vad du behöver göra och hitta ett nästa steg.")}</span></span>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </MyFloveWide>

        <MyFloveWide>
          <CollapsibleSection id="health-other" title="Mer inom hälsa" defaultCollapsed className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft" headingClassName="pace-place-section-title font-sans text-base font-semibold text-ink">
            <HealthToolLinks />
          </CollapsibleSection>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
