import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Hand, Sunset, Timer } from "lucide-react";
import Layout from "@/components/layout";
import { PacePageHeader } from "@/components/paceable/page-header";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import LightBoost from "@/components/light-boost";
import PauseSession from "@/components/recovery/pause-session";
import RecoveryGapCard from "@/components/recovery/recovery-gap-card";
import EnergyAfterCheck from "@/components/recovery/energy-after-check";
import RecoveryLibrary from "@/components/recovery/recovery-library";
import CollapsibleSection from "@/components/collapsible-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { useLang } from "@/hooks/use-language";
import { track } from "@/lib/analytics";

const PRESETS = [5, 10, 20, 30, 60];

/**
 * Återhämtning – egen huvudsektion.
 * EN paus där användaren väljer tid (inga separata mikropauser eller akut lugn),
 * Ljusboost och Stopp-knappen. Efter paus och Ljusboost erbjuds en frivillig
 * energikoll som sparas i befintlig energilogg.
 * Strukturen är listbaserad så att fler återhämtningssätt kan läggas till.
 */
export default function PausePage() {
  const { t } = useLang();
  const [minutes, setMinutes] = useCloudSyncedStorage<number>("myflove-pause-minutes", 10);
  const [custom, setCustom] = useState("");
  const [running, setRunning] = useState(() => new URLSearchParams(window.location.search).get("start") === "paus");
  const [check, setCheck] = useState<{ title: string; source: string } | null>(null);
  const [lightBoost, setLightBoost] = useState(() => new URLSearchParams(window.location.search).get("start") === "ljusboost");

  useEffect(() => {
    track("recovery_viewed");
  }, []);

  const startPause = (m: number) => {
    const safe = Math.min(240, Math.max(1, Math.round(m)));
    setMinutes(safe);
    track("recovery_pause_started", { count: safe });
    setRunning(true);
  };

  return (
    <Layout>
      <PauseSession
        minutes={minutes}
        open={running}
        onClose={() => {
          setRunning(false);
          setCheck({ title: `Paus ${minutes} min`, source: "paus" });
        }}
      />
      <LightBoost
        open={lightBoost}
        onOpenChange={(next) => {
          setLightBoost(next);
          if (!next) setCheck({ title: "Ljusboost", source: "ljusboost" });
        }}
      />

      <MyFlovePageGrid area="halsa" className="pace-ds pace-compact-page pace-next-page pace-next-health gap-4">
        <MyFloveWide>
          <div className="pace-compact-stack">
            <PacePageHeader
              title={t("Återhämtning")}
              icon={Timer}
              description={t("Vad behöver du just nu?")}
            />

            {check && (
              <EnergyAfterCheck
                title={check.title}
                source={check.source}
                onDone={() => setCheck(null)}
              />
            )}

            <section
              className="pace-card-surface rounded-3xl border border-border/60 bg-card p-4 shadow-soft"
              aria-label={t("Paus")}
              data-testid="pause-choices"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary text-primary"
                >
                  <Timer className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-ink">{t("Paus")}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t("Välj hur länge. Påminnelser är tysta under pausen.")}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {PRESETS.map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={m === minutes ? "default" : "secondary"}
                    className={`pace-compact-control ${m === minutes ? "pace-compact-primary" : ""}`}
                    onClick={() => startPause(m)}
                  >
                    {m} min
                  </Button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2">
                <Input
                  inputMode="numeric"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
                  placeholder={t("Egen tid i minuter")}
                  aria-label={t("Egen tid i minuter")}
                  className="h-11 rounded-2xl"
                />
                <Button
                  type="button"
                  className="pace-ds-button pace-compact-control pace-compact-primary"
                  disabled={!custom}
                  onClick={() => {
                    startPause(Number(custom));
                    setCustom("");
                  }}
                >
                  {t("Starta")}
                </Button>
              </div>
            </section>

            <div className="grid gap-3">
              <Button
                variant="outline"
                type="button"
                data-testid="pause-light-boost"
                onClick={() => {
                  track("home_widget_opened", { source: "ljusboost" });
                  track("recovery_lightboost_opened");
                  setLightBoost(true);
                }}
                className="pace-card-surface press flex min-h-16 w-full items-center gap-3 rounded-3xl border border-border/60 bg-card px-4 py-3 text-left shadow-soft transition-colors hover:border-primary/35"
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
              </Button>

              <Link
                href="/stop-paus"
                onClick={() => track("home_widget_opened", { source: "stop_paus" })}
                className="pace-card-surface press flex min-h-16 w-full items-center gap-3 rounded-3xl border border-border/60 bg-card px-4 py-3 text-left shadow-soft transition-colors hover:border-primary/35"
              >
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground"
                >
                  <Hand className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{t("Stop-paus")}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t("En paus mellan impuls och beslut – och ett lugnt nästa steg")}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              </Link>
            </div>
            <CollapsibleSection id="recovery-library-entry" title={t("Återhämtningsbibliotek")} defaultCollapsed className="pace-card-surface rounded-2xl border border-border/60 bg-card p-3 shadow-soft" headingClassName="text-sm font-semibold text-ink"><RecoveryLibrary /></CollapsibleSection>
            <CollapsibleSection id="recovery-gap-entry" title={t("Hitta en lugnare väg")} defaultCollapsed className="pace-card-surface rounded-2xl border border-border/60 bg-card p-3 shadow-soft" headingClassName="text-sm font-semibold text-ink"><RecoveryGapCard /></CollapsibleSection>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
