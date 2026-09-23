import { Link } from "wouter";
import { BatteryMedium } from "lucide-react";

import { useFamilyLoad } from "@/hooks/use-family-load";
import { useLang } from "@/hooks/use-language";

/**
 * "Vad kräver dig idag?" – familjens åtaganden sedda genom förälderns
 * befintliga batteri. Inga energivärden på barnens aktiviteter.
 */
export default function FamilyLoadCard({ className = "" }: { className?: string }) {
  const { t } = useLang();
  const load = useFamilyLoad();

  return (
    <section className={`space-y-3 rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5 ${className}`}>
      <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
        <BatteryMedium size={18} aria-hidden /> {t("Vad kräver dig idag?")}
      </h2>
      <p className="text-sm text-ink">{t(load.headline)}</p>
      <p className="text-sm text-muted-foreground">{t(load.summaryLine)}</p>

      {load.upcoming.length > 0 && (
        <ul className="space-y-1.5">
          {load.upcoming.slice(0, 4).map((item) => (
            <li key={`${item.time}-${item.title}`} className="text-sm text-ink">
              <span className="font-medium">{item.time}</span> {item.title}
              <span className="text-muted-foreground"> · {item.childName}</span>
              {(item.prepMinutes || item.travelMinutes) && (
                <span className="text-muted-foreground">
                  {" · "}
                  {item.prepMinutes ? `${t("förberedelse")} ${item.prepMinutes} min` : ""}
                  {item.prepMinutes && item.travelMinutes ? " · " : ""}
                  {item.travelMinutes ? `${t("resa")} ${item.travelMinutes} min` : ""}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {load.patternNote && <p className="text-xs text-muted-foreground">{t(load.patternNote)}</p>}

      {load.suggestion && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/flow"
            className="press min-h-11 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {t("Prata med Flow")}
          </Link>
          <Link
            href="/aterhamtning"
            className="press min-h-11 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-ink"
          >
            {t("Hitta återhämtning")}
          </Link>
        </div>
      )}
      {load.suggestion && <p className="text-xs text-muted-foreground">{t(load.suggestion)}</p>}
    </section>
  );
}
