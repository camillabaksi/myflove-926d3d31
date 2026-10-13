import type { Child } from "@/hooks/use-children";
import { useLang } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

export function ChildScheduleRecipients({ children, selectedIds, onChange, disabled = false }: {
  children: Child[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const { t } = useLang();
  return <fieldset disabled={disabled} className="space-y-2">
    <legend className="mb-2 text-sm font-medium">{t("Lägg till för")}</legend>
    <div className="flex flex-wrap gap-2">
      {children.map(child => <label key={child.id} className={cn("flex min-h-11 max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm", selectedIds.includes(child.id) ? "border-primary/35 bg-primary/5" : "border-border bg-card")}>
        <input type="checkbox" className="h-4 w-4 shrink-0 accent-primary" checked={selectedIds.includes(child.id)} onChange={event => onChange(event.target.checked ? [...selectedIds, child.id] : selectedIds.filter(id => id !== child.id))} />
        <span className="break-words">{child.name}</span>
      </label>)}
    </div>
    <p className="text-xs text-muted-foreground">{t("Välj ett eller flera barn. Samma aktivitet läggs in i varje valt barns schema.")}</p>
  </fieldset>;
}
