import { useLang } from "@/hooks/use-language";
import { countRegistrationPlatforms, REGISTRATION_PLATFORMS, REGISTRATION_PLATFORM_LABELS, type RegistrationPlatform } from "@/lib/registration-platform";
import { cn } from "@/lib/utils";

export default function RegistrationPlatformSummary({ users, value, onChange }: {
  users: Array<{ user_id: string; registration_platform: RegistrationPlatform }>;
  value: RegistrationPlatform | "all";
  onChange: (platform: RegistrationPlatform | "all") => void;
}) {
  const { t } = useLang();
  const counts = countRegistrationPlatforms(users);
  return (
    <fieldset className="min-w-0 space-y-3 rounded-2xl border border-border bg-card p-4">
      <legend className="px-1 text-sm font-semibold">{t("Konto skapat via")}</legend>
      <button type="button" aria-pressed={value === "all"} onClick={() => onChange("all")}
        className={cn("min-h-11 rounded-xl border px-3 py-2 text-sm", value === "all" ? "border-primary bg-primary/10" : "border-border")}>
        {t("Alla plattformar")} · {counts.all}
      </button>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {REGISTRATION_PLATFORMS.map(platform => (
          <button key={platform} type="button" aria-pressed={value === platform} onClick={() => onChange(platform)}
            className={cn("min-h-16 min-w-0 rounded-xl border p-3 text-left", value === platform ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/40")}>
            <span className="block text-xl font-semibold">{counts[platform]}</span>{" "}
            <span className="block break-words text-xs text-muted-foreground">{t(REGISTRATION_PLATFORM_LABELS[platform])}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("Visar var kontot skapades. Äldre konton utan sparad plattform visas som Okänd. Samma konto räknas en gång, även om det används på flera enheter.")}</p>
      <p className="text-xs text-muted-foreground">{t("Antalen följer datum- och aktivitetsfiltren och inkluderar även admin- och demokonton. Plattformen visar inte om appen installerades via ett testprogram.")}</p>
    </fieldset>
  );
}
