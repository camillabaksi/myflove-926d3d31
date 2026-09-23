import { useEffect, useState } from "react";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { CHILD_COLORS, type Child } from "@/hooks/use-children";
import { CHILD_HELP_OPTIONS } from "@/lib/family-flow";
import { cn } from "@/lib/utils";

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
  startAdding = false,
}: {
  childrenList: Child[];
  /** Öppna formuläret direkt, t.ex. från knappen "Lägg till barn" högre upp. */
  startAdding?: boolean;
  onAdd: (d: { name: string; avatar: string; helps: string[] }) => Promise<void>;
  onUpdate: (id: string, d: { name: string; avatar: string; helps: string[] }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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
          <div
            key={c.id}
            className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft"
          >
            <span aria-hidden className="text-2xl">
              {c.avatar || "💜"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {c.name} – {t("vad brukar hjälpa?")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {c.helps.length > 0 ? c.helps.join(" · ") : t("Inget sparat än")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(c.id)}
              aria-label={t("Ändra")}
              className="press rounded-xl p-2 text-muted-foreground hover:text-ink"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(t("Ta bort barnprofilen?"))) return;
                await onDelete(c.id);
                toast({ description: t("Barnprofilen är borttagen.") });
              }}
              aria-label={t("Ta bort")}
              className="press rounded-xl p-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={16} />
            </button>
          </div>
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
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="press inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-ink"
        >
          <Plus size={15} aria-hidden /> {t("Lägg till barn")}
        </button>
      )}
    </div>
  );
}

export { CHILD_COLORS };
