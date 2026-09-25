import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ListChecks, ShoppingCart, Pill, Lock, Users, Dumbbell, Smile, Wallet, GraduationCap, Briefcase, StickyNote, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { todayISO } from "@/lib/day";

type Area =
  | "kalender" | "uppgifter" | "inkop" | "rutiner" | "traning" | "maende"
  | "ekonomi" | "studier" | "jobb" | "anteckningar" | "hem";

const AREAS: { id: Area; label: string; hint: string; icon: typeof CalendarDays }[] = [
  { id: "kalender", label: "Kalender & Min dag", hint: "Dina aktiviteter och möten med datum", icon: CalendarDays },
  { id: "uppgifter", label: "Uppgifter & QuickFlow", hint: "Dina att-göra-saker", icon: ListChecks },
  { id: "inkop", label: "Inköp & måltider", hint: "Inköpslista och matsedel", icon: ShoppingCart },
  { id: "rutiner", label: "Rutiner & medicin", hint: "Rutiner, doser och om de är tagna idag", icon: Pill },
  { id: "traning", label: "Träning", hint: "Dina träningspass", icon: Dumbbell },
  { id: "maende", label: "Mående & ork", hint: "Senaste måendet och orkloggar", icon: Smile },
  { id: "ekonomi", label: "Ekonomi", hint: "Budget och senaste utgifter", icon: Wallet },
  { id: "studier", label: "Studier", hint: "Kurser och studieplan", icon: GraduationCap },
  { id: "jobb", label: "Jobb", hint: "Projekt", icon: Briefcase },
  { id: "anteckningar", label: "Anteckningar & idéer", hint: "Tankar du skrivit ner", icon: StickyNote },
  { id: "hem", label: "Hem & städning", hint: "Städlistor och sysslor hemma", icon: Home },
];

type SharedRow = {
  owner_id: string;
  display_name: string;
  color: string;
  area: string;
  key: string;
  value: unknown;
};

type Entry = Record<string, unknown>;
const asList = (v: unknown): Entry[] =>
  Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as Entry[]) : [];
const str = (v: unknown) => (typeof v === "string" ? v : "");
const label = (e: Entry) => str(e.title) || str(e.name) || str(e.text) || str(e.meal) || "";

/** Rader att visa för en delad sektion – förenklad läsvy. */
function linesFor(area: Area, rows: SharedRow[]): string[] {
  const today = todayISO();
  const get = (key: string) => asList(rows.find((r) => r.key === key)?.value);
  if (area === "kalender") {
    const dated = [...get("myflow-tasks"), ...get("myflow-reminders")].filter(
      (e) => str(e.date) >= today && !e.completed,
    );
    return dated
      .sort((a, b) => `${str(a.date)}${str(a.time)}`.localeCompare(`${str(b.date)}${str(b.time)}`))
      .slice(0, 8)
      .map((e) => `${str(e.date) === today ? "Idag" : str(e.date)}${str(e.time) ? ` ${str(e.time)}` : ""} · ${label(e)}`);
  }
  if (area === "uppgifter") {
    return get("myflow-tasks").filter((e) => !e.completed && !e.date).slice(0, 8).map(label);
  }
  if (area === "inkop") {
    const shop = get("myflow-shopping").filter((e) => !e.completed && !e.checked).map(label);
    return shop.slice(0, 10).map((s) => `🛒 ${s}`);
  }
  if (area !== "rutiner") {
    const list = rows.flatMap((r) => asList(r.value));
    const out = list
      .slice(-8)
      .reverse()
      .map((e) => {
        const d = str(e.date) || str(e.createdAt).slice(0, 10);
        const extra = typeof e.amount === "number" ? ` · ${e.amount} kr` : typeof e.level === "number" ? ` · nivå ${e.level}` : str(e.mood) ? ` · ${str(e.mood)}` : "";
        const t = label(e) || str(e.note) || str(e.category);
        return t || extra ? `${d ? `${d} · ` : ""}${t}${extra}` : "";
      })
      .filter(Boolean);
    return out;
  }
  const log = get("myflove-medication-log").filter((l) => str(l.date) === today);
  const meds = get("myflove-medications").flatMap((m) =>
    (Array.isArray(m.times) ? (m.times as string[]) : []).map((t) => {
      const taken = log.some((l) => l.medId === m.id && l.time === t);
      return `${t} · ${label(m)} ${taken ? "– tagen" : ""}`;
    }),
  );
  const routines = get("myflove-routines")
    .filter((r) => r.enabled !== false)
    .map((r) => `${str(r.time)} · ${label(r)}`);
  return [...routines, ...meds].sort().slice(0, 10);
}

/**
 * Välj vilka delar av appen familjen får se, och se vad de andra delar.
 * Allt är privat tills du slår på en del.
 */
export default function FamilyAreaSharing() {
  const { toast } = useToast();
  const [mine, setMine] = useState<Set<Area>>(new Set());
  const [shared, setShared] = useState<SharedRow[]>([]);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const [{ data: own }, { data: rows }] = await Promise.all([
      supabase.from("family_share_areas").select("area").eq("user_id", u.user.id),
      supabase.rpc("get_family_shared_data"),
    ]);
    setMine(new Set((own ?? []).map((r) => r.area as Area)));
    setShared((rows ?? []) as SharedRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (area: Area) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const on = mine.has(area);
    const next = new Set(mine);
    if (on) next.delete(area);
    else next.add(area);
    setMine(next);
    const { error } = on
      ? await supabase.from("family_share_areas").delete().eq("user_id", u.user.id).eq("area", area)
      : await supabase.from("family_share_areas").insert({ user_id: u.user.id, area });
    if (error) {
      setMine(mine);
      toast({ description: "Kunde inte spara just nu.", variant: "destructive" });
    }
  };

  const people = useMemo(() => {
    const map = new Map<string, { name: string; color: string; rows: SharedRow[] }>();
    for (const r of shared) {
      const p = map.get(r.owner_id) ?? { name: r.display_name, color: r.color, rows: [] };
      p.rows.push(r);
      map.set(r.owner_id, p);
    }
    return [...map.entries()];
  }, [shared]);

  return (
    <section className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-base text-ink">Vad familjen får se</h2>
        <p className="text-sm text-muted-foreground">
          Allt är privat tills du slår på en del. Familjen kan bara läsa, inte ändra.
        </p>
      </div>
      <ul className="space-y-2">
        {AREAS.map(({ id, label: l, hint, icon: Icon }) => {
          const on = mine.has(id);
          return (
            <li key={id}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => toggle(id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                  on ? "border-primary bg-primary/10" : "border-border bg-secondary/30"
                }`}
              >
                <Icon size={18} className="shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{l}</span>
                  <span className="block text-xs text-muted-foreground">{hint}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  {on ? <><Users size={13} /> Delas</> : <><Lock size={13} /> Privat</>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {people.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-ink">Delat med dig</h3>
          {people.map(([id, p]) => (
            <div key={id} className="rounded-2xl border border-border p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </div>
              {AREAS.filter((a) => p.rows.some((r) => r.area === a.id)).map((a) => {
                const lines = linesFor(a.id, p.rows.filter((r) => r.area === a.id));
                return (
                  <div key={a.id}>
                    <p className="text-xs font-medium text-muted-foreground">{a.label}</p>
                    {lines.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Inget just nu.</p>
                    ) : (
                      <ul className="text-sm text-ink">
                        {lines.map((line, i) => (
                          <li key={i} className="break-words">{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
