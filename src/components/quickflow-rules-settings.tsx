import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { useQuickflowRules } from "@/hooks/use-quickflow-rules";
import {
  MATCH_LABEL,
  RULE_TEMPLATES,
  type RuleMatchType,
} from "@/lib/quickflow-rules";
import { DESTINATION_META, type QuickflowDestination } from "@/lib/quickflow";
import { AREA_META, ALL_AREAS, type LifeArea } from "@/lib/life-areas";

const DESTINATIONS: QuickflowDestination[] = [
  "inkop",
  "kalender",
  "uppgift",
  "paminnelse",
  "ide",
];

const MATCH_TYPES: RuleMatchType[] = ["startsWith", "contains", "endsWith"];

/**
 * Egna regler för QuickFlow – "börjar med köpa → Inköpslistan".
 * Reglerna går alltid före MyFloves egen gissning.
 */
export default function QuickflowRulesSettings() {
  const { rules, addRule, updateRule, removeRule, moveRule } = useQuickflowRules();
  const [phrase, setPhrase] = useState("");
  const [matchType, setMatchType] = useState<RuleMatchType>("startsWith");
  const [destination, setDestination] = useState<QuickflowDestination>("inkop");
  const [area, setArea] = useState<LifeArea | "">("");
  const [time, setTime] = useState("");
  const [strip, setStrip] = useState(true);

  const save = () => {
    const p = phrase.trim();
    if (!p) {
      toast("Skriv ett ord först", { description: "T.ex. \"köpa\" eller \"boka\"." });
      return;
    }
    addRule({
      phrase: p,
      matchType,
      destination,
      ...(area ? { area } : {}),
      ...(time ? { time } : {}),
      stripPhrase: strip,
    });
    setPhrase("");
    setTime("");
    toast.success(`Klart – "${p}" hamnar nu i ${DESTINATION_META[destination].label}.`);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Bestäm själv vart olika sorters texter ska hamna. Den översta regeln som passar vinner –
        annars föreslår jag som vanligt.
      </p>

      {rules.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm text-ink">Inga egna regler än. Vill du börja med några vanliga?</p>
          <button
            type="button"
            onClick={() => {
              RULE_TEMPLATES.forEach((t) => addRule(t));
              toast.success("Fem vanliga regler tillagda – ändra dem precis som du vill.");
            }}
            className="rounded-full border border-primary bg-primary/10 text-primary px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
          >
            <Sparkles size={16} /> Lägg till förslag
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {rules.map((r, i) => (
          <li key={r.id} className="rounded-2xl border border-border bg-card p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink">
                  Text som <span className="text-muted-foreground">{MATCH_LABEL[r.matchType]}</span>{" "}
                  <span className="font-semibold">"{r.phrase}"</span> →{" "}
                  {DESTINATION_META[r.destination].emoji} {DESTINATION_META[r.destination].label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.area ? `${AREA_META[r.area].label} · ` : ""}
                  {r.time ? `kl ${r.time} · ` : ""}
                  {r.stripPhrase ? "tar bort ordet ur titeln" : "behåller hela texten"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Flytta upp"
                onClick={() => moveRule(r.id, -1)}
                disabled={i === 0}
                className="rounded-full border border-border p-1.5 disabled:opacity-30"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                aria-label="Flytta ner"
                onClick={() => moveRule(r.id, 1)}
                disabled={i === rules.length - 1}
                className="rounded-full border border-border p-1.5 disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                aria-label="Ta bort regel"
                onClick={() => removeRule(r.id)}
                className="rounded-full border border-border p-1.5 text-destructive"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={(e) => updateRule(r.id, { enabled: e.target.checked })}
              />
              Regeln är på
            </label>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold text-ink">Ny regel</p>

        <div className="flex flex-wrap gap-1.5">
          {MATCH_TYPES.map((m) => (
            <Chip key={m} active={matchType === m} onClick={() => setMatchType(m)}>
              {MATCH_LABEL[m]}
            </Chip>
          ))}
        </div>

        <input
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder='T.ex. "köpa"'
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />

        <div>
          <p className="text-xs text-muted-foreground mb-1">Hamnar i:</p>
          <div className="flex flex-wrap gap-1.5">
            {DESTINATIONS.map((d) => (
              <Chip key={d} active={destination === d} onClick={() => setDestination(d)}>
                {DESTINATION_META[d].emoji} {DESTINATION_META[d].label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Livsområde (valfritt):</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={area === ""} onClick={() => setArea("")}>
              Låt mig gissa
            </Chip>
            {ALL_AREAS.map((a) => (
              <Chip key={a} active={area === a} onClick={() => setArea(a)}>
                {AREA_META[a].emoji} {AREA_META[a].label}
              </Chip>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <span className="text-xs text-muted-foreground">Tid (valfritt):</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-xl border border-border bg-background px-2 py-1 text-sm"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={strip} onChange={(e) => setStrip(e.target.checked)} />
          Ta bort ordet ur titeln
        </label>

        <button
          type="button"
          onClick={save}
          className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
        >
          <Plus size={16} /> Spara regel
        </button>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}
