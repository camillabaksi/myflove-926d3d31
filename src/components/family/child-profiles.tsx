import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Check, ChevronRight, Ellipsis, HeartHandshake, Leaf, Lock, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { CHILD_COLORS, type Child, type FamilyMember } from "@/hooks/use-children";
import { CHILD_HELP_OPTIONS } from "@/lib/family-flow";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSavedExercises } from "@/hooks/use-saved-exercises";
import ExercisePlayer from "@/components/recovery/exercise-player";
import { FlowSpeakButton } from "@/components/flow/flow-speak-button";

const AVATARS = ["💜", "🌸", "🦊", "🐣", "⭐", "🐢", "🌿", "🚀"];

interface Draft {
  name: string;
  avatar: string;
  helps: string[];
  other: string;
}

const EMPTY: Draft = { name: "", avatar: AVATARS[0]!, helps: [], other: "" };

function ChildForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Child;
  onCancel: () => void;
  onSave: (d: { name: string; avatar: string; helps: string[] }) => Promise<void>;
}) {
  const { t } = useLang();
  const known = (initial?.helps ?? []).filter((h) =>
    (CHILD_HELP_OPTIONS as readonly string[]).includes(h),
  );
  const other = (initial?.helps ?? []).filter(
    (h) => !(CHILD_HELP_OPTIONS as readonly string[]).includes(h),
  );
  const [draft, setDraft] = useState<Draft>(
    initial
      ? {
          name: initial.name,
          avatar: initial.avatar || AVATARS[0]!,
          helps: known,
          other: other.join(", "),
        }
      : EMPTY,
  );
  const [pending, setPending] = useState(false);

  const toggleHelp = (h: string) =>
    setDraft((d) => ({
      ...d,
      helps: d.helps.includes(h) ? d.helps.filter((x) => x !== h) : [...d.helps, h],
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setPending(true);
    try {
      const extra = draft.other
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await onSave({
        name: draft.name.trim(),
        avatar: draft.avatar,
        helps: [...draft.helps, ...extra],
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-soft"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-ink">{t("Namn")}</label>
        <Input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder={t("Barnets namn")}
          className="h-12 rounded-2xl"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-ink">{t("Bild")}</label>
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setDraft({ ...draft, avatar: a })}
              aria-pressed={draft.avatar === a}
              className={cn(
                "press flex h-11 w-11 items-center justify-center rounded-2xl border text-lg",
                draft.avatar === a ? "border-primary bg-primary/10" : "border-border bg-card",
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-ink">
          {t("Det här brukar hjälpa mitt barn")}
        </label>
        <div className="flex flex-wrap gap-2">
          {CHILD_HELP_OPTIONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => toggleHelp(h)}
              aria-pressed={draft.helps.includes(h)}
              className={cn(
                "press min-h-11 rounded-full border px-3 text-sm",
                draft.helps.includes(h)
                  ? "border-primary bg-primary/10 text-ink"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {t(h)}
            </button>
          ))}
        </div>
        <Input
          value={draft.other}
          onChange={(e) => setDraft({ ...draft, other: e.target.value })}
          placeholder={t("Annat – skriv med egna ord")}
          className="h-12 rounded-2xl"
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock size={12} aria-hidden />
          {t("Privat familjeinformation. Bara du ser det här.")}
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending || !draft.name.trim()} className="h-12 rounded-2xl">
          {t("Spara")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-12 rounded-2xl">
          {t("Avbryt")}
        </Button>
      </div>
    </form>
  );
}

/** Barnprofiler – förälderns egna observationer, inga diagnosfält. */
export default function ChildProfiles({
  childrenList,
  onAdd,
  onUpdate,
  onDelete,
  onSchedule,
  onHelp,
  onSelect,
  userId,
  startAdding = false,
}: {
  childrenList: Child[];
  /** Öppna formuläret direkt, t.ex. från knappen "Lägg till barn" högre upp. */
  startAdding?: boolean;
  onAdd: (d: { name: string; avatar: string; helps: string[] }) => Promise<void>;
  onUpdate: (id: string, d: { name: string; avatar: string; helps: string[] }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSchedule?: (child: Child) => void;
  onHelp?: (child: Child) => void;
  onSelect?: (child: Child) => void;
  userId?: string | null;
}) {
  const { t } = useLang();
  const { toast } = useToast();
  const [adding, setAdding] = useState(startAdding);

  useEffect(() => {
    if (startAdding) setAdding(true);
  }, [startAdding]);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-3" data-testid="child-profiles">
      {childrenList.map((c) =>
        editing === c.id ? (
          <ChildForm
            key={c.id}
            initial={c}
            onCancel={() => setEditing(null)}
            onSave={async (d) => {
              await onUpdate(c.id, d);
              setEditing(null);
            }}
          />
        ) : (
           <article
            key={c.id}
             className="pace-adaptive rounded-3xl border border-border bg-card p-4 shadow-soft"
           >
             <div className="pace-adaptive-row flex min-w-0 items-center gap-3">
               <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl">{c.avatar || "💜"}</span>
               <div className="min-w-0 flex-1">
                 <Button variant="link" type="button" onClick={() => onSelect?.(c)} className="h-auto max-w-full justify-start whitespace-normal p-0 text-left font-display text-lg font-bold text-ink hover:text-primary">
                   <span className="min-w-0 break-words">{c.name}</span><ChevronRight size={16} className="shrink-0" aria-hidden />
                 </Button>
                 <p className="line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">
                   {c.helps.length ? c.helps.slice(0, 2).map((h) => t(h)).join(" · ") : t("Inget stöd sparat än")}
                 </p>
                </div>
             </div>
             <div className={cn("pace-adaptive-grid mt-3 grid gap-2", !userId || c.owner_id === userId ? "grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px]" : "grid-cols-2")}>
               <Button type="button" onClick={() => onSchedule?.(c)} className="h-11 min-w-0 rounded-2xl px-2 text-sm"><CalendarDays size={16} className="shrink-0" aria-hidden /> {t("Schema")}</Button>
               <Button type="button" variant="outline" onClick={() => onHelp?.(c)} className="h-11 min-w-0 rounded-2xl px-2 text-sm"><HeartHandshake size={16} className="shrink-0" aria-hidden /> {t("Hjälp")}</Button>
               {(!userId || c.owner_id === userId) && <DropdownMenu>
                 <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-2xl" aria-label={`${t("Fler val för")} ${c.name}`}><Ellipsis size={20} /></Button></DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="min-w-40 rounded-2xl">
                   <DropdownMenuItem onSelect={() => setEditing(c.id)}>{t("Redigera barn")}</DropdownMenuItem>
                   <DropdownMenuItem onSelect={() => setEditing(c.id)}>{t("Ändra stöd")}</DropdownMenuItem>
                   <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={async () => {
                     if (!window.confirm(`${t("Ta bort")} ${c.name}?`)) return;
                     await onDelete(c.id);
                     toast({ description: t("Barnprofilen är borttagen.") });
                   }}>{t("Ta bort barn")}</DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>}
             </div>
           </article>
        ),
      )}

      {adding ? (
        <ChildForm
          onCancel={() => setAdding(false)}
          onSave={async (d) => {
            await onAdd(d);
            setAdding(false);
          }}
        />
      ) : (
         <Button
          type="button"
          onClick={() => setAdding(true)}
           variant="outline"
           className="min-h-11 rounded-full"
        >
          <Plus size={15} aria-hidden /> {t("Lägg till barn")}
         </Button>
      )}
    </div>
  );
}

/** Fördjupning för ett barn, med samma profil och sparade övningar som i övriga appen. */
export function ChildProfileDetail({ child, canEdit = true, members = [], onLinkAccount, onBack, onSchedule, onHelp, onUpdate, onDelete }: {
  child: Child;
  canEdit?: boolean;
  /** Familjemedlemmar som kan vara barnets eget konto (endast föräldern ser valet). */
  members?: FamilyMember[];
  onLinkAccount?: (id: string, accountUserId: string | null) => Promise<void>;
  onBack: () => void;
  onSchedule: () => void;
  onHelp: () => void;
  onUpdate: (id: string, d: { name: string; avatar: string; helps: string[] }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useLang();
  const { exercises } = useSavedExercises();
  const [editing, setEditing] = useState(false);
  const [section, setSection] = useState<"support" | "exercises" | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const saved = exercises.filter((exercise) => exercise.category === "barn" && exercise.childId === child.id);
  const selected = saved.find((exercise) => exercise.id === playing);
  return <div className="mx-auto max-w-2xl space-y-5" data-testid="child-profile-detail">
    <div className="flex items-center justify-between gap-2">
      <Button type="button" variant="ghost" onClick={onBack} className="min-h-11 rounded-2xl"><ArrowLeft size={17} aria-hidden /> {t("Barn")}</Button>
      {canEdit && <DropdownMenu>
        <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-2xl" aria-label={`${t("Fler val för")} ${child.name}`}><Ellipsis size={20} /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl">
          <DropdownMenuItem onSelect={() => setEditing(true)}>{t("Redigera barn")}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => { setEditing(false); setSection("support"); }}>{t("Ändra stöd")}</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={async () => {
            if (!window.confirm(`${t("Ta bort")} ${child.name}?`)) return;
            await onDelete(child.id); onBack();
          }}>{t("Ta bort barn")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>}
    </div>
    <header className="flex min-w-0 items-center gap-3">
      <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-secondary text-3xl">{child.avatar || "💜"}</span>
      <div className="min-w-0"><h1 className="break-words font-display text-2xl font-bold text-ink">{child.name}</h1><p className="text-sm text-muted-foreground">{t("Vad behöver")} {child.name} {t("idag?")}</p></div>
    </header>
    {editing ? <ChildForm initial={child} onCancel={() => setEditing(false)} onSave={async (d) => { await onUpdate(child.id, d); setEditing(false); }} /> : <div className="space-y-2">
      <Button type="button" onClick={onSchedule} className="flex min-h-16 w-full justify-between rounded-2xl px-4 text-left"><span className="flex min-w-0 items-center gap-3"><CalendarDays size={20} className="shrink-0" aria-hidden /><span className="truncate">{t("Schema")}</span></span><ChevronRight size={18} className="shrink-0" aria-hidden /></Button>
      <Button type="button" variant="outline" onClick={() => setSection(section === "support" ? null : "support")} aria-expanded={section === "support"} className="flex min-h-14 w-full justify-between rounded-2xl px-4 text-left"><span className="flex items-center gap-3"><Check size={20} aria-hidden />{t("Stöd i vardagen")}</span><ChevronRight size={18} aria-hidden /></Button>
      {section === "support" && <div className="flex flex-wrap gap-2 py-2" aria-label={`${t("Det här brukar hjälpa")} ${child.name}`}>
        {child.helps.length ? child.helps.map((help) => <span key={help} className="max-w-full break-words rounded-2xl bg-secondary px-3 py-2 text-sm text-ink"><Check size={14} className="mr-1 inline text-primary" aria-hidden />{t(help)}</span>) : <p className="text-sm text-muted-foreground">{t("Inget stöd sparat än")}</p>}
        {canEdit && <Button type="button" variant="link" onClick={() => { setEditing(true); setSection(null); }} className="h-9 px-2">{t("Ändra stöd")}</Button>}
      </div>}
      {canEdit && onLinkAccount && members.length > 0 && <label className="block space-y-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
        <span className="font-semibold text-ink">{t("Barnets eget konto")}</span>
        <span className="block text-xs text-muted-foreground">{t("Barnet ser sin egen kalender, men aldrig stöd eller anteckningar du sparat här.")}</span>
        <select className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-ink" value={child.account_user_id ?? ""} onChange={(event) => { void onLinkAccount(child.id, event.target.value || null).catch(() => undefined); }}>
          <option value="">{t("Inget eget konto")}</option>
          {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}
        </select>
      </label>}
      <Button type="button" variant="outline" onClick={onHelp} className="flex h-auto min-h-14 w-full justify-between rounded-2xl px-4 py-3 text-left"><span className="flex min-w-0 items-center gap-3"><HeartHandshake size={20} className="shrink-0" aria-hidden /><span className="break-words whitespace-normal">{t("Hjälp mig med en situation")}</span></span><ChevronRight size={18} className="shrink-0" aria-hidden /></Button>
      <Button type="button" variant="outline" onClick={() => setSection(section === "exercises" ? null : "exercises")} aria-expanded={section === "exercises"} className="flex min-h-14 w-full justify-between rounded-2xl px-4 text-left"><span className="flex min-w-0 items-center gap-3"><Leaf size={20} className="shrink-0" aria-hidden /><span className="truncate">{t("Sparade övningar")}</span>{saved.length > 0 && <span className="text-muted-foreground">({saved.length})</span>}</span><ChevronRight size={18} className="shrink-0" aria-hidden /></Button>
      {section === "exercises" && <div className="space-y-2 py-2">
        {saved.length === 0 && <p className="text-sm text-muted-foreground">{t("Inga övningar sparade för")} {child.name}.</p>}
        {saved.map((exercise) => <div key={exercise.id}>
          <Button type="button" variant="ghost" onClick={() => setPlaying(playing === exercise.id ? null : exercise.id)} className="h-auto min-h-14 w-full justify-start gap-3 rounded-2xl bg-secondary/50 px-3 py-2 text-left"><span aria-hidden className="text-xl">{exercise.icon}</span><span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{exercise.title}</span><span className="block text-xs text-muted-foreground">{[exercise.age, exercise.situation].filter(Boolean).join(" · ")}</span></span><ChevronRight size={16} className="shrink-0" aria-hidden /></Button>
          {selected?.id === exercise.id && <div className="mt-2 space-y-2"><p className="text-sm text-ink">{exercise.description}</p><FlowSpeakButton text={[exercise.title, exercise.description, ...exercise.steps].filter(Boolean).join(". ")} className="h-11 w-11" /><ExercisePlayer exercise={exercise} onClose={() => setPlaying(null)} /></div>}
        </div>)}
      </div>}
    </div>}
  </div>;
}

export { CHILD_COLORS };
