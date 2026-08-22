import { useMemo, useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout";
import CollapsibleSection from "@/components/collapsible-section";
import EnergyFlowSettings from "@/components/energy-flow-settings";
import DidThisQuickAdd from "@/components/did-this-quick-add";
import DayEnergyFlow from "@/components/day-energy-flow";

import {
  MyFloveButton,
  MyFloveCard,
  MyFloveChip,
  MyFloveEmptyState,
  MyFloveHeader,
  MyFloveLoading,
} from "@/components/myflove";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEnergyFlow } from "@/hooks/use-energy-flow";
import { useFlowScore } from "@/hooks/use-flowscore";
import {
  categoryEmoji,
  categoryLabel,
  categoryTrends,
  ENERGY_CATEGORIES,
  ENERGY_KINDS,
  FRICTION_LEVELS,
  frictionEmoji,
  frictionLabel,
  frictionTrends,
  isSameDay,
  kindEmoji,
  kindLabel,
  titleTrends,
  type EnergyCategory,
  type EnergyDirection,
  type EnergyKind,
} from "@/lib/energy-flow";

interface Props {
  showHeader?: boolean;
}

export function EnergyFlowContent({ showHeader = true }: Props) {
  const {
    entries,
    presets,
    balance,
    insight,
    settings,
    setSettings,
    loading,
    signedIn,
    addFactor,
    removeFactor,
    updateFactor,
    toggleCounts,
    addPreset,
    removePreset,
  } = useEnergyFlow();
  const { flow } = useFlowScore();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [direction, setDirection] = useState<EnergyDirection>("drains");
  const [strength, setStrength] = useState(3);
  const [category, setCategory] = useState<EnergyCategory>("annat");
  const [kind, setKind] = useState<EnergyKind>("vardag");
  const [friction, setFriction] = useState(2);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const today = useMemo(() => entries.filter((e) => isSameDay(e.occurredAt)), [entries]);
  const catTrends = useMemo(() => categoryTrends(entries, 14), [entries]);
  const nameTrends = useMemo(() => titleTrends(entries, 30).slice(0, 6), [entries]);
  const frictionRows = useMemo(() => frictionTrends(entries, 30).slice(0, 5), [entries]);

  const save = async () => {
    const t = title.trim();
    if (!t) {
      toast({ description: "Skriv vad det gäller – t.ex. dålig sömn eller en promenad." });
      return;
    }
    setSaving(true);
    try {
      await addFactor({
        title: t,
        direction,
        strength,
        category,
        kind,
        friction,
        note: note.trim(),
      });
      setTitle("");
      setNote("");
      toast({ description: "Tack – det räknas med i din kapacitet idag." });
    } catch {
      toast({ description: "Kunde inte spara just nu. Försök igen.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const quickAdd = async (p: (typeof presets)[number]) => {
    try {
      await addFactor({
        title: p.title,
        direction: p.direction,
        strength: p.strength,
        category: p.category,
        kind: p.kind,
        friction: p.friction,
      });
      toast({ description: `${p.title} tillagd.` });
    } catch {
      toast({ description: "Kunde inte spara just nu.", variant: "destructive" });
    }
  };

  if (loading) return <MyFloveLoading label="Hämtar ditt energiflöde..." />;

  if (!signedIn) {
    return (
      <MyFloveEmptyState
        emoji="🔋"
        title="Logga in för att använda Min energi"
        description="Dina energiposter sparas till ditt konto så att Flow kan förstå din kapacitet."
      />
    );
  }

  return (
    <div className="space-y-8">
      {showHeader && (
        <MyFloveHeader
          title="Min energi"
          emoji="🔋"
          description="Vad ger och vad tar energi? Det här är inte att göra-listan – det är sådant som påverkar hur mycket du orkar."
        />
      )}

      <DidThisQuickAdd />

      <DayEnergyFlow showLink={false} />

      <CollapsibleSection
        title="Dagens balans"
        help="Summan av det du registrerat idag. Den vägs in i dagens balans, så planen blir rimlig i stället för för stor."
      >
        <MyFloveCard tone="lavender" className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Gett energi</div>
              <div className="font-display text-2xl font-bold text-ink">🔋 +{balance.gives}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tagit energi</div>
              <div className="font-display text-2xl font-bold text-ink">🪫 −{balance.drains}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Netto</div>
              <div className="font-display text-2xl font-bold text-ink">
                {balance.net > 0 ? "+" : ""}
                {balance.net}
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Din FlowScore är {flow.score} just nu ({flow.label}).{" "}
            <Link href="/flowscore" className="underline">
              Se hur den räknas
            </Link>
            .
          </p>
        </MyFloveCard>

        {insight && (
          <MyFloveCard tone="blush" className="mt-3 space-y-3">
            <p className="text-sm text-ink">{insight.message}</p>
            {insight.suggestLighterPlan && <MyFloveLinkRow />}
          </MyFloveCard>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Lägg till något som påverkar"
        help="Skriv vad som helst som påverkar din energi – sömn, ljud, en konflikt, egentid, en promenad. Det blir aldrig en kalenderhändelse."
      >
        <MyFloveCard className="space-y-4">
          {presets.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-ink">Snabbknappar</div>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1">
                    <MyFloveChip onClick={() => quickAdd(p)}>
                      {p.direction === "gives" ? "🔋" : "🪫"} {p.title}
                    </MyFloveChip>
                    <button
                      type="button"
                      aria-label={`Ta bort snabbknappen ${p.title}`}
                      onClick={() => removePreset(p.id)}
                      className="text-xs text-muted-foreground hover:text-ink"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="T.ex. dålig sömn, promenad, stökigt möte"
            className="h-12 rounded-2xl"
          />

          <div className="flex flex-wrap gap-2">
            <MyFloveChip active={direction === "drains"} onClick={() => setDirection("drains")}>
              🔻 Tar energi
            </MyFloveChip>
            <MyFloveChip active={direction === "gives"} onClick={() => setDirection("gives")}>
              🔺 Ger energi
            </MyFloveChip>
            <MyFloveChip active={direction === "neutral"} onClick={() => setDirection("neutral")}>
              ➖ Neutral
            </MyFloveChip>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-ink">Hur mycket?</div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <MyFloveChip key={n} active={strength === n} onClick={() => setStrength(n)}>
                  {n}
                </MyFloveChip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-ink">Hur svårt var det att komma igång?</div>
            <p className="text-xs text-muted-foreground">
              Svårighetsgrad är något annat än energi – tvätt kan kosta lite energi men vara tungt att
              börja med.
            </p>
            <div className="flex flex-wrap gap-2">
              {FRICTION_LEVELS.map((f) => (
                <MyFloveChip
                  key={f.value}
                  active={friction === f.value}
                  onClick={() => setFriction(f.value)}
                >
                  {f.emoji} {f.label}
                </MyFloveChip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-ink">Var kom det ifrån?</div>
            <div className="flex flex-wrap gap-2">
              {ENERGY_KINDS.map((k) => (
                <MyFloveChip key={k.id} active={kind === k.id} onClick={() => setKind(k.id)}>
                  {k.emoji} {k.label}
                </MyFloveChip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-ink">Vad handlar det om?</div>
            <div className="flex flex-wrap gap-2">
              {ENERGY_CATEGORIES.map((c) => (
                <MyFloveChip
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.emoji} {c.label}
                </MyFloveChip>
              ))}
            </div>
          </div>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anteckning (frivilligt)"
            className="rounded-2xl"
            rows={2}
          />

          <div className="flex flex-wrap gap-2">
            <MyFloveButton onClick={save} disabled={saving}>
              {saving ? "Sparar…" : "Lägg till"}
            </MyFloveButton>
            <MyFloveButton
              variant="secondary"
              onClick={async () => {
                const t = title.trim();
                if (!t) {
                  toast({ description: "Skriv en titel först, så sparar jag den som snabbknapp." });
                  return;
                }
                await addPreset({ title: t, direction, strength, category, kind, friction });
                toast({ description: "Sparad som snabbknapp." });
              }}
            >
              Spara som snabbknapp
            </MyFloveButton>
          </div>
        </MyFloveCard>
      </CollapsibleSection>

      <CollapsibleSection
        title="Idag"
        help="Allt du registrerat idag. Du kan stänga av påverkan på enstaka poster utan att ta bort dem."
      >
        {today.length === 0 ? (
          <MyFloveEmptyState
            emoji="🌤️"
            title="Inget registrerat idag"
            description="Lägg till en sak som gett eller tagit energi – det räcker med en."
          />
        ) : (
          <div className="space-y-2">
            {today.map((e) => (
              <MyFloveCard key={e.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {kindEmoji(e.kind)} {kindLabel(e.kind)} · {categoryEmoji(e.category)}{" "}
                    {categoryLabel(e.category)} ·{" "}
                    {e.direction === "gives"
                      ? `🔺 +${e.strength}`
                      : e.direction === "neutral"
                        ? "➖ 0"
                        : `🔻 −${e.strength}`}
                    {e.friction
                      ? ` · ${frictionEmoji(e.friction)} ${frictionLabel(e.friction)}`
                      : ""}
                  </div>
                  <div
                    className={`font-medium text-ink ${e.countsTowardScore ? "" : "opacity-60"}`}
                  >
                    {e.title}
                  </div>
                  {e.note && <p className="text-sm text-muted-foreground">{e.note}</p>}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(["drains", "gives", "neutral"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        aria-label={`Ändra till ${d}`}
                        onClick={() => updateFactor(e.id, { direction: d })}
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          e.direction === d
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 text-muted-foreground"
                        }`}
                      >
                        {d === "gives" ? "🔺" : d === "neutral" ? "➖" : "🔻"}
                      </button>
                    ))}
                    {FRICTION_LEVELS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        title={f.label}
                        onClick={() => updateFactor(e.id, { friction: f.value })}
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          e.friction === f.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 text-muted-foreground"
                        }`}
                      >
                        {f.emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => toggleCounts(e.id, !e.countsTowardScore)}
                    className="text-xs font-medium text-muted-foreground hover:text-ink"
                  >
                    {e.countsTowardScore ? "Räkna inte med" : "Räkna med"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFactor(e.id)}
                    className="text-xs text-muted-foreground hover:text-ink"
                  >
                    Ta bort
                  </button>
                </div>
              </MyFloveCard>
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Mönster över tid"
        help="Enkla sammanställningar av dina egna poster. Ingen värdering – bara vad du själv har registrerat."
      >
        {catTrends.length === 0 ? (
          <MyFloveEmptyState
            emoji="📈"
            title="Mönstren dyker upp efter hand"
            description="När du registrerat några poster visar jag vad som oftast ger och tar energi."
          />
        ) : (
          <div className="space-y-4">
            <MyFloveCard className="space-y-2">
              <div className="text-sm font-medium text-ink">Senaste 14 dagarna</div>
              {catTrends.map((t) => (
                <div key={t.key} className="flex items-center justify-between text-sm">
                  <span>
                    {t.emoji} {t.label}
                  </span>
                  <span className={t.net >= 0 ? "text-ink" : "text-muted-foreground"}>
                    {t.net > 0 ? "+" : ""}
                    {t.net} · {t.count} gånger
                  </span>
                </div>
              ))}
            </MyFloveCard>

            {nameTrends.length > 0 && (
              <MyFloveCard className="space-y-2">
                <div className="text-sm font-medium text-ink">
                  Dina återkommande faktorer (30 dagar)
                </div>
                {nameTrends.map((t) => (
                  <div key={t.key} className="flex items-center justify-between text-sm">
                    <span>
                      {t.emoji} {t.label}
                    </span>
                    <span className="text-muted-foreground">{t.count} gånger</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Något som återkommer och tar mycket?{" "}
                  <Link href="/friktionsindex" className="underline">
                    Lägg in det i friktionsbiblioteket
                  </Link>{" "}
                  så tas det med i hur uppgifter rankas.
                </p>
              </MyFloveCard>
            )}

            {frictionRows.length > 0 && (
              <MyFloveCard className="space-y-2">
                <div className="text-sm font-medium text-ink">
                  Tungt att komma igång med (30 dagar)
                </div>
                <p className="text-xs text-muted-foreground">
                  Hög svårighetsgrad behöver inte betyda hög energikostnad – det betyder att starten är
                  svår.
                </p>
                {frictionRows.map((t) => (
                  <div key={t.key} className="flex items-center justify-between text-sm">
                    <span>
                      {frictionEmoji(Math.round(t.friction))} {t.label}
                    </span>
                    <span className="text-muted-foreground">
                      svårighetsgrad {t.friction.toFixed(1)} · energi {t.energy > 0 ? "+" : ""}
                      {t.energy.toFixed(1)}
                    </span>
                  </div>
                ))}
              </MyFloveCard>
            )}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Hur mycket får det påverka?"
        help="Du bestämmer själv. Du kan stänga av påverkan helt, eller ställa in vikten för varje energifaktor för sig."
      >
        <EnergyFlowSettings />
        <p className="mt-3 text-sm text-muted-foreground">
          Energiflödet skapar aldrig kalenderhändelser eller uppgifter. Det beskriver bara din
          kapacitet.
        </p>
      </CollapsibleSection>
    </div>
  );
}

/** Erbjudandet att göra planen lättare – går till befintlig omplanering. */
function MyFloveLinkRow() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/idag">
        <MyFloveButton variant="secondary">Gör planen lättare</MyFloveButton>
      </Link>
      <Link href="/flow">
        <MyFloveButton variant="tertiary">Prata med Flow</MyFloveButton>
      </Link>
    </div>
  );
}

export default function EnergyFlowPage() {
  return (
    <Layout>
      <EnergyFlowContent />
    </Layout>
  );
}
