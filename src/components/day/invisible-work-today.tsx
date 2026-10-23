import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { ChevronRight, HeartHandshake, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { isActiveOwner } from "@/lib/account-scope";
import { todayISO } from "@/lib/day";

export type InvisibleWorkEntry = { id: string; owner: string; date: string; text: string; sourceId?: string; source: "activity" | "note" };
export const INVISIBLE_WORK_EVENT = "paceable:invisible-work-add";

export function InvisibleWorkToday({ pending, onDismiss }: { pending: { id: string; title: string } | null; onDismiss: () => void }) {
  const { user } = useUser();
  const owner = user?.id;
  const [entries, setEntries] = useCloudSyncedStorage<InvisibleWorkEntry[]>("paceable-invisible-work-v1", []);
  const [expanded, setExpanded] = useState(false);
  const date = todayISO();
  const active = Boolean(owner && isActiveOwner(owner));
  const mine = active ? entries.filter(row => row.owner === owner && row.date === date) : [];
  function add(text: string, source: InvisibleWorkEntry["source"], sourceId?: string) {
    if (!owner || !isActiveOwner(owner) || !text.trim()) return;
    setEntries(previous => {
      if (previous.some(row => row.owner === owner && row.date === date && (sourceId ? row.sourceId === sourceId : row.source === source && row.text.trim() === text.trim()))) return previous;
      return [...previous, { id: crypto.randomUUID(), owner, date, text: text.trim(), source, sourceId }];
    });
  }
  /** Remove only this display entry. The original task/note and energy history
   * are independent sources and must never be changed by this action. */
  function remove(row: InvisibleWorkEntry) {
    if (!owner || !isActiveOwner(owner) || row.owner !== owner || row.date !== todayISO()) return;
    setEntries(previous => isActiveOwner(owner)
      ? previous.filter(entry => !(entry.id === row.id && entry.owner === owner && entry.date === row.date))
      : previous,
    );
    toast("Borttaget från Det osynliga arbetet.", {
      action: {
        label: "Ångra",
        onClick: () => {
          // A stale undo from an old session or another day cannot restore
          // a private entry into the next signed-in account.
          if (!isActiveOwner(owner) || row.date !== todayISO()) return;
          setEntries(previous => isActiveOwner(owner) && !previous.some(entry => entry.id === row.id)
            ? [...previous, row]
            : previous,
          );
        },
      },
    });
  }
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ owner: string; date: string; text: string }>).detail;
      if (detail && detail.owner === owner && detail.date === todayISO() && isActiveOwner(detail.owner)) add(detail.text, "note");
    };
    window.addEventListener(INVISIBLE_WORK_EVENT, handler);
    return () => window.removeEventListener(INVISIBLE_WORK_EVENT, handler);
  }, [owner, setEntries]);
  if (!active) return null;
  return <div className="mt-2 space-y-2">
    {pending && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F8ECE6] px-3 py-2 text-sm text-ink" role="status">
      <span className="min-w-0 flex-1">Klart: {pending.title}. Räkna med det som också tog plats?</span>
      <button type="button" className="min-h-11 rounded-full bg-card/85 px-3 font-medium text-ink" onClick={() => { add(pending.title, "activity", pending.id); onDismiss(); }}>Räkna med det</button>
      <button type="button" className="min-h-11 px-2 text-muted-foreground" onClick={onDismiss}>Bara klart</button>
    </div>}
    {mine.length > 0 && <section className="rounded-2xl bg-[#F8ECE6] p-3 text-ink" aria-label="Det osynliga arbetet">
      <button type="button" className="flex min-h-11 w-full items-center gap-2 text-left" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        <HeartHandshake size={20} className="shrink-0 text-[#986F80]" aria-hidden />
        <span className="flex-1 font-semibold">Det osynliga arbetet ({mine.length})</span>
        <ChevronRight size={20} className={expanded ? "rotate-90 transition-transform" : "transition-transform"} aria-hidden />
      </button>
      {expanded && <ul className="space-y-2 border-t border-[#E6CFC7] pt-2">{mine.map(row =>
        <li key={row.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-card/75 px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{row.text}</span>
          <button
            type="button"
            onClick={() => remove(row)}
            aria-label={`Ta bort ${row.text} från Det osynliga arbetet`}
            title="Ta bort från Det osynliga arbetet"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </li>,
      )}</ul>}
    </section>}
  </div>;
}
