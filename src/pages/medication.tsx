import { useState } from "react";
import { useFlowExplainer } from "@/hooks/use-flow-explainer";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide, MyFloveBlock } from "@/components/myflove/block";
import { MyFloveHeader } from "@/components/myflove";
import { MyFloveEmptyIllustration } from "@/components/myflove/motion";
import { useMedications } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Pill, Plus, Trash2, Check, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRandomEncouragement } from "@/lib/encouragements";
import { REPEAT_LABELS, type RepeatMode } from "@/lib/recurrence";

const REPEAT_OPTIONS: Array<{ value: RepeatMode; label: string }> = [
  { value: "daily", label: "Varje dag" },
  { value: "weekdays", label: "Vardagar" },
  { value: "weekly", label: "Varje vecka" },
  { value: "none", label: "En gång" },
];

interface MedicationContentProps {
  showHeader?: boolean;
}

export function MedicationContent({ showHeader = true }: MedicationContentProps) {
  const { explain } = useFlowExplainer();
  const medExplainer = explain("medicin");
  const { medications, addMedication, deleteMedication, isTaken, toggleTaken } = useMedications();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState<string[]>([""]);
  const [repeat, setRepeat] = useState<RepeatMode>("daily");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  const updateTime = (index: number, value: string) => {
    setTimes((prev) => prev.map((t, i) => (i === index ? value : t)));
  };

  const addTimeField = () => setTimes((prev) => [...prev, ""]);
  const removeTimeField = (index: number) => setTimes((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validTimes = times.filter((t) => t.trim() !== "");
    if (name.trim() === "" || validTimes.length === 0) return;
    addMedication(
      name.trim(),
      validTimes,
      dosage.trim() || undefined,
      repeat,
      repeat === "daily" ? undefined : startDate,
    );
    setName("");
    setDosage("");
    setTimes([""]);
    setRepeat("daily");
    toast({ description: "Medicin tillagd 💊" });
  };

  const handleToggle = (medId: string, time: string, wasTaken: boolean) => {
    toggleTaken(medId, time);
    if (!wasTaken) {
      toast({ description: getRandomEncouragement() });
    }
  };

  return (
    <MyFlovePageGrid>
      {showHeader && (
        <MyFloveWide>
          <MyFloveHeader
            title="Medicinpåminnelser"
            emojiKey="medicine"
            description={`Lägg till dina mediciner och bocka av när du tagit dem.${medExplainer ? ` ${medExplainer}` : ""}`}
          />
        </MyFloveWide>
      )}

      <MyFloveWide>
        <MyFloveBlock title="Ny medicin" icon={Pill}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Namn på medicin"
                className="p-3 rounded-xl bg-secondary/50 border-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none text-base"
              />
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Dos (valfritt), t.ex. 10 mg"
                className="p-3 rounded-xl bg-secondary/50 border-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none text-base"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tider på dagen</p>
              {times.map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => updateTime(index, e.target.value)}
                    className="p-3 rounded-xl bg-secondary/50 border-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none text-base"
                  />
                  {times.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeField(index)}
                      className="p-2 text-muted-foreground hover:text-destructive rounded-lg"
                      aria-label="Ta bort tid"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTimeField}
                className="text-sm text-primary font-medium flex items-center gap-1 mt-1"
              >
                <Plus size={16} /> Lägg till fler tider
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Hur ofta?</p>
              <div className="flex flex-wrap gap-2">
                {REPEAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRepeat(opt.value)}
                    aria-pressed={repeat === opt.value}
                    className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                      repeat === opt.value
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-secondary/50 border-transparent text-foreground hover:border-primary/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {repeat !== "daily" && (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  {repeat === "none" ? "Datum" : "Startdatum"}
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="p-2 rounded-xl bg-secondary/50 border border-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm"
                  />
                </label>
              )}
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl">
              <Plus size={18} className="mr-2" /> Spara medicin
            </Button>
          </form>
        </MyFloveBlock>
      </MyFloveWide>

      <MyFloveWide>
        {medications.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center">
            <Pill size={32} className="mx-auto mb-3 text-muted-foreground" />
            <MyFloveEmptyIllustration kind="default" className="mb-2 block" />
            <p className="text-muted-foreground">
              Inga mediciner tillagda än – lägg till när det passar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {medications.map((med) => (
              <MyFloveBlock
                key={med.id}
                title={med.name}
                icon={Pill}
                subtitle={`${med.dosage ? `${med.dosage} · ` : ""}${REPEAT_LABELS[med.repeat ?? "daily"]}${
                  med.repeat === "none" && med.startDate
                    ? ` ${med.startDate}`
                    : med.repeat && med.repeat !== "daily" && med.startDate
                      ? ` från ${med.startDate}`
                      : ""
                }`}
                action={
                  <button
                    type="button"
                    onClick={() => deleteMedication(med.id)}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg"
                    aria-label="Ta bort medicin"
                  >
                    <Trash2 size={18} />
                  </button>
                }
              >
                <div className="flex flex-wrap gap-2">
                  {med.times.map((time) => {
                    const taken = isTaken(med.id, time);
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleToggle(med.id, time, taken)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                          taken
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-secondary/50 border-transparent text-foreground hover:border-primary/30"
                        }`}
                      >
                        {taken ? <Check size={16} /> : <Clock size={16} />}
                        <span className="font-medium">{time}</span>
                      </button>
                    );
                  })}
                </div>
              </MyFloveBlock>
            ))}
          </div>
        )}
      </MyFloveWide>
    </MyFlovePageGrid>
  );
}

export default function Medication() {
  return (
    <Layout>
      <MedicationContent />
    </Layout>
  );
}
