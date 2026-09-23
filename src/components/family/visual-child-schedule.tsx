import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Ellipsis,
  ImagePlus,
  Images,
  Library,
  Heart,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFlowScore } from "@/hooks/use-flowscore";
import { useLang } from "@/hooks/use-language";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { addDaysISO, parseISODate, todayISO } from "@/lib/day";
import { capacityFromScore } from "@/lib/adaptive-activity";
import {
  ACTIVITY_BANK,
  CATEGORY_LABELS,
  VISUAL_TONES,
  activityDedupKey,
  dayPart,
  decodeVisualNotes,
  encodeVisualNotes,
  getScheduleGuidance,
  transitionPrompt,
  weekDates,
  type ActivityBankItem,
  type VisualActivityCategory,
  type VisualActivityMeta,
  type VisualActivityTone,
} from "@/lib/child-visual-schedule";
import { emitActivityDone } from "@/lib/activity-energy-event";
import type { Child, ChildItem, ChildItemPatch } from "@/hooks/use-children";
import type { ChildScheduleEntry } from "@/components/child-schedule";
import { isoWeekNumberFromString } from "@/lib/iso-week";
import { cn } from "@/lib/utils";

const SCHEDULE_KEY = "myflove-child-schedules";
const DAY_NAMES = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
const SHORT_DAYS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
const CATEGORY_KEYS = Object.keys(ACTIVITY_BANK) as VisualActivityCategory[];
const TONE_CLASS: Record<VisualActivityTone, string> = {
  lavender: "bg-lavender/60 border-primary/15",
  blush: "bg-blush/55 border-blush",
  mint: "bg-mint/55 border-mint",
  sky: "bg-sky/55 border-sky",
  sun: "bg-sun/55 border-sun",
};
const DAY_COLUMN_CLASS = [
  "bg-lavender/75",
  "bg-mint/70",
  "bg-sky/70",
  "bg-sun/75",
  "bg-blush/70",
  "bg-secondary/80",
  "bg-accent/60",
];

interface Draft {
  title: string;
  date: string;
  time: string;
  note: string;
  meta: VisualActivityMeta;
  file: File | null;
}

const defaultDraft = (date: string): Draft => ({
  title: "",
  date,
  time: "",
  note: "",
  meta: { emoji: "⭐", category: "hemma", tone: "lavender" },
  file: null,
});

function signedImage(path: string, openDoc: (path: string) => Promise<string>, setUrl: (url: string) => void) {
  void openDoc(path).then(setUrl).catch(() => undefined);
}

function ActivityImage({ path, title, openDoc }: { path: string; title: string; openDoc: (path: string) => Promise<string> }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    signedImage(path, openDoc, (next) => active && setUrl(next));
    return () => {
      active = false;
    };
  }, [path, openDoc]);
  if (!url) return <div className="h-12 w-12 animate-pulse rounded-2xl bg-muted" aria-hidden />;
  return <img src={url} alt={title} className="h-12 w-12 rounded-2xl object-cover" />;
}

function ActivityVisual({ item, className, openDoc }: { item: ChildItem; className?: string; openDoc: (path: string) => Promise<string> }) {
  const { meta } = decodeVisualNotes(item.notes);
  return item.file_path ? (
    <ActivityImage path={item.file_path} title={item.title} openDoc={openDoc} />
  ) : (
    <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl", TONE_CLASS[meta.tone], className)} aria-hidden>
      {meta.emoji}
    </span>
  );
}

export default function VisualChildSchedule({
  child,
  items,
  onClose,
  addItem,
  updateItem,
  toggleItem,
  deleteItem,
  uploadDoc,
  openDoc,
}: {
  child: Child;
  items: ChildItem[];
  onClose: () => void;
  addItem: (input: { childId: string; kind: "activity"; title: string; notes?: string; date?: string; time?: string; filePath?: string }) => Promise<string>;
  updateItem: (id: string, patch: ChildItemPatch) => Promise<void>;
  toggleItem: (id: string, completed: boolean) => Promise<void>;
  deleteItem: (item: ChildItem) => Promise<void>;
  uploadDoc: (childId: string, file: File) => Promise<string>;
  openDoc: (path: string) => Promise<string>;
}) {
  const { t, locale } = useLang();
  const { flow } = useFlowScore();
  const { openItems: quickItems, absorb } = useQuickflow();
  const [schedules] = useCloudSyncedStorage<Record<string, ChildScheduleEntry[]>>(SCHEDULE_KEY, {});
  const [mode, setMode] = useState<"week" | "today">("today");
  const [anchor, setAnchor] = useState(todayISO());
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ChildItem | null>(null);
  const [draft, setDraft] = useState<Draft>(() => defaultDraft(todayISO()));
  const [saving, setSaving] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const dates = useMemo(() => weekDates(anchor), [anchor]);
  const childItems = useMemo(
    () => items.filter((item) => item.child_id === child.id && (item.kind === "activity" || item.kind === "task")),
    [items, child.id],
  );
  const schoolEntries = schedules[child.id] ?? [];
  const today = todayISO();
  const todayItems = useMemo(
    () => childItems.filter((item) => item.date === today).sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99") || a.created_at.localeCompare(b.created_at)),
    [childItems, today],
  );
  const todayWeekday = (parseISODate(today).getDay() + 6) % 7;
  const todaySchoolEntries = schoolEntries
    .filter((entry) => entry.weekday === todayWeekday)
    .sort((a, b) => a.start.localeCompare(b.start));
  const openToday = todayItems.filter((item) => !item.completed);
  const current = openToday[0] ?? null;
  const next = openToday[1] ?? null;
  const score = typeof flow?.score === "number" ? flow.score : null;
  const guidance = getScheduleGuidance(openToday.length, capacityFromScore(score));
  const wantsWarning = child.helps.includes("Förvarna vid förändringar");
  const quickMatches = quickItems.filter((item) => item.text.toLocaleLowerCase("sv").includes(child.name.toLocaleLowerCase("sv")));

  const openAdd = (preset?: ActivityBankItem, date = mode === "today" ? today : anchor) => {
    setEditing(null);
    setDraft({ ...defaultDraft(date), ...(preset ? { title: preset.title, meta: preset } : {}) });
    setAdding(true);
  };

  const openEdit = (item: ChildItem) => {
    const decoded = decodeVisualNotes(item.notes);
    setDraft({ title: item.title, date: item.date ?? today, time: item.time?.slice(0, 5) ?? "", note: decoded.note, meta: decoded.meta, file: null });
    setEditing(item);
    setAdding(true);
  };

  const saveDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.date) return;
    setSaving(true);
    try {
      let filePath = editing?.file_path ?? undefined;
      if (draft.file) filePath = await uploadDoc(child.id, draft.file);
      if (editing) {
        await updateItem(editing.id, {
          title: draft.title.trim(),
          date: draft.date,
          time: draft.time || null,
          notes: encodeVisualNotes(draft.meta, draft.note),
          file_path: filePath ?? null,
        });
      } else {
        const key = activityDedupKey({ childId: child.id, title: draft.title, date: draft.date, time: draft.time });
        if (childItems.some((item) => activityDedupKey({ childId: item.child_id, title: item.title, date: item.date, time: item.time }) === key)) {
          toast.info(t("Aktiviteten finns redan den dagen."));
          return;
        }
        await addItem({ childId: child.id, kind: "activity", title: draft.title.trim(), date: draft.date, time: draft.time || undefined, notes: encodeVisualNotes(draft.meta, draft.note), filePath });
      }
      setAdding(false);
      setEditing(null);
      toast.success(t(editing ? "Aktiviteten är ändrad." : "Aktiviteten är tillagd."));
    } catch {
      toast.error(t("Kunde inte spara aktiviteten."));
    } finally {
      setSaving(false);
    }
  };

  const markDone = async (item: ChildItem) => {
    await toggleItem(item.id, !item.completed);
    if (!item.completed) emitActivityDone({ id: `child-${item.id}`, title: item.title, ...(item.date ? { dueDate: item.date } : {}) });
  };

  const copyWeek = async () => {
    if (!window.confirm(t("Vill du kopiera den här veckan till nästa vecka?"))) return;
    const source = childItems.filter((item) => item.date && dates.includes(item.date));
    const existing = new Set(childItems.map((item) => activityDedupKey({ childId: item.child_id, title: item.title, date: item.date, time: item.time })));
    let copied = 0;
    for (const item of source) {
      const targetDate = addDaysISO(item.date ?? dates[0]!, 7);
      const key = activityDedupKey({ childId: child.id, title: item.title, date: targetDate, time: item.time });
      if (existing.has(key)) continue;
      await addItem({ childId: child.id, kind: "activity", title: item.title, date: targetDate, time: item.time ?? undefined, notes: item.notes ?? undefined });
      existing.add(key);
      copied += 1;
    }
    toast.success(t(copied ? `${copied} aktiviteter kopierades.` : "Nästa vecka innehåller redan aktiviteterna."));
  };

  const importQuickItem = async (text: string, remindAt?: number) => {
    const when = remindAt ? new Date(remindAt) : null;
    const date = when ? `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}-${String(when.getDate()).padStart(2, "0")}` : today;
    const time = when ? `${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}` : undefined;
    const key = activityDedupKey({ childId: child.id, title: text, date, time });
    if (!childItems.some((item) => activityDedupKey({ childId: item.child_id, title: item.title, date: item.date, time: item.time }) === key)) {
      await addItem({ childId: child.id, kind: "activity", title: text, date, time, notes: encodeVisualNotes({ emoji: "🎒", category: "hemma", tone: "mint" }) });
    }
    absorb(text);
    toast.success(t("Tillagd i barnets schema."));
  };

  const weekLabel = `v. ${isoWeekNumberFromString(dates[0]!)} · ${new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(parseISODate(dates[0]!))}–${new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(parseISODate(dates[6]!))}`;

  return (
    <section className="mx-auto min-h-[70vh] w-full max-w-5xl space-y-4 overflow-hidden rounded-3xl border border-border bg-card p-3 shadow-soft sm:p-5" data-testid="visual-child-schedule">
      <header className="flex items-center gap-3 border-b border-border/70 pb-4">
        <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-11 w-11 rounded-full" aria-label={t("Tillbaka")}><ChevronLeft /></Button>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blush text-primary" aria-hidden>{child.avatar ? <span className="text-2xl">{child.avatar}</span> : <UserRound size={24} />}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-xl font-bold text-ink">{child.name}</h2>
          <p className="text-sm text-muted-foreground">{t(mode === "week" ? "Veckoschema" : `Idag – ${new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "short" }).format(parseISODate(today))}`)}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => openAdd()} className="h-10 rounded-xl px-3"><Pencil size={15} /><span className="hidden sm:inline">{t("Redigera")}</span></Button>
      </header>

      {mode === "today" && <p className="flex items-center justify-center gap-2 rounded-xl bg-lavender/70 px-4 py-2 text-center text-sm font-medium text-primary"><Heart size={15} fill="currentColor" /> {t("Du klarar det! Ett steg i taget.")} <Heart size={15} fill="currentColor" /></p>}

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1" role="tablist" aria-label={t("Välj schemavy") }>
        <Button type="button" variant={mode === "week" ? "default" : "ghost"} onClick={() => setMode("week")} className="h-10 rounded-lg shadow-none" role="tab" aria-selected={mode === "week"}>{t("Vecka")}</Button>
        <Button type="button" variant={mode === "today" ? "default" : "ghost"} onClick={() => setMode("today")} className="h-10 rounded-lg shadow-none" role="tab" aria-selected={mode === "today"}>{t("Idag")}</Button>
      </div>

      {mode === "today" ? (
        <div className="space-y-5">
          {current ? (
            <section className="space-y-3 rounded-2xl border border-primary/25 bg-lavender/35 p-3" aria-label={t("Nu och nästa") }>
              <div className="flex items-center gap-3">
                <ActivityVisual item={current} openDoc={openDoc} />
                <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase text-primary">{t("Nu")}</p><p className="font-display text-lg font-bold text-ink">{current.title}</p>{current.time && <p className="text-sm text-muted-foreground">{current.time.slice(0, 5)}</p>}</div>
                <Button type="button" onClick={() => void markDone(current)} className="h-11 rounded-full px-4"><Check size={18} /> {t("Klar")}</Button>
              </div>
              {next && (
                <div className="border-t border-primary/15 pt-3">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{t("Nästa")}</p>
                  <div className="mt-2 flex items-center gap-3"><ActivityVisual item={next} openDoc={openDoc} /><div><p className="font-semibold text-ink">{next.title}</p>{next.time && <p className="text-sm text-muted-foreground">{next.time.slice(0, 5)}</p>}</div></div>
                  {wantsWarning && <p className="mt-3 rounded-2xl bg-card/80 p-3 text-sm text-ink">🔔 {transitionPrompt(next.title)}</p>}
                </div>
              )}
            </section>
          ) : (
            <div className="rounded-2xl bg-mint/45 p-5 text-center"><CheckCircle2 className="mx-auto mb-2 text-primary" /><p className="font-semibold text-ink">{t(todayItems.length ? "Allt är klart för idag." : "Inget inlagt idag än.")}</p></div>
          )}

          {guidance.message && (
            <section className="rounded-2xl border border-border bg-blush/35 p-4">
              <p className="font-semibold text-ink"><Sparkles size={16} className="mr-1 inline text-primary" />{t(guidance.message)}</p>
              {guidance.recovery && <p className="mt-1 text-sm text-muted-foreground">{t(guidance.recovery)}</p>}
              <Button type="button" variant="outline" onClick={() => openAdd(ACTIVITY_BANK.återhämtning[1], today)} className="mt-3 h-11 rounded-2xl">{t("Lägg in lugn stund")}</Button>
            </section>
          )}

          {todaySchoolEntries.length > 0 && (
            <section className="space-y-2" aria-label={t("Skolschema idag")}>
              <h3 className="text-sm font-bold text-ink">🏫 {t("Skolschema idag")}</h3>
              {todaySchoolEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-sky bg-card px-3 py-2 shadow-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky/50 text-2xl" aria-hidden>🏫</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">{entry.start}{entry.end ? `–${entry.end}` : ""} · {t("återkommer varje vecka")}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          <div className="space-y-4">
            {(["Morgon", "Dag", "Efter skolan", "Kväll"] as const).map((part) => {
              const partItems = todayItems.filter((item) => dayPart(item.time) === part);
              if (partItems.length === 0) return null;
              return <section key={part}><h3 className="mb-2 text-sm font-bold text-ink">{part === "Morgon" ? "☀️" : part === "Kväll" ? "🌙" : "💜"} {t(part)}</h3><ul className="space-y-2">{partItems.map((item) => {
                const isCurrent = current?.id === item.id;
                const isNext = next?.id === item.id;
                return <li key={item.id} className={cn("flex items-center gap-2 rounded-xl border px-2 py-1.5 shadow-sm transition-opacity", item.completed ? "border-border bg-muted/35 opacity-60" : isCurrent ? "border-primary bg-lavender/45" : isNext ? "border-primary/30 bg-card" : "border-border bg-card opacity-80")}><Button type="button" variant="ghost" size="icon" onClick={() => void markDone(item)} className="h-10 w-10 shrink-0 rounded-full" aria-label={t(item.completed ? "Markera som inte klar" : "Markera som klar")}>{item.completed ? <CheckCircle2 className="text-primary" /> : isCurrent ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">›</span> : <span className="h-5 w-5 rounded-full border-2 border-muted-foreground" />}</Button><ActivityVisual item={item} className="h-11 w-11 rounded-xl" openDoc={openDoc} /><div className="min-w-0 flex-1"><p className={cn("font-semibold text-ink", item.completed && "line-through")}>{item.title}</p><p className="text-xs text-muted-foreground">{item.time?.slice(0, 5) || t("Ingen tid")}{isCurrent ? ` · ${t("Nu")}` : isNext ? ` · ${t("Nästa")}` : ""}</p></div><Button type="button" variant="ghost" size="icon" onClick={() => openEdit(item)} className="h-10 w-10 rounded-full" aria-label={t("Ändra")}><Ellipsis size={18} /></Button></li>;
              })}</ul></section>;
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => setAnchor(addDaysISO(anchor, -7))} className="h-11 w-11 rounded-2xl" aria-label={t("Föregående vecka")}><ChevronLeft /></Button>
            <p className="text-sm font-semibold text-ink">{weekLabel}</p>
            <Button type="button" variant="ghost" size="icon" onClick={() => setAnchor(addDaysISO(anchor, 7))} className="h-11 w-11 rounded-2xl" aria-label={t("Nästa vecka")}><ChevronRight /></Button>
          </div>
          <div className="grid min-w-0 grid-cols-7 gap-1 sm:gap-2">
            {dates.map((date, index) => {
              const dated = childItems.filter((item) => item.date === date).sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
              const recurring = schoolEntries.filter((entry) => entry.weekday === index);
              return <section key={date} className={cn("min-w-0 rounded-xl p-1.5 sm:p-2", DAY_COLUMN_CLASS[index], date === today && "ring-2 ring-primary")}><div className="mb-2 text-center"><p className="truncate text-[11px] font-bold text-ink sm:text-sm"><span className="sm:hidden">{t(SHORT_DAYS[index] ?? "")}</span><span className="hidden sm:inline">{t(DAY_NAMES[index] ?? "")}</span></p><p className="text-[10px] text-muted-foreground">{new Intl.DateTimeFormat(locale, { day: "numeric" }).format(parseISODate(date))}</p></div><div className="space-y-1.5">{recurring.map((entry) => <div key={`school-${entry.id}`} className="rounded-lg border border-border/70 bg-card p-1 text-center shadow-sm"><span className="block text-xl" aria-hidden>🏫</span><p className="truncate text-[9px] font-bold text-ink sm:text-xs">{entry.title}</p></div>)}{dated.map((item) => { const { meta } = decodeVisualNotes(item.notes); return <Button key={item.id} type="button" variant="ghost" onClick={() => openEdit(item)} className={cn("h-auto min-h-14 w-full flex-col gap-0 whitespace-normal rounded-lg border border-border/70 bg-card p-1 text-center shadow-sm", item.completed && "opacity-50")}><span className="text-xl leading-none" aria-hidden>{meta.emoji}</span><span className={cn("block max-w-full truncate text-[9px] font-bold text-ink sm:text-xs", item.completed && "line-through")}>{item.title}</span></Button>; })}<Button type="button" variant="ghost" onClick={() => openAdd(undefined, date)} className="h-9 w-full rounded-lg border border-dashed border-border bg-card/50 p-0" aria-label={`${t("Lägg till")} ${SHORT_DAYS[index]}`}><Plus size={14} /></Button></div></section>;
            })}
          </div>
          <Button type="button" variant="secondary" onClick={() => openAdd()} className="h-11 w-full rounded-xl"><Plus size={16} /> {t("Lägg till aktivitet")}</Button>
          <section className="space-y-2"><h3 className="text-sm font-bold text-ink">{t("Snabblänkar")}</h3><div className="grid grid-cols-3 gap-2"><Button type="button" variant="secondary" onClick={() => openAdd()} className="h-auto min-h-20 flex-col rounded-xl px-2 py-3"><Library /><span className="text-xs">{t("Aktivitetsbank")}</span></Button><Button type="button" variant="secondary" onClick={() => { openAdd(); window.setTimeout(() => galleryRef.current?.click(), 0); }} className="h-auto min-h-20 flex-col rounded-xl px-2 py-3"><Images /><span className="text-xs">{t("Egna bilder")}</span></Button><Button type="button" variant="secondary" onClick={() => void copyWeek()} className="h-auto min-h-20 flex-col rounded-xl px-2 py-3"><Copy /><span className="text-xs">{t("Kopiera vecka")}</span></Button></div></section>
        </div>
      )}

      {quickMatches.length > 0 && (
        <section className="rounded-3xl border border-border bg-sky/25 p-4"><h3 className="font-semibold text-ink">{t("Från QuickFlow")}</h3><div className="mt-2 space-y-2">{quickMatches.map((item) => <div key={item.id} className="flex items-center gap-2"><p className="min-w-0 flex-1 text-sm text-ink">{item.text}</p><Button type="button" variant="outline" onClick={() => void importQuickItem(item.text, item.remindAt)} className="h-11 rounded-2xl">{t("Lägg till")}</Button></div>)}</div></section>
      )}

      {!adding && mode === "today" && <Button type="button" onClick={() => openAdd()} className="h-12 w-full rounded-xl"><Plus size={18} /> {t("Lägg till aktivitet")}</Button>}

      {adding && (
        <form onSubmit={saveDraft} className="space-y-4 rounded-3xl border border-border bg-muted/25 p-4">
          <div className="flex items-center justify-between gap-2"><h3 className="font-display text-lg font-bold text-ink">{t(editing ? "Ändra aktivitet" : "Lägg till aktivitet")}</h3><Button type="button" variant="ghost" onClick={() => { setAdding(false); setEditing(null); }} className="rounded-2xl">{t("Avbryt")}</Button></div>
          {!editing && <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-3"><AccordionItem value="bank" className="border-0"><AccordionTrigger>{t("Välj från aktivitetsbanken")}</AccordionTrigger><AccordionContent><Accordion type="multiple">{CATEGORY_KEYS.map((category) => <AccordionItem key={category} value={category}><AccordionTrigger>{t(CATEGORY_LABELS[category])}</AccordionTrigger><AccordionContent><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{ACTIVITY_BANK[category].map((preset) => <Button key={`${category}-${preset.title}`} type="button" variant="outline" onClick={() => setDraft((currentDraft) => ({ ...currentDraft, title: preset.title, meta: preset }))} className="h-auto min-h-12 justify-start whitespace-normal rounded-2xl px-3 py-2"><span className="text-xl" aria-hidden>{preset.emoji}</span><span>{t(preset.title)}</span></Button>)}</div></AccordionContent></AccordionItem>)}</Accordion></AccordionContent></AccordionItem></Accordion>}
          <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={t("Aktivitetens namn")} className="h-12 rounded-2xl" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><Input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} aria-label={t("Datum")} className="h-12 rounded-2xl" /><Input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} aria-label={t("Tid, valfritt")} className="h-12 rounded-2xl" /></div>
          <div className="space-y-2"><label className="text-sm font-medium text-ink">{t("Ikon")}</label><div className="flex flex-wrap gap-2">{["⭐", "🎒", "🏫", "🍎", "🪥", "👕", "🎧", "⚽", "🎨", "😴"].map((emoji) => <Button key={emoji} type="button" variant="outline" size="icon" onClick={() => setDraft({ ...draft, meta: { ...draft.meta, emoji } })} aria-pressed={draft.meta.emoji === emoji} className={cn("h-11 w-11 rounded-2xl text-lg", draft.meta.emoji === emoji && "border-primary bg-primary/10")}>{emoji}</Button>)}</div></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><label className="space-y-1 text-sm font-medium text-ink"><span>{t("Kategori")}</span><select value={draft.meta.category} onChange={(event) => setDraft({ ...draft, meta: { ...draft.meta, category: event.target.value as VisualActivityCategory } })} className="h-12 w-full rounded-2xl border border-border bg-card px-3">{CATEGORY_KEYS.map((category) => <option key={category} value={category}>{t(CATEGORY_LABELS[category])}</option>)}</select></label><fieldset className="space-y-1"><legend className="text-sm font-medium text-ink">{t("Färg")}</legend><div className="flex gap-2">{VISUAL_TONES.map((tone) => <Button key={tone} type="button" variant="outline" size="icon" onClick={() => setDraft({ ...draft, meta: { ...draft.meta, tone } })} aria-label={t(`Färg ${tone}`)} aria-pressed={draft.meta.tone === tone} className={cn("h-11 w-11 rounded-full border-2", TONE_CLASS[tone], draft.meta.tone === tone && "border-primary")}><Check size={15} className={draft.meta.tone === tone ? "opacity-100" : "opacity-0"} /></Button>)}</div></fieldset></div>
          <Input value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder={t("Kort anteckning (valfritt)")} className="h-12 rounded-2xl" />
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(event) => setDraft({ ...draft, file: event.target.files?.[0] ?? null })} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => setDraft({ ...draft, file: event.target.files?.[0] ?? null })} />
          <div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={() => cameraRef.current?.click()} className="h-12 rounded-2xl"><Camera size={17} /> {t("Ta foto")}</Button><Button type="button" variant="outline" onClick={() => galleryRef.current?.click()} className="h-12 rounded-2xl"><ImagePlus size={17} /> {t("Egna bilder")}</Button></div>
          {draft.file && <p className="truncate text-xs text-muted-foreground">{draft.file.name}</p>}
          <p className="text-xs text-muted-foreground">🔒 {t("Bilden är privat och öppnas bara med en tillfällig säker länk.")}</p>
          <div className="flex flex-wrap gap-2"><Button type="submit" disabled={saving || !draft.title.trim()} className="h-12 rounded-2xl">{saving ? t("Sparar...") : t("Spara")}</Button>{editing && <Button type="button" variant="outline" onClick={async () => { if (!window.confirm(t("Ta bort aktiviteten?"))) return; await deleteItem(editing); setAdding(false); setEditing(null); }} className="h-12 rounded-2xl text-destructive"><Trash2 size={16} /> {t("Ta bort")}</Button>}</div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays size={13} /> {t("Aktiviteten visas också i familjens vanliga dag och kalender.")}</p>
        </form>
      )}
    </section>
  );
}