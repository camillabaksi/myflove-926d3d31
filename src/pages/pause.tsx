import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Hand, Wind, Moon, Sunset } from "lucide-react";
import Layout from "@/components/layout";
import { MyFloveHeader } from "@/components/myflove";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import CalmMode from "@/components/calm-mode";
import LightBoost from "@/components/light-boost";
import { useLang } from "@/hooks/use-language";
import { track } from "@/lib/analytics";

/**
 * Paus – en samlad återhämtningsväg.
 * Samlar befintliga funktioner (Akut Lugn, Mikropaus, Stop-paus, Ljusboost) på
 * ett ställe i stället för konkurrerande ingångar på Hem. Ingen ny logik.
 */
export default function PausePage() {
  const { t } = useLang();
  const [calmMode, setCalmMode] = useState<"acute" | "micro" | null>(null);
  const [lightBoost, setLightBoost] = useState(false);

  const open = (kind: "acute" | "micro") => {
    track("home_widget_opened", { source: kind === "acute" ? "akut_lugn" : "mikropaus" });
    setCalmMode(kind);
  };

  return (
    <Layout>
      <CalmMode
        kind={calmMode ?? "acute"}
        open={calmMode != null}
        onOpenChange={(next) => !next && setCalmMode(null)}
      />
      <LightBoost open={lightBoost} onOpenChange={setLightBoost} />

      <MyFlovePageGrid area="halsa">
        <MyFloveWide>
          <div className="space-y-5">
            <MyFloveHeader
              area="aterhamtning"
              title={t("Paus")}
              emojiKey="wellness"
              description={t("Vad behöver du just nu?")}
            />

            <div className="grid gap-3" data-testid="pause-choices">
              <button
                type="button"
                onClick={() => open("micro")}
                className="press flex min-h-16 w-full items-center gap-3 rounded-3xl border border-border/60 bg-card px-4 py-3 text-left shadow-soft transition-colors hover:border-primary/35"
              >
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary text-primary"
                >
                  <Wind className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{t("Mikropaus")}</span>
                  <span className="block text-xs text-muted-foreground">{t("2 minuter")}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              </button>

              <button
                type="button"
                onClick={() => open("acute")}
                className="press flex min-h-16 w-full items-center gap-3 rounded-3xl border border-border/60 bg-card px-4 py-3 text-left shadow-soft transition-colors hover:border-primary/35"
              >
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-lavender/60 text-primary"
                >
                  <Moon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{t("Akut Lugn")}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t("15 minuter utan påminnelser")}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              </button>

              <button
                type="button"
                data-testid="pause-light-boost"
                onClick={() => {
                  track("home_widget_opened", { source: "ljusboost" });
                  setLightBoost(true);
                }}
                className="press flex min-h-16 w-full items-center gap-3 rounded-3xl border border-border/60 bg-card px-4 py-3 text-left shadow-soft transition-colors hover:border-primary/35"
              >
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground"
                >
                  <Sunset className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{t("Ljusboost")}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t("Varmt ljus och långsamma vågor")}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              </button>



              <Link
                href="/stop-paus"
                onClick={() => track("home_widget_opened", { source: "stop_paus" })}
                className="press flex min-h-16 w-full items-center gap-3 rounded-3xl border border-border/60 bg-card px-4 py-3 text-left shadow-soft transition-colors hover:border-primary/35"
              >
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground"
                >
                  <Hand className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{t("Stopp-knappen")}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t("En paus mellan impuls och beslut")}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              </Link>
            </div>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
