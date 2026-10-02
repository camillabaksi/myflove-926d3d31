import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FlowRoom } from "@/components/flow/flow-room";
import { AppearanceChoice } from "@/components/flow/flow-appearance-controls";
import { FLOW_THEMES, useMyFlowAppearance, type FlowAppearance } from "@/hooks/use-my-flow";
import { flushCloudSync, getCloudSyncStatus, useCloudSyncStatus } from "@/lib/cloud-storage";

export function FlowCustomizeSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [saved, setSaved] = useMyFlowAppearance();
  const [draft, setDraft] = useState<FlowAppearance>(saved);
  const [tab, setTab] = useState<"flow" | "rum">("flow");
  const [saving, setSaving] = useState(false);
  const status = useCloudSyncStatus();
  useEffect(() => { if (open) setDraft(saved); }, [open, saved]);
  const change = <K extends keyof FlowAppearance>(key: K, value: FlowAppearance[K]) => setDraft(prev => ({ ...prev, [key]: value }));
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="mx-auto w-full max-w-2xl rounded-t-3xl px-4 pt-5 sm:px-6">
      <SheetHeader className="pr-8 text-left"><SheetTitle>Anpassa Flow</SheetTitle><SheetDescription>Gör platsen till din, i din egen takt.</SheetDescription></SheetHeader>
      <div className="mt-3 grid grid-cols-2 gap-2" role="tablist" aria-label="Anpassa">
        <Button role="tab" aria-selected={tab === "flow"} variant={tab === "flow" ? "secondary" : "ghost"} onClick={() => setTab("flow")}>Flow</Button>
        <Button role="tab" aria-selected={tab === "rum"} variant={tab === "rum" ? "secondary" : "ghost"} onClick={() => setTab("rum")}>Rummet</Button>
      </div>
      <div className="mx-auto my-3 max-w-sm"><FlowRoom appearance={draft} compact /></div>
      <div role="tabpanel" className="space-y-4 pb-4">
        {tab === "flow" ? <>
          <p className="rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">Flow vilar här precis som han är. Kläder och tillbehör kommer när de passar honom i rummet.</p>
        </> : <>
          <AppearanceChoice title="Stämning" value={draft.theme} onChange={value => change("theme", value)} options={FLOW_THEMES.map(theme => ({ value: theme.id, label: theme.name }))} />
        </>}
      </div>
      {status === "error" && <p role="alert" className="text-sm text-destructive">Kunde inte spara i molnet. Dina val finns kvar på enheten. Försök igen när du har uppkoppling.</p>}
      <div className="sticky bottom-0 flex gap-2 bg-background py-2">
        <Button disabled={saving} className="flex-1" onClick={async () => { setSaving(true); setSaved(draft); try { await flushCloudSync(); if (getCloudSyncStatus() !== "error") onOpenChange(false); } finally { setSaving(false); } }}>Spara utseende</Button>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
      </div>
    </SheetContent>
  </Sheet>;
}