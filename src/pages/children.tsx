import { PacePageHeader } from "@/components/paceable/page-header";
import { openSignedDocument } from "@/lib/open-signed-document";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useClerk, Show } from "@clerk/react";
import Layout from "@/components/layout";
import { MyFlovePageGrid, MyFloveWide } from "@/components/myflove/block";
import { MyFloveEmptyIllustration } from "@/components/myflove/motion";
import { REPEAT_LABELS, type RepeatMode } from "@/lib/recurrence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Baby,
  Plus,
  Trash2,
  Users,
  Lock,
  Check,
  CalendarDays,
  CheckCircle2,
  Circle,
  StickyNote,
  Paperclip,
  BellRing,
  Loader2,
} from "lucide-react";
import { ChildConflictDialog } from "@/components/child-conflict-dialog";
import {
  useChildren,
  CHILD_COLORS,
  type ChildItem,
  type ChildItemKind,
} from "@/hooks/use-children";
import { useToast } from "@/hooks/use-toast";
import { syncReminder, cancelReminder } from "@/lib/push.functions";
import { celebrateFromEvent } from "@/lib/celebrate";
import { emitActivityDone } from "@/lib/activity-energy-event";
import { decodeVisualNotes } from "@/lib/child-visual-schedule";

import CollapsibleSection from "@/components/collapsible-section";
import ChildSchedule from "@/components/child-schedule";
import { useChildEvents } from "@/hooks/use-child-events";
import ChildReminderSettings from "@/components/child-reminder-settings";
import { ACCEPT_DOCUMENTS } from "@/lib/file-formats";
import ChildProfiles, { ChildProfileDetail } from "@/components/family/child-profiles";
import VisualChildSchedule from "@/components/family/visual-child-schedule";
import FamilySituation from "@/components/family/family-situation";
import type { SituationLogEntry } from "@/components/family/situation-log";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

const KIND_META: Record<ChildItemKind, { label: string; icon: typeof Baby }> = {
  activity: { label: "Aktivitet", icon: CalendarDays },
  task: { label: "Att göra", icon: CheckCircle2 },
  note: { label: "Anteckning", icon: StickyNote },
  doc: { label: "Dokument", icon: Paperclip },
};

const FILTERS: { id: "alla" | ChildItemKind; label: string }[] = [
  { id: "alla", label: "Allt" },
  { id: "activity", label: "Aktiviteter" },
  { id: "task", label: "Att göra" },
  { id: "note", label: "Anteckningar" },
  { id: "doc", label: "Dokument" },
];

function ChildrenContent() {
  const {
    userId,
    children,
    items,
    members,
    setChildAccount,
    loading,
    error,
    reload,
    addChild,
    updateChild,
    deleteChild,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    setItemShares,
    uploadDoc,
    copyDoc,
    openDoc,
    conflict,
    resolveConflict,
  } = useChildren();
  const { toast } = useToast();
  const sync = useServerFn(syncReminder);
  const cancel = useServerFn(cancelReminder);

  const [childName, setChildName] = useState("");
  const [childColor, setChildColor] = useState(CHILD_COLORS[0] as string);
  const [childBirth, setChildBirth] = useState("");
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [view, setView] = useState<"overview" | "profile" | "schedule" | "help" | "details">("overview");
  const [situationLog, setSituationLog] = useCloudSyncedStorage<SituationLogEntry[]>("myflove-situation-log", []);
  const [filter, setFilter] = useState<"alla" | ChildItemKind>("alla");
  const [addChildOpen, setAddChildOpen] = useState(false);

  const [kind, setKind] = useState<ChildItemKind>("activity");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [remind, setRemind] = useState(true);
  const [repeat, setRepeat] = useState<RepeatMode>("none");
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const myChildren = useMemo(
    () => children.filter((c) => c.owner_id === userId),
    [children, userId],
  );
  const sharedChildren = useMemo(
    () => children.filter((c) => c.owner_id !== userId),
    [children, userId],
  );

  const [openWeekFromCalendar, setOpenWeekFromCalendar] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("vecka") === "1") {
      setOpenWeekFromCalendar(true);
      setView("schedule");
    }
  }, []);
  const activeChildId = selectedChild ?? myChildren[0]?.id ?? sharedChildren[0]?.id ?? null;
  const activeChild = children.find((c) => c.id === activeChildId) ?? null;
  const isOwner = activeChild?.owner_id === userId;

  const visibleItems = useMemo(
    () =>
      items
        .filter((i) => i.child_id === activeChildId)
        .filter((i) => (filter === "alla" ? true : i.kind === filter))
        .sort((a, b) => {
          if (a.kind === "task" && b.kind === "task" && a.completed !== b.completed) return a.completed ? 1 : -1;
          return (a.date ?? "9999").localeCompare(b.date ?? "9999");
        }),
    [items, activeChildId, filter],
  );

  /** Dagens hållpunkter för valt barn – skolschema och tidsatta aktiviteter. */
  const childEvents = useChildEvents();
  const todaysPoints = useMemo(
    () => (activeChild ? childEvents.filter((e) => e.childId === activeChild.id) : []),
    [childEvents, activeChild],
  );

  const memberName = (id: string) =>
    members.find((m) => m.user_id === id)?.display_name ?? "Familjemedlem";

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) return;
    try {
      await addChild(childName.trim(), childColor, childBirth || undefined);
      setChildName("");
      setChildBirth("");
    } catch {
      toast({ description: "Kunde inte lägga till barnet.", variant: "destructive" });
    }
  };

  const openChild = (id: string, next: typeof view) => {
    setSelectedChild(id);
    setView(next);
  };

  const scheduleReminder = async (id: string, itemTitle: string, d: string, t: string) => {
    const [h, m] = t.split(":").map(Number);
    const [y, mo, day] = d.split("-").map(Number);
    const when = new Date(y as number, (mo ?? 1) - 1, day as number, h ?? 0, m ?? 0);
    if (when.getTime() < Date.now() + 30_000) return;
    try {
      await sync({
        data: {
          clientKey: `child:${id}`,
          kind: "custom",
          title: itemTitle,
          body: `Kl ${t}`,
          deliverAt: when.toISOString(),
          url: "/barn",
        },
      });
    } catch {
      /* påminnelsen är ett tillägg – tyst fel räcker */
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChildId || !title.trim()) return;
    setSaving(true);
    try {
      let filePath: string | undefined;
      if (kind === "doc" && pendingFile) {
        filePath = await uploadDoc(activeChildId, pendingFile);
      }
      const id = await addItem({
        childId: activeChildId,
        kind,
        title: title.trim(),
        notes: notes.trim() || undefined,
        date: date || undefined,
        time: time || undefined,
        remind: remind && !!date && !!time,
        repeat,
        filePath,
      });
      if (remind && date && time) await scheduleReminder(id, title.trim(), date, time);
      setTitle("");
      setDate("");
      setTime("");
      setRepeat("none");
      setNotes("");
      setPendingFile(null);
      if (fileInput.current) fileInput.current.value = "";
      toast({ description: "Sparat – bara du ser det tills du delar." });
    } catch (err) {
      toast({
        description: err instanceof Error ? err.message : "Kunde inte spara.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: ChildItem, e: React.MouseEvent) => {
    if (item.kind !== "task" || item.owner_id !== userId) return;
    const next = !item.completed;
    if (next) celebrateFromEvent(e);
    await toggleItem(item.id, next);
    if (next) await cancel({ data: { clientKey: `child:${item.id}` } }).catch(() => {});
    // Genomförd familjeaktivitet → samma frivilliga "Hur kändes det?" som i övriga appen.
    if (next)
      emitActivityDone({
        id: `child-${item.id}`,
        title: item.title,
        ...(item.date ? { dueDate: item.date } : {}),
      });
  };


  const handleShareToggle = async (item: ChildItem, memberId: string) => {
    const next = item.sharedWith.includes(memberId)
      ? item.sharedWith.filter((u) => u !== memberId)
      : [...item.sharedWith, memberId];
    try {
      await setItemShares(item.id, next);
    } catch {
      toast({ description: "Kunde inte ändra delningen.", variant: "destructive" });
    }
  };

  const shareWithAll = async (item: ChildItem) => {
    try {
      await setItemShares(
        item.id,
        members.map((m) => m.user_id),
      );
    } catch {
      toast({ description: "Kunde inte dela med familjen.", variant: "destructive" });
    }
  };

  const handleOpenDoc = async (path: string) => {
    try {
      await openSignedDocument(() => openDoc(path));
    } catch {
      toast({ description: "Kunde inte öppna dokumentet.", variant: "destructive" });
    }
  };

  if (loading && children.length === 0 && !error)
    return <div className="py-16 text-center text-muted-foreground">Laddar barn...</div>;
  if (error && children.length === 0)
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="rounded-2xl" onClick={() => void reload()}>
          Försök igen
        </Button>
      </div>
    );

  return (
    <div className="space-y-8">
      <ChildConflictDialog conflict={conflict} onResolve={(c) => void resolveConflict(c)} />
      {view === "overview" && <ChildProfiles
        childrenList={children}
        userId={userId}
        onAdd={async (d) => { await addChild(d.name, CHILD_COLORS[0] ?? "", undefined, undefined, { helps: d.helps, avatar: d.avatar }); }}
        onUpdate={async (id, d) => { await updateChild(id, { name: d.name, helps: d.helps, avatar: d.avatar }); }}
        onDelete={deleteChild}
        onSelect={(child) => openChild(child.id, "profile")}
        onSchedule={(child) => openChild(child.id, "schedule")}
        onHelp={(child) => openChild(child.id, "help")}
      />}

      {view !== "overview" && activeChild && <div className="space-y-4">
        {view === "profile" && <ChildProfileDetail child={activeChild} canEdit={isOwner} members={members} onLinkAccount={setChildAccount} onBack={() => setView("overview")} onSchedule={() => setView("schedule")} onHelp={() => setView("help")} onUpdate={async (id, d) => { await updateChild(id, { name: d.name, helps: d.helps, avatar: d.avatar }); }} onDelete={deleteChild} />}
        {view === "help" && <div className="flex items-center gap-3"><Button variant="ghost" type="button" onClick={() => setView("profile")}>← {activeChild.name}</Button><span aria-hidden className="text-2xl">{activeChild.avatar || "💜"}</span><h2 className="truncate font-display text-xl font-bold text-ink">{activeChild.name}</h2></div>}
        {view === "schedule" && <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-muted-foreground">Barnens vecka:</span>{children.map((kid) => <Button key={kid.id} type="button" size="sm" variant={kid.id === activeChild.id ? "default" : "outline"} className="min-h-11 rounded-xl" onClick={() => { setOpenWeekFromCalendar(true); setSelectedChild(kid.id); }}>{kid.name}</Button>)}</div>}
        {view === "schedule" && <VisualChildSchedule key={activeChild.id} initialMode={openWeekFromCalendar ? "week" : "today"} child={activeChild} children={children} items={items} onClose={() => setView("profile")} addItem={addItem} updateItem={updateItem} toggleItem={toggleItem} deleteItem={deleteItem} uploadDoc={uploadDoc} copyDoc={copyDoc} openDoc={openDoc} />}
        {view === "help" && <FamilySituation key={activeChild.id} selectedChildId={activeChild.id} childrenList={[{ id: activeChild.id, name: activeChild.name, helps: activeChild.helps }]} onSaveHelp={(id, helps) => updateChild(id, { helps })} log={(situationLog ?? []).filter((entry) => entry.childId === activeChild.id || (!entry.childId && entry.who === activeChild.name))} onChangeLog={(update) => setSituationLog((prev) => update(prev ?? []))} />}
        {view === "profile" && <Button variant="link" type="button" onClick={() => setView("details")} className="px-0">Aktiviteter, anteckningar och dokument →</Button>}
      </div>}

      {/* Befintliga detaljflöden finns kvar bakom barnets profil. */}
      {view === "details" && <><section className="space-y-3">
        <Button variant="ghost" type="button" onClick={() => setView("profile")}>← {activeChild?.name ?? "Barn"}</Button>
        <div className="flex gap-2 flex-wrap">
          {children.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedChild(c.id)}
              aria-pressed={c.id === activeChildId}
              className={`px-4 py-2 rounded-2xl border flex items-center gap-2 transition-colors ${
                c.id === activeChildId ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
              {c.owner_id !== userId && (
                <span className="text-xs text-muted-foreground">delat med dig</span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAddChildOpen((v) => !v)}
            aria-expanded={addChildOpen}
            className="px-4 py-2 rounded-2xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-ink flex items-center gap-1"
          >
            <Plus size={16} /> Lägg till barn
          </button>
        </div>

        {addChildOpen && (
          <form onSubmit={handleAddChild} className="surface-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Barnets namn"
                className="h-11 rounded-2xl"
              />
              <Input
                type="date"
                value={childBirth}
                onChange={(e) => setChildBirth(e.target.value)}
                aria-label="Födelsedatum"
                className="h-11 rounded-2xl sm:w-44"
              />
              <Button type="submit" className="h-11 rounded-2xl">
                <Plus size={18} className="mr-1" /> Lägg till
              </Button>
            </div>
            <div className="flex gap-2">
              {CHILD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Färg ${c}`}
                  onClick={() => setChildColor(c)}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                  style={{
                    backgroundColor: c,
                    borderColor: childColor === c ? "var(--foreground)" : "transparent",
                  }}
                >
                  {childColor === c && <Check size={14} className="text-primary-foreground drop-shadow" />}
                </button>
              ))}
            </div>
          </form>
        )}
      </section>

      {activeChild && (
        <>
          <section className="surface-card space-y-3 p-5">
            <h2 className="font-display text-base text-ink">Idag för {activeChild.name}</h2>
            {todaysPoints.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inga tider inlagda idag.</p>
            ) : (
              <ul className="space-y-1.5">
                {todaysPoints.map((e, i) => (
                  <li
                    key={`${e.time}-${e.title}-${i}`}
                    className={`flex items-start gap-3 rounded-2xl border border-border bg-card px-3 py-2 text-sm ${
                      "text-ink"
                    }`}
                  >
                    <span className="font-mono text-xs pt-0.5 text-muted-foreground">{e.time}</span>
                    <span className="min-w-0 flex-1 truncate">{e.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {isOwner && (
            <section className="pace-card-surface surface-card p-5">
              <CollapsibleSection
                title={`Lägg till för ${activeChild.name}`}
                id="Lägg till för barn"
                defaultCollapsed
                headingClassName="text-lg font-semibold"
                className="space-y-3"
              >
                <form onSubmit={handleAddItem} className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(KIND_META) as ChildItemKind[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        aria-pressed={kind === k}
                        className={`px-3 py-1.5 rounded-full text-sm border ${
                          kind === k
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {KIND_META[k].label}
                      </button>
                    ))}
                  </div>

                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={kind === "note" ? "Rubrik på anteckningen" : "Vad gäller det?"}
                    className="h-11 rounded-2xl"
                  />

                  {(kind === "activity" || kind === "task") && (
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        aria-label="Datum"
                        className="h-11 rounded-2xl"
                      />
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        aria-label="Tid"
                        className="h-11 rounded-2xl w-32"
                      />
                    </div>
                  )}

                  {(kind === "activity" || kind === "task") && (
                    <div className="flex flex-wrap gap-2">
                      {(["none", "daily", "weekdays", "weekly"] as RepeatMode[]).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setRepeat(val)}
                          className={`px-3 py-2 rounded-2xl border text-sm transition-colors ${
                            repeat === val
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:border-primary/40"
                          }`}
                        >
                          {REPEAT_LABELS[val]}
                        </button>
                      ))}
                    </div>
                  )}

                  {kind === "doc" && (
                    <input
                      ref={fileInput}
                      type="file"
                      accept={ACCEPT_DOCUMENTS}
                      aria-label="Välj dokument"
                      onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-muted-foreground"
                    />
                  )}

                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anteckning (valfritt)"
                    className="h-11 rounded-2xl"
                  />

                  {(kind === "activity" || kind === "task") && (
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={remind}
                        onChange={(e) => setRemind(e.target.checked)}
                      />
                      <BellRing size={15} /> Påminn mig när det är dags
                    </label>
                  )}

                  <Button type="submit" disabled={saving} className="h-11 rounded-2xl w-full">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : "Spara"}
                  </Button>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock size={12} /> Allt du lägger in är privat tills du väljer att dela det.
                  </p>
                </form>
              </CollapsibleSection>
            </section>
          )}

           {/* Alla poster finns kvar, men tidslinjen ovan är första nivån. */}
           <CollapsibleSection id="barn-all-items" title={`Alla aktiviteter och dokument för ${activeChild.name}`} defaultCollapsed className="pace-card-surface surface-card p-4" headingClassName="text-base font-semibold text-ink">
           <section className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  aria-pressed={filter === f.id}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    filter === f.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {visibleItems.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                <MyFloveEmptyIllustration kind="default" className="mb-2 block" />
                Inget här än – lugnt, det kommer.
              </p>
            ) : (
              <ul className="space-y-2">
                {visibleItems.map((item) => {
                  const Icon = KIND_META[item.kind].icon;
                  const mine = item.owner_id === userId;
                  const displayNote = decodeVisualNotes(item.notes).note
                    .replace(/^\[myflove-visual:[^\]\n]*\]\r?\n?/, "")
                    .trim();
                  return (
                    <li key={item.id} className="surface-card p-4 space-y-2">
                      <div className="flex items-start gap-3">
                        {item.kind === "task" ? (
                          <button
                            type="button"
                            onClick={(e) => handleToggle(item, e)}
                            aria-label={item.completed ? "Markera som ej klar" : "Markera som klar"}
                            className="mt-0.5 text-primary"
                            disabled={!mine}
                          >
                            {item.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </button>
                        ) : (
                          <Icon size={20} className="mt-0.5 text-muted-foreground" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-medium ${item.kind === "task" && item.completed ? "line-through text-muted-foreground" : ""}`}
                          >
                            {item.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {[KIND_META[item.kind].label, item.date, item.time]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                           {displayNote && <p className="mt-1 break-words text-sm">{displayNote}</p>}
                          {item.file_path && (
                            <button
                              type="button"
                              onClick={() => handleOpenDoc(item.file_path as string)}
                              className="text-sm text-primary underline mt-1"
                            >
                              Öppna dokumentet
                            </button>
                          )}
                        </div>
                        {mine && (
                          <button
                            type="button"
                            onClick={() => deleteItem(item)}
                            aria-label="Ta bort"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>

                      {mine && (
                        <div className="pt-1 border-t border-border/60">
                          <button
                            type="button"
                            onClick={() => setShareOpen(shareOpen === item.id ? null : item.id)}
                            className="text-sm flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                          >
                            {item.sharedWith.length === 0 ? (
                              <>
                                <Lock size={14} /> Bara du
                              </>
                            ) : (
                              <>
                                <Users size={14} /> Delad med{" "}
                                {item.sharedWith.map(memberName).join(", ")}
                              </>
                            )}
                          </button>

                          {shareOpen === item.id && (
                            <div className="mt-2 space-y-2">
                              {members.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  Du behöver skapa eller gå med i en familj för att kunna dela.{" "}
                                  <a href="/familj" className="text-primary underline">
                                    Gå till Familj
                                  </a>
                                </p>
                              ) : (
                                <>
                                  <div className="flex gap-2 flex-wrap">
                                    {members.map((m) => {
                                      const on = item.sharedWith.includes(m.user_id);
                                      return (
                                        <button
                                          key={m.user_id}
                                          type="button"
                                          onClick={() => handleShareToggle(item, m.user_id)}
                                          aria-pressed={on}
                                          className={`px-3 py-1.5 rounded-full text-sm border flex items-center gap-1.5 ${
                                            on
                                              ? "border-primary bg-primary/10 text-primary"
                                              : "border-border text-muted-foreground"
                                          }`}
                                        >
                                          <span
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: m.color }}
                                          />
                                          {m.display_name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="rounded-2xl h-9"
                                      onClick={() => shareWithAll(item)}
                                    >
                                      Dela med hela familjen
                                    </Button>
                                    {item.sharedWith.length > 0 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="rounded-2xl h-9"
                                        onClick={() => setItemShares(item.id, [])}
                                      >
                                        Sluta dela
                                      </Button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
           </section>
           </CollapsibleSection>

           <CollapsibleSection
            title="Mer om barnen"
            id="barn-mer"
            defaultCollapsed
            headingClassName="text-lg font-semibold"
            className="surface-card space-y-4 p-5"
          >
            <ChildSchedule
              childId={activeChild.id}
              childName={activeChild.name}
              canEdit={isOwner}
            />

            <ChildReminderSettings />

            {isOwner && (
              <Button
                variant="ghost"
                className="text-destructive rounded-2xl"
                onClick={async () => {
                  if (!confirm(`Ta bort ${activeChild.name} och allt som hör dit?`)) return;
                  await deleteChild(activeChild.id);
                  setSelectedChild(null);
                }}
              >
                <Trash2 size={16} className="mr-2" /> Ta bort {activeChild.name}
              </Button>
            )}
          </CollapsibleSection>
        </>
      )}
    </>}
    </div>
  );
}

export default function ChildrenPage() {
  const { openSignIn } = useClerk();

  return (
    <Layout>
      <MyFlovePageGrid area="hem" className="pace-ds pace-compact-page">
        <MyFloveWide>
          <div className="space-y-8 pace-compact-stack">
<PacePageHeader icon={Baby} title="Barn" description="Allt som rör barnen på ett ställe – privat för dig, delat bara när du vill." />

            <Show when="signed-out">
              <div className="max-w-md mx-auto text-center py-16 surface-card border-dashed bg-card/60 space-y-4">
                <Baby className="mx-auto text-muted-foreground" size={40} />
                <p className="text-lg">Logga in för att använda barn-delen.</p>
                <Button onClick={() => openSignIn()} className="rounded-2xl h-12 px-8">
                  Logga in
                </Button>
              </div>
            </Show>

            <Show when="signed-in">
              <ChildrenContent />
            </Show>
          </div>
        </MyFloveWide>
      </MyFlovePageGrid>
    </Layout>
  );
}
