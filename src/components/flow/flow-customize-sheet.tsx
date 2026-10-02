import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FlowRoom } from "@/components/flow/flow-room";
import { AppearanceChoice } from "@/components/flow/flow-appearance-controls";
import { useMyFlowAppearance, type FlowAppearance } from "@/hooks/use-my-flow";
import { flushCloudSync, getCloudSyncStatus, useCloudSyncStatus } from "@/lib/cloud-storage";
import shirt from "@/assets/flow-shirt.png";
import hoodie from "@/assets/flow-hoodie.png";
import sleep from "@/assets/flow-sleep.png";
import beanie from "@/assets/flow-accessory-beanie.png";
import glasses from "@/assets/flow-accessory-glasses.png";
import headphones from "@/assets/flow-accessory-headphones.png";
import bow from "@/assets/flow-accessory-bow.png";
import flowers from "@/assets/flow-decor-flowers.png";
import mountains from "@/assets/flow-decor-mountains.png";
import vine from "@/assets/flow-decor-vine.png";
import blossom from "@/assets/flow-decor-blossom.png";

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
          <AppearanceChoice title="Kläder" value={draft.outfit ?? "vanlig"} onChange={value => change("outfit", value)} options={[{ value: "vanlig", label: "Vanlig" }, { value: "troja", label: "Tröja", image: shirt }, { value: "hoodie", label: "Hoodie", image: hoodie }, { value: "pyjamas", label: "Pyjamas", image: sleep }]} />
          <AppearanceChoice title="Accessoar" value={draft.accessory ?? "ingen"} onChange={value => change("accessory", value)} options={[{ value: "ingen", label: "Ingen" }, { value: "mossa", label: "Mössa", image: beanie }, { value: "glasogon", label: "Glasögon", image: glasses }, { value: "horlurar", label: "Hörlurar", image: headphones }, { value: "harspanne", label: "Hårspänne", image: bow }]} />
        </> : <>
          <AppearanceChoice title="Tavlan" value={draft.picture ?? "original"} onChange={value => change("picture", value)} options={[{ value: "original", label: "Original" }, { value: "blommor", label: "Blommor", image: flowers }, { value: "berg", label: "Berg", image: mountains }]} />
          <AppearanceChoice title="Växten" value={draft.plant ?? "original"} onChange={value => change("plant", value)} options={[{ value: "original", label: "Original" }, { value: "gron", label: "Grön", image: vine }, { value: "blommor", label: "Blommor", image: blossom }]} />
          <AppearanceChoice title="Pläden" value={draft.throwColor ?? "original"} onChange={value => change("throwColor", value)} options={[{ value: "original", label: "Original" }, { value: "rosa", label: "Rosa" }, { value: "lila", label: "Lila" }]} />
          <AppearanceChoice title="Kudden" value={draft.pillowColor ?? "original"} onChange={value => change("pillowColor", value)} options={[{ value: "original", label: "Original" }, { value: "rosa", label: "Rosa" }, { value: "lila", label: "Lila" }]} />
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