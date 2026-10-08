import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  BarChart3,
  CalendarClock,
  Plus,
  Repeat,
  Scale,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide, MyFloveBlock } from "@/components/myflove/block";
import EnergyFlowSettings from "@/components/energy-flow-settings";
import DidThisQuickAdd from "@/components/did-this-quick-add";
import DayEnergyFlow from "@/components/day-energy-flow";
import WhyHint from "@/components/why-hint";
import { useLang } from "@/hooks/use-language";

import {
  MyFloveButton,
  MyFloveChip,
  MyFloveEmptyState,
  MyFloveHeader,
  MyFloveLoading,
} from "@/components/myflove";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  showDayFlow?: boolean;
}

/** Liten horisontell nyckeltalsruta – används i Dagens balans. */
function BalanceStat({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-card/70 px-2 py-3 text-center">
      <div className="text-lg leading-none" aria-hidden>
        {emoji}
      </div>
      <div className="mt-1 truncate text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="font-display text-xl font-bold leading-tight text-ink">{value}</div>
    </div>
  );
}

/** En rad i mönstersektionerna – ikon/etikett vänster, värde höger. */
function TrendRow({
  emoji,
  label,
  value,
  hint,
}: {
  emoji: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-secondary/40 px-3 py-2">
      <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
        <span aria-hidden className="shrink-0">
          {emoji}
        </span>
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 text-right text-sm text-muted-foreground">
        {value}
        {hint && <span className="block text-[11px]">{hint}</span>}
      </span>
    </div>
  );
}

export function EnergyFlowContent({ showHeader = true, showDayFlow = true }: Props) {
  const {
    entries,
    presets,
    balance,
    insight,
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
  const { t } = useLang();

  const [title, setTitle] = useState("");
  const [direction, setDirection] = useState<EnergyDirection>("drains");
  const [strength, setStrength] = useState(3);
  const [category, setCategory] = useState<EnergyCategory>("annat");
  const [kind, setKind] = useState<EnergyKind>("vardag");
  const [friction, setFriction] = useState(2);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const today = useMemo(() => entries.filter((e) => isSameDay(e.occurredAt)), [entries]);
  const catTrends = useMemo(() => categoryTrends(entries, 14), [entries]);
  const nameTrends = useMemo(() => titleTrends(entries, 30).slice(0, 6), [entries]);
  const frictionRows = useMemo(() => frictionTrends(entries, 30).slice(0, 5), [entries]);

  const save = async () => {
    const value = title.trim();
    if (!value) {
      toast({ description: t("Skriv vad det gäller – t.ex. dålig sömn eller en promenad.") });
      return;
    }
    setSaving(true);
    try {
      await addFactor({
        title: value,
        direction,
        strength,
        category,
        kind,
        friction,
        note: note.trim(),
      });
      setTitle("");
      setNote("");
      setAddOpen(false);
      toast({ description: t("Tack – det räknas med i din kapacitet idag.") });
    } catch {
      toast({ description: t("Kunde inte spara just nu. Försök igen."), variant: "destructive" });
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
      toast({ description: `${p.title} ${t("tillagd.")}` });
    } catch {
      toast({ description: t("Kunde inte spara just nu."), variant: "destructive" });
    }
  };

  if (loading) return <MyFloveLoading label={t("Hämtar ditt energiflöde...")} />;

  if (!signedIn) {
    return (
      <MyFloveEmptyState
        emoji="🔋"
        title={t("Logga in för att använda Min energi")}
        description={t(
          "Dina energiposter sparas till ditt konto så att Flow kan förstå din kapacitet.",
        )}
      />
    );
  }

  return (
    <MyFlovePageGrid area="halsa" className="pb-24">
      {showHeader && (
        <MyFloveWide>
          <MyFloveHeader
            area="halsa"
            title={t("Min energi – historik och mönster")}
            emoji="📈"
            description={t("Se vad som brukar ge och ta energi över tid.")}
            why={t(
              "Genom att logga vad som påverkar dig kan Flow upptäcka mönster över tid. Det handlar inte om att göra rätt eller fel – utan om att förstå vad som fungerar för just dig.",
            )}
          />
        </MyFloveWide>
      )}

      <MyFloveWide>
        <DidThisQuickAdd />
      </MyFloveWide>

      {showDayFlow && (
        <MyFloveWide>
          <DayEnergyFlow showLink={false} />
        </MyFloveWide>
      )}

      <MyFloveWide span="wide">
        <MyFloveBlock
          area="halsa"
          icon={Scale}
          title={t("Dagens balans")}
          subtitle={t("Vad har gett och tagit energi idag?")}
          collapsible
          status={`${t("Netto")} ${balance.net > 0 ? "+" : ""}${balance.net}`}
        >
          <div className="grid grid-cols-3 gap-2">
            <BalanceStat emoji="🔋" label={t("Gett energi")} value={`+${balance.gives}`} />
            <BalanceStat emoji="🪫" label={t("Tagit energi")} value={`−${balance.drains}`} />
            <BalanceStat
              emoji="⚖️"
              label={t("Netto")}
              value={`${balance.net > 0 ? "+" : ""}${balance.net}`}
            />
          </div>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {t("Balans just nu:")} <span className="font-semibold text-ink">{flow.score}</span> (
              {flow.label})
            </span>
            <Link href="/flowscore" className="underline">
              {t("Så räknas den")}
            </Link>
          </p>
        </MyFloveBlock>
      </MyFloveWide>

      {insight && (
        <MyFloveWide span="wide">
          <MyFloveBlock
            surface="blush"
            tone="blush"
            icon={Sparkles}
            title={t("Flow ser ett möjligt mönster")}
            subtitle={t("En reflektion, inte en slutsats.")}
          >
            <p className="text-sm leading-relaxed text-ink">{insight.message}</p>
            {insight.suggestLighterPlan && <MyFloveLinkRow />}
          </MyFloveBlock>
        </MyFloveWide>
      )}

      <MyFloveWide>
        <MyFloveBlock
          area="halsa"
          icon={CalendarClock}
          title={t("Idag")}
          subtitle={t("Det här har påverkat din energi.")}
          collapsible
          status={`${today.length} ${t("registrerat")}`}
        >
          {today.length === 0 ? (
            <MyFloveEmptyState
              emoji="🌤️"
              title={t("Inget registrerat idag")}
              description={t("Lägg till en sak som gett eller tagit energi – det räcker med en.")}
            />
          ) : (
            <ul className="space-y-2">
              {today.map((e) => (
                <li
                  key={e.id}
                  className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-secondary/40 px-3 py-2"
                >
                  <span
                    className={`min-w-0 flex-1 truncate text-sm font-medium text-ink ${
                      e.countsTowardScore ? "" : "opacity-60"
                    }`}
                  >
                    {kindEmoji(e.kind)} {e.title}
                  </span>

                  <span className="shrink-0 text-xs text-muted-foreground">
                    {categoryEmoji(e.category)} {categoryLabel(e.category)}
                  </span>

                  <span className="flex shrink-0 items-center gap-1">
                    {(["drains", "neutral", "gives"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        aria-label={`Ändra påverkan till ${
                          d === "gives" ? "gav energi" : d === "neutral" ? "neutralt" : "tog energi"
                        }`}
                        onClick={() => updateFactor(e.id, { direction: d })}
                        className={`press rounded-full border px-2 py-0.5 text-xs ${
                          e.direction === d
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 text-muted-foreground"
                        }`}
                      >
                        {d === "gives" ? "🔺" : d === "neutral" ? "➖" : "🔻"}
                      </button>
                    ))}
                    <span className="ml-0.5 text-xs text-muted-foreground">
                      {e.direction === "gives"
                        ? `+${e.strength}`
                        : e.direction === "neutral"
                          ? "0"
                          : `−${e.strength}`}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-1">
                    {FRICTION_LEVELS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        title={t(f.label)}
                        aria-label={`${t("Svårighetsgrad")} ${t(f.label)}`}
                        onClick={() => updateFactor(e.id, { friction: f.value })}
                        className={`press rounded-full border px-2 py-0.5 text-xs ${
                          e.friction === f.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 text-muted-foreground"
                        }`}
                      >
                        {f.emoji}
                      </button>
                    ))}
                  </span>

                  <span className="ml-auto flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      title={e.countsTowardScore ? t("Räkna inte med") : t("Räkna med")}
                      aria-label={e.countsTowardScore ? t("Räkna inte med") : t("Räkna med")}
                      onClick={() => toggleCounts(e.id, !e.countsTowardScore)}
                      className="press grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-ink"
                    >
                      {e.countsTowardScore ? <X size={14} /> : <Plus size={14} />}
                    </button>
                    <button
                      type="button"
                      title={t("Ta bort")}
                      aria-label={`${t("Ta bort")} ${e.title}`}
                      onClick={() => removeFactor(e.id)}
                      className="press grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>

                  {e.note && <p className="w-full text-xs text-muted-foreground">{e.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </MyFloveBlock>
      </MyFloveWide>

      <MyFloveWide>
        <MyFloveBlock
          area="halsa"
          icon={Activity}
          title={t("Lägg till något som påverkar")}
          subtitle={t("Sömn, ljud, en konflikt, egen tid eller en promenad.")}
        >
          <MyFloveButton onClick={() => setAddOpen(true)}>
            {t("Lägg till något som påverkar")}
          </MyFloveButton>
        </MyFloveBlock>
      </MyFloveWide>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t("Lägg till något som påverkar")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
          {presets.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-ink">{t("Snabbknappar")}</div>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1">
                    <MyFloveChip onClick={() => quickAdd(p)}>
                      {p.direction === "gives" ? "🔋" : "🪫"} {p.title}
                    </MyFloveChip>
                    <button
                      type="button"
                      aria-label={`${t("Ta bort snabbknappen")} ${p.title}`}
                      onClick={() => removePreset(p.id)}
                      className="press grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:text-ink"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("T.ex. dålig sömn, promenad, stökigt möte")}
            className="h-12 rounded-2xl"
          />

          <div className="space-y-2">
            <div className="text-sm font-medium text-ink">{t("Hur påverkade det din energi?")}</div>
            <div className="flex flex-wrap gap-2">
              <MyFloveChip active={direction === "drains"} onClick={() => setDirection("drains")}>
                🔻 {t("Tog energi")}
              </MyFloveChip>
              <MyFloveChip active={direction === "neutral"} onClick={() => setDirection("neutral")}>
                ➖ {t("Neutralt")}
              </MyFloveChip>
              <MyFloveChip active={direction === "gives"} onClick={() => setDirection("gives")}>
                🔺 {t("Gav energi")}
              </MyFloveChip>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-ink">{t("Hur mycket?")}</div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <MyFloveChip
                  key={n}
                  active={strength === n}
                  onClick={() => setStrength(n)}
                  className="min-w-11"
                >
                  {n}
                </MyFloveChip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-medium text-ink">
                {t("Hur svårt var det att komma igång?")}
              </div>
              <WhyHint label={t("svårighetsgrad")}>
                {t(
                  "Svårighetsgrad är något annat än energi – tvätt kan kosta lite energi men vara tungt att börja med.",
                )}
              </WhyHint>
            </div>
            <div className="flex flex-wrap gap-2">
              {FRICTION_LEVELS.map((f) => (
                <MyFloveChip
                  key={f.value}
                  active={friction === f.value}
                  onClick={() => setFriction(f.value)}
                >
                  {f.emoji} {t(f.label)}
                </MyFloveChip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-ink">{t("Var kom det ifrån?")}</div>
            <div className="flex flex-wrap gap-2">
              {ENERGY_KINDS.map((k) => (
                <MyFloveChip key={k.id} active={kind === k.id} onClick={() => setKind(k.id)}>
                  {k.emoji} {t(k.label)}
                </MyFloveChip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-ink">{t("Vad handlar det om?")}</div>
            <div className="flex flex-wrap gap-2">
              {ENERGY_CATEGORIES.map((c) => (
                <MyFloveChip
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.emoji} {t(c.label)}
                </MyFloveChip>
              ))}
            </div>
          </div>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("Anteckning (frivilligt)")}
            className="rounded-2xl"
            rows={2}
          />

          <div className="flex flex-wrap items-center gap-3">
            <MyFloveButton onClick={save} disabled={saving}>
              {saving ? t("Sparar…") : t("Lägg till")}
            </MyFloveButton>
            <button
              type="button"
              onClick={async () => {
                const value = title.trim();
                if (!value) {
                  toast({
                    description: t("Skriv en titel först, så sparar jag den som snabbknapp."),
                  });
                  return;
                }
                await addPreset({ title: value, direction, strength, category, kind, friction });
                toast({ description: t("Sparad som snabbknapp.") });
              }}
              className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-ink"
            >
              {t("Spara som snabbknapp")}
            </button>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      <MyFloveWide span="wide">
        <MyFloveBlock
          area="halsa"
          icon={BarChart3}
          title={t("Mönster över tid")}
          subtitle={t("Vad brukar påverka din energi?")}
          collapsible
          defaultCollapsed
          status={`${catTrends.length} ${t("områden")}`}
          action={
            <WhyHint label={t("mönster över tid")}>
              {t(
                "Enkla sammanställningar av dina egna poster. Ingen värdering – bara vad du själv har registrerat.",
              )}
            </WhyHint>
          }
        >
          {catTrends.length === 0 ? (
            <MyFloveEmptyState
              emoji="📈"
              title={t("Mönstren dyker upp efter hand")}
              description={t(
                "När du registrerat några poster visar jag vad som oftast ger och tar energi.",
              )}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t("Senaste 14 dagarna")}</p>
              {catTrends.map((row) => (
                <TrendRow
                  key={row.key}
                  emoji={row.emoji}
                  label={t(row.label)}
                  value={`${row.net > 0 ? "+" : ""}${row.net} ${t("energi")} · ${row.count} ${
                    row.count === 1 ? t("gång") : t("gånger")
                  }`}
                />
              ))}
            </div>
          )}
        </MyFloveBlock>
      </MyFloveWide>

      {nameTrends.length > 0 && (
        <MyFloveWide span="wide">
          <MyFloveBlock
            area="halsa"
            icon={Repeat}
            title={t("Dina återkommande faktorer")}
            subtitle={t("Det här återkommer ofta i dina loggningar.")}
            collapsible
            defaultCollapsed
            status={`${nameTrends.length} ${t("faktorer")}`}
          >
            <div className="space-y-2">
              {nameTrends.map((row) => (
                <TrendRow
                  key={row.key}
                  emoji={row.emoji}
                  label={row.label}
                  value={`${row.count} ${row.count === 1 ? t("gång") : t("gånger")}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Något som återkommer och tar mycket?")}{" "}
              <Link href="/friktionsindex" className="underline">
                {t("Lägg det i friktionsbiblioteket")}
              </Link>
              .
            </p>
          </MyFloveBlock>
        </MyFloveWide>
      )}

      {frictionRows.length > 0 && (
        <MyFloveWide span="wide">
          <MyFloveBlock
            area="halsa"
            icon={Activity}
            title={t("Tungt att komma igång med")}
            subtitle={t("Svår start behöver inte betyda hög kostnad.")}
            collapsible
            defaultCollapsed
            status={`${frictionRows.length} ${t("saker")}`}
          >
            <div className="space-y-2">
              {frictionRows.map((row) => (
                <TrendRow
                  key={row.key}
                  emoji={frictionEmoji(Math.round(row.friction))}
                  label={row.label}
                  value={`${t("svårighet")} ${row.friction.toFixed(1)}`}
                  hint={`${t("energi")} ${row.energy > 0 ? "+" : ""}${row.energy.toFixed(1)}`}
                />
              ))}
            </div>
          </MyFloveBlock>
        </MyFloveWide>
      )}

      <MyFloveWide>
        <MyFloveBlock
          area="halsa"
          icon={Settings2}
          title={t("Hur mycket får det påverka?")}
          subtitle={t("Du bestämmer själv hur mycket energiflödet väger in.")}
          collapsible
          defaultCollapsed
          status={t("Öppna inställningar")}
        >
          <EnergyFlowSettings />
          <p className="text-sm text-muted-foreground">
            {t(
              "Energiflödet skapar aldrig kalenderhändelser eller uppgifter. Det beskriver bara din kapacitet.",
            )}
          </p>
        </MyFloveBlock>
      </MyFloveWide>
    </MyFlovePageGrid>
  );
}

/** Erbjudandet att göra planen lättare – går till befintlig omplanering. */
function MyFloveLinkRow() {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/idag">
        <MyFloveButton variant="secondary">{t("Gör planen lättare")}</MyFloveButton>
      </Link>
      <Link href="/assistant">
        <MyFloveButton variant="tertiary">{t("Prata med Pace")}</MyFloveButton>
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
