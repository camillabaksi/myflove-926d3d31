import { useState } from "react";
import { Link } from "wouter";
import { Plus, X, Check, ArrowUp, ArrowDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/use-language";
import { track } from "@/lib/analytics";
import { HOME_SHORTCUT_CATALOG, useHomeShortcuts } from "@/lib/home-shortcuts";

/**
 * "Mina genvägar" – användaren lägger själv till det den behöver på Hem.
 * Genvägarna pekar på sidor som redan finns; inget nytt innehåll skapas.
 */
export function HomeShortcutsPicker({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const { t } = useLang();
  const { shortcuts, toggle } = useHomeShortcuts();
  const chosen = new Set(shortcuts.map((item) => item.href));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Lägg till på startsidan")}</DialogTitle>
          <DialogDescription>
            {t("Välj det du vill ha nära till hands. Du kan ändra när som helst.")}
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {HOME_SHORTCUT_CATALOG.map((item) => {
            const active = chosen.has(item.href);
            return (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => {
                    track("settings_opened", { source: "hemskarm", method: "genvag" });
                    toggle(item.href);
                  }}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                    active
                      ? "border-primary/40 bg-secondary/60"
                      : "border-border/60 bg-background hover:bg-muted"
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{t(item.label)}</span>
                    <span className="block text-xs text-muted-foreground">{t(item.hint)}</span>
                  </span>
                  <span
                    aria-hidden
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                      active ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                    }`}
                  >
                    {active ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <Button className="mt-2 w-full rounded-2xl" onClick={() => onOpenChange(false)}>
          {t("Klar")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function HomeShortcuts() {
  const { t } = useLang();
  const { shortcuts, remove, move } = useHomeShortcuts();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <section className="mt-5" aria-label={t("Mina genvägar")} data-testid="home-shortcuts">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("Mina genvägar")}
        </h2>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          data-testid="home-shortcuts-add"
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-semibold text-primary shadow-soft hover:bg-card"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> {t("Lägg till")}
        </button>
      </div>

      {shortcuts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-4 text-xs leading-relaxed text-muted-foreground">
          {t("Lägg till det du behöver här – till exempel inköpslistan, timern eller ekonomin.")}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {shortcuts.map((item, index) => (
            <li key={item.href} className="relative min-w-0">
              <Link
                href={item.href}
                onClick={() => track("home_widget_opened", { source: "genvag" })}
                className="home-quick-action"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-primary">
                  <item.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-ink">{t(item.label)}</span>
                <span className="text-xs text-muted-foreground">{t(item.hint)}</span>
              </Link>
              <button
                type="button"
                onClick={() => remove(item.storedHref)}
                aria-label={`${t("Ta bort")} ${t(item.label)}`}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(item.storedHref, -1)}
                  disabled={index === 0}
                  aria-label={`${t("Flytta upp")} ${t(item.label)}`}
                  className="grid h-7 w-7 place-items-center rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(item.storedHref, 1)}
                  disabled={index === shortcuts.length - 1}
                  aria-label={`${t("Flytta ner")} ${t(item.label)}`}
                  className="grid h-7 w-7 place-items-center rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <HomeShortcutsPicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </section>
  );
}
