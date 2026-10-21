import { useEffect, useId, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { Feather, History, Save, X, Heart, BriefcaseBusiness, Sparkles, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useDaySpace } from "@/hooks/use-day-space";
import { isActiveOwner } from "@/lib/account-scope";
import { todayISO } from "@/lib/day";
import { SPACE_CATEGORIES, validSpaceDate, type SpaceCategory } from "@/lib/day-space";
import { clearSpaceDraft, readSpaceDraft, writeSpaceDraft } from "@/lib/day-space-drafts";

export function DaySpaceNote({ compact = false }: { compact?: boolean }) {
  const { user } = useUser();
  const [date, setDate] = useState(() => todayISO());
  const [currentDay, setCurrentDay] = useState(() => todayISO());
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = todayISO();
      setCurrentDay(next);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { setOpen(false); setDate(todayISO()); }, [user?.id]);
  if (!user?.id || !isActiveOwner(user.id)) return null;
  const editor = <SpaceEditor key={`${user.id}:${date}`} owner={user.id} date={date} currentDay={currentDay} />;
  return <section className={compact ? "min-w-0 space-y-2" : "pace-day-space-card min-w-0 space-y-5 rounded-[2rem] border border-[#E9DCE5]/70 bg-gradient-to-br from-[#FFFBF8]/90 via-[#FCF5F5]/90 to-[#F6EFF8]/90 px-4 py-6 shadow-[0_12px_30px_rgba(81,38,84,.08)] sm:px-6"} aria-label="Det som också tog plats">
    {compact ? <>
      <Button ref={opener} variant="ghost" className="min-h-11 max-w-full gap-2 whitespace-normal text-left text-muted-foreground" onClick={() => { setDate(todayISO()); setOpen(true); }}><Feather size={15} aria-hidden />Det som också tog plats</Button>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="pace-ds max-h-[85dvh] overflow-y-auto" onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }}><DialogTitle>Det som också tog plats</DialogTitle><DialogDescription>Din privata anteckning för dagen.</DialogDescription>{editor}</DialogContent></Dialog>
    </> : <>
      <header className="flex min-w-0 items-center justify-between gap-2"><h2 className="flex min-w-0 items-center gap-2 font-handwritten text-[2.1rem] leading-tight text-[#512654]"><Feather size={24} strokeWidth={1.5} className="shrink-0 text-[#856B89]" aria-hidden />Det som också tog plats</h2><Button variant="ghost" size="icon" aria-label="Välj tidigare datum" aria-expanded={history} onClick={() => setHistory(value => !value)}><History size={16} aria-hidden /></Button></header>
      {history && <label className="block text-sm text-muted-foreground">Datum<input aria-label="Anteckningens datum" type="date" value={date} max={currentDay} onChange={event => { if (validSpaceDate(event.target.value) && event.target.value <= currentDay) setDate(event.target.value); }} className="ml-2 min-h-11 max-w-full rounded-lg border border-border bg-card px-2 text-ink" /></label>}
      {editor}
    </>}
  </section>;
}

function SpaceEditor({ owner, date, currentDay }: { owner: string; date: string; currentDay: string }) {
  const store = useDaySpace(owner, date);
  const id = useId();
  const initialDraft = useRef(readSpaceDraft(owner, date));
  const [text, setText] = useState(initialDraft.current?.text ?? "");
  const [categories, setCategories] = useState<SpaceCategory[]>(initialDraft.current?.categories ?? []);
  const [parents, setParents] = useState<string[]>(initialDraft.current?.parents ?? []);
  const [dirty, setDirty] = useState(Boolean(initialDraft.current));
  const [help, setHelp] = useState(false);
  const [context, setContext] = useState("");
  const [message, setMessage] = useState("");
  const fingerprint = store.heads.map(head => head.id).join("|");
  function updateDraft(nextText: string, nextCategories: SpaceCategory[], nextParents = parents) {
    setText(nextText); setCategories(nextCategories); setParents(nextParents); setDirty(true); setContext(""); setMessage("");
    writeSpaceDraft(owner, date, { text: nextText, categories: nextCategories, parents: nextParents });
  }
  useEffect(() => {
    if (dirty) return;
    const head = store.heads[0];
    setText(head?.text ?? ""); setCategories(head?.categories ?? []); setParents(head ? [head.id] : []);
  }, [fingerprint, dirty]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  function save() {
    if (!isActiveOwner(owner) || todayISO() !== currentDay) { setMessage("Dagen eller kontot har ändrats. Öppna anteckningen igen."); return; }
    try {
      const revision = store.save(text, categories, parents);
      if (revision) { clearSpaceDraft(owner, date); setParents([revision.id]); setDirty(false); setMessage(""); }
    } catch { setMessage("Anteckningen kunde inte sparas. Din text finns kvar; försök igen."); }
  }
  if (!isActiveOwner(owner)) return null;
  return <div className="min-w-0 space-y-2">
    <label htmlFor={id} className="block text-sm text-[#6E5B72]">Vad tog plats utöver din plan?</label>
    <Textarea id={id} value={text} placeholder="Skriv det som det var…" onChange={event => updateDraft(event.target.value, categories)} className="min-h-28 resize-y rounded-[1.4rem] border-[#E6DDE4] bg-white/80 p-4 text-ink shadow-sm focus-visible:ring-[#A38BB1]" />
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label="Valfria kategorier">{SPACE_CATEGORIES.map(category => { const CategoryIcon = category === "Omsorg" ? Heart : category === "Praktiskt" ? BriefcaseBusiness : category === "Oväntat" ? Sparkles : Plus; return <Button key={category} variant="ghost" size="sm" aria-pressed={categories.includes(category)} className={`min-h-11 justify-start gap-2 rounded-full px-3 text-sm transition-colors ${categories.includes(category) ? "bg-[#DFD0E8] text-[#512654] ring-1 ring-[#9E83AD]" : category === "Omsorg" ? "bg-[#F8E8E5] text-[#754D63]" : category === "Praktiskt" ? "bg-[#E7EFE9] text-[#536C61]" : category === "Oväntat" ? "bg-[#EEE7F6] text-[#665476]" : "bg-[#F6EDE6] text-[#755E68]"}`} onClick={() => updateDraft(text, categories.includes(category) ? categories.filter(value => value !== category) : [...categories, category])}><CategoryIcon size={16} aria-hidden />{category}</Button>; })}</div>
    {store.heads.length > 1 && <div role="status" className="space-y-2 border-l-2 border-border pl-3 text-sm"><p>Det finns flera sparade versioner. Din text är kvar.</p>{store.heads.map((head, index) => <Button key={head.id} variant="outline" className="h-auto min-h-11 w-full whitespace-normal text-left" onClick={() => updateDraft(head.text, head.categories, store.heads.map(value => value.id))}>Använd version {index + 1}: {head.text || "Tom anteckning"}</Button>)}</div>}
    <div className="space-y-2 border-t border-[#E9DEE6] pt-4"><Button size="sm" variant="outline" className="min-h-11 w-full justify-start gap-2 rounded-2xl border-[#E8DCE5] bg-white/75 text-[#512654]" disabled={!dirty || (!text.trim() && !store.hasRows)} onClick={save}><Save size={16} aria-hidden />Spara anteckning</Button><Button variant="ghost" size="sm" className="min-h-11 w-full justify-start gap-2 rounded-2xl text-[#65546B]" disabled={!text.trim() || date !== currentDay} onClick={() => { setHelp(value => !value); setContext(""); setMessage(""); }}><Sparkles size={16} aria-hidden />Använd för omplaneringshjälp</Button></div>
    <p role="status" className="text-xs text-muted-foreground">{dirty ? "Inte sparat än" : store.hasRows ? store.status : "Bara för dig"}</p>
    {store.hasRows && text.trim() && <Button variant="ghost" size="sm" className="min-h-11 gap-2 text-[#806C7C]" onClick={() => { if (window.confirm("Ta bort anteckningen för detta datum? Tidigare versioner behålls för återställning.")) updateDraft("", [], store.heads.map(head => head.id)); }}><Trash2 size={15} aria-hidden />Ta bort anteckning</Button>}
    {store.status.includes("misslyckades") && <Button variant="ghost" size="sm" onClick={() => void store.retry()}>Försök synka igen</Button>}
    {help && <div className="space-y-3 rounded-2xl bg-lavender/25 p-3 text-sm">
      <div className="flex items-center justify-between gap-2"><h3 className="font-medium text-ink">Frivillig omplaneringshjälp</h3><Button variant="ghost" size="icon" aria-label="Stäng omplaneringshjälp" onClick={() => { setHelp(false); setContext(""); setMessage(""); }}><X size={15} aria-hidden /></Button></div>
      <p className="text-muted-foreground">Din anteckning stannar privat. Välj ett allmänt sammanhang om du vill, utan att dela texten.</p>
      <fieldset className="space-y-2"><legend className="font-medium text-ink">Vad behöver få plats i planeringen?</legend>
        {["Något oväntat tog tid", "Mycket praktiskt att göra", "Andras behov tog plats", "Många avbrott", "Jag vill ta det varsammare"].map(option => <label key={option} className="flex min-h-11 items-center gap-2 rounded-xl bg-card/80 px-3 py-2"><input type="radio" name={id + "-context"} checked={context === option} onChange={() => setContext(option)} className="h-4 w-4 shrink-0 accent-primary" /><span>{option}</span></label>)}
      </fieldset>
      <p className="text-xs text-muted-foreground">{context ? "Du valde: " + context + ". " : ""}Sammanhanget sparas inte i chatthistoriken eller delas med andra. Sammanhanget ger ett varsamt råd i nästa steg, utan att ändra kalendern eller batteriet.</p>
      <Button variant="outline" type="button" className="min-h-11 w-full whitespace-normal" onClick={() => { if (!isActiveOwner(owner) || date !== todayISO()) return; window.dispatchEvent(new CustomEvent("paceable:day-space-replan", { detail: { owner, date, context } })); setHelp(false); setContext(""); }}>Få ihop dagen – granska förslag</Button>
    </div>}
    {message && <p role="alert" className="text-sm text-muted-foreground">{message}</p>}
  </div>;
}