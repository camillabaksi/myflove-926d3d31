import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/use-language";

/** Gemensamma sorteringslägen för adminlistor. */
export type AdminSortKey = "most" | "fewest" | "az";

const OPTIONS: Array<{ key: AdminSortKey; label: string }> = [
  { key: "most", label: "Mest först" },
  { key: "fewest", label: "Minst först" },
  { key: "az", label: "A–Ö" },
];

export function AdminListSorter({
  value,
  onChange,
}: {
  value: AdminSortKey;
  onChange: (key: AdminSortKey) => void;
}) {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <span className="text-xs text-muted-foreground">{t("Sortera")}:</span>
      {OPTIONS.map((o) => (
        <Button
          key={o.key}
          variant={value === o.key ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(o.key)}
        >
          {t(o.label)}
        </Button>
      ))}
    </div>
  );
}

/** Sorterar en lista med label + events enligt valt läge. */
export function sortAdminRows<T extends { label: string; events: number }>(
  rows: T[],
  key: AdminSortKey,
): T[] {
  return [...rows].sort((a, b) => {
    if (key === "most") return b.events - a.events;
    if (key === "fewest") return a.events - b.events;
    return a.label.localeCompare(b.label, "sv");
  });
}
