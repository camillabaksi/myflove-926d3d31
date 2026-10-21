import { useEffect, useId, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { Feather, History, Save, X } from "lucide-react";
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
      setCurrentDay(previous => { if (previous !== next) { setOpen(false); setDate(next); } return next; });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { setOpen(false); setDate(todayISO()); }, [user?.id]);
  if (!user?.id || !isActiveOwner(user.id)) return null;
  const editor = <SpaceEditor key={`${user.id}:${date}:${currentDay}`} owner={user.id} date={date} currentDay={currentDay} />;
  return <section className="min-w-0 space-y-2" aria-label="Det som också tog plats">
    {compact ? <>
      <Button ref={opener} variant="ghost" className="min-h-11 max-w-full gap-2 whitespace-normal text-left text-muted-foreground" onClick={() => { setDate(todayISO()); setOpen(true); }}><Feather size={15} aria-hidden />Det som också tog plats</Button>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="pace-ds max-h-[85dvh] overflow-y-auto" onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }}><DialogTitle>Det som också tog plats</DialogTitle><DialogDescription>Din privata anteckning för dagen.</DialogDescription>{editor}</DialogContent></Dialog>
    </> : <>
      <header className="flex min-w-0 items-center justify-between gap-2"><h2 className="pace-editorial-section text-base font-medium text-ink">Det som också tog plats</h2><Button variant="ghost" size="icon" aria-label="Välj tidigare datum" aria-expanded={history} onClick={() => setHistory(value => !value)}><History size={16} aria-hidden /></Button></header>
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
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState("");
  const fingerprint = store.heads.map(head => head.id).join("|");
  function updateDraft(nextText: string, nextCategories: SpaceCategory[], nextParents = parents) {
    setText(nextText); setCategories(nextCategories); setParents(nextParents); setDirty(true); setConsent(false); setMessage("");
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
    const revision = store.save(text, categories, parents);
    if (revision) { clearSpaceDraft(owner, date); setParents([revision.id]); setDirty(false); setMessage(""); }
  }
  if (!isActiveOwner(owner)) return null;
  return <div className="min-w-0 space-y-2">
    <label htmlFor={id} className="text-sm text-muted-foreground">Vad tog plats utöver din plan?</label>
    <Textarea id={id} value={text} placeholder="Skriv det som det var…" onChange={event => updateDraft(event.target.value, categories)} className="min-h-24 resize-y border-border/60 bg-card/60 text-ink" />
    <div className="flex flex-wrap gap-1" aria-label="Valfria kategorier">{SPACE_CATEGORIES.map(category => <Button key={category} variant="ghost" size="sm" aria-pressed={categories.includes(category)} className={`min-h-11 text-xs ${categories.includes(category) ? "bg-lavender/50 text-ink" : "text-muted-foreground"}`} onClick={() => updateDraft(text, categories.includes(category) ? categories.filter(value => value !== category) : [...categories, category])}>{category}</Button>)}</div>
    {store.heads.length > 1 && <div role="status" className="space-y-2 border-l-2 border-border pl-3 text-sm"><p>Det finns flera sparade versioner. Din text är kvar.</p>{store.heads.map((head, index) => <Button key={head.id} variant="outline" className="h-auto min-h-11 w-full whitespace-normal text-left" onClick={() => updateDraft(head.text, head.categories, store.heads.map(value => value.id))}>Använd version {index + 1}: {head.text || "Tom anteckning"}</Button>)}</div>}
    <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" disabled={!dirty || (!text.trim() && !store.hasRows)} onClick={save}><Save size={14} aria-hidden className="mr-1" />Spara anteckning</Button><Button variant="ghost" size="sm" disabled={!text.trim() || date !== currentDay} onClick={() => { setHelp(value => !value); setConsent(false); setMessage(""); }}>Använd för omplaneringshjälp</Button></div>
    <p role="status" className="text-xs text-muted-foreground">{dirty ? "Inte sparat än" : store.hasRows ? store.status : "Bara för dig"}</p>
    {store.hasRows && text.trim() && <Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Ta bort anteckningen för detta datum? Tidigare versioner behålls för återställning.")) updateDraft("", [], store.heads.map(head => head.id)); }}>Ta bort anteckning</Button>}
    {store.status.includes("misslyckades") && <Button variant="ghost" size="sm" onClick={() => void store.retry()}>Försök synka igen</Button>}
    {help && <div className="space-y-2 border-l-2 border-border pl-3 text-sm"><div className="flex items-center justify-between gap-2"><h3 className="font-medium text-ink">Frivillig omplaneringshjälp</h3><Button variant="ghost" size="icon" aria-label="Stäng omplaneringshjälp" onClick={() => { setHelp(false); setConsent(false); setMessage(""); }}><X size={15} aria-hidden /></Button></div><p className="whitespace-pre-wrap break-words text-muted-foreground">{text}</p><label className="flex min-h-11 items-start gap-2"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-primary" /><span>Ta med denna anteckning när Pace hjälper mig att planera om</span></label><p className="text-xs text-muted-foreground">Överföring till Pace är pausad tills skyddet för privata texter har verifierats. Anteckningen stannar hos dig.</p><Button variant="outline" disabled={!consent} onClick={() => setMessage("Anteckningen har inte skickats. Du kan fortfarande använda Få ihop dagen utan att dela texten.")}>Kontrollera om hjälpen är tillgänglig</Button><Button variant="ghost" asChild><a href="/idag?replan=1">Få ihop dagen utan att dela anteckningen</a></Button></div>}
    {message && <p role="alert" className="text-sm text-muted-foreground">{message}</p>}
  </div>;
}