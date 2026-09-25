import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ListChecks, ShoppingCart, Pill, Users, Dumbbell, Smile, Wallet, GraduationCap, Briefcase, StickyNote, Home, Check, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { todayISO } from "@/lib/day";
import { CLEAN_ROOMS } from "@/lib/cleaning";

type Area =
  | "kalender" | "uppgifter" | "inkop" | "rutiner" | "traning" | "maende"
  | "ekonomi" | "studier" | "jobb" | "anteckningar" | "hem";

type Level = "off" | "view" | "edit";

/** Delar där familjen kan få ändra. Personliga delar kan bara visas. */
const EDITABLE: ReadonlySet<Area> = new Set<Area>(["inkop", "hem", "uppgifter", "kalender"]);

const AREAS: { id: Area; label: string; hint: string; icon: typeof CalendarDays }[] = [
  { id: "kalender", label: "Kalender & Min dag", hint: "Dina aktiviteter och möten med datum", icon: CalendarDays },
  { id: "uppgifter", label: "Uppgifter & QuickFlow", hint: "Dina att-göra-saker", icon: ListChecks },
  { id: "inkop", label: "Inköp & måltider", hint: "Inköpslista och matsedel", icon: ShoppingCart },
  { id: "hem", label: "Hem & städning", hint: "Städlistor och sysslor hemma", icon: Home },
  { id: "rutiner", label: "Rutiner & medicin", hint: "Rutiner, doser och om de är tagna idag", icon: Pill },
  { id: "traning", label: "Träning", hint: "Dina träningspass", icon: Dumbbell },
  { id: "maende", label: "Mående & ork", hint: "Senaste måendet och orkloggar", icon: Smile },
  { id: "ekonomi", label: "Ekonomi", hint: "Budget och senaste utgifter", icon: Wallet },
  { id: "studier", label: "Studier", hint: "Kurser och studieplan", icon: GraduationCap },
  { id: "jobb", label: "Jobb", hint: "Projekt", icon: Briefcase },
  { id: "anteckningar", label: "Anteckningar & idéer", hint: "Tankar du skrivit ner", icon: StickyNote },
];

type SharedRow = { owner_id: string; display_name: string; color: string; area: string; key: string; value: unknown };
type Entry = Record<string, unknown>;
type Item = { id: string; text: string; done: boolean; by?: string };

const asList = (v: unknown): Entry[] =>
  Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as Entry[]) : [];
const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const str = (v: unknown) => (typeof v === "string" ? v : "");
const label = (e: Entry) => str(e.title) || str(e.name) || str(e.text) || str(e.meal) || str(e.label) || "";

/** Bockbara rader för delar som kan ändras gemensamt. */
function itemsFor(area: Area, rows: SharedRow[]): Item[] {
  const today = todayISO();
  const raw = (key: string) => rows.find((r) => r.key === key)?.value;
  const toItem = (e: Entry): Item => ({ id: str(e.id), text: label(e), done: Boolean(e.completed || e.checked), by: str(e.editedBy) || undefined });
  if (area === "inkop") return asList(raw("myflow-shopping")).map(toItem).filter((i) => i.id && i.text).sort((a, b) => Number(a.done) - Number(b.done)).slice(0, 15);
  if (area === "uppgifter") return asList(raw("myflow-tasks")).filter((e) => !e.date).map(toItem).filter((i) => i.id && i.text && !i.done).slice(0, 10);
  if (area === "kalender") {
    return [...asList(raw("myflow-tasks")), ...asList(raw("myflow-reminders"))]
      .filter((e) => str(e.date) >= today && !e.completed)
      .sort((a, b) => `${str(a.date)}${str(a.time)}`.localeCompare(`${str(b.date)}${str(b.time)}`))
      .slice(0, 8)
      .map((e) => ({ ...toItem(e), text: `${str(e.date) === today ? "Idag" : str(e.date)}${str(e.time) ? ` ${str(e.time)}` : ""} · ${label(e)}` }))
      .filter((i) => i.id);
  }
  // hem: egna städsteg per rum:läge, klar-markering nyckel "läge:stegId"
  const done = asObj(raw("myflove-cleaning-done"));
  const custom = asObj(raw("myflove-cleaning-custom"));
  const hidden = asObj(raw("myflove-cleaning-hidden"));
  // Appens steg per rum i båda lägena (utan bortvalda) + egna steg.
  const builtIn = CLEAN_ROOMS.flatMap((room) =>
    (["vardag", "stor"] as const).flatMap((mode) => {
      const off = new Set((Array.isArray(hidden[`${room.id}:${mode}`]) ? hidden[`${room.id}:${mode}`] : []) as string[]);
      const modeLabel = mode === "stor" ? "Storstädning" : "Vardag";
      return room.steps[mode].filter((st) => !off.has(st.id)).map((st) => {
        const id = `${mode}:${st.id}`;
        return { id, text: `${room.label} · ${modeLabel} · ${st.label}`, done: Boolean(done[id]) };
      });
    }),
  );
  const own = Object.entries(custom).flatMap(([listKey, steps]) => {
    const [roomId, mode = "vardag"] = listKey.split(":");
    const roomLabel = CLEAN_ROOMS.find((x) => x.id === roomId)?.label;
    return asList(steps).map((st) => {
      const id = `${mode}:${str(st.id)}`;
      return { id, text: `${roomLabel ? `${roomLabel} · ` : ""}${label(st)}`, done: Boolean(done[id]) };
    });
  });
  return [...builtIn, ...own].filter((i) => i.text);
}

/** Läsrader för delar som bara visas. */
function linesFor(area: Area, rows: SharedRow[]): string[] {
  if (EDITABLE.has(area)) return itemsFor(area, rows).map((i) => `${i.text}${i.done ? " – klar" : ""}`);
  const today = todayISO();
  const get = (key: string) => asList(rows.find((r) => r.key === key)?.value);
  if (area !== "rutiner") {
    return rows.flatMap((r) => asList(r.value)).slice(-8).reverse().map((e) => {
      const d = str(e.date) || str(e.createdAt).slice(0, 10);
      const extra = typeof e.amount === "number" ? ` · ${e.amount} kr` : typeof e.level === "number" ? ` · nivå ${e.level}` : str(e.mood) ? ` · ${str(e.mood)}` : "";
      const t = label(e) || str(e.note) || str(e.category);
      return t || extra ? `${d ? `${d} · ` : ""}${t}${extra}` : "";
    }).filter(Boolean);
  }
  const log = get("myflove-medication-log").filter((l) => str(l.date) === today);
  const meds = get("myflove-medications").flatMap((m) =>
    (Array.isArray(m.times) ? (m.times as string[]) : []).map((t) => {
      const taken = log.some((l) => l.medId === m.id && l.time === t);
      return `${t} · ${label(m)} ${taken ? "– tagen" : ""}`;
    }),
  );
  const routines = get("myflove-routines").filter((r) => r.enabled !== false).map((r) => `${str(r.time)} · ${label(r)}`);
  return [...routines, ...meds].sort().slice(0, 10);
}

/**
 * Välj vad familjen får se – och i vissa delar ändra. Allt är privat tills du slår på en del.
 */
export default function FamilyAreaSharing() {
  const { toast } = useToast();
  const [mine, setMine] = useState<Map<Area, Level>>(new Map());
  const [shared, setShared] = useState<SharedRow[]>([]);
  const [perms, setPerms] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editors, setEditors] = useState<Map<Area, string[] | null>>(new Map());
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const [{ data: own }, { data: rows }, { data: p }, { data: hm }] = await Promise.all([
      supabase.from("family_share_areas").select("area, can_edit, editors").eq("user_id", u.user.id),
      supabase.rpc("get_family_shared_data"),
      supabase.rpc("get_family_share_permissions"),
      supabase.from("household_members").select("user_id, display_name"),
    ]);
    setEditors(new Map((own ?? []).map((r) => [r.area as Area, r.editors ?? null])));
    const seen = new Map<string, string>();
    for (const m of hm ?? []) if (m.user_id !== u.user.id) seen.set(m.user_id, m.display_name);
    setMembers([...seen.entries()].map(([id, name]) => ({ id, name })));
    setMine(new Map((own ?? []).map((r) => [r.area as Area, r.can_edit ? "edit" : "view"])));
    setShared((rows ?? []) as SharedRow[]);
    setPerms(new Set((p ?? []).filter((r) => r.can_edit).map((r) => `${r.owner_id}|${r.area}`)));
  }, []);

  useEffect(() => { void load(); }, [load]);

  const setLevel = async (area: Area, level: Level) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const prev = mine;
    const cur = mine.get(area) ?? "off";
    if (cur === level) return;
    const next = new Map(mine);
    if (level === "off") next.delete(area); else next.set(area, level);
    setMine(next);
    const uid = u.user.id;
    const { error } =
      level === "off"
        ? await supabase.from("family_share_areas").delete().eq("user_id", uid).eq("area", area)
        : cur === "off"
          ? await supabase.from("family_share_areas").insert({ user_id: uid, area, can_edit: level === "edit" })
          : await supabase.from("family_share_areas").update({ can_edit: level === "edit" }).eq("user_id", uid).eq("area", area);
    if (error) {
      setMine(prev);
      toast({ description: "Kunde inte spara just nu.", variant: "destructive" });
    }
  };

  const setAreaEditors = async (area: Area, list: string[] | null) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const prev = editors;
    setEditors(new Map(editors).set(area, list));
    const { error } = await supabase.from("family_share_areas").update({ editors: list }).eq("user_id", u.user.id).eq("area", area);
    if (error) {
      setEditors(prev);
      toast({ description: "Kunde inte spara just nu.", variant: "destructive" });
    }
  };

  const edit = async (owner: string, area: Area, op: "toggle" | "add", itemId: string | null, title: string | null) => {
    const { error } = await supabase.rpc("family_edit_shared", {
      _owner: owner, _area: area, _op: op, _item_id: itemId ?? "", _title: title ?? "",
    });
    if (error) {
      toast({ description: "Du kan inte ändra här just nu.", variant: "destructive" });
      return;
    }
    await load();
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
          Allt är privat tills du väljer. Inköp, städning, uppgifter och kalender kan familjen få bocka av. Bara du kan ta bort saker.
        </p>
      </div>
      <ul className="space-y-2">
        {AREAS.map(({ id, label: l, hint, icon: Icon }) => {
          const level = mine.get(id) ?? "off";
          const options: { v: Level; t: string }[] = [
            { v: "off", t: "Av" },
            { v: "view", t: "Kan se" },
            ...(EDITABLE.has(id) ? [{ v: "edit" as Level, t: "Kan ändra" }] : []),
          ];
          return (
            <li key={id} className={`rounded-2xl border p-3 ${level !== "off" ? "border-primary bg-primary/10" : "border-border bg-secondary/30"}`}>
              <div className="flex items-center gap-3">
                <Icon size={18} className="shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{l}</span>
                  <span className="block text-xs text-muted-foreground">{hint}</span>
                </span>
              </div>
              <div role="radiogroup" aria-label={`Delning för ${l}`} className="mt-2 flex gap-1">
                {options.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    role="radio"
                    aria-checked={level === o.v}
                    onClick={() => setLevel(id, o.v)}
                    className={`flex-1 rounded-full px-2 py-1.5 text-xs font-medium ${
                      level === o.v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border"
                    }`}
                  >
                    {o.t}
                  </button>
                ))}
              </div>
              {level === "edit" && members.length > 0 && (() => {
                const list = editors.get(id) ?? null;
                const chip = (on: boolean) =>
                  `rounded-full px-2.5 py-1 text-xs border ${on ? "bg-primary/15 border-primary text-ink" : "border-border text-muted-foreground bg-card"}`;
                return (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">Vem får ändra?</p>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" aria-pressed={list === null} className={chip(list === null)} onClick={() => setAreaEditors(id, null)}>Alla</button>
                      {members.map((m) => {
                        const on = list !== null && list.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            aria-pressed={on}
                            className={chip(on)}
                            onClick={() => {
                              const base = list ?? [];
                              const next = on ? base.filter((x) => x !== m.id) : [...base, m.id];
                              void setAreaEditors(id, next.length === 0 ? null : next);
                            }}
                          >
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                    {list !== null && <p className="text-[11px] text-muted-foreground">Övriga i familjen kan bara se.</p>}
                  </div>
                );
              })()}
            </li>
          );
        })}
      </ul>

      {people.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-ink">Delat med dig</h3>
          {people.map(([ownerId, p]) => (
            <div key={ownerId} className="rounded-2xl border border-border p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </div>
              {AREAS.filter((a) => p.rows.some((r) => r.area === a.id)).map((a) => {
                const rows = p.rows.filter((r) => r.area === a.id);
                const canEdit = EDITABLE.has(a.id) && perms.has(`${ownerId}|${a.id}`);
                const draftKey = `${ownerId}|${a.id}`;
                if (canEdit) {
                  const items = itemsFor(a.id, rows);
                  return (
                    <div key={a.id} className="space-y-1">
                      <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        {a.label} <Users size={12} /> <span>du kan bocka av</span>
                      </p>
                      {items.length === 0 && <p className="text-xs text-muted-foreground">Inget just nu.</p>}
                      <ul className="space-y-1">
                        {items.map((i) => (
                          <li key={i.id}>
                            <button
                              type="button"
                              onClick={() => edit(ownerId, a.id, "toggle", i.id, null)}
                              className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left text-sm"
                            >
                              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${i.done ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>
                                {i.done && <Check size={12} />}
                              </span>
                              <span className={`min-w-0 flex-1 break-words ${i.done ? "line-through text-muted-foreground" : "text-ink"}`}>{i.text}</span>
                              {i.by && <span className="shrink-0 text-[11px] text-muted-foreground">{i.by}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {a.id === "inkop" && (
                        <form
                          className="flex gap-2 pt-1"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const t = (drafts[draftKey] ?? "").trim();
                            if (!t) return;
                            setDrafts((d) => ({ ...d, [draftKey]: "" }));
                            void edit(ownerId, a.id, "add", null, t);
                          }}
                        >
                          <input
                            value={drafts[draftKey] ?? ""}
                            onChange={(e) => setDrafts((d) => ({ ...d, [draftKey]: e.target.value }))}
                            maxLength={200}
                            placeholder="Lägg till vara"
                            className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-1.5 text-sm"
                          />
                          <button type="submit" aria-label="Lägg till" className="rounded-xl bg-primary px-3 text-primary-foreground">
                            <Plus size={16} />
                          </button>
                        </form>
                      )}
                    </div>
                  );
                }
                const lines = linesFor(a.id, rows);
                return (
                  <div key={a.id}>
                    <p className="text-xs font-medium text-muted-foreground">{a.label}</p>
                    {lines.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Inget just nu.</p>
                    ) : (
                      <ul className="text-sm text-ink">
                        {lines.map((line, i) => <li key={i} className="break-words">{line}</li>)}
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
