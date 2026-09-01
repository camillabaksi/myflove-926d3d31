import Layout from "@/components/layout";
import { useGetAnalyticsSummary } from "@workspace/api-client-react";
import { BarChart3, Users, Activity, Flame, Lock } from "lucide-react";
import { useIsAdmin } from "@/hooks/use-is-admin";
import CollapsibleSection from "@/components/collapsible-section";
import AnalyticsExport from "@/components/admin/analytics-export";

const SECTION_LABELS: Record<string, string> = {
  page: "Sidvisning",
  mood: "Mående",
  dump: "Dumping",
  calendar: "Kalender",
  fokus: "Fokus",
  tasks: "Att göra",
  pomodoro: "Timer",
  medicin: "Medicin",
  shopping: "Inköp",
  finances: "Ekonomi",
  travel: "Resor",
  statistik: "Statistik",
  beloningar: "Belöningar",
  assistant: "Hjälp",
  admin: "Appstatistik",
};

const ACTION_LABELS: Record<string, string> = {
  view: "Besök",
  task_completed: "Uppgift klar",
  item_bought: "Vara köpt",
  mood_logged: "Mående loggat",
  transaction_added: "Transaktion tillagd",
  reminder_added: "Påminnelse tillagd",
  dose_taken: "Dos tagen",
  idea_saved: "Idé sparad",
  session_completed: "Pass klart",
};

function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? section;
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export default function AdminStats() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { data, isLoading, isError } = useGetAnalyticsSummary();

  if (adminLoading) {
    return (
      <Layout>
        <p className="text-muted-foreground">Laddar…</p>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center space-y-3 py-16">
          <Lock size={40} className="mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Endast för grundaren</h1>
          <p className="text-muted-foreground">Den här sidan är privat.</p>
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

  const maxViews = Math.max(1, ...viewsBySection.map((row) => row.events));
  const maxPageViews = Math.max(1, ...pageViews.map((row) => row.events));
  const maxDaily = Math.max(1, ...(data?.dailyActiveSessions ?? []).map((d) => d.sessions));
  const maxSignups = Math.max(1, ...(data?.dailySignups ?? []).map((d) => d.users));

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BarChart3 className="text-primary" /> Appstatistik
          </h1>
          <p className="text-muted-foreground">
            Anonym, sammanslagen statistik om hur MyFlove används.
          </p>
          <p className="mt-2 text-xs text-muted-foreground bg-secondary/40 border border-border rounded-2xl p-3">
            <strong>Integritet:</strong> vi mäter bara vilken del av appen som används och vilken
            typ av handling som sker. Inget användar-id, ingen e-post, ingen IP och inget innehåll
            (mående, texter, uppgifter) sparas — händelser går inte att koppla till en person.
          </p>
        </div>

        <AnalyticsExport />

        {isLoading && <p className="text-muted-foreground">Laddar statistik…</p>}
        {isError && <p className="text-destructive">Kunde inte hämta statistik just nu.</p>}

        {data && (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] md:grid-cols-3 gap-4">
              <div className="bg-card p-5 rounded-3xl border-2 border-border shadow-sm space-y-1">
                <Users size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.totalUsers ?? 0}</p>
                <p className="text-xs text-muted-foreground">Registrerade användare</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border-2 border-border shadow-sm space-y-1">
                <Users size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.newUsers7d ?? 0}</p>
                <p className="text-xs text-muted-foreground">Nya senaste 7 dagarna</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border-2 border-border shadow-sm space-y-1">
                <Activity size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Besökare (30 d)</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border-2 border-border shadow-sm space-y-1">
                <Activity size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.activeSessions1d}</p>
                <p className="text-xs text-muted-foreground">Aktiva idag</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border-2 border-border shadow-sm space-y-1">
                <Activity size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.activeSessions7d}</p>
                <p className="text-xs text-muted-foreground">Aktiva senaste 7 dagarna</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border-2 border-border shadow-sm space-y-1">
                <Flame size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.activeSessions30d}</p>
                <p className="text-xs text-muted-foreground">Aktiva senaste 30 dagarna</p>
              </div>
            </div>

            <CollapsibleSection
              title="Nyckeltal vi mäter"
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
              description="Sammanslagna mått som visar om appen faktiskt hjälper — helt utan personlig data."
            >
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] md:grid-cols-3 gap-4">
                {[
                  {
                    label: "Händelser per besökare",
                    value: `${data.avgEventsPerSession ?? 0}`,
                    hint: "Hur mycket appen används per person",
                  },
                  {
                    label: "Återkommer",
                    value: `${data.returningRate ?? 0}%`,
                    hint: "Andel som använt appen fler än en dag",
                  },
                  {
                    label: "Dagligt bruk (DAU/MAU)",
                    value: `${data.stickiness ?? 0}%`,
                    hint: "Hur ofta månadens användare är inne i dag",
                  },
                  {
                    label: "Delar per besökare",
                    value: `${data.avgSectionsPerSession ?? 0}`,
                    hint: "Hur brett appen används",
                  },
                  {
                    label: "Gör något",
                    value: `${data.actionRate ?? 0}%`,
                    hint: "Andel som gör en handling, inte bara tittar",
                  },
                  {
                    label: "Händelser (30 d)",
                    value: `${data.totalEvents ?? 0}`,
                    hint: "Totalt antal mätpunkter",
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
              title="Dagliga loopen: Fånga → Planera → Göra → Reflektera"
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
              description="Hur många anonyma besökare som når varje steg i MyFloves kärnflöde."
            >
              <div className="space-y-3">
                {(data.coreLoop ?? []).map((step) => {
                  const max = Math.max(1, ...(data.coreLoop ?? []).map((s) => s.sessions));
                  return (
                    <div key={step.step}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{step.step}</span>
                        <span className="text-muted-foreground">{step.sessions} besökare</span>
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
              title="Händelser per dag (senaste 14 dagarna)"
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
              title="Nya registreringar (senaste 14 dagarna)"
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
            >
              {(data.dailySignups ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Ingen data än.</p>
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
              title="Mest använda delar av appen"
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
            >
              {viewsBySection.length === 0 && (
                <p className="text-sm text-muted-foreground">Ingen data än.</p>
              )}
              <div className="space-y-3">
                {viewsBySection.map((row) => (
                  <div key={`${row.section}-${row.action}`}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{sectionLabel(row.section)}</span>
                      <span className="text-muted-foreground">
                        {row.events} besök · {row.sessions} användare
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
              title="Mest besökta sidor"
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
              description="Varje sidvisning i appen loggas anonymt — här ser du vilka sidor besökarna faktiskt öppnar."
            >
              {pageViews.length === 0 && (
                <p className="text-sm text-muted-foreground">Ingen data än.</p>
              )}
              <div className="space-y-3">
                {pageViews.map((row) => (
                  <div key={row.action}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">/{row.action}</span>
                      <span className="text-muted-foreground">
                        {row.events} visningar · {row.sessions} besökare
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
              title="Funktioner som faktiskt används"
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
              description="Konkreta handlingar (inte bara besök) — visar vad som fungerar bra och vad som knappt rörs."
            >
              {otherActions.length === 0 && (
                <p className="text-sm text-muted-foreground">Ingen data än.</p>
              )}
              <div className="divide-y divide-border">
                {otherActions.map((row) => (
                  <div
                    key={`${row.section}-${row.action}`}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span>
                      {sectionLabel(row.section)} — {actionLabel(row.action)}
                    </span>
                    <span className="text-muted-foreground">
                      {row.events} ggr · {row.sessions} användare
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Aktiva användare per dag (senaste 14 dagarna)"
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border-2 border-border shadow-sm"
            >
              {(data.dailyActiveSessions ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Ingen data än.</p>
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
