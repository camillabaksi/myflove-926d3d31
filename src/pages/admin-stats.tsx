import Layout from "@/components/layout";
import { useGetAnalyticsSummary } from "@workspace/api-client-react";
import { BarChart3, Users, Activity, Flame, Lock } from "lucide-react";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useLang } from "@/hooks/use-language";
import CollapsibleSection from "@/components/collapsible-section";
import AnalyticsExport from "@/components/admin/analytics-export";
import UserAnalytics from "@/components/admin/user-analytics";
import { actionLabel, pageLabel, sectionLabel } from "@/lib/analytics-labels";

export default function AdminStats() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { t } = useLang();
  const { data, isLoading, isError } = useGetAnalyticsSummary();

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
          <h1 className="text-2xl font-bold">{t("Endast för grundaren")}</h1>
          <p className="text-muted-foreground">{t("Den här sidan är privat.")}</p>
        </div>
      </Layout>
    );
  }

  const viewsBySection = (data?.featureUsage ?? [])
    .filter((row) => row.action === "view" && row.section !== "page")
    .sort((a, b) => b.events - a.events);

  const pageViews = (data?.featureUsage ?? [])
    .filter((row) => row.section === "page")
    .sort((a, b) => b.events - a.events);

  const otherActions = (data?.featureUsage ?? [])
    .filter((row) => row.action !== "view" && row.section !== "page")
    .sort((a, b) => b.events - a.events);

  // Energi, Påverkan & Flow – nyckelhändelser samlade på ett ställe.
  const usage = data?.featureUsage ?? [];
  const findUsage = (section: string, action: string) =>
    usage.find((row) => row.section === section && row.action === action);
  const sumSection = (sections: string[]) =>
    usage
      .filter((row) => sections.includes(row.section))
      .reduce(
        (acc, row) => ({ events: acc.events + row.events, sessions: acc.sessions + row.sessions }),
        { events: 0, sessions: 0 },
      );
  const energyFlowStats = [
    { label: t("Påverkan registrerad"), ...findUsage("batteri", "impact_logged") },
    { label: t("Energi loggad"), ...findUsage("batteri", "battery_logged") },
    { label: t("Mående loggat"), ...findUsage("mood", "mood_logged") },
    { label: t("Hälsofaktor loggad"), ...findUsage("halsa", "health_factor_logged") },
    {
      label: t("Energipåverkan efter aktivitet"),
      ...findUsage("energi", "activity_energy_logged"),
    },
    { label: t("Flow totalt"), ...sumSection(["flow", "flowplan"]) },
  ].map((row) => ({ label: row.label, events: row.events ?? 0, sessions: row.sessions ?? 0 }));
  const maxEnergyFlow = Math.max(1, ...energyFlowStats.map((row) => row.events));

  const maxViews = Math.max(1, ...viewsBySection.map((row) => row.events));
  const maxPageViews = Math.max(1, ...pageViews.map((row) => row.events));
  const maxDaily = Math.max(1, ...(data?.dailyActiveSessions ?? []).map((d) => d.sessions));
  const maxSignups = Math.max(1, ...(data?.dailySignups ?? []).map((d) => d.users));

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BarChart3 className="text-primary" /> {t("Appstatistik")}
          </h1>
          <p className="text-muted-foreground">
            {t("Anonym, sammanslagen statistik om hur MyFlove används.")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground bg-secondary/40 border border-border rounded-2xl p-3">
            <strong>{t("Integritet:")}</strong>{" "}
            {t(
              "vi mäter bara vilken del av appen som används och vilken typ av handling som sker. Inget användar-id, ingen e-post, ingen IP och inget innehåll (mående, texter, uppgifter) sparas — händelser går inte att koppla till en person.",
            )}
          </p>
        </div>

        <UserAnalytics />

        <AnalyticsExport />

        {isLoading && <p className="text-muted-foreground">{t("Laddar statistik…")}</p>}
        {isError && <p className="text-destructive">{t("Kunde inte hämta statistik just nu.")}</p>}

        {data && (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] md:grid-cols-3 gap-4">
              <div className="bg-card p-5 rounded-3xl border-2 border-border shadow-sm space-y-1">
                <Users size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.totalUsers ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t("Registrerade användare")}</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border-2 border-border shadow-sm space-y-1">
                <Users size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.newUsers7d ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t("Nya senaste 7 dagarna")}</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border-2 border-border shadow-sm space-y-1">
                <Activity size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.totalSessions}</p>
                <p className="text-xs text-muted-foreground">{t("Besökare (30 d)")}</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border-2 border-border shadow-sm space-y-1">
                <Activity size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.activeSessions1d}</p>
                <p className="text-xs text-muted-foreground">{t("Aktiva idag")}</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border-2 border-border shadow-sm space-y-1">
                <Activity size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.activeSessions7d}</p>
                <p className="text-xs text-muted-foreground">{t("Aktiva senaste 7 dagarna")}</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border-2 border-border shadow-sm space-y-1">
                <Flame size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.activeSessions30d}</p>
                <p className="text-xs text-muted-foreground">{t("Aktiva senaste 30 dagarna")}</p>
              </div>
            </div>

            <CollapsibleSection
              title={t("Nyckeltal vi mäter")}
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
              description={t(
                "Sammanslagna mått som visar om appen faktiskt hjälper — helt utan personlig data.",
              )}
            >
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] md:grid-cols-3 gap-4">
                {[
                  {
                    label: t("Händelser per besökare"),
                    value: `${data.avgEventsPerSession ?? 0}`,
                    hint: t("Hur mycket appen används per person"),
                  },
                  {
                    label: t("Återkommer"),
                    value: `${data.returningRate ?? 0}%`,
                    hint: t("Andel som använt appen fler än en dag"),
                  },
                  {
                    label: t("Dagligt bruk (DAU/MAU)"),
                    value: `${data.stickiness ?? 0}%`,
                    hint: t("Hur ofta månadens användare är inne i dag"),
                  },
                  {
                    label: t("Delar per besökare"),
                    value: `${data.avgSectionsPerSession ?? 0}`,
                    hint: t("Hur brett appen används"),
                  },
                  {
                    label: t("Gör något"),
                    value: `${data.actionRate ?? 0}%`,
                    hint: t("Andel som gör en handling, inte bara tittar"),
                  },
                  {
                    label: t("Händelser (30 d)"),
                    value: `${data.totalEvents ?? 0}`,
                    hint: t("Totalt antal mätpunkter"),
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-1"
                  >
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-sm font-medium">{kpi.label}</p>
                    <p className="text-xs text-muted-foreground">{kpi.hint}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={t("Dagliga loopen: Fånga → Planera → Göra → Reflektera")}
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
              description={t("Hur många anonyma besökare som når varje steg i MyFloves kärnflöde.")}
            >
              <div className="space-y-3">
                {(data.coreLoop ?? []).map((step) => {
                  const max = Math.max(1, ...(data.coreLoop ?? []).map((s) => s.sessions));
                  return (
                    <div key={step.step}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{step.step}</span>
                        <span className="text-muted-foreground">
                          {step.sessions} {t("besökare")}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(step.sessions / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={t("Energi, Påverkan & Flow")}
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
              description={t(
                "Hur ofta användare loggar energi, mående, påverkan och använder Flow.",
              )}
            >
              <div className="space-y-3">
                {energyFlowStats.map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{row.label}</span>
                      <span className="text-muted-foreground">
                        {row.events} {t("gånger")} · {row.sessions} {t("besökare")}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(row.events / maxEnergyFlow) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={t("Händelser per dag (senaste 14 dagarna)")}
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
            >
              <div className="flex items-end gap-1.5 h-32">
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
                      <span className="text-[9px] text-muted-foreground">{day.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={t("Nya registreringar (senaste 14 dagarna)")}
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
            >
              {(data.dailySignups ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">{t("Ingen data än.")}</p>
              )}
              <div className="flex items-end gap-1.5 h-32">
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
                    <span className="text-[9px] text-muted-foreground">{day.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={t("Mest använda delar av appen")}
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
            >
              {viewsBySection.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("Ingen data än.")}</p>
              )}
              <div className="space-y-3">
                {viewsBySection.map((row) => (
                  <div key={`${row.section}-${row.action}`}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{t(sectionLabel(row.section))}</span>
                      <span className="text-muted-foreground">
                        {row.events} {t("besök")} · {row.sessions} {t("användare")}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(row.events / maxViews) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={t("Mest besökta sidor")}
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
              description={t(
                "Varje sidvisning i appen loggas anonymt — här ser du vilka sidor besökarna faktiskt öppnar.",
              )}
            >
              {pageViews.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("Ingen data än.")}</p>
              )}
              <div className="space-y-3">
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
                    <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(row.events / maxPageViews) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={t("Funktioner som faktiskt används")}
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
              description={t(
                "Konkreta handlingar (inte bara besök) — visar vad som fungerar bra och vad som knappt rörs.",
              )}
            >
              {otherActions.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("Ingen data än.")}</p>
              )}
              <div className="divide-y divide-border">
                {otherActions.map((row) => (
                  <div
                    key={`${row.section}-${row.action}`}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span>
                      {t(sectionLabel(row.section))} — {t(actionLabel(row.action))}
                    </span>
                    <span className="text-muted-foreground">
                      {row.events} {t("ggr")} · {row.sessions} {t("användare")}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={t("Aktiva användare per dag (senaste 14 dagarna)")}
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
            >
              {(data.dailyActiveSessions ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">{t("Ingen data än.")}</p>
              )}
              <div className="flex items-end gap-1.5 h-32">
                {data.dailyActiveSessions.map((day) => (
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
                    <span className="text-[9px] text-muted-foreground rotate-0">
                      {day.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </>
        )}
      </div>
    </Layout>
  );
}
