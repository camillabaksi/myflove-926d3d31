import Layout from "@/components/layout";
import { useGetAnalyticsSummary } from "@workspace/api-client-react";
import { BarChart3, Users, Activity, Flame, Lock } from "lucide-react";
import { useIsAdmin } from "@/hooks/use-is-admin";
import CollapsibleSection from "@/components/collapsible-section";

const SECTION_LABELS: Record<string, string> = {
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
    .filter((row: any) => row.action === "view")
    .sort((a: any, b: any) => b.events - a.events);

  const otherActions = (data?.featureUsage ?? [])
    .filter((row: any) => row.action !== "view")
    .sort((a: any, b: any) => b.events - a.events);

  const maxViews = Math.max(1, ...viewsBySection.map((row: any) => row.events));
  const maxDaily = Math.max(1, ...(data?.dailyActiveSessions ?? []).map((d: any) => d.sessions));
  const maxSignups = Math.max(1, ...(data?.dailySignups ?? []).map((d: any) => d.users));

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BarChart3 className="text-primary" /> Appstatistik
          </h1>
          <p className="text-muted-foreground">
            Anonym, sammanslagen statistik om hur MyFlove används — ingen personlig data (mående, texter osv) ingår.
          </p>
        </div>

        {isLoading && <p className="text-muted-foreground">Laddar statistik…</p>}
        {isError && <p className="text-destructive">Kunde inte hämta statistik just nu.</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-1">
                <Users size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.totalUsers ?? 0}</p>
                <p className="text-xs text-muted-foreground">Registrerade användare</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-1">
                <Users size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.newUsers7d ?? 0}</p>
                <p className="text-xs text-muted-foreground">Nya senaste 7 dagarna</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-1">
                <Activity size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Besökare (30 d)</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-1">
                <Activity size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.activeSessions1d}</p>
                <p className="text-xs text-muted-foreground">Aktiva idag</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-1">
                <Activity size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.activeSessions7d}</p>
                <p className="text-xs text-muted-foreground">Aktiva senaste 7 dagarna</p>
              </div>
              <div className="bg-card p-5 rounded-3xl border border-border shadow-sm space-y-1">
                <Flame size={20} className="text-primary" />
                <p className="text-2xl font-bold">{data.activeSessions30d}</p>
                <p className="text-xs text-muted-foreground">Aktiva senaste 30 dagarna</p>
              </div>
            </div>

            <CollapsibleSection
              title="Nya registreringar (senaste 14 dagarna)"
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border border-border shadow-sm"
            >
              {(data.dailySignups ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Ingen data än.</p>
              )}
              <div className="flex items-end gap-1.5 h-32">
                {(data.dailySignups ?? []).map((day: any) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <div
                      className="w-full bg-primary rounded-t-md"
                      style={{ height: `${(day.users / maxSignups) * 100}%`, minHeight: day.users > 0 ? "4px" : "0" }}
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
              className="bg-card p-6 rounded-3xl border border-border shadow-sm"
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
              title="Funktioner som faktiskt används"
              headingClassName="text-lg font-semibold"
              className="bg-card p-6 rounded-3xl border border-border shadow-sm"
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
              className="bg-card p-6 rounded-3xl border border-border shadow-sm"
            >
              {(data.dailyActiveSessions ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Ingen data än.</p>
              )}
              <div className="flex items-end gap-1.5 h-32">
                {data.dailyActiveSessions.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <div
                      className="w-full bg-primary rounded-t-md"
                      style={{ height: `${(day.sessions / maxDaily) * 100}%`, minHeight: day.sessions > 0 ? "4px" : "0" }}
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
