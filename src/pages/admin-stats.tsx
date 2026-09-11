import Layout from "@/components/layout";
import { useGetAnalyticsSummary } from "@workspace/api-client-react";
import { BarChart3, Users, Activity, Repeat, Sparkles, Lock, Info } from "lucide-react";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useLang } from "@/hooks/use-language";
import { useState } from "react";
import CollapsibleSection from "@/components/collapsible-section";
import { AdminListSorter, sortAdminRows, type AdminSortKey } from "@/components/admin/list-sorter";
import AnalyticsExport from "@/components/admin/analytics-export";
import UserAnalytics from "@/components/admin/user-analytics";
import { actionLabel, pageLabel, sectionLabel } from "@/lib/analytics-labels";

/** Kort förklaring under varje block: vad vi mäter och varför det spelar roll. */
function WhyBox({ what, why }: { what: string; why: string }) {
  const { t } = useLang();
  return (
    <div className="rounded-2xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground space-y-1">
      <p>
        <strong className="text-foreground">{t("Vad mäter vi?")}</strong> {what}
      </p>
      <p>
        <strong className="text-foreground">{t("Varför är det viktigt?")}</strong> {why}
      </p>
    </div>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
      <div
        className="h-full bg-primary rounded-full"
        style={{ width: `${(value / Math.max(1, max)) * 100}%` }}
      />
    </div>
  );
}

const CORE_LOOP_ICON: Record<string, string> = {
  Fånga: "🧠",
  Planera: "📋",
  Göra: "✨",
  Reflektera: "💭",
};

/** Delar av appen vi visar med människovänliga namn i översikten. */
const FRIENDLY_PARTS: Array<{ label: string; sections: string[] }> = [
  { label: "Hem", sections: ["hem", "home"] },
  { label: "Idag", sections: ["idag", "today", "my-day", "min-dag"] },
  { label: "Flow", sections: ["flow", "flowplan", "flowscore", "assistant"] },
  { label: "Kalender", sections: ["kalender", "calendar"] },
  { label: "Mitt batteri", sections: ["batteri", "energi", "energifloede", "energikarta"] },
  { label: "Mående", sections: ["mood", "halsa", "how-are-you", "wellness"] },
];

export default function AdminStats() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { t } = useLang();
  const { data, isLoading, isError } = useGetAnalyticsSummary();
  const [partsSort, setPartsSort] = useState<AdminSortKey>("most");
  const [capacitySort, setCapacitySort] = useState<AdminSortKey>("most");
  const [viewsSort, setViewsSort] = useState<AdminSortKey>("most");
  const [pagesSort, setPagesSort] = useState<AdminSortKey>("most");
  const [actionsSort, setActionsSort] = useState<AdminSortKey>("most");

  if (adminLoading) {
    return (
      <Layout>
        <p className="text-muted-foreground">{t("Laddar…")}</p>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center space-y-3 py-16">
          <Lock size={40} className="mx-auto text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            {t("Endast för grundaren")}
          </h1>
          <p className="text-muted-foreground">{t("Den här sidan är privat.")}</p>
        </div>
      </Layout>
    );
  }

  const usage = data?.featureUsage ?? [];

  const viewsBySection = sortAdminRows(
    usage
      .filter((row) => row.action === "view" && row.section !== "page")
      .map((row) => ({ ...row, label: t(sectionLabel(row.section)) })),
    viewsSort,
  );

  const pageViews = sortAdminRows(
    usage
      .filter((row) => row.section === "page")
      .map((row) => ({ ...row, label: t(pageLabel(row.action)) })),
    pagesSort,
  );

  const otherActions = sortAdminRows(
    usage
      .filter((row) => row.action !== "view" && row.section !== "page")
      .map((row) => ({
        ...row,
        label: `${t(sectionLabel(row.section))} — ${t(actionLabel(row.action))}`,
      })),
    actionsSort,
  );

  const findUsage = (section: string, action: string) =>
    usage.find((row) => row.section === section && row.action === action);
  const sumSection = (sections: string[]) =>
    usage
      .filter((row) => sections.includes(row.section))
      .reduce(
        (acc, row) => ({
          events: acc.events + row.events,
          sessions: Math.max(acc.sessions, row.sessions),
        }),
        { events: 0, sessions: 0 },
      );

  const flowUsage = sumSection(["flow", "flowplan", "flowscore", "assistant"]);

  const capacityStats = [
    { label: t("Energi loggad"), ...findUsage("batteri", "battery_logged") },
    { label: t("Mående loggat"), ...findUsage("mood", "mood_logged") },
    { label: t("Påverkan registrerad"), ...findUsage("batteri", "impact_logged") },
    {
      label: t("Energipåverkan efter aktivitet"),
      ...findUsage("energi", "activity_energy_logged"),
    },
    { label: t("Hälsofaktor loggad"), ...findUsage("halsa", "health_factor_logged") },
    { label: t("Flow totalt"), ...sumSection(["flow", "flowplan"]) },
  ].map((row) => ({ label: row.label, events: row.events ?? 0, sessions: row.sessions ?? 0 }));
  const maxCapacity = Math.max(1, ...capacityStats.map((row) => row.events));

  const friendlyParts = sortAdminRows(
    FRIENDLY_PARTS.map((part) => ({
      label: t(part.label),
      ...sumSection(part.sections),
    })),
    partsSort,
  );
  const maxFriendly = Math.max(1, ...friendlyParts.map((p) => p.events));

  const maxViews = Math.max(1, ...viewsBySection.map((row) => row.events));
  const maxPageViews = Math.max(1, ...pageViews.map((row) => row.events));
  const maxDaily = Math.max(1, ...(data?.dailyActiveSessions ?? []).map((d) => d.sessions));
  const maxSignups = Math.max(1, ...(data?.dailySignups ?? []).map((d) => d.users));

  const kpis = data
    ? [
        {
          icon: Activity,
          label: t("Aktivitet"),
          value: `${data.avgEventsPerSession ?? 0}`,
          hint: t("Händelser per användare"),
        },
        {
          icon: Users,
          label: t("Aktiva användare"),
          value: `${data.activeSessions7d ?? 0}`,
          hint: t("Senaste 7 dagarna"),
        },
        {
          icon: Repeat,
          label: t("Återkomst"),
          value: `${data.returningRate ?? 0}%`,
          hint: t("Kommer tillbaka en annan dag"),
        },
        {
          icon: Sparkles,
          label: t("Flow-användning"),
          value: `${flowUsage.events}`,
          hint: t("Gånger Flow använts"),
        },
      ]
    : [];

  const cardClass = "bg-card p-5 rounded-3xl border-2 border-border shadow-sm";

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl mb-2 flex items-center gap-2">
            <BarChart3 className="text-primary" /> {t("Hur går MyFlove?")}
          </h1>
          <p className="text-muted-foreground">
            {t("Anonym, sammanslagen statistik om hur MyFlove används.")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground flex items-start gap-2 bg-secondary/40 border border-border rounded-2xl p-3">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              {t("Period: senaste 30 dagarna.")}{" "}
              {t(
                "Siffrorna är tidiga MVP-signaler från en liten grupp användare — riktningsvisare, inte statistiskt säkerställda resultat.",
              )}
            </span>
          </p>
        </div>

        {isLoading && <p className="text-muted-foreground">{t("Laddar statistik…")}</p>}
        {isError && <p className="text-destructive">{t("Kunde inte hämta statistik just nu.")}</p>}

        {data && (
          <>
            {/* 1. Överst: fyra tydliga KPI-kort */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-card p-4 rounded-3xl border-2 border-border shadow-sm space-y-1"
                >
                  <kpi.icon size={18} className="text-primary" />
                  <p className="text-2xl font-bold leading-tight">{kpi.value}</p>
                  <p className="text-sm font-medium leading-tight">{kpi.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{kpi.hint}</p>
                </div>
              ))}
            </div>

            {/* 2. Kärnflödet som funnel */}
            <CollapsibleSection
              title={t("MyFloves kärnflöde")}
              id="admin-core-flow"
              headingClassName="text-lg font-semibold"
              className={cardClass}
            >
              <p className="text-sm text-muted-foreground -mt-2">
                🧠 {t("Fånga")} → 📋 {t("Planera")} → ✨ {t("Göra")} → 💭 {t("Reflektera")}
              </p>
              <div className="space-y-3">
                {(data.coreLoop ?? []).map((step) => {
                  const max = Math.max(1, ...(data.coreLoop ?? []).map((s) => s.sessions));
                  return (
                    <div key={step.step}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">
                          {CORE_LOOP_ICON[step.step] ?? ""} {t(step.step)}
                        </span>
                        <span className="text-muted-foreground">
                          {step.sessions} {t("användare")}
                        </span>
                      </div>
                      <Bar value={step.sessions} max={max} />
                    </div>
                  );
                })}
              </div>
              <WhyBox
                what={t("Hur många användare som når varje steg i MyFloves dagliga loop.")}
                why={t("Visar om hela flödet håller ihop eller om något steg tappar folk.")}
              />
            </CollapsibleSection>

            {/* 3. Vad använder människor? */}
            <CollapsibleSection
              title={t("Vad använder människor?")}
              id="admin-feature-use"
              headingClassName="text-lg font-semibold"
              className={cardClass}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {friendlyParts.map((part) => (
                  <div key={part.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{part.label}</span>
                      <span className="text-muted-foreground">
                        {part.events} {t("ggr")} · {part.sessions} {t("användare")}
                      </span>
                    </div>
                    <Bar value={part.events} max={maxFriendly} />
                  </div>
                ))}
              </div>
              <WhyBox
                what={t("Vilka delar av appen som faktiskt öppnas och används.")}
                why={t("Visar var värdet finns i dag och vad vi ska bygga vidare på.")}
              />
            </CollapsibleSection>

            {/* 4. Kapacitet & mående */}
            <CollapsibleSection
              title={`🔋 ${t("Kapacitet & mående")}`}
              id="admin-capacity"
              headingClassName="text-lg font-semibold"
              className={cardClass}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {capacityStats.map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{row.label}</span>
                      <span className="text-muted-foreground">
                        {row.events} {t("ggr")} · {row.sessions} {t("användare")}
                      </span>
                    </div>
                    <Bar value={row.events} max={maxCapacity} />
                  </div>
                ))}
              </div>
              <WhyBox
                what={t("Hur ofta människor loggar energi, mående och påverkan — helt anonymt.")}
                why={t(
                  "Det här är MyFloves kärna: att planera efter kapacitet, inte bara att-göra.",
                )}
              />
            </CollapsibleSection>

            {/* 5. Återkomst */}
            <CollapsibleSection
              title={`🔄 ${t("Återkomst")}`}
              id="admin-returning"
              headingClassName="text-lg font-semibold"
              className={cardClass}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: t("Aktiva idag"), value: `${data.activeSessions1d}` },
                  { label: t("Aktiva 7 dagar"), value: `${data.activeSessions7d}` },
                  { label: t("Aktiva 30 dagar"), value: `${data.activeSessions30d}` },
                  { label: t("Återkommer"), value: `${data.returningRate ?? 0}%` },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="rounded-2xl border border-border bg-secondary/30 p-3"
                  >
                    <p className="text-xl font-bold">{row.value}</p>
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  "Kohortbaserad Dag 1 / Dag 7 / Dag 30 går inte att räkna fram ur nuvarande anonyma data, så vi visar bara det som faktiskt kan mätas.",
                )}
              </p>
              <WhyBox
                what={t("Hur många som är aktiva över tid och hur stor andel som kommer tillbaka.")}
                why={t("Återkomst är den starkaste signalen på att appen gör verklig nytta.")}
              />
            </CollapsibleSection>

            {/* 6. Detaljerad statistik – sekundär och expanderbar */}
            <CollapsibleSection
              title={`📋 ${t("Detaljerad statistik")}`}
              headingClassName="text-lg font-semibold"
              className={cardClass}
              defaultCollapsed
              description={t("Rådata och detaljerade mått — för egen analys, inte för demo.")}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label: t("Registrerade användare"), value: `${data.totalUsers ?? 0}` },
                    { label: t("Nya senaste 7 dagarna"), value: `${data.newUsers7d ?? 0}` },
                    { label: t("Besökare (30 d)"), value: `${data.totalSessions}` },
                    { label: t("Händelser (30 d)"), value: `${data.totalEvents ?? 0}` },
                    { label: t("Dagligt bruk (DAU/MAU)"), value: `${data.stickiness ?? 0}%` },
                    { label: t("Delar per besökare"), value: `${data.avgSectionsPerSession ?? 0}` },
                    { label: t("Gör något"), value: `${data.actionRate ?? 0}%` },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-2xl border border-border bg-secondary/30 p-3"
                    >
                      <p className="text-xl font-bold">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    {t("Händelser per dag (senaste 14 dagarna)")}
                  </h3>
                  <div className="flex items-end gap-1.5 h-28">
                    {(data.dailyEvents ?? []).map((day) => {
                      const max = Math.max(1, ...(data.dailyEvents ?? []).map((d) => d.events));
                      return (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center justify-end gap-1"
                        >
                          <div
                            className="w-full bg-accent rounded-t-md"
                            style={{
                              height: `${(day.events / max) * 100}%`,
                              minHeight: day.events > 0 ? "4px" : "0",
                            }}
                            title={`${day.date}: ${day.events}`}
                          />
                          <span className="text-[9px] text-muted-foreground">
                            {day.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    {t("Aktiva användare per dag (senaste 14 dagarna)")}
                  </h3>
                  <div className="flex items-end gap-1.5 h-28">
                    {(data.dailyActiveSessions ?? []).map((day) => (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center justify-end gap-1"
                      >
                        <div
                          className="w-full bg-primary rounded-t-md"
                          style={{
                            height: `${(day.sessions / maxDaily) * 100}%`,
                            minHeight: day.sessions > 0 ? "4px" : "0",
                          }}
                          title={`${day.date}: ${day.sessions}`}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {day.date.slice(5)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    {t("Nya registreringar (senaste 14 dagarna)")}
                  </h3>
                  <div className="flex items-end gap-1.5 h-28">
                    {(data.dailySignups ?? []).map((day) => (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center justify-end gap-1"
                      >
                        <div
                          className="w-full bg-primary rounded-t-md"
                          style={{
                            height: `${(day.users / maxSignups) * 100}%`,
                            minHeight: day.users > 0 ? "4px" : "0",
                          }}
                          title={`${day.date}: ${day.users}`}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {day.date.slice(5)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">{t("Mest använda delar av appen")}</h3>
                  {viewsBySection.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("Ingen data än.")}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {viewsBySection.map((row) => (
                      <div key={`${row.section}-${row.action}`}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{t(sectionLabel(row.section))}</span>
                          <span className="text-muted-foreground">
                            {row.events} {t("besök")} · {row.sessions} {t("användare")}
                          </span>
                        </div>
                        <Bar value={row.events} max={maxViews} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">{t("Mest besökta sidor")}</h3>
                  {pageViews.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("Ingen data än.")}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {pageViews.map((row) => (
                      <div key={row.action}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">
                            {t(pageLabel(row.action))}{" "}
                            <span className="text-xs text-muted-foreground">/{row.action}</span>
                          </span>
                          <span className="text-muted-foreground">
                            {row.events} {t("visningar")} · {row.sessions} {t("besökare")}
                          </span>
                        </div>
                        <Bar value={row.events} max={maxPageViews} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    {t("Funktioner som faktiskt används")}
                  </h3>
                  {otherActions.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("Ingen data än.")}</p>
                  )}
                  <div className="divide-y divide-border">
                    {otherActions.map((row) => (
                      <div
                        key={`${row.section}-${row.action}`}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <span>
                          {t(sectionLabel(row.section))} — {t(actionLabel(row.action))}
                        </span>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {row.events} {t("ggr")} · {row.sessions} {t("användare")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <UserAnalytics />
                <AnalyticsExport />
              </div>
            </CollapsibleSection>

            <p className="text-xs text-muted-foreground bg-secondary/40 border border-border rounded-2xl p-3">
              <strong>{t("Integritet:")}</strong>{" "}
              {t(
                "vi mäter bara vilken del av appen som används och vilken typ av handling som sker. Inget användar-id, ingen e-post, ingen IP och inget innehåll (mående, texter, uppgifter) sparas — händelser går inte att koppla till en person.",
              )}
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}
