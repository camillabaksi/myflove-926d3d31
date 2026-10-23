import { PacePageHeader } from "@/components/paceable/page-header";
import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { supabase } from "@/integrations/supabase/client";
import { Battery, Loader2, Sparkles } from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import CollapsibleSection from "@/components/collapsible-section";
import { MyFloveEnergyDots } from "@/components/myflove/motion";
import { useLang } from "@/hooks/use-language";
import SoftWaveChart from "@/components/soft-wave-chart";
import { useQuickCheckin } from "@/hooks/use-quick-checkin";
import { hourlyEnergyProfile } from "@/lib/hourly-energy-profile";

const LEVEL_LABELS: Record<number, string> = {
  1: "Tom",
  2: "Låg",
  3: "Ok",
  4: "På",
  5: "Fullt laddad",
};

const LEVEL_LABELS_EN: Record<number, string> = {
  1: "Empty",
  2: "Low",
  3: "Ok",
  4: "On",
  5: "Fully charged",
};

const LEVEL_EMOJI: Record<number, string> = {
  1: "🪫",
  2: "😮‍💨",
  3: "🙂",
  4: "⚡",
  5: "🔋",
};

interface EnergyContentProps {
  showHeader?: boolean;
  readOnly?: boolean;
}

export function EnergyContent({ showHeader = true, readOnly = false }: EnergyContentProps) {
  const { t, lang, locale } = useLang();
  const levelLabels = lang === "en" ? LEVEL_LABELS_EN : LEVEL_LABELS;
  const { energyEntries, logEnergy } = useQuickCheckin();
  const logs = useMemo(
    () =>
      energyEntries.filter(
        (entry) => new Date(entry.logged_at).getTime() >= Date.now() - 7 * 86400000,
      ),
    [energyEntries],
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!mounted) return;
      const uid = userData.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setLoading(false);
        return;
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const todayLogs = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return logs
      .filter((l) => new Date(l.logged_at) >= start)
      .map((l) => ({
        time: new Date(l.logged_at).toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        }),
        level: l.level,
      }));
  }, [logs, locale]);

  const { hours: hourAverages, supportedPattern, peak: peakHour, low: lowHour, observedDays } = useMemo(
    () => hourlyEnergyProfile(logs),
    [logs],
  );
  const observedHours = hourAverages.filter((row) => row.avg != null);

  async function handleSave() {
    if (!userId || !selected) return;
    setSaving(true);
    setError(null);
    try {
      await logEnergy(selected * 2, note);
      setSelected(null);
      setNote("");
    } catch {
      setError(t("Det gick inte att spara. Dina val finns kvar – försök igen."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <MyFlovePageGrid className="pace-ds pace-compact-page pace-next-page pace-next-health">
      {showHeader && (
        <MyFloveWide>
<PacePageHeader icon={Battery} title={t("Energikarta")} description={t("Logga hur du känner dig just nu. Pace lär sig när på dygnet du har mest att ge – och när du behöver vila.")} />
        </MyFloveWide>
      )}

      {!userId && !loading && (
        <MyFloveWide>
          <div className="pace-card-surface rounded-2xl bg-card border border-border p-4 text-sm text-muted-foreground">
            {t("Logga in för att spara din energi över tid.")}
          </div>
        </MyFloveWide>
      )}

      {userId && !readOnly && (
        <MyFloveWide>
          <CollapsibleSection
            title={t("Hur känns det just nu?")}
            help={t(
              "Tryck på en nivå. Det tar två sekunder och styr hur mycket appen föreslår idag.",
            )}
            headingClassName="font-sans text-base font-semibold text-ink"
            description={t("Välj det som passar närmast – det finns inga fel svar.")}
            className={readOnly ? "space-y-3 rounded-2xl bg-secondary/30 p-3" : "pace-card-surface rounded-2xl bg-card border border-border p-5 shadow-sm"}
          >
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,5.5rem),1fr))] gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const active = selected === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelected(lvl)}
                    aria-pressed={active}
                    className={`pace-health-choice flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                        : "bg-secondary/40 border-transparent hover:bg-secondary"
                    }`}
                  >
                    <span className="text-2xl leading-none">{LEVEL_EMOJI[lvl]}</span>
                    <span className="text-center text-xs leading-snug break-words">{levelLabels[lvl]}</span>
                  </button>
                );
              })}
            </div>
            {selected !== null && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                <MyFloveEnergyDots value={selected} className="justify-center pt-1" />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("Något som påverkade? (valfritt)")}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? <Loader2 className="animate-spin" size={16} /> : t("Spara")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelected(null);
                      setNote("");
                    }}
                  >
                    {t("Avbryt")}
                  </Button>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CollapsibleSection>
        </MyFloveWide>
      )}

      {loading ? (
        <MyFloveWide>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
          </div>
        </MyFloveWide>
      ) : (
        <>
          <MyFloveWide span="wide">
            <CollapsibleSection
              title={t("Idag")}
              headingClassName="font-medium"
              description={
                todayLogs.length === 0
                  ? t("Ingen loggning idag än – lägg en när det passar.")
                  : `${todayLogs.length} ${todayLogs.length === 1 ? t("loggning idag.") : t("loggningar idag.")}`
              }
              className="rounded-2xl bg-secondary/30 p-3"
            >
              {todayLogs.length > 0 && (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={todayLogs} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <defs><linearGradient id="battery-history-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A996C6" stopOpacity={0.25}/><stop offset="100%" stopColor="#A996C6" stopOpacity={0.02}/></linearGradient></defs>
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[1, 5]} ticks={[1, 3, 5]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: number) => [`${v} – ${levelLabels[v]}`, t("Energi")]} contentStyle={{ borderRadius: 14, fontSize: 12, borderColor: "#E8DFEC" }} />
                      <Area type="monotone" dataKey="level" stroke="#9775AD" strokeWidth={2.5} fill="url(#battery-history-area)" dot={{ r: 4, fill: "#9775AD", stroke: "#FAF9F6", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CollapsibleSection>
          </MyFloveWide>

          <MyFloveWide span="wide">
            <CollapsibleSection
              title={t("Din vecka i snitt")}
              defaultCollapsed
              help={t(
                "Ser du ett mönster? Använd det för att lägga tunga saker när du brukar orka.",
              )}
              headingClassName="font-sans text-base font-semibold text-ink"
              description={t("Snittenergi per timme, senaste 7 dagarna.")}
              className="rounded-2xl bg-secondary/30 p-3"
            >
              {observedHours.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  {t("Logga några gånger så börjar din karta ta form.")}
                </p>
              ) : (
                <>
                  <div role="img" aria-label={`${t("Snittenergi per timme")}: ${observedHours.map((r) => `${r.hour} ${r.avg}`).join(", ")}`}>
                    <SoftWaveChart series={[{ id: "hour", tone: "primary", values: hourAverages.map((r) => r.avg == null ? null : ((r.avg - 1) / 4) * 100) }]} />
                    <div className="mt-1 flex justify-between gap-2 px-1 text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                      <span className="shrink-0 whitespace-nowrap">00:00</span>
                      <span className="shrink-0 whitespace-nowrap">12:00</span>
                      <span className="shrink-0 whitespace-nowrap">23:00</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{t("Endast timmar med egna loggningar visas. Tomma timmar betyder att underlag saknas, inte att energin var noll.")}</p>
                  {!supportedPattern && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("Vi behöver återkommande loggningar vid flera tider och minst tre olika dagar innan vi kan föreslå en vanlig energitopp.")}
                      {observedDays > 0 ? ` (${observedDays} ${t("dagar med loggningar")})` : ""}
                    </p>
                  )}
                  {supportedPattern && peakHour && lowHour && peakHour.hour !== lowHour.hour && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/40 p-3 text-sm">
                      <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
                      <p className="leading-snug">
                        {t("Du är oftast som mest på runt")} <strong>{peakHour.hour}</strong>{" "}
                        {t("och lägre")} {t("kring")} <strong>{lowHour.hour}</strong>
                        {t(". Planera det tunga när kroppen är med.")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CollapsibleSection>
          </MyFloveWide>
        </>
      )}
    </MyFlovePageGrid>
  );
}

export default function EnergyMapPage() {
  return (
    <Layout>
      <EnergyContent />
    </Layout>
  );
}
