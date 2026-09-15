import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { getUserFunnelFn, type UserFunnel } from "@/lib/user-funnel.functions";
import { useLang } from "@/hooks/use-language";

/**
 * Kontobaserad användarstatistik med tydliga definitioner. Räknar personer
 * (konton), inte webbläsare. Interna konton (grundare + demo) räknas bort.
 */
export default function UserFunnelCard({ className }: { className?: string }) {
  const { t } = useLang();
  const { data, isLoading, isError } = useQuery<UserFunnel>({
    queryKey: ["user-funnel"],
    queryFn: () => getUserFunnelFn() as Promise<UserFunnel>,
    retry: false,
  });

  const rows = data
    ? [
        {
          label: t("Aktiva användare · senaste 30 dagarna"),
          value: data.active30d,
          help: t(
            "Konton som både loggat in de senaste 30 dagarna och har egen sparad data. Enbart ett sidbesök räknas inte.",
          ),
          primary: true,
        },
        {
          label: t("Aktiva användare · senaste 7 dagarna"),
          value: data.active7d,
          help: t("Samma definition, men inloggning inom 7 dagar."),
        },
        {
          label: t("Med egen data"),
          value: data.withData,
          help: t(
            "Konton med riktigt innehåll: uppgifter, rutiner, energi, mående, anteckningar, barn med mera. Teknisk state och onboarding räknas inte.",
          ),
        },
        {
          label: t("Aktiverade"),
          value: data.activated,
          help: t("Konton som loggat in minst en gång."),
        },
        {
          label: t("Registrerade"),
          value: data.registered,
          help: t("Alla externa konton, oavsett om de använts."),
        },
        {
          label: t("Nya senaste 7 dagarna"),
          value: data.new7d,
          help: t("Konton skapade den senaste veckan."),
        },
        {
          label: t("Aldrig inloggade"),
          value: data.neverSignedIn,
          help: t("Registrerade men aldrig aktiverade konton."),
        },
        {
          label: t("Inloggade utan egen data"),
          value: data.signedInNoData,
          help: t("Har loggat in men har inget eget innehåll sparat."),
        },
        {
          label: t("Test/interna konton"),
          value: data.internal,
          help: t(
            "Grundar-, admin- och demokonto. Redovisas separat och ingår inte i siffrorna ovan.",
          ),
        },
      ]
    : [];

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
        <Users size={18} className="text-primary" /> {t("Användare (konton)")}
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        {t("Räknar personer med konto — inte webbläsare eller enheter.")}
      </p>

      {isLoading && <p className="text-muted-foreground text-sm">{t("Laddar…")}</p>}
      {isError && (
        <p className="text-destructive text-sm">{t("Kunde inte hämta användarstatistik just nu.")}</p>
      )}

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((row) => (
            <div
              key={row.label}
              title={row.help}
              className={`rounded-2xl border p-3 ${
                row.primary ? "border-primary bg-primary/10" : "border-border bg-secondary/30"
              }`}
            >
              <p className="text-2xl font-bold">{row.value}</p>
              <p className="text-xs font-medium text-foreground break-words">{row.label}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{row.help}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
