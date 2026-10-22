import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { ChevronRight, HeartHandshake, Plus } from "lucide-react";
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
    setExpanded(true);
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
      <button type="button" className="min-h-11 rounded-full bg-white/80 px-3 font-medium" onClick={() => { add(pending.title, "activity", pending.id); onDismiss(); }}>Räkna med det</button>
      <button type="button" className="min-h-11 px-2 text-muted-foreground" onClick={onDismiss}>Bara klart</button>
    </div>}
    {mine.length > 0 && <section className="rounded-2xl bg-[#F8ECE6] p-3 text-ink" aria-label="Det osynliga arbetet">
      <button type="button" className="flex min-h-11 w-full items-center gap-2 text-left" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        <HeartHandshake size={20} className="shrink-0 text-[#986F80]" aria-hidden />
        <span className="flex-1 font-semibold">Det osynliga arbetet <span className="text-xs font-normal text-muted-foreground">({mine.length})</span></span>
        <ChevronRight size={20} className={expanded ? "rotate-90 transition-transform" : "transition-transform"} aria-hidden />
      </button>
      {expanded && <ul className="space-y-2 border-t border-[#E6CFC7] pt-2">{mine.map(row => <li key={row.id} className="flex items-start gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm"><HeartHandshake size={16} className="mt-0.5 shrink-0 text-[#986F80]" aria-hidden /><span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{row.text}</span><span className="shrink-0 text-xs text-muted-foreground">Redan gjort</span></li>)}</ul>}
    </section>}
  </div>;
}
