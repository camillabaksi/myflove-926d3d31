import { UserRound, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { FamilyLayerPreferences } from "@/lib/family-calendar";
import { useLang } from "@/hooks/use-language";

export function FamilyLayerSettings({ open, onOpenChange, preferences, onChange, members }: {
  open: boolean; onOpenChange: (open: boolean) => void; preferences: FamilyLayerPreferences;
  onChange: (next: FamilyLayerPreferences) => void; members: Array<{ id: string; name: string }>;
}) {
  const { t } = useLang();
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[88dvh] overflow-y-auto rounded-3xl">
    <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="text-primary" size={22} />{t("Familjelager")}</DialogTitle><DialogDescription>{t("Välj hur mycket av familjens dag du vill se i din kalender.")}</DialogDescription></DialogHeader>
    <fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold">{t("Visa i min kalender")}</legend>
      {([ ["mine", "Min dag", "Bara mina aktiviteter"], ["context", "Min dag + familj", "Barnens aktiviteter visas diskret i bakgrunden."], ["overview", "Familjeöversikt", "Familjens aktiviteter visas tydligare."] ] as const).map(([mode, title, text]) => <label key={mode} className="flex min-h-16 cursor-pointer items-start gap-3 rounded-2xl border border-border bg-secondary/25 p-3"><input className="mt-1 h-4 w-4 shrink-0 accent-primary" type="radio" name="family-layer-mode" checked={preferences.mode === mode} onChange={() => onChange({ ...preferences, mode })} /><span className="min-w-0"><span className="block text-sm font-semibold">{t(title)}{mode === "context" && <span className="ml-1 text-xs font-normal text-primary">{t("Rekommenderas")}</span>}</span><span className="mt-1 block text-xs text-muted-foreground">{t(text)}</span></span></label>)}
    </fieldset>
    <fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold">{t("Visa från")}</legend>{members.map(member => <label key={member.id} className="flex min-h-12 items-center gap-3"><UserRound size={18} className="shrink-0 text-primary" /><span className="min-w-0 flex-1 break-words text-sm">{member.name}</span><Switch aria-label={`${t("Visa från")} ${member.name}`} checked={preferences.children === null || preferences.children.includes(member.id)} onCheckedChange={checked => { const current = preferences.children ?? members.map(m => m.id); onChange({ ...preferences, children: checked ? [...new Set([...current, member.id])] : current.filter(id => id !== member.id) }); }} /></label>)}{!members.length && <p className="text-sm text-muted-foreground">{t("Inga barnprofiler att visa ännu.")}</p>}</fieldset>
  </DialogContent></Dialog>;
}