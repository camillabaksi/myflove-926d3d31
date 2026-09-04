import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Check, Pencil, X } from "lucide-react";
import { useQuickflowRules } from "@/hooks/use-quickflow-rules";
import {
  MATCH_LABEL,
  RULE_TEMPLATE_LIST,
  type RuleDraft,
  type RuleMatchType,
} from "@/lib/quickflow-rules";
import { DESTINATION_META, type QuickflowDestination } from "@/lib/quickflow";
import { AREA_META, ALL_AREAS, type LifeArea } from "@/lib/life-areas";
import { useLang } from "@/hooks/use-language";

const DESTINATIONS: QuickflowDestination[] = ["inkop", "kalender", "uppgift", "paminnelse", "ide"];

const MATCH_TYPES: RuleMatchType[] = ["startsWith", "contains", "endsWith"];

/**
 * Egna regler för QuickFlow – "börjar med köpa → Inköpslistan".
 * Färdiga mallar går att lägga till direkt eller anpassa först.
 */
export default function QuickflowRulesSettings() {
  const { t } = useLang();
  const { rules, addRule, updateRule, removeRule, moveRule } = useQuickflowRules();
  const formRef = useRef<HTMLDivElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [phrase, setPhrase] = useState("");
  const [matchType, setMatchType] = useState<RuleMatchType>("startsWith");
  const [destination, setDestination] = useState<QuickflowDestination>("inkop");
  const [area, setArea] = useState<LifeArea | "">("");
  const [time, setTime] = useState("");
  const [strip, setStrip] = useState(true);

  const hasPhrase = (p: string) =>
    rules.some((r) => r.phrase.trim().toLowerCase() === p.trim().toLowerCase());


  const fillForm = (draft: RuleDraft) => {
    setPhrase(draft.phrase);
    setMatchType(draft.matchType);
    setDestination(draft.destination);
    setArea(draft.area ?? "");
    setTime(draft.time ?? "");
    setStrip(Boolean(draft.stripPhrase));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const resetForm = () => {
    setEditingId(null);
    setPhrase("");
    setTime("");
    setArea("");
    setStrip(true);
    setMatchType("startsWith");
    setDestination("inkop");
  };

  const save = () => {
    const p = phrase.trim();
    if (!p) {
      toast(t("Skriv ett ord först"), { description: t('T.ex. "köpa" eller "boka".') });
      return;
    }
    const draft = {
      phrase: p,
      matchType,
      destination,
      area: area || undefined,
      time: time || undefined,
      stripPhrase: strip,
    };
    if (editingId) {
      updateRule(editingId, draft);
      toast.success(
        `${t("Ändringen är sparad")} – "${p}" ${t("går till")} ${t(DESTINATION_META[destination].label)}.`,
      );
    } else {
      addRule({
        phrase: p,
        matchType,
        destination,
        ...(area ? { area } : {}),
        ...(time ? { time } : {}),
        stripPhrase: strip,
      });
      toast.success(
        `${t("Klart – ")}"${p}" ${t("hamnar nu i")} ${t(DESTINATION_META[destination].label)}.`,
      );
    }
    resetForm();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t(
          "Bestäm själv vart olika sorters texter ska hamna. Den översta regeln som passar vinner – annars föreslår jag som vanligt.",
        )}
      </p>

      {/* Färdiga mallar */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <p className="text-sm font-semibold text-ink">{t("Färdiga mallar")}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("Lägg till direkt, eller välj Anpassa om du vill ändra något först.")}
        </p>
        <ul className="space-y-2">
          {RULE_TEMPLATE_LIST.map((tpl) => {
            const added = hasPhrase(tpl.rule.phrase);
            return (
              <li
                key={tpl.key}
                className="rounded-xl border border-border/70 bg-background/60 p-3 flex items-start gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {t(tpl.label)} → {DESTINATION_META[tpl.rule.destination].emoji}{" "}
                    {t(DESTINATION_META[tpl.rule.destination].label)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t(tpl.hint)}</p>
                  <p className="text-xs text-muted-foreground italic">{t(tpl.example)}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => {
                      addRule(tpl.rule);
                      toast.success(
                        `"${tpl.rule.phrase}" ${t("är tillagd – du kan ändra den när du vill.")}`,
                      );
                    }}
                    className="rounded-full border border-primary bg-primary/10 text-primary px-3 py-1 text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-40"
                  >
                    {added ? <Check size={13} /> : <Plus size={13} />}
                    {added ? t("Tillagd") : t("Lägg till")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      fillForm(tpl.rule);
                    }}
                    className="rounded-full border border-border px-3 py-1 text-xs font-medium inline-flex items-center gap-1"
                  >
                    <Pencil size={13} /> {t("Anpassa")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {rules.length === 0 && (
          <button
            type="button"
            onClick={() => {
              RULE_TEMPLATE_LIST.forEach((tpl) => addRule(tpl.rule));
              toast.success(t("Alla mallar tillagda – ändra dem precis som du vill."));
            }}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
          >
            {t("Lägg till alla mallar")}
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {rules.map((r, i) => (
          <li key={r.id} className="rounded-2xl border border-border bg-card p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink">
                  {t("Text som")}{" "}
                  <span className="text-muted-foreground">{t(MATCH_LABEL[r.matchType])}</span>{" "}
                  <span className="font-semibold">"{r.phrase}"</span> →{" "}
                  {DESTINATION_META[r.destination].emoji} {t(DESTINATION_META[r.destination].label)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.area ? `${t(AREA_META[r.area].label)} · ` : ""}
                  {r.time ? `kl ${r.time} · ` : ""}
                  {r.stripPhrase ? t("tar bort ordet ur titeln") : t("behåller hela texten")}
                </p>
              </div>
              <button
                type="button"
                aria-label={t("Ändra regel")}
                onClick={() => {
                  setEditingId(r.id);
                  fillForm(r);
                }}
                className="rounded-full border border-border p-1.5"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                aria-label={t("Flytta upp")}
                onClick={() => moveRule(r.id, -1)}
                disabled={i === 0}
                className="rounded-full border border-border p-1.5 disabled:opacity-30"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                aria-label={t("Flytta ner")}
                onClick={() => moveRule(r.id, 1)}
                disabled={i === rules.length - 1}
                className="rounded-full border border-border p-1.5 disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                aria-label={t("Ta bort regel")}
                onClick={() => {
                  removeRule(r.id);
                  if (editingId === r.id) resetForm();
                }}
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
              {t("Regeln är på")}
            </label>
          </li>
        ))}
      </ul>

      <div ref={formRef} className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">{editingId ? t("Ändra regel") : t("Ny regel")}</p>
          {(editingId || phrase) && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-muted-foreground inline-flex items-center gap-1"
            >
              <X size={13} /> {t("Avbryt")}
            </button>
          )}
        </div>

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
          placeholder={t('T.ex. "köpa"')}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />

        <div>
          <p className="text-xs text-muted-foreground mb-1">{t("Hamnar i:")}</p>
          <div className="flex flex-wrap gap-1.5">
            {DESTINATIONS.map((d) => (
              <Chip key={d} active={destination === d} onClick={() => setDestination(d)}>
                {DESTINATION_META[d].emoji} {t(DESTINATION_META[d].label)}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">{t("Livsområde (valfritt):")}</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={area === ""} onClick={() => setArea("")}>
              {t("Låt mig gissa")}
            </Chip>
            {ALL_AREAS.map((a) => (
              <Chip key={a} active={area === a} onClick={() => setArea(a)}>
                {AREA_META[a].emoji} {t(AREA_META[a].label)}
              </Chip>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <span className="text-xs text-muted-foreground">{t("Tid (valfritt):")}</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="rounded-xl border border-border bg-background px-2 py-1 text-sm"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={strip} onChange={(e) => setStrip(e.target.checked)} />
          {t("Ta bort ordet ur titeln")}
        </label>

        <button
          type="button"
          onClick={save}
          className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
        >
          {editingId ? <Check size={16} /> : <Plus size={16} />}
          {editingId ? t("Spara ändring") : t("Spara regel")}
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
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}
