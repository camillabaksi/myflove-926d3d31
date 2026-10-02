import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FlowRoom } from "@/components/flow/flow-room";
import { useCloudSyncStatus, flushCloudSync } from "@/lib/cloud-storage";
import { DEFAULT_FLOW_APPEARANCE, FLOW_THEMES, useMyFlowAppearance, useMyFlowMemories, type FlowAppearance } from "@/hooks/use-my-flow";

const suggestions = [
  "Jag gillar korta påminnelser.",
  "Jag vill gärna förbereda saker kvällen innan.",
  "Jag föredrar en lugn och omtänksam ton.",
  "Jag vill helst göra en sak i taget.",
];

function PageFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-2xl space-y-5 pb-8" aria-label={title}>
    <Button asChild variant="ghost" className="-ml-2 gap-2 rounded-2xl"><Link to="/flow"><ArrowLeft className="size-4" /> Min Flow</Link></Button>
    <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
    {children}
  </main>;
}

function SaveState() {
  const status = useCloudSyncStatus();
  return status === "error" ? <p role="alert" className="text-sm text-destructive">Kunde inte spara i molnet. Dina ändringar finns kvar här. <Button variant="link" className="h-auto p-0" onClick={() => void flushCloudSync()}>Försök igen</Button></p> : status === "pending" ? <p role="status" className="text-xs text-muted-foreground">Väntar på synk</p> : null;
}

export function FlowMemoriesPage() {
  const [memories, setMemories] = useMyFlowMemories();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const start = (id: string | null, value = "") => { setEditing(id); setText(value); setOpen(true); };
  const save = () => {
    const value = text.trim().slice(0, 300);
    if (!value) return;
    setMemories(prev => editing ? prev.map(m => m.id === editing ? { ...m, text: value } : m) : [...prev, { id: crypto.randomUUID(), text: value }]);
    setOpen(false);
  };
  return <PageFrame title="Det här vet Flow om mig">
    <p className="text-sm leading-6 text-muted-foreground">Här finns sådant du har valt att låta Flow komma ihåg. Du kan alltid ändra eller ta bort något. 💜</p>
    {memories.length === 0 ? <p className="rounded-3xl bg-card p-5 text-sm text-muted-foreground">Här finns ingenting än. Du bestämmer om Flow ska komma ihåg något.</p> : <ul className="space-y-2">{memories.map(m => <li key={m.id} className="flex min-w-0 items-center gap-2 rounded-3xl bg-card p-3 shadow-soft"><span className="min-w-0 flex-1 break-words pl-2 text-sm">{m.text}</span><Button size="icon" variant="ghost" aria-label={`Ändra ${m.text}`} title="Ändra" onClick={() => start(m.id, m.text)}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" aria-label={`Ta bort ${m.text}`} title="Ta bort" onClick={() => setMemories(prev => prev.filter(item => item.id !== m.id))}><Trash2 className="size-4" /></Button></li>)}</ul>}
    <Button onClick={() => start(null)} className="w-full rounded-2xl"><Plus className="size-4" /> Lägg till mer om mig</Button>
    <SaveState />
    <div className="space-y-2"><p className="text-sm font-semibold">Om du vill kan du börja med ett förslag</p>{suggestions.map(s => <Button key={s} variant="outline" className="h-auto min-h-12 w-full justify-between whitespace-normal rounded-2xl bg-card py-3 text-left" onClick={() => start(null, s)}><span className="min-w-0 break-words">{s}</span><Plus className="ml-2 size-4 shrink-0" /></Button>)}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="rounded-3xl"><DialogTitle>{editing ? "Ändra minne" : "Vad vill du att Flow ska komma ihåg?"}</DialogTitle><DialogDescription>Endast det du själv väljer att spara används av Flow.</DialogDescription><form className="space-y-4" onSubmit={e => { e.preventDefault(); save(); }}><Input autoFocus value={text} maxLength={300} onChange={e => setText(e.target.value)} placeholder="Skriv med dina egna ord" aria-label="Det Flow ska komma ihåg" /><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Avbryt</Button><Button type="submit" disabled={!text.trim()}>Spara</Button></div></form></DialogContent></Dialog>
  </PageFrame>;
}

export function FlowCustomizePage() {
  const [saved, setSaved] = useMyFlowAppearance();
  const [draft, setDraft] = useState<FlowAppearance>(saved);
  const navigate = useNavigate();
  useEffect(() => setDraft(saved), [saved]);
  return <PageFrame title="Anpassa Flow">
    <FlowRoom appearance={draft} compact />
    <section className="space-y-3"><h2 className="font-semibold">Flows rum</h2><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{FLOW_THEMES.map(theme => <Button key={theme.id} variant="outline" aria-pressed={draft.theme === theme.id} onClick={() => setDraft(prev => ({ ...prev, theme: theme.id }))} className={`h-auto min-h-20 flex-col items-start gap-1 whitespace-normal rounded-2xl bg-card p-3 text-left ${draft.theme === theme.id ? "border-primary ring-2 ring-ring" : ""}`}><span className="font-semibold">{draft.theme === theme.id && <Check className="mr-1 inline size-4" />}{theme.name}</span><span className="text-xs font-normal text-muted-foreground">{theme.description}</span></Button>)}</div></section>
    <section className="space-y-3"><h2 className="font-semibold">Rörelse</h2><div className="grid grid-cols-2 gap-2"><Button variant="outline" aria-pressed={draft.motion === "mjuk"} className={`rounded-2xl ${draft.motion === "mjuk" ? "border-primary ring-2 ring-ring" : ""}`} onClick={() => setDraft(prev => ({ ...prev, motion: "mjuk" }))}>Mjuk rörelse</Button><Button variant="outline" aria-pressed={draft.motion === "still"} className={`rounded-2xl ${draft.motion === "still" ? "border-primary ring-2 ring-ring" : ""}`} onClick={() => setDraft(prev => ({ ...prev, motion: "still" }))}>Ingen rörelse</Button></div></section>
    <SaveState /><div className="flex gap-2"><Button className="flex-1 rounded-2xl" onClick={() => { setSaved(draft); void navigate({ to: "/flow" }); }}>Spara utseende</Button><Button variant="outline" className="rounded-2xl" onClick={() => void navigate({ to: "/flow" })}>Avbryt</Button></div>
  </PageFrame>;
}

export function FlowCollectionPage() {
  const [saved] = useMyFlowAppearance();
  return <PageFrame title="Min samling">
    <p className="text-sm text-muted-foreground">Alla rumsteman finns här från början. Välj det som känns bra just nu.</p>
    <div className="space-y-3">{FLOW_THEMES.map(theme => <div key={theme.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-3xl bg-card p-3 shadow-soft"><div className="min-w-0"><FlowRoom appearance={{ ...DEFAULT_FLOW_APPEARANCE, theme: theme.id, motion: "still" }} compact /><h2 className="mt-2 font-semibold">{theme.name}</h2><p className="text-xs text-muted-foreground">{theme.description}</p></div><Button asChild variant="outline" className="rounded-2xl"><Link to="/flow-anpassa">{saved.theme === theme.id ? "Valt" : "Välj"}</Link></Button></div>)}</div>
  </PageFrame>;
}