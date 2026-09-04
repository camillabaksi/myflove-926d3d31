import { useEffect, useState } from "react";
import { Moon, Sunrise } from "lucide-react";
import { useDayWindow } from "@/hooks/use-day-window";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/use-language";

/**
 * Morgon och kväll – du fyller själv i när morgonen startar, när dagen
 * slutar och hur batteriet känns vid de två tidpunkterna. Kurvan i
 * Mitt batteri™ utgår sedan från dina egna siffror.
 */
export default function DayEdgesCheckin({ className }: { className?: string }) {
  const { t } = useLang();
  const { window: win, setWindow, todayEdges, setMorning, setEvening } = useDayWindow();
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
      aria-label={t("Morgon och kväll")}
      className={cn(
        "space-y-4 rounded-3xl border-2 border-border/60 bg-card p-5 shadow-soft",
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("Morgon och kväll")}
        </h2>
        <p className="mt-1 text-sm text-ink">
          {t("Fyll i när din morgon startar och när dagen slutar – och hur batteriet känns då.")}
        </p>
      </div>

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
        label={`${t("Batteri när dagen slutar")} (${win.end})`}
        value={evening}
        onChange={setEveningValue}
        onSave={() => save("evening")}
        saved={todayEdges.evening != null}
      />
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
    <div className="space-y-2 rounded-2xl bg-secondary/40 p-3">
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
        className="rounded-pill bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
      >
        {saved ? t("Uppdatera") : t("Spara")}
      </button>
    </div>
  );
}
