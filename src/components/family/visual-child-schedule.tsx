import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  Move,
  Search,
  Heart,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { deviceAccessReady, UPDATE_APP_FOR_DEVICE_ACCESS } from "@/lib/native-caps";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLang } from "@/hooks/use-language";
import { useQuickflow } from "@/hooks/use-quickflow";
import { isActiveOwner } from "@/lib/account-scope";
import { addToChildSchedules } from "@/lib/add-child-schedule";
import { ChildScheduleRecipients } from "@/components/family/child-schedule-recipients";
import { getSyncUser, useCloudSyncedStorage } from "@/lib/cloud-storage";
import { addDaysISO, parseISODate, todayISO } from "@/lib/day";
import {
  ACTIVITY_BANK,
  CATEGORY_LABELS,
  CATEGORY_STYLES,
  FAMILY_LABELS,
  activityDedupKey,
  hasChildActivityOn,
  compareDayItems,
  activityOccursOn,
  buildMultiMovePatches,
  copiedVisualNotes,
  dayPart,
  decodeVisualNotes,
  encodeVisualNotes,
  PREP_MINUTE_CHOICES,
  TRAVEL_MINUTE_CHOICES,
  pictogramForActivity,
  searchActivityBank,
  shiftEndTime,
  shiftDateBetween,
  transitionPrompt,
  localNowMinutes,
  minutesUntilTime,
  pickNowNext,
  weekDates,
  type ActivityBankItem,
  type VisualActivityCategory,
  type VisualActivityMeta,
  type ChildRepeatMode,
  type FamilyActivityLabel,
} from "@/lib/child-visual-schedule";
import { MulberryPictogram as ActivityPictogram, MulberryAttribution } from "@/components/calendar/mulberry-pictogram";
import type { ChildScheduleTemplate } from "@/lib/child-schedule-templates";
import type { Child, ChildItem, ChildItemPatch } from "@/hooks/use-children";
import type { ChildScheduleEntry } from "@/components/child-schedule";
import { isoWeekNumberFromString } from "@/lib/iso-week";
import { cn } from "@/lib/utils";

const SCHEDULE_KEY = "myflove-child-schedules";
const TEMPLATE_KEY = "myflove-child-schedule-templates";
const DAY_NAMES = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];
const SHORT_DAYS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
const CATEGORY_KEYS = Object.keys(ACTIVITY_BANK) as VisualActivityCategory[];
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
  endTime: string;
  repeat: ChildRepeatMode;
  note: string;
  meta: VisualActivityMeta;
  file: File | null;
}

const defaultDraft = (date: string): Draft => ({
  title: "",
  date,
  time: "",
  endTime: "",
  repeat: "none",
  note: "",
  meta: { pictogram: "home", category: "hemma", tone: "lavender" },
  file: null,
});

function signedImage(path: string, openDoc: (path: string) => Promise<string>, setUrl: (url: string) => void) {
  void openDoc(path).then(setUrl).catch(() => undefined);
}

function ActivityImage({ path, title, openDoc, className }: { path: string; title: string; className?: string; openDoc: (path: string) => Promise<string> }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    signedImage(path, openDoc, (next) => active && setUrl(next));
    return () => {
      active = false;
    };
  }, [path, openDoc]);
  if (!url) return <div className={cn("h-11 w-11 shrink-0 animate-pulse rounded-xl bg-muted", className)} aria-hidden />;
  return <img src={url} alt={title} className={cn("h-11 w-11 shrink-0 rounded-xl object-cover", className)} />;
}

function ActivityVisual({ item, className, openDoc, enabled = true }: { item: ChildItem; enabled?: boolean; className?: string; openDoc: (path: string) => Promise<string> }) {
  const { meta } = decodeVisualNotes(item.notes);
  if (!enabled) return null;
  return item.file_path ? (
    <ActivityImage path={item.file_path} title={item.title} openDoc={openDoc} className={className} />
  ) : (
    <ActivityPictogram id={pictogramForActivity(item.title, meta.pictogram)} tone={meta.tone} className={cn("h-11 w-11 rounded-xl", className)} />
  );
}

export default function VisualChildSchedule({
  child,
  children,
  items,
  onClose,
  addItem,
  updateItem,
  deleteItem,
  uploadDoc,
  copyDoc,
  openDoc,
  readOnly = false,
}: {
  child: Child;
  children: Child[];
  items: ChildItem[];
  onClose: () => void;
  addItem: (input: { childId: string; kind: "activity"; title: string; notes?: string; date?: string; time?: string; repeat?: ChildRepeatMode; filePath?: string }) => Promise<string>;
  updateItem: (id: string, patch: ChildItemPatch) => Promise<void>;
  toggleItem: (id: string, completed: boolean) => Promise<void>;
  deleteItem: (item: ChildItem) => Promise<void>;
  uploadDoc: (childId: string, file: File) => Promise<string>;
  copyDoc: (sourcePath: string, targetChildId: string) => Promise<string>;
  openDoc: (path: string) => Promise<string>;
  /** Barnets egen vy: bara titta, föräldern administrerar schemat. */
  readOnly?: boolean;
}) {
  const { t, locale } = useLang();
  const { openItems: quickItems, absorb } = useQuickflow();
  const [schedules] = useCloudSyncedStorage<Record<string, ChildScheduleEntry[]>>(SCHEDULE_KEY, {});
  const [picturePreferences, setPicturePreferences] = useCloudSyncedStorage<Record<string, boolean>>("myflove-child-picture-support", {});
  const showPictograms = picturePreferences[child.id] !== false;
  const [templates, setTemplates] = useCloudSyncedStorage<ChildScheduleTemplate[]>(TEMPLATE_KEY, []);
  const [mode, setMode] = useState<"week" | "today">("today");
  const [viewDate, setViewDate] = useState<string | null>(null);
  const [anchor, setAnchor] = useState(todayISO());
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ChildItem | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => defaultDraft(todayISO()));
  const [saving, setSaving] = useState(false);
  const [addChildIds, setAddChildIds] = useState<string[]>([child.id]);
  const ownedChildren = children.filter(candidate => candidate.owner_id === child.owner_id);
  const savingRef = useRef(false);
  const liveChildOwner = useRef(child.owner_id);
  liveChildOwner.current = child.owner_id;
  const mounted = useRef(true);
  const draftFilePaths = useRef<{ file: File | null; paths: Map<string, string> }>({ file: null, paths: new Map() });
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [search, setSearch] = useState("");
  const [pickerCategory, setPickerCategory] = useState<VisualActivityCategory | "alla">("alla");
  const [copying, setCopying] = useState<{ scope: "activity" | "day" | "week"; item?: ChildItem; sourceDate?: string } | null>(null);
  const [copyDate, setCopyDate] = useState(addDaysISO(todayISO(), 1));
  const [copyExtraDates, setCopyExtraDates] = useState<string[]>([]);
  const [copyChildId, setCopyChildId] = useState(child.id);
  const [includePrivateNote, setIncludePrivateNote] = useState(false);
  const [copyingNow, setCopyingNow] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [movingIds, setMovingIds] = useState<string[] | null>(null);
  const [moveDate, setMoveDate] = useState(todayISO());
  const [moveTime, setMoveTime] = useState("");
  const [movingNow, setMovingNow] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const dates = useMemo(() => weekDates(anchor), [anchor]);
  const childItems = useMemo(
    () => items.filter((item) => item.child_id === child.id && (item.kind === "activity" || item.kind === "task")),
    [items, child.id],
  );
  const schoolEntries = schedules[child.id] ?? [];
  // Lokal klocka som tickar – samma lokala tid som lib/day använder för "idag".
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  const nowDate = new Date(nowTick);
  const nowMinutes = localNowMinutes(nowDate);
  const today = todayISO(nowDate);
  const dayDate = viewDate ?? today;
  const dayChips = useMemo(() => weekDates(dayDate), [dayDate]);
  const isViewingToday = dayDate === today;
  const todayItems = useMemo(
    () => childItems.filter((item) => activityOccursOn(item, dayDate)).sort(compareDayItems),
    [childItems, dayDate],
  );
  const todayWeekday = (parseISODate(dayDate).getDay() + 6) % 7;
  const todaySchoolEntries = schoolEntries
    .filter((entry) => entry.weekday === todayWeekday)
    .sort((a, b) => a.start.localeCompare(b.start));
  const schoolAsActivities: ChildItem[] = todaySchoolEntries.map(entry => ({ id: `school-${entry.id}`, child_id: child.id, owner_id: child.owner_id, kind: "activity", title: entry.title, date: dayDate, time: entry.start, notes: encodeVisualNotes({ pictogram: "school", category: "skola", tone: "sky", endTime: entry.end }), completed: false, remind: false, repeat: "weekly", file_path: null, created_at: "", updated_at: "", sharedWith: [], shareNotify: {} }));
  const openToday = [...todayItems, ...schoolAsActivities];
  const { current, next } = isViewingToday ? pickNowNext(openToday, nowMinutes) : { current: null, next: null };
  const later = openToday.filter(item => item.time && item.id !== next?.id && minutesUntilTime(item.time, nowMinutes) > 0).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))[0];
  const nextPrompt = next?.time ? transitionPrompt(next.title, minutesUntilTime(next.time, nowMinutes)) : null;
  const wantsWarning = child.helps.includes("Förvarna vid förändringar");
  const quickMatches = quickItems.filter((item) => item.text.toLocaleLowerCase("sv").includes(child.name.toLocaleLowerCase("sv")));
  const pickerItems = useMemo(() => searchActivityBank(search, pickerCategory === "alla" ? undefined : pickerCategory), [search, pickerCategory]);
  const contextLabel = (meta: VisualActivityMeta) => meta.category === "familj" && meta.familyLabel
    ? `${t(FAMILY_LABELS[meta.familyLabel])}${meta.familyLabel === "child" ? ` · ${child.name}` : ""}`
    : t(CATEGORY_LABELS[meta.category]);

  const openAdd = (preset?: ActivityBankItem, date = mode === "today" ? dayDate : anchor) => {
    if (readOnly) return;
    setEditing(null);
    setAddChildIds([child.id]);
    draftFilePaths.current = { file: null, paths: new Map() };
    setDraft({ ...defaultDraft(date), ...(preset ? { title: preset.title, meta: preset } : {}) });
    setAdding(true);
  };

  const reorderItem = async (id: string, direction: -1 | 1) => {
    const list = [...todayItems];
    const index = list.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return;
    const source = list[index], destination = list[target];
    if (!source || !destination) return;
    [list[index], list[target]] = [destination, source];
    for (const [position, item] of list.entries()) {
      const decoded = decodeVisualNotes(item.notes);
      if (decoded.meta.order === position) continue;
      await updateItem(item.id, { notes: encodeVisualNotes({ ...decoded.meta, order: position }, decoded.note) });
    }
  };

  const openEdit = (item: ChildItem, occurrence?: string) => {
    if (readOnly) return;
    setEditingDate(occurrence ?? null);
    const decoded = decodeVisualNotes(item.notes);
    setDraft({ title: item.title, date: item.date ?? today, time: item.time?.slice(0, 5) ?? "", endTime: decoded.meta.endTime ?? "", repeat: item.repeat, note: decoded.note, meta: decoded.meta, file: null });
    setEditing(item);
    setAdding(true);
  };

  const removeEditing = async () => {
    if (!editing) return;
    const occurrence = editingDate ?? (mode === "today" ? dayDate : null);
    if (editing.repeat !== "none" && editing.date && occurrence && occurrence > editing.date) {
      if (!window.confirm(t("Ta bort från och med den här dagen? Tidigare dagar sparas."))) return;
      const decoded = decodeVisualNotes(editing.notes);
      await updateItem(editing.id, { notes: encodeVisualNotes({ ...decoded.meta, repeatUntil: addDaysISO(occurrence, -1) }, decoded.note) });
      toast.success(t("Tidigare dagar ligger kvar."));
    } else {
      if (!window.confirm(t("Ta bort aktiviteten?"))) return;
      await deleteItem(editing);
    }
    setAdding(false);
    setEditing(null);
  };

  const saveDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (readOnly || savingRef.current || !draft.title.trim() || !draft.date || !editing && !addChildIds.length) return;
    const owner = child.owner_id;
    const canContinue = async () => mounted.current && liveChildOwner.current === owner && isActiveOwner(owner) && (await getSyncUser())?.id === owner;
    if (!await canContinue()) return;
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    if (mode === "today") setViewDate(draft.date === today ? null : draft.date);
    else setAnchor(draft.date);
    try {
      const notes = encodeVisualNotes({ ...draft.meta, endTime: draft.endTime || undefined, ...(!editing && addChildIds.length > 1 ? { linkGroup: crypto.randomUUID() } : {}) }, draft.note);
      if (editing) {
        let filePath = editing.file_path ?? undefined;
        if (draft.file) filePath = await uploadDoc(child.id, draft.file);
        if (!await canContinue()) return;
        await updateItem(editing.id, { title: draft.title.trim(), date: draft.date, time: draft.time || null, repeat: draft.repeat, notes, file_path: filePath ?? null });
      } else {
        const fileForChild = async (target: string) => {
          if (!draft.file) return undefined;
          if (draftFilePaths.current.file !== draft.file) draftFilePaths.current = { file: draft.file, paths: new Map() };
          const paths = draftFilePaths.current.paths;
          if (paths.has(target)) return paths.get(target);
          const source = paths.values().next().value;
          const path = source ? await copyDoc(source, target) : await uploadDoc(target, draft.file);
          paths.set(target, path);
          return path;
        };
        const result = await addToChildSchedules({ owner, children: ownedChildren, selectedIds: addChildIds, items, input: { title: draft.title, date: draft.date, time: draft.time || undefined, repeat: draft.repeat, notes }, addItem, canContinue, fileForChild });
        if (!await canContinue()) return;
        if (result.failed.length) {
          setAddChildIds(result.failed);
          toast.error(t("Några barn återstår."), { description: `${result.created.length + result.skipped.length} ${t("klara. Tryck Spara igen för de återstående barnen.")}` });
          return;
        }
        if (result.skipped.length) toast.info(t("Aktiviteter som redan finns hoppades över."));
      }
      if (await canContinue()) { setAdding(false); setEditing(null); }
    } catch { if (mounted.current && liveChildOwner.current === owner) toast.error(t("Kunde inte spara aktiviteten.")); }
    finally { savingRef.current = false; if (mounted.current) setSaving(false); }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]);
  };

  const openMove = (ids: string[]) => {
    if (readOnly) return;
    const selected = childItems.filter((item) => ids.includes(item.id));
    if (!selected.length) return;
    const first = [...selected].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || (a.time ?? "99:99").localeCompare(b.time ?? "99:99"))[0];
    if (!first) return;
    setMoveDate(first.date ?? today);
    setMoveTime(selected.length === 1 ? first.time?.slice(0, 5) ?? "" : first.time?.slice(0, 5) ?? "");
    setMovingIds(ids);
  };

  const performMove = async () => {
    if (!movingIds?.length || !moveDate) return;
    const selected = childItems.filter((item) => movingIds.includes(item.id));
    const patches = buildMultiMovePatches(selected, moveDate, moveTime || undefined);
    const movingSet = new Set(movingIds);
    const occupied = new Set(childItems.filter((item) => !movingSet.has(item.id)).map((item) => activityDedupKey({ childId: item.child_id, title: item.title, date: item.date, time: item.time })));
    if (patches.some((patch) => {
      const source = selected.find((item) => item.id === patch.id);
      return source && occupied.has(activityDedupKey({ childId: source.child_id, title: source.title, date: patch.date, time: patch.time }));
    })) {
      toast.info(t("En aktivitet finns redan på den tiden."));
      return;
    }
    setMovingNow(true);
    try {
      for (const patch of patches) {
        const source = selected.find((item) => item.id === patch.id);
        if (!source) continue;
        const decoded = decodeVisualNotes(source.notes);
        const endTime = shiftEndTime(source.time, decoded.meta.endTime, patch.time);
        await updateItem(patch.id, {
          date: patch.date,
          time: patch.time,
          ...(endTime !== decoded.meta.endTime ? { notes: encodeVisualNotes({ ...decoded.meta, ...(endTime ? { endTime } : {}) }, decoded.note) } : {}),
        });
      }
      toast.success(t(patches.length === 1 ? "Aktiviteten har flyttats." : `${patches.length} aktiviteter har flyttats.`));
      setMovingIds(null);
      setSelectedIds([]);
      setSelectionMode(false);
    } catch {
      toast.error(t("Kunde inte flytta aktiviteterna."));
    } finally {
      setMovingNow(false);
    }
  };

  const moveByDrop = async (item: ChildItem, targetDate: string) => {
    if (readOnly) return;
    if (item.date === targetDate) return;
    await updateItem(item.id, { date: targetDate });
    toast.success(t("Aktiviteten har flyttats."));
  };

  const copyItems = async (source: ChildItem[], targetChildId: string, targetAnchor: string, sourceAnchor: string, sameDay = false) => {
    const existing = new Set<string>();
    let copied = 0;
    for (const item of source) {
      if (!item.date) continue;
      const targetDate = sameDay ? targetAnchor : shiftDateBetween(item.date, sourceAnchor, targetAnchor);
      const key = activityDedupKey({ childId: targetChildId, title: item.title, date: targetDate, time: item.time });
      if (existing.has(key) || hasChildActivityOn(items, { childId: targetChildId, title: item.title, date: targetDate, time: item.time })) continue;
      let filePath = item.file_path ?? undefined;
      if (filePath) filePath = await copyDoc(filePath, targetChildId);
      await addItem({ childId: targetChildId, kind: "activity", title: item.title, date: targetDate, time: item.time ?? undefined, notes: copiedVisualNotes(item.notes, targetChildId === item.child_id || includePrivateNote), filePath });
      existing.add(key);
      copied += 1;
    }
    return copied;
  };

  const performCopy = async () => {
    if (!copying) return;
    setCopyingNow(true);
    try {
      const source = copying.scope === "activity" && copying.item
        ? [copying.item]
        : copying.scope === "day" && copying.sourceDate
          ? childItems.filter((item) => activityOccursOn(item, copying.sourceDate!))
          : childItems.filter((item) => item.date && dates.includes(item.date));
      const sourceAnchor = copying.scope === "activity" ? copying.item?.date ?? today : copying.scope === "day" ? copying.sourceDate ?? today : dates[0] ?? today;
      let copied = 0;
      const targetDates = copying.scope === "day" ? [copyDate, ...copyExtraDates.filter((date) => date !== copyDate)] : [copyDate];
      for (const targetDate of targetDates) copied += await copyItems(source, copyChildId, targetDate, sourceAnchor, copying.scope !== "week");
      toast.success(t(copied ? `${copied} aktiviteter kopierades.` : "Aktiviteterna finns redan på måldatumet."));
      setCopying(null);
    } catch { toast.error(t("Kunde inte kopiera aktiviteterna.")); }
    finally { setCopyingNow(false); }
  };

  const openCopy = (scope: "activity" | "day" | "week", item?: ChildItem, sourceDate?: string) => {
    if (readOnly) return;
    const sourceAnchor = item?.date ?? sourceDate ?? dates[0] ?? today;
    setCopyDate(addDaysISO(sourceAnchor, scope === "week" ? 7 : 1));
    setCopyChildId(child.id);
    setCopyExtraDates([]);
    setIncludePrivateNote(false);
    setCopying({ scope, item, sourceDate });
  };

  const saveDayTemplate = (sourceDate: string) => {
    const source = childItems.filter((item) => item.date === sourceDate);
    if (!source.length) { toast.info(t("Dagen har inga aktiviteter att spara.")); return; }
    const name = window.prompt(t("Namn på mallen"), t("Min dagsmall"))?.trim();
    if (!name) return;
    setTemplates((currentTemplates) => [...currentTemplates, { id: crypto.randomUUID(), name, createdAt: new Date().toISOString(), items: source.map((item) => { const { meta } = decodeVisualNotes(item.notes); return { title: item.title, time: item.time?.slice(0, 5) ?? null, pictogram: meta.pictogram, category: meta.category, tone: meta.tone, ...(meta.familyLabel ? { familyLabel: meta.familyLabel } : {}) }; }) }]);
    toast.success(t("Mallen är sparad utan privata anteckningar."));
  };

  const applyTemplate = async (template: ChildScheduleTemplate, targetDate: string) => {
    const existing = new Set<string>();
    let copied = 0;
    for (const templateItem of template.items) {
      const key = activityDedupKey({ childId: child.id, title: templateItem.title, date: targetDate, time: templateItem.time });
      if (existing.has(key) || hasChildActivityOn(items, { childId: child.id, title: templateItem.title, date: targetDate, time: templateItem.time })) continue;
      await addItem({ childId: child.id, kind: "activity", title: templateItem.title, date: targetDate, time: templateItem.time ?? undefined, notes: encodeVisualNotes(templateItem) });
      existing.add(key); copied += 1;
    }
    toast.success(t(copied ? `${copied} aktiviteter lades till.` : "Aktiviteterna finns redan den dagen."));
  };

  const importQuickItem = async (text: string, remindAt?: number) => {
    const when = remindAt ? new Date(remindAt) : null;
    const date = when ? `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}-${String(when.getDate()).padStart(2, "0")}` : today;
    const time = when ? `${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}` : undefined;
    const key = activityDedupKey({ childId: child.id, title: text, date, time });
    if (!childItems.some((item) => activityDedupKey({ childId: item.child_id, title: item.title, date: item.date, time: item.time }) === key)) {
      await addItem({ childId: child.id, kind: "activity", title: text, date, time, notes: encodeVisualNotes({ pictogram: "bag", category: "hemma", tone: "mint" }) });
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
        {!readOnly && <Button type="button" variant={selectionMode ? "default" : "outline"} onClick={() => { setSelectionMode((currentMode) => !currentMode); setSelectedIds([]); }} className="h-10 rounded-xl px-3"><Check size={15} /><span className="hidden sm:inline">{t(selectionMode ? "Klar" : "Välj flera")}</span></Button>}
      </header>

      <div className="flex items-center justify-between gap-3 px-1">
        <label htmlFor={`child-picture-support-${child.id}`} className="flex min-h-11 items-center gap-2 text-sm"><Images size={16} aria-hidden />{t("Visa bildstöd")}</label>
        <Switch id={`child-picture-support-${child.id}`} checked={showPictograms} onCheckedChange={(enabled) => setPicturePreferences(current => ({ ...current, [child.id]: enabled }))} />
      </div>

      {mode === "today" && <p className="flex items-center justify-center gap-2 rounded-xl bg-lavender/70 px-4 py-2 text-center text-sm font-medium text-primary"><Heart size={15} fill="currentColor" /> {t("En sak i taget, i din takt.")} <Heart size={15} fill="currentColor" /></p>}

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1" role="tablist" aria-label={t("Välj schemavy") }>
        <Button type="button" variant={mode === "week" ? "default" : "ghost"} onClick={() => setMode("week")} className="h-10 rounded-lg shadow-none" role="tab" aria-selected={mode === "week"}>{t("Vecka")}</Button>
        <Button type="button" variant={mode === "today" ? "default" : "ghost"} onClick={() => { setMode("today"); setViewDate(null); }} className="h-10 rounded-lg shadow-none" role="tab" aria-selected={mode === "today"}>{t("Idag")}</Button>
      </div>

      {mode === "today" && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-7 gap-1" role="tablist" aria-label={t("Välj dag")}>
            {dayChips.map((date) => {
              const selected = date === dayDate;
              const isToday = date === today;
              return (
                <button key={date} type="button" role="tab" aria-selected={selected} aria-label={`${t(DAY_NAMES[(parseISODate(date).getDay() + 6) % 7] ?? "")} ${new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(parseISODate(date))}`}
                  onClick={() => setViewDate(isToday && selected ? null : date)}
                  className={cn("flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[11px] font-semibold transition-colors", selected ? "bg-primary text-primary-foreground shadow-soft" : isToday ? "border border-primary/40 bg-card text-primary" : "border border-border bg-card text-muted-foreground")}>
                  <span className="truncate">{t(SHORT_DAYS[(parseISODate(date).getDay() + 6) % 7] ?? "")}</span>
                  <span className={cn("text-[10px] font-medium", selected ? "text-primary-foreground/80" : "text-muted-foreground/80")}>{new Intl.DateTimeFormat(locale, { day: "numeric" }).format(parseISODate(date))}</span>
                  <span className={cn("h-1 w-1 rounded-full", isToday ? (selected ? "bg-primary-foreground" : "bg-primary") : "bg-transparent")} aria-hidden />
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-1">
            <Button type="button" variant="ghost" onClick={() => setViewDate(addDaysISO(dayDate, -1))} className="h-10 rounded-lg px-3" aria-label={t("Föregående dag")}>‹</Button>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
              <p className="truncate text-sm font-semibold text-ink">{isViewingToday ? t("Idag") : new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "short" }).format(parseISODate(dayDate))}</p>
              {!isViewingToday && <Button type="button" variant="outline" onClick={() => setViewDate(null)} className="h-8 rounded-full px-3 text-xs">{t("Till idag")}</Button>}
            </div>
            <Button type="button" variant="ghost" onClick={() => setViewDate(addDaysISO(dayDate, 1))} className="h-10 rounded-lg px-3" aria-label={t("Nästa dag")}>›</Button>
          </div>
        </div>
      )}

      {mode === "today" ? (
        <div className="space-y-5">
          {(current || next) ? (
            <section className="space-y-3 rounded-2xl border border-border bg-card p-3" aria-label={t("Nu och nästa") }>
              <div className="flex items-center gap-3">
                {current && <><span className={cn("h-12 w-1 shrink-0 rounded-full", CATEGORY_STYLES[decodeVisualNotes(current.notes).meta.category].marker)} aria-hidden />
                <ActivityVisual enabled={showPictograms} item={current} openDoc={openDoc} />
                 <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase text-primary">{t("Nu")}</p><p className="pace-type-activity font-display text-lg font-bold text-ink">{current.title}</p><p className="text-xs text-muted-foreground">{contextLabel(decodeVisualNotes(current.notes).meta)}</p>{current.time && <p className="pace-type-time text-sm text-muted-foreground">{current.time.slice(0, 5)}</p>}</div>
                </>}
              </div>
              {next && (
                <div className="border-t border-primary/15 pt-3">
                  <p className="text-xs font-bold uppercase text-muted-foreground">{t("Sedan")}</p>
                   <div className="mt-2 flex items-center gap-3"><span className={cn("h-10 w-1 shrink-0 rounded-full", CATEGORY_STYLES[decodeVisualNotes(next.notes).meta.category].marker)} aria-hidden /><ActivityVisual enabled={showPictograms} item={next} openDoc={openDoc} /><div><p className="font-semibold text-ink">{next.title}</p><p className="text-xs text-muted-foreground">{contextLabel(decodeVisualNotes(next.notes).meta)}</p>{next.time && <p className="text-sm text-muted-foreground">{next.time.slice(0, 5)}</p>}</div></div>
                  {wantsWarning && nextPrompt && <p className="mt-3 rounded-2xl bg-card/80 p-3 text-sm text-ink">{nextPrompt}</p>}
                </div>
              )}
              {later && <div className="border-t border-border pt-3"><p className="text-xs font-bold uppercase text-muted-foreground">{t("Sen")}</p><p className="mt-1 font-semibold">{later.title}</p><p className="text-sm text-muted-foreground">{later.time?.slice(0, 5)}</p></div>}
            </section>
          ) : (
            <div className="rounded-2xl bg-mint/45 p-5 text-center"><CheckCircle2 className="mx-auto mb-2 text-primary" /><p className="font-semibold text-ink">{isViewingToday ? t(todayItems.length ? "Dagens tider har passerat. Schemat finns kvar nedan." : "Inget inlagt idag än.") : t(todayItems.length ? "Dagens schema finns nedan." : "Inget inlagt den här dagen än.")}</p></div>
          )}

          {todaySchoolEntries.length > 0 && (
            <section className="space-y-2" aria-label={t("Skolschema idag")}>
              <h3 className="text-sm font-bold text-ink">{t("Skolschema idag")}</h3>
              {todaySchoolEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-sky bg-card px-3 py-2 shadow-sm">
                  {showPictograms && <ActivityPictogram id="school" tone="sky" className="h-10 w-10" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">{entry.start}{entry.end ? `–${entry.end}` : ""} · {t("återkommer varje vecka")}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          <div className="space-y-4">
            {(["Morgon", "Dag", "Efter skolan", "Kväll", "Utan tid"] as const).map((part) => {
              const partItems = todayItems.filter((item) => (item.time ? dayPart(item.time) : "Utan tid") === part);
              if (partItems.length === 0) return null;
               return <section key={part}><h3 className="mb-2 text-sm font-bold text-ink">{t(part)}</h3><ul className="space-y-2">{partItems.map((item) => {
                const isCurrent = current?.id === item.id;
                const isNext = next?.id === item.id;
                 const category = decodeVisualNotes(item.notes).meta.category;
                 return <li key={item.id} className={cn("flex items-center gap-2 rounded-xl border px-2 py-1.5 shadow-sm transition-opacity", CATEGORY_STYLES[category].subtle, (isCurrent || isNext) && "ring-1 ring-primary/30")}>
                   {selectionMode ? <Button type="button" variant={selectedIds.includes(item.id) ? "default" : "outline"} size="icon" onClick={() => toggleSelected(item.id)} className="h-10 w-10 shrink-0 rounded-full" aria-label={t("Välj aktivitet")}><Check size={16} /></Button> : null}
                    <ActivityVisual enabled={showPictograms} item={item} className="h-11 w-11 rounded-xl" openDoc={openDoc} /><div className="min-w-0 flex-1"><p className={"font-semibold text-ink"}>{item.title}</p><p className="text-xs text-muted-foreground"><span className="pace-type-time">{item.time?.slice(0, 5) || t("Ingen tid")}{decodeVisualNotes(item.notes).meta.endTime ? `–${decodeVisualNotes(item.notes).meta.endTime}` : ""}</span> · {contextLabel(decodeVisualNotes(item.notes).meta)}{isCurrent ? ` · ${t("Nu")}` : isNext ? ` · ${t("Nästa")}` : ""}{decodeVisualNotes(item.notes).meta.parentPresence === true ? ` · ${t("Behöver mig")}` : ""}</p></div>{!selectionMode && !readOnly && <div className="flex shrink-0"><div className="flex flex-col"><Button type="button" variant="ghost" size="icon" disabled={todayItems[0]?.id === item.id} onClick={() => void reorderItem(item.id, -1)} className="h-5 w-8 rounded-md" aria-label={t("Flytta upp")}><ChevronUp size={14} /></Button><Button type="button" variant="ghost" size="icon" disabled={todayItems[todayItems.length - 1]?.id === item.id} onClick={() => void reorderItem(item.id, 1)} className="h-5 w-8 rounded-md" aria-label={t("Flytta ner")}><ChevronDown size={14} /></Button></div><Button type="button" variant="ghost" size="icon" onClick={() => openMove([item.id])} className="h-10 w-10 rounded-full" aria-label={t("Flytta")}><Move size={16} /></Button><Button type="button" variant="ghost" size="icon" onClick={() => openEdit(item, dayDate)} className="h-10 w-10 rounded-full" aria-label={t("Ändra")}><Ellipsis size={18} /></Button></div>}</li>;
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
          <div className="grid min-w-0 grid-cols-7 gap-1 sm:gap-2" data-testid="family-week-grid">
            {dates.map((date, index) => {
               const dated = childItems.filter((item) => activityOccursOn(item, date)).sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
               const recurring = schoolEntries.filter((entry) => entry.weekday === index);
                return <section key={date} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const item = childItems.find((candidate) => candidate.id === event.dataTransfer.getData("text/plain")); if (item) void moveByDrop(item, date); }} className={cn("min-w-0 rounded-xl p-1 sm:p-2", DAY_COLUMN_CLASS[index], date === today && "ring-2 ring-primary")}><div className="mb-2 flex items-start justify-between gap-0.5"><button type="button" onClick={() => { setViewDate(date); setMode("today"); }} aria-label={`${t("Visa")} ${t(DAY_NAMES[index] ?? "")}`} className="min-w-0 flex-1 rounded-md text-center hover:bg-card/60"><p className="truncate text-[11px] font-bold text-ink sm:text-sm"><span className="sm:hidden">{t(SHORT_DAYS[index] ?? "")}</span><span className="hidden sm:inline">{t(DAY_NAMES[index] ?? "")}</span></p><p className="text-[10px] text-muted-foreground">{new Intl.DateTimeFormat(locale, { day: "numeric" }).format(parseISODate(date))}</p></button>{!readOnly && <Button type="button" variant="ghost" size="icon" onClick={() => openCopy("day", undefined, date)} className="h-6 w-6 rounded-full" aria-label={t("Kopiera dagen")}><Ellipsis size={13} /></Button>}</div><div className="space-y-1.5">{recurring.map((entry) => <div key={`school-${entry.id}`} className="rounded-lg border border-sky bg-sky/30 p-1 text-center shadow-sm">{showPictograms && <ActivityPictogram id="school" tone="sky" className="mx-auto h-8 w-8 rounded-lg" />}<p className="truncate text-[9px] font-bold text-ink sm:text-xs">{entry.title}</p></div>)}{dated.map((item) => { const { meta } = decodeVisualNotes(item.notes); return <Button key={`${item.id}-${date}`} type="button" variant="ghost" draggable={!selectionMode && !readOnly} onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} onClick={() => readOnly ? (setViewDate(date), setMode("today")) : selectionMode ? toggleSelected(item.id) : openEdit(item, date)} className={cn("h-auto min-h-14 w-full flex-col gap-0 whitespace-normal rounded-lg border p-1 text-center shadow-sm", CATEGORY_STYLES[meta.category].card, selectedIds.includes(item.id) && "ring-2 ring-primary")}><ActivityVisual enabled={showPictograms} item={item} className="h-8 w-8 rounded-lg" openDoc={openDoc} /><span className={"block max-w-full truncate text-[9px] font-bold text-ink sm:text-xs"}>{item.title}</span><span className="hidden text-[8px] text-muted-foreground sm:block">{contextLabel(meta)}</span></Button>; })}{!readOnly && <Button type="button" variant="ghost" onClick={() => openAdd(undefined, date)} className="h-9 w-full rounded-lg border border-dashed border-border bg-card/50 p-0" aria-label={`${t("Lägg till")} ${SHORT_DAYS[index]}`}><Plus size={14} /></Button>}</div></section>;
            })}
          </div>
          {!readOnly && <><Button type="button" variant="secondary" onClick={() => openAdd()} className="h-11 w-full rounded-xl"><Plus size={16} /> {t("Lägg till aktivitet")}</Button>
           <section className="space-y-2"><h3 className="text-sm font-bold text-ink">{t("Snabblänkar")}</h3><div className="grid grid-cols-3 gap-2"><Button type="button" variant="secondary" onClick={() => openAdd()} className="h-auto min-h-20 flex-col rounded-xl px-2 py-3"><Library /><span className="text-xs">{t("Aktivitetsbank")}</span></Button><Button type="button" variant="secondary" onClick={() => { openAdd(); window.setTimeout(() => galleryRef.current?.click(), 0); }} className="h-auto min-h-20 flex-col rounded-xl px-2 py-3"><Images /><span className="text-xs">{t("Egna bilder")}</span></Button><Button type="button" variant="secondary" onClick={() => openCopy("week")} className="h-auto min-h-20 flex-col rounded-xl px-2 py-3"><Copy /><span className="text-xs">{t("Kopiera vecka")}</span></Button></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => saveDayTemplate(anchor)} className="h-10 rounded-xl">{t("Spara dagen som mall")}</Button>{templates.map((template) => <Button key={template.id} type="button" variant="outline" onClick={() => void applyTemplate(template, anchor)} className="h-10 rounded-xl">{t(template.name)}</Button>)}</div></section></>}
        </div>
      )}

      {!readOnly && quickMatches.length > 0 && (
        <section className="rounded-3xl border border-border bg-sky/25 p-4"><h3 className="font-semibold text-ink">{t("Från Fånga")}</h3><div className="mt-2 space-y-2">{quickMatches.map((item) => <div key={item.id} className="flex items-center gap-2"><p className="min-w-0 flex-1 text-sm text-ink">{item.text}</p><Button type="button" variant="outline" onClick={() => void importQuickItem(item.text, item.remindAt)} className="h-11 rounded-2xl">{t("Lägg till")}</Button></div>)}</div></section>
      )}

      {!readOnly && !adding && mode === "today" && <div className="grid grid-cols-2 gap-2"><Button type="button" onClick={() => openAdd()} className="h-12 rounded-xl"><Plus size={18} /> {t("Lägg till")}</Button><Button type="button" variant="outline" onClick={() => openCopy("day", undefined, dayDate)} className="h-12 rounded-xl"><Copy size={17} /> {t("Kopiera dagen")}</Button></div>}

      {!readOnly && selectionMode && <div className="sticky bottom-20 z-20 flex items-center gap-2 rounded-2xl border border-primary/20 bg-card p-3 shadow-soft"><p className="min-w-0 flex-1 text-sm font-semibold text-ink">{t(`${selectedIds.length} valda`)}</p><Button type="button" onClick={() => openMove(selectedIds)} disabled={!selectedIds.length} className="h-11 rounded-xl"><Move size={16} /> {t("Flytta")}</Button></div>}

      <Dialog open={!!movingIds} onOpenChange={(open) => { if (!open) setMovingIds(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl p-4 sm:max-w-xl"><DialogTitle className="font-display text-lg font-bold text-ink">{t(movingIds && movingIds.length > 1 ? `Flytta ${movingIds.length} aktiviteter` : "Flytta aktivitet")}</DialogTitle>{movingIds && <section className="min-w-0 space-y-4" aria-label={t("Flytta aktiviteter")}><p className="text-sm text-muted-foreground">{t("Välj ny dag och tid. Samma aktiviteter uppdateras – inga kopior skapas.")}</p><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm font-medium text-ink"><span>{t("Ny dag")}</span><Input type="date" value={moveDate} onChange={(event) => setMoveDate(event.target.value)} className="h-12 rounded-xl" /></label><label className="space-y-1 text-sm font-medium text-ink"><span>{t(movingIds.length > 1 ? "Första aktivitetens tid" : "Ny tid")}</span><Input type="time" value={moveTime} onChange={(event) => setMoveTime(event.target.value)} className="h-12 rounded-xl" /></label></div>{movingIds.length > 1 && <p className="text-xs text-muted-foreground">{t("Aktiviteterna behåller sin ordning och samma tidsavstånd.")}</p>}<Button type="button" onClick={() => void performMove()} disabled={movingNow || !moveDate} className="h-12 w-full rounded-xl"><Move size={17} /> {movingNow ? t("Flyttar...") : t("Flytta")}</Button></section>}</DialogContent></Dialog>

      <Dialog open={!!copying} onOpenChange={(open) => { if (!open) setCopying(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl p-4 sm:max-w-xl"><DialogTitle className="font-display text-lg font-bold text-ink">{t(copying?.scope === "activity" ? "Kopiera aktivitet" : copying?.scope === "week" ? "Kopiera vecka" : "Kopiera dagen")}</DialogTitle>
      {copying && (
        <section id="child-copy-panel" className="min-w-0 space-y-4" aria-label={t("Kopiera till") }>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-ink"><span>{t(copying.scope === "week" ? "Veckan som börjar" : "Kopiera till datum")}</span><Input type="date" value={copyDate} onChange={(event) => setCopyDate(event.target.value)} className="h-12 rounded-xl" /><span className="flex flex-wrap gap-1.5 pt-1"><Button type="button" variant="outline" onClick={() => setCopyDate(today)} className="h-8 rounded-full px-3 text-xs">{t("Idag")}</Button><Button type="button" variant="outline" onClick={() => setCopyDate(addDaysISO(today, 1))} className="h-8 rounded-full px-3 text-xs">{t("Imorgon")}</Button>{copying.scope === "week" && <Button type="button" variant="outline" onClick={() => setCopyDate(addDaysISO(dates[0] ?? today, 7))} className="h-8 rounded-full px-3 text-xs">{t("Nästa vecka")}</Button>}</span></label>
            {children.length > 1 && <label className="space-y-1 text-sm font-medium text-ink"><span>{t("Kopiera till barn")}</span><select value={copyChildId} onChange={(event) => setCopyChildId(event.target.value)} className="h-12 w-full rounded-xl border border-border bg-card px-3">{children.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>}
          </div>
          {copying.scope === "day" && <fieldset className="space-y-2"><legend className="text-sm font-medium text-ink">{t("Flera dagar (valfritt)")}</legend><div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">{Array.from({ length: 7 }, (_, index) => addDaysISO(copyDate, index)).map((date) => { const selected = date === copyDate || copyExtraDates.includes(date); return <Button key={date} type="button" variant={selected ? "default" : "outline"} onClick={() => { if (date === copyDate) return; setCopyExtraDates((currentDates) => currentDates.includes(date) ? currentDates.filter((item) => item !== date) : [...currentDates, date]); }} className="h-auto min-h-11 flex-col rounded-lg px-1 py-1 text-xs" aria-pressed={selected}><span>{new Intl.DateTimeFormat(locale, { weekday: "short" }).format(parseISODate(date))}</span><span>{new Intl.DateTimeFormat(locale, { day: "numeric" }).format(parseISODate(date))}</span></Button>; })}</div></fieldset>}
          {copyChildId !== child.id && <label className="flex items-start gap-3 rounded-xl bg-card p-3 text-sm text-ink"><input type="checkbox" checked={includePrivateNote} onChange={(event) => setIncludePrivateNote(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" /><span><strong>{t("Ta med privata anteckningar")}</strong><span className="mt-0.5 block text-xs text-muted-foreground">{t("Av som standard så barnspecifika uppgifter inte följer med.")}</span></span></label>}
          <p className="text-xs text-muted-foreground">{t("Originalet ändras inte och exakta dubbletter hoppas över.")}</p>
          <Button type="button" onClick={() => void performCopy()} disabled={copyingNow || !copyDate} className="h-12 w-full rounded-xl"><Copy size={17} /> {copyingNow ? t("Kopierar...") : t("Kopiera")}</Button>
        </section>
      )}
      </DialogContent></Dialog>

      <MulberryAttribution />

      <Dialog open={adding} onOpenChange={(open) => { if (!savingRef.current && !open) { setAdding(false); setEditing(null); } }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl p-4 sm:max-w-xl">
          <DialogTitle className="sr-only">{t(editing ? "Ändra aktivitet" : "Lägg till aktivitet")}</DialogTitle>
        <form onSubmit={saveDraft}><fieldset disabled={saving} className="min-w-0 space-y-4">
          <h3 className="pr-8 font-display text-lg font-bold text-ink">{t(editing ? "Ändra aktivitet" : "Lägg till aktivitet")}</h3>
          {!editing && ownedChildren.length > 1 && <ChildScheduleRecipients children={ownedChildren} selectedIds={addChildIds} onChange={setAddChildIds} disabled={saving} />}
          <Accordion type="single" collapsible defaultValue={editing ? undefined : "bank"} className="rounded-2xl border border-border bg-card px-3"><AccordionItem value="bank" className="border-0"><AccordionTrigger>{t(editing ? "Byt pictogram" : "Pictogram")}</AccordionTrigger><AccordionContent><div className="space-y-3"><div className="relative"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Sök aktivitet") } className="h-11 rounded-xl pl-9" /></div><div className="flex gap-1.5 overflow-x-auto pb-1"><Button type="button" variant={pickerCategory === "alla" ? "default" : "outline"} onClick={() => setPickerCategory("alla")} className="h-9 shrink-0 rounded-full px-3">{t("Alla")}</Button>{CATEGORY_KEYS.map((category) => <Button key={category} type="button" variant={pickerCategory === category ? "default" : "outline"} onClick={() => setPickerCategory(category)} className="h-9 shrink-0 rounded-full px-3">{t(CATEGORY_LABELS[category])}</Button>)}</div><div className="grid max-h-[40dvh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">{pickerItems.map((preset) => <Button key={`${preset.category}-${preset.title}`} type="button" variant="outline" onClick={() => setDraft((currentDraft) => ({ ...currentDraft, ...(!editing ? { title: preset.title } : {}), meta: { ...currentDraft.meta, ...preset, ...(currentDraft.endTime ? { endTime: currentDraft.endTime } : {}) } }))} className={cn("h-auto min-h-20 min-w-0 flex-col whitespace-normal rounded-xl px-1 py-2", CATEGORY_STYLES[preset.category].subtle, draft.meta.pictogram === preset.pictogram && "ring-2 ring-primary")}><ActivityPictogram id={preset.pictogram} tone={preset.tone} className="h-10 w-10" iconClassName="h-6 w-6" /><span className="text-xs">{t(preset.title)}</span></Button>)}</div>{pickerItems.length === 0 && <p className="py-3 text-center text-sm text-muted-foreground">{t("Inga pictogram hittades.")}</p>}</div></AccordionContent></AccordionItem></Accordion>
          <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={t("Aktivitetens namn")} className="h-12 rounded-2xl" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><label className="col-span-2 space-y-1 text-sm font-medium text-ink sm:col-span-1"><span>{t("Dag")}</span><Input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} className="h-12 rounded-2xl" />{/^\d{4}-\d{2}-\d{2}$/.test(draft.date) && <span className="block text-xs font-semibold text-primary">{new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "short" }).format(parseISODate(draft.date))}</span>}</label><label className="space-y-1 text-sm font-medium text-ink"><span>{t("Starttid")}</span><Input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} className="h-12 rounded-2xl" /></label><label className="space-y-1 text-sm font-medium text-ink"><span>{t("Sluttid")}</span><Input type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} className="h-12 rounded-2xl" /></label></div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"><ActivityPictogram id={draft.meta.pictogram} tone={draft.meta.tone} /><div><p className="text-sm font-semibold text-ink">{t("Valt pictogram")}</p><p className="text-xs text-muted-foreground">{t(CATEGORY_LABELS[draft.meta.category])}</p></div></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><label className="space-y-1 text-sm font-medium text-ink"><span>{t("Område")}</span><select value={draft.meta.category} onChange={(event) => { const category = event.target.value as VisualActivityCategory; setDraft({ ...draft, meta: { ...draft.meta, category, ...(category === "familj" ? { familyLabel: draft.meta.familyLabel ?? "shared" } : { familyLabel: undefined }) } }); }} className={cn("h-12 w-full rounded-2xl border px-3", CATEGORY_STYLES[draft.meta.category].subtle)}>{CATEGORY_KEYS.map((category) => <option key={category} value={category}>{t(CATEGORY_LABELS[category])}</option>)}</select></label><label className="space-y-1 text-sm font-medium text-ink"><span>{t("Återkommer")}</span><select value={draft.repeat} onChange={(event) => setDraft({ ...draft, repeat: event.target.value as ChildRepeatMode })} className="h-12 w-full rounded-2xl border border-border bg-card px-3"><option value="none">{t("Inte återkommande")}</option><option value="daily">{t("Varje dag")}</option><option value="weekdays">{t("Vardagar")}</option><option value="weekly">{t("Varje vecka")}</option></select></label></div>
          {draft.meta.category === "familj" && <label className="space-y-1 text-sm font-medium text-ink"><span>{t("Gäller inom Familj")}</span><select value={draft.meta.familyLabel ?? "shared"} onChange={(event) => setDraft({ ...draft, meta: { ...draft.meta, familyLabel: event.target.value as FamilyActivityLabel } })} className={cn("h-12 w-full rounded-2xl border px-3", CATEGORY_STYLES.familj.subtle)}><option value="child">{t(`Barn · ${child.name}`)}</option><option value="shared">{t("Familj gemensamt")}</option><option value="caregiver">{t("Förälder/omsorg")}</option></select></label>}
          <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-3">
            <p className="text-sm font-semibold text-ink">{t("Behöver mig")}</p>
            <p className="text-xs text-muted-foreground">{t("Frivilligt. Handlar om dig, inte om barnet.")}</p>
            <label className="flex items-center justify-between gap-2 text-sm text-ink">
              <span>{t("Jag behöver vara med")}</span>
              <Switch checked={draft.meta.parentPresence === true} onCheckedChange={(checked) => setDraft({ ...draft, meta: { ...draft.meta, parentPresence: checked } })} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-sm font-medium text-ink"><span>{t("Förberedelse")}</span>
                <select value={draft.meta.prepMinutes ?? 0} onChange={(event) => setDraft({ ...draft, meta: { ...draft.meta, prepMinutes: Number(event.target.value) || undefined } })} className="h-12 w-full rounded-2xl border border-border bg-card px-3">
                  <option value={0}>{t("Ingen")}</option>
                  {PREP_MINUTE_CHOICES.map((m) => <option key={m} value={m}>{`${m} min`}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium text-ink"><span>{t("Resa")}</span>
                <select value={draft.meta.travelMinutes ?? 0} onChange={(event) => setDraft({ ...draft, meta: { ...draft.meta, travelMinutes: Number(event.target.value) || undefined } })} className="h-12 w-full rounded-2xl border border-border bg-card px-3">
                  <option value={0}>{t("Ingen")}</option>
                  {TRAVEL_MINUTE_CHOICES.map((m) => <option key={m} value={m}>{`${m} min`}</option>)}
                </select>
              </label>
            </div>
            <label className="flex items-center justify-between gap-2 text-sm text-ink">
              <span>{t("Lugn stund efteråt")}</span>
              <Switch checked={!!draft.meta.recoveryAfter} onCheckedChange={(checked) => setDraft({ ...draft, meta: { ...draft.meta, recoveryAfter: checked || undefined } })} />
            </label>
          </div>
          <Input value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder={t("Kort anteckning (valfritt)")} className="h-12 rounded-2xl" />
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(event) => setDraft({ ...draft, file: event.target.files?.[0] ?? null })} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => setDraft({ ...draft, file: event.target.files?.[0] ?? null })} />
          <div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={() => void deviceAccessReady().then((ok) => (ok ? cameraRef.current?.click() : toast.error(UPDATE_APP_FOR_DEVICE_ACCESS)))} className="h-12 rounded-2xl"><Camera size={17} /> {t("Ta foto")}</Button><Button type="button" variant="outline" onClick={() => galleryRef.current?.click()} className="h-12 rounded-2xl"><ImagePlus size={17} /> {t("Egna bilder")}</Button></div>
          {draft.file && <p className="truncate text-xs text-muted-foreground">{draft.file.name}</p>}
          <p className="text-xs text-muted-foreground">{t("Bilden är privat och öppnas bara med en tillfällig säker länk.")}</p>
          <div className="flex flex-wrap gap-2"><Button type="submit" disabled={saving || !draft.title.trim() || !editing && !addChildIds.length} className="h-12 rounded-2xl">{saving ? t("Sparar...") : !editing && addChildIds.length > 1 ? `${t("Spara för")} ${addChildIds.length} ${t("barn")}` : t("Spara")}</Button>{editing && <Button type="button" variant="outline" onClick={() => openMove([editing.id])} className="h-12 rounded-2xl"><Move size={16} /> {t("Flytta")}</Button>}{editing && <Button type="button" variant="outline" onClick={() => void removeEditing()} className="h-12 rounded-2xl text-destructive"><Trash2 size={16} /> {t("Ta bort")}</Button>}</div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays size={13} /> {t("Aktiviteten visas också i familjens vanliga dag och kalender.")}</p>
        </fieldset></form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
