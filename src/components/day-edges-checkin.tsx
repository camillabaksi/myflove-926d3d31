import { useEffect, useState } from "react";
import { Moon, Sunrise, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { isSameDay } from "@/lib/energy-flow";
import CollapsibleSection from "@/components/collapsible-section";
import { useDayWindow } from "@/hooks/use-day-window";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/use-language";

/**
 * Morgon och kväll – du fyller själv i när morgonen startar, när dagen
 * slutar och hur energin upplevs vid två tidpunkter. Morgonvärdet kan
 * vara batteriets baslinje; kvällsvärdet är en separat reflektion.
 */
export default function DayEdgesCheckin({ className }: { className?: string }) {
  const { t } = useLang();
  const { window: win, setWindow, todayEdges, setMorning, setEvening } = useDayWindow();
  const { entries } = useEnergyFlow();
  const todayActivities = entries.filter(e => isSameDay(e.occurredAt)).sort((a,b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
  const [morning, setMorningValue] = useState<number>(todayEdges.morning ?? 5);
  const [evening, setEveningValue] = useState<number>(todayEdges.evening ?? 5);

  useEffect(() => {
    if (todayEdges.morning != null) setMorningValue(todayEdges.morning);
    if (todayEdges.evening != null) setEveningValue(todayEdges.evening);
  }, [todayEdges.morning, todayEdges.evening]);

  const save = (kind: "morning" | "evening") => {
    if (kind === "morning") setMorning(morning);
    else setEvening(evening);
    track("battery_checkin_completed", {
      source: kind === "morning" ? "morgonstart" : "dagens-slut",
      method: "slider",
      result: "completed",
    });
  };

  return (
    <section
      aria-label={t("Din energiresa")}
      className={cn(
        "pace-surface space-y-3 rounded-3xl p-4 shadow-[0_6px_22px_-12px_rgba(81,38,84,0.22)] sm:p-5",
        className,
      )}
    >
      <CollapsibleSection
        id="morgon-och-kvall"
        title={t("Din energiresa")}
        headingClassName="font-sans text-base font-semibold text-ink"
        className="space-y-3"
      >
        <p className="text-sm text-ink">
          {t("Följ din energi från morgon till kväll och se vad som gav eller tog energi.")}
        </p>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            {t("Morgonen startar")}
            <input
              type="time"
              value={win.start}
              onChange={(e) => setWindow({ start: e.target.value })}
              className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            {t("Dagen slutar")}
            <input
              type="time"
              value={win.end}
              onChange={(e) => setWindow({ end: e.target.value })}
              className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-ink"
            />
          </label>
        </div>

        <EdgeSlider
          icon={<Sunrise size={16} className="text-primary" aria-hidden="true" />}
          label={`${t("Batteri vid morgonstart")} (${win.start})`}
          value={morning}
          onChange={setMorningValue}
          onSave={() => save("morning")}
          saved={todayEdges.morning != null}
        />

        <EdgeSlider
          icon={<Moon size={16} className="text-primary" aria-hidden="true" />}
          label={`${t("Hur kändes energin vid dagens slut?")} (${win.end})`}
          value={evening}
          onChange={setEveningValue}
          onSave={() => save("evening")}
          saved={todayEdges.evening != null}
        />
        <p className="text-xs text-muted-foreground">{t("Morgonvärdet kan påverka dagens batteri. Kvällsvärdet sparas i historiken och ändrar inte batteriprocenten.")}</p>
        <div className="space-y-3 rounded-2xl bg-[#F5EDF7]/60 p-3" data-testid="daily-energy-journey">
          <h3 className="font-sans text-sm font-semibold text-ink">{t("Dagens energiresa")}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("Registreringar och aktiviteter i tidsordning. Energiupplevelser är inte exakta procentförändringar.")}</p>
          <ol className="ml-2 space-y-3 border-l-2 border-primary/20 pl-5">
            <li>
              <p className="text-sm font-semibold text-ink">{t("Morgon")} · {win.start}</p>
              <p className="text-xs text-muted-foreground">{todayEdges.morning == null ? t("Ingen morgonregistrering ännu") : todayEdges.morning + "/10"}</p>
            </li>
            {todayActivities.map(entry => {
              const gives = entry.direction === "gives";
              const drains = entry.direction === "drains";
              const time = new Date(entry.occurredAt);
              return (
                <li key={entry.id} className="flex items-start gap-2">
                  {gives ? <ArrowUpRight size={16} className="shrink-0 text-emerald-700" aria-hidden /> : drains ? <ArrowDownRight size={16} className="shrink-0 text-orange-700" aria-hidden /> : <Minus size={16} className="shrink-0 text-muted-foreground" aria-hidden />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">{Number.isNaN(time.getTime()) ? "" : time.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })} · {t(gives ? "Gav energi" : drains ? "Tog energi" : entry.direction === "both" ? "Både gav och tog energi" : "Ingen tydlig energipåverkan")}</p>
                  </div>
                </li>
              );
            })}
            <li>
              <p className="text-sm font-semibold text-ink">{t("Kväll")} · {win.end}</p>
              <p className="text-xs text-muted-foreground">{todayEdges.evening == null ? t("Ingen kvällsregistrering ännu") : todayEdges.evening + "/10"}</p>
            </li>
          </ol>
        </div>
      </CollapsibleSection>
    </section>
  );
}

function EdgeSlider({
  icon,
  label,
  value,
  onChange,
  onSave,
  saved,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
  onSave: () => void;
  saved: boolean;
}) {
  const { t } = useLang();
  return (
    <div className="space-y-2 rounded-2xl bg-[#F5EDF7]/60 p-3">
      <div className="flex items-center gap-2 text-sm text-ink">
        {icon}
        <span className="flex-1">{label}</span>
        <span className="text-xs font-semibold text-primary">{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full accent-[hsl(var(--primary))]"
      />
      <button
        type="button"
        onClick={onSave}
        className="min-h-9 rounded-xl bg-[#F5EDF7] px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-[#EFE5F2]"
      >
        {saved ? t("Uppdatera") : t("Spara")}
      </button>
    </div>
  );
}
