import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { ENERGY_CATEGORIES, type EnergyCategory, type EnergyDirection } from "@/lib/energy-flow";
import type { FlowNote } from "@/lib/notes";
import { useLang } from "@/hooks/use-language";
import { parseWhenFromText } from "@/lib/quickflow";
import { toISODate, todayISO } from "@/lib/day";

export type ConvertTarget = "uppgift" | "kalender" | "energi";

const todayStr = () => todayISO();

/**
 * "Omvandla till …" – anteckningen blir något annat först efter
 * att du bekräftat. Inget händer i bakgrunden.
 */
export default function NoteConvertDialog({
  note,
  open,
  onOpenChange,
  onConverted,
}: {
  note: FlowNote | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConverted: (target: ConvertTarget) => void;
}) {
  const { t } = useLang();
  const { addTask } = useTasks();
  const { addReminder } = useReminders();
  const { addFactor } = useEnergyFlow();

  const [target, setTarget] = useState<ConvertTarget | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("09:00");
  const [remind, setRemind] = useState(false);
  const [direction, setDirection] = useState<EnergyDirection>("drains");
  const [strength, setStrength] = useState(3);
  const [category, setCategory] = useState<EnergyCategory>("annat");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && note) {
      setTarget(null);
      setTitle(note.text);
      // Står ett datum i texten ("APT 14 oktober") används det – annars idag.
      const parsed = parseWhenFromText(note.text);
      if (parsed) {
        const d = new Date(parsed.at);
        setDate(toISODate(d));
        setTime(
          parsed.hasTime
            ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
            : "09:00",
        );
      } else {
        setDate(todayStr());
        setTime("09:00");
      }
      setRemind(false);
      setDirection("drains");
      setStrength(3);
      setCategory("annat");
    }
  }, [open, note]);

  const TARGETS: { id: ConvertTarget; emoji: string; label: string; hint: string }[] = [
    {
      id: "uppgift",
      emoji: "✅",
      label: t("Uppgift"),
      hint: t("Något du vill göra – utan datum om du vill"),
    },
    {
      id: "kalender",
      emoji: "📅",
      label: t("Kalenderhändelse"),
      hint: t("Något som händer en viss dag och tid"),
    },
    {
      id: "energi",
      emoji: "🔋",
      label: t("Energifaktor"),
      hint: t("Något som gav eller tog energi"),
    },
  ];

  if (!note) return null;

  const confirm = async () => {
    if (!target || !title.trim() || saving) return;
    setSaving(true);
    try {
      if (target === "uppgift") {
        addTask(title.trim(), undefined, { area: note.area });
        toast.success(t("Anteckningen blev en uppgift. ✅"));
      } else if (target === "kalender") {
        addTask(title.trim(), date, {
          area: note.area,
          time,
          ...(remind ? { reminderMinutesBefore: 30 } : {}),
        });
        if (remind) addReminder(title.trim(), date, time);
        toast.success(t("Anteckningen ligger nu i kalendern. 📅"));
      } else {
        await addFactor({ title: title.trim(), direction, strength, category });
        toast.success(
          direction === "gives"
            ? t("Sparad som något som ger energi. 🔋")
            : t("Sparad som något som tar energi. 🪫"),
        );
      }
      onConverted(target);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Omvandla till …")}</DialogTitle>
          <DialogDescription>
            {t("Välj vad anteckningen ska bli. Inget sparas förrän du bekräftar.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            {TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTarget(t.id)}
                className={`text-left rounded-2xl border px-3.5 py-3 transition-colors ${
                  target === t.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <span className="font-medium text-ink">
                  {t.emoji} {t.label}
                </span>
                <span className="block text-xs text-muted-foreground">{t.hint}</span>
              </button>
            ))}
          </div>

          {target && (
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-muted-foreground">{t("Text")}</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
              </label>

              {target === "kalender" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <label className="flex-1 text-sm">
                      <span className="text-muted-foreground">{t("Datum")}</span>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
                      />
                    </label>
                    <label className="w-32 text-sm">
                      <span className="text-muted-foreground">{t("Tid")}</span>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={remind}
                      onChange={(e) => setRemind(e.target.checked)}
                    />
                    {t("Påminn mig innan")}
                  </label>
                </div>
              )}

              {target === "energi" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Chip active={direction === "gives"} onClick={() => setDirection("gives")}>
                      {t("🔋 Gav energi")}
                    </Chip>
                    <Chip active={direction === "drains"} onClick={() => setDirection("drains")}>
                      {t("🪫 Tog energi")}
                    </Chip>
                  </div>
                  <label className="block text-sm">
                    <span className="text-muted-foreground">
                      {t("Styrka: ")}
                      {strength}
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={strength}
                      onChange={(e) => setStrength(Number(e.target.value))}
                      className="mt-1 w-full"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ENERGY_CATEGORIES.map((c) => (
                      <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                        {c.emoji} {t(c.label)}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-border px-4 py-2 text-sm"
            >
              {t("Avbryt")}
            </button>
            <button
              type="button"
              disabled={!target || !title.trim() || saving}
              onClick={confirm}
              className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {t("Bekräfta")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}
