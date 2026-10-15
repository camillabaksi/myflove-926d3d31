import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { getUserFunnelFn } from "@/lib/user-funnel.functions";
import type { PilotAccounts } from "@/lib/pilot-statistics";
import { REGISTRATION_PLATFORMS, REGISTRATION_PLATFORM_LABELS } from "@/lib/registration-platform";
import { useLang } from "@/hooks/use-language";

export function usePilotAccounts() {
  return useQuery({ queryKey: ["pilot-accounts"], queryFn: () => getUserFunnelFn() as Promise<PilotAccounts>, retry: false });
}

export function AccountStatistics({ data, isLoading, isError, className }: {
  data?: PilotAccounts; isLoading: boolean; isError: boolean; className?: string;
}) {
  const { t } = useLang();
  return (
    <section className={className} aria-label={t("Aktiva konton")}>
      <h2 className="text-lg font-semibold flex items-center gap-2"><Users size={18} aria-hidden="true" />{t("Vilka använder Paceable?")}</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{t("Unika konton med registrerad användning eller inloggning. Admin och demo är borträknade. Det här är inte ett mått på bekräftade pilotdeltagare.")}</p>
      {isLoading && <p role="status">{t("Laddar kontostatistik…")}</p>}
      {isError && <p role="alert" className="text-destructive">{t("Kontostatistiken kunde inte hämtas. Inga nollvärden visas när underlaget saknas.")}</p>}
      {data && !isError && <>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Aktiva · 30 dagar", value: data.active30d, help: "Alla externa konton med observerad aktivitet under perioden." },
            { label: "Aktiva · 7 dagar", value: data.active7d, help: "Den del av 30-dagarsgruppen som varit aktiv senaste veckan." },
            { label: "Nya och aktiva · 7 dagar", value: data.newActive7d, help: "Skapat konto och registrerat aktivitet senaste veckan. Registrering ensam räknas inte." },
          ].map(row => <div key={row.label} className="rounded-2xl border border-border bg-secondary/30 p-4">
            <dt className="text-sm font-medium">{t(row.label)}</dt><dd className="text-3xl font-semibold my-1">{row.value}</dd>
            <p className="text-xs text-muted-foreground">{t(row.help)}</p>
          </div>)}
        </dl>
        <h3 className="text-sm font-semibold mt-5 mb-2">{t("Var skapades de aktiva kontona?")}</h3>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REGISTRATION_PLATFORMS.map(platform => <div key={platform} className="rounded-xl border border-border p-3">
            <dt className="text-xs text-muted-foreground">{t(REGISTRATION_PLATFORM_LABELS[platform])}</dt>
            <dd className="text-xl font-semibold">{data.platforms[platform]}</dd>
          </div>)}
        </dl>
        <p className="text-xs text-muted-foreground mt-2">{t("Samma 30-dagarsgrupp som ovan, ett konto per plattform. Äldre konton utan uppgift visas som Okänd. Ursprung vid registrering visar inte TestFlight-/Play-teststatus eller vilken enhet som används nu.")}</p>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer min-h-11 flex items-center underline underline-offset-4">{t("Visa kontohistorik och avgränsning")}</summary>
          <dl className="grid gap-2 py-2">
            <div className="flex justify-between gap-3"><dt>{t("Registrerade externa konton totalt")}</dt><dd>{data.history.registered}</dd></div>
            <div className="flex justify-between gap-3"><dt>{t("Utan registrerad aktivitet senaste 30 dagarna")}</dt><dd>{data.history.inactive}</dd></div>
            <div className="flex justify-between gap-3"><dt>{t("Admin- och demokonton, undantagna")}</dt><dd>{data.history.internal}</dd></div>
          </dl>
          <p className="text-xs text-muted-foreground">{t("Inaktiva konton räknas inte i översikten och ändras eller raderas inte. Användare & roller inkluderar däremot admin och demo för administration. Utan aktivitetsobservation vet vi inte om kontot har använts.")}</p>
        </details>
      </>}
    </section>
  );
}

export default function UserFunnelCard({ className }: { className?: string }) {
  const query = usePilotAccounts();
  return <AccountStatistics {...query} className={className} />;
}
