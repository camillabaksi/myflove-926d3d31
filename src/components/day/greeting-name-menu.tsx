import { useId, useRef, useState, type FormEvent } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLang } from "@/hooks/use-language";

/** Diskret ⋯-meny i Idag-hälsningen för att ändra det egna visningsnamnet. */
export function GreetingNameMenu({ name, onSave }: { name: string; onSave: (value: string) => Promise<boolean> }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputId = useId();
  const errorId = useId();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) {
      setError(t("Skriv ett namn med minst ett tecken."));
      return;
    }
    setSaving(true);
    setError(null);
    const ok = await onSave(draft);
    setSaving(false);
    if (ok) setOpen(false);
    else setError(t("Namnet kunde inte sparas just nu. Ditt tidigare namn finns kvar – försök igen om en stund."));
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label={t("Fler val för hälsningen")}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreHorizontal size={20} aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl">
          <DropdownMenuItem
            className="min-h-11 rounded-xl"
            onSelect={() => {
              setDraft(name);
              setError(null);
              setOpen(true);
            }}
          >
            <span aria-hidden>✏️</span> {t("Ändra visningsnamn")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <DialogContent
          className="max-w-sm rounded-3xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          <form onSubmit={submit} noValidate>
            <DialogHeader>
              <DialogTitle className="text-left">{t("Vad vill du bli kallad?")}</DialogTitle>
              <DialogDescription className="sr-only">{t("Namnet visas i hälsningen och sparas på ditt konto.")}</DialogDescription>
            </DialogHeader>
            <label htmlFor={inputId} className="sr-only">{t("Visningsnamn")}</label>
            <input
              id={inputId}
              autoFocus
              value={draft}
              maxLength={32}
              onChange={(event) => {
                setDraft(event.target.value);
                if (error) setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="mt-4 min-h-11 w-full rounded-2xl border border-border bg-background px-4 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {error && (
              <p id={errorId} role="alert" className="mt-2 text-sm text-muted-foreground">
                {error}
              </p>
            )}
            <DialogFooter className="mt-5 flex-row flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" className="min-h-11 rounded-full" disabled={saving} onClick={() => setOpen(false)}>
                {t("Avbryt")}
              </Button>
              <Button type="submit" className="min-h-11 rounded-full" disabled={saving}>
                {saving ? t("Sparar…") : t("Spara")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
