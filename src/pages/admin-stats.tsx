import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BarChart3, Copy, Lock } from "lucide-react";
import Layout from "@/components/layout";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useLang } from "@/hooks/use-language";
import CollapsibleSection from "@/components/collapsible-section";
import { AccountStatistics, usePilotAccounts } from "@/components/admin/user-funnel";
import UserAnalytics from "@/components/admin/user-analytics";
import AnalyticsExport from "@/components/admin/analytics-export";
import { Button } from "@/components/ui/button";
import { getPilotUsageFn } from "@/lib/pilot-statistics.functions";
import { PILOT_FEATURES, pilotDate, type PilotUsage, type PilotAccounts } from "@/lib/pilot-statistics";

const card = "rounded-3xl border border-border bg-card p-4 sm:p-6 space-y-4";
const rate = (value: number | null) => value === null ? "—" : `${value} %`;

/** Aggregate-only sharing. Account and anonymous browser metrics retain their separate units. */
export function pilotSnapshot(accounts: PilotAccounts, usage: PilotUsage): string {
  return [
    `Paceable – pilotöversikt, ${pilotDate(usage.from)}–${pilotDate(usage.to)} (30 dagar).`,
    `Aktiva externa konton: ${accounts.active30d} senaste 30 dagarna; ${accounts.active7d} senaste 7 dagarna. Admin/demo borträknade. Aktiv = registrerad användning eller inloggning.`,
    `Registrerad kärnanvändning: ${usage.meaningfulBrowsers} anonyma app-/webbläsar-ID.`,
    `Återkommande kärnanvändning på minst två svenska kalenderdagar: ${usage.repeatedBrowsers} av ${usage.meaningfulBrowsers} (${rate(usage.repeatRate)}).`,
    `Märkta interna ID är borträknade (${usage.internalBrowsersExcluded}). ${usage.unknownBrowsers} ID har okänd intern/extern status. ID är inte personer och kan omfatta flera enheter eller återställd lagring.`,
    "Upplevd avlastning och appens egen belastning: enkätsvar är ännu inte anslutna till denna vy. Användningsdata visar inte effekt.",
  ].join("\n");
}

export default function AdminStats() {
  const { isAdmin, loading } = useIsAdmin();
  const { t } = useLang();
  if (loading) return <Layout><p>{t("Laddar…")}</p></Layout>;
  if (!isAdmin) return <Layout><div className="max-w-md mx-auto text-center space-y-3 py-16">
    <Lock size={40} className="mx-auto" /><h1 className="text-2xl font-semibold">{t("Endast för grundaren")}</h1>
    <p>{t("Den här sidan är privat.")}</p>
  </div></Layout>;
  return <Layout><PilotDashboard /></Layout>;
}

export function PilotDashboard() {
  const { t } = useLang();
  const accounts = usePilotAccounts();
  const usage = useQuery({ queryKey: ["pilot-usage"], queryFn: () => getPilotUsageFn() as Promise<PilotUsage>, retry: false });
  const [copyStatus, setCopyStatus] = useState("");
  const data = usage.data;
  async function copySnapshot() {
    if (!accounts.data || !data) return;
    try { await navigator.clipboard.writeText(pilotSnapshot(accounts.data, data)); setCopyStatus(t("Översikten är kopierad.")); }
    catch { setCopyStatus(t("Kunde inte kopiera. Försök igen i en webbläsare med tillgång till urklipp.")); }
  }
  return <div className="min-w-0 max-w-5xl mx-auto space-y-6">
    <header className="space-y-3">
      <Link to="/admin" className="text-sm underline underline-offset-4">{t("Till adminöversikten")}</Link>
      <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2"><BarChart3 size={25} aria-hidden="true" />{t("Paceable i test")}</h1>
      <p className="text-muted-foreground">{t("Kommer stödet till användning, kommer man tillbaka och blir vardagen lättare? Här följer vi pilotens viktigaste frågor.")}</p>
      <p className="text-sm">{t("Senaste 30 dagarna, löpande. Dagindelning: svensk tid.")}{data && ` ${pilotDate(data.from)}–${pilotDate(data.to)}.`}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={copySnapshot} disabled={!accounts.data || !data || accounts.isError || usage.isError}><Copy size={16} className="mr-2" />{t("Kopiera översikt att dela")}</Button>
        <Button variant="outline" onClick={() => { void accounts.refetch(); void usage.refetch(); }} disabled={accounts.isFetching || usage.isFetching}>{t("Uppdatera")}</Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">{copyStatus}</p>
    </header>

    <AccountStatistics {...accounts} className={card} />

    <section className={card} aria-label={t("Kärnanvändning")}>
      <div><h2 className="text-lg font-semibold">{t("Kommer stödet till användning?")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("Registrerade handlingar i planering, genomförande, energi, paus och nästa steg. Sidvisningar och öppnade menyer räknas inte som kärnanvändning.")}</p></div>
      {usage.isLoading && <p role="status">{t("Laddar användningsstatistik…")}</p>}
      {usage.isError && <p role="alert" className="text-destructive">{t("Användningsstatistiken kunde inte hämtas fullständigt. Försök igen senare.")}</p>}
      {data && !usage.isError && <>
        <dl className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-secondary/30 border border-border p-4">
            <dt className="text-sm font-medium">{t("Minst en kärnhandling · 30 dagar")}</dt><dd className="text-3xl font-semibold my-1">{data.meaningfulBrowsers}</dd>
            <p className="text-xs text-muted-foreground">{t("Anonyma app-/webbläsar-ID. Samma ID räknas en gång, även med många handlingar.")}</p>
          </div>
          <div className="rounded-2xl bg-secondary/30 border border-border p-4">
            <dt className="text-sm font-medium">{t("Återkommande kärnanvändning · 30 dagar")}</dt><dd className="text-3xl font-semibold my-1">{rate(data.repeatRate)}</dd>
            <p className="text-xs text-muted-foreground">{data.repeatedBrowsers} {t("av")} {data.meaningfulBrowsers} {t("ID har gjort kärnhandlingar på minst två kalenderdagar. Nya ID har kortare tid att hinna återkomma. Detta är inte D7-retention.")}</p>
          </div>
        </dl>
        {data.meaningfulBrowsers === 0 && <p className="text-sm">{t("Inga kärnhandlingar har registrerats under perioden. Det betyder inte säkert att ingen har använt appen.")}</p>}
        <p className="text-sm text-muted-foreground">{t("En person kan ha flera ID, och ett ID kan delas eller återställas. Siffrorna får därför inte läggas ihop med kontosiffrorna. Avstängd analys och äldre appversioner kan ge luckor.")}</p>
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{t("Vilket stöd används? · unika ID per del")}</h3>
          {PILOT_FEATURES.map(feature => {
            const count = data.features.find(row => row.id === feature.id)?.browsers ?? 0;
            return <div key={feature.id} className="space-y-1">
              <div className="flex justify-between gap-3 text-sm"><span className="font-medium">{t(feature.label)}</span><span>{count} {t("av")} {data.meaningfulBrowsers}</span></div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden" aria-hidden="true"><div className="h-full bg-primary rounded-full" style={{ width: `${data.meaningfulBrowsers ? count / data.meaningfulBrowsers * 100 : 0}%` }} /></div>
              <p className="text-xs text-muted-foreground">{t(feature.detail)}</p>
            </div>;
          })}
          <p className="text-xs text-muted-foreground">{t("Ett ID kan finnas i flera delar. Delarna är inte en tratt och ska inte summeras till antal användare. Måtten visar registrerad användning, inte om stödet hjälpte.")}</p>
        </div>
        <details>
          <summary className="cursor-pointer min-h-11 flex items-center text-sm underline underline-offset-4">{t("Visa daglig användning och mätunderlag")}</summary>
          <p className="text-xs text-muted-foreground my-2">{t("Unika ID med kärnhandling per dag, senaste 14 kalenderdagarna. Dagens värde är ännu inte en hel dag.")}</p>
          <table className="w-full text-sm"><thead><tr className="text-left"><th className="py-2">{t("Datum")}</th><th className="text-right">{t("ID med kärnhandling")}</th></tr></thead><tbody>
            {data.daily.map(row => <tr key={row.date} className="border-t border-border"><td className="py-1">{row.date}</td><td className="text-right">{row.browsers}</td></tr>)}
          </tbody></table>
          <p className="text-xs mt-3 text-muted-foreground">{data.internalBrowsersExcluded} {t("märkta interna ID är borträknade.")} {data.unknownBrowsers} {t("av")} {data.browsers} {t("kvarvarande ID har okänd intern/extern status. De ingår, men är inte verifierade externa testare. Märk din egen webbläsare som intern under Granskning och export.")}</p>
          {data.unidentifiedEvents > 0 && <p className="text-xs mt-2 text-muted-foreground">{data.unidentifiedEvents} {t("händelser saknar ett beständigt ID och är undantagna från ID-måtten.")}</p>}
        </details>
        <div className="rounded-2xl border border-border p-4 space-y-2">
          <h3 className="font-semibold text-sm">{t("Finns friktion i energiincheckningen?")}</h3>
          <p className="text-lg font-semibold">{rate(data.energyCheckin.completionRate)} · {data.energyCheckin.completedAfterStart} {t("av")} {data.energyCheckin.started} {t("ID med registrerad start")}</p>
          <p className="text-xs text-muted-foreground">{t("Har både start och slutförd incheckning i rätt ordning inom 30 minuter, under perioden. Varje ID räknas en gång. Det är inte en andel lyckade försök: samma ID kan ha flera försök, och vissa ingångar saknar starthändelse. Uteblivet klart visar inte säkert ett avbrott.")}</p>
        </div>
      </>}
    </section>

    <section className={card} aria-label={t("Upplevd nytta")}>
      <div><h2 className="text-lg font-semibold">{t("Blir vardagen lättare?")}</h2><p className="text-sm text-muted-foreground mt-1">{t("Detta behöver vi fråga testarna om. Enkätsvar är ännu inte anslutna till denna vy.")}</p></div>
      <p className="w-full min-w-0 rounded-2xl bg-secondary px-3 py-2 text-xs font-medium">{t("Upplevd nytta · underlag saknas här")}</p>
      <p className="text-sm">{t("Veckopuls enligt testprotokollet, frivilligt och med samma skala 1–5:")}</p>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        <li>{t("Paceable hjälpte mig att få överblick denna vecka.")}</li>
        <li>{t("Paceable minskade min upplevda mentala belastning.")}</li>
        <li>{t("Att använda Paceable kändes som ytterligare en uppgift.")}</li>
      </ul>
      <p className="text-sm text-muted-foreground">{t("Redovisa varje fråga separat med antal svar av antal inbjudna och svarens fördelning. Jämför de fem identiska före-/efterfrågorna inom samma deltagare när T0 och T1 finns. Uteblivna svar är inte negativa svar.")}</p>
      <p className="text-sm text-muted-foreground">{t("Användning och återkomst är beteendesignaler. De visar inte minskad belastning eller att appen orsakat en förbättring. Målvärden behöver bestämmas före nästa mätperiod.")}</p>
    </section>

    <CollapsibleSection title={t("Granskning och export")} defaultCollapsed className={card}
      description={t("Detaljer för felsökning, internmärkning och historik. Exporterna nedan har egna periodval och ska inte blandas med pilotöversiktens 30 dagar.")}>
      <UserAnalytics />
      <AnalyticsExport />
    </CollapsibleSection>
    <p className="text-xs text-muted-foreground">{t("Underlag: kontons registrerings- och aktivitetsuppgifter samt anonyma händelsetyper. Översikten läser inga privata planer, energivärden, meddelanden eller fritextsvar. Ingen ny spårning eller kontokoppling införs.")}</p>
  </div>;
}
