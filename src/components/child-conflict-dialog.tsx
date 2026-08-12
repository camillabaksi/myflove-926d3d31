import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ChildItemConflict } from "@/hooks/use-children";

function summary(title: string, date: string | null, time: string | null, completed: boolean) {
  const bits = [date ?? "utan datum", time ?? null, completed ? "klarmarkerad" : null].filter(Boolean);
  return `${title} · ${bits.join(" · ")}`;
}

interface Props {
  conflict: ChildItemConflict | null;
  onResolve: (choice: "mine" | "theirs") => void;
}

/** Visas när två personer ändrat samma aktivitet samtidigt. */
export function ChildConflictDialog({ conflict, onResolve }: Props) {
  const open = conflict !== null;
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Någon annan hann före</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left">
              <p>
                Aktiviteten ändrades av en annan familjemedlem medan du höll på. Välj vilken version
                som ska gälla – ingenting sparas förrän du valt.
              </p>
              {conflict && (
                <div className="space-y-2">
                  <div className="rounded-xl border bg-muted/40 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide">Deras version</p>
                    <p className="text-sm">
                      {summary(
                        conflict.theirs.title,
                        conflict.theirs.date,
                        conflict.theirs.time,
                        conflict.theirs.completed,
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/40 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide">
                      {conflict.intent === "delete" ? "Din ändring: ta bort" : "Din ändring"}
                    </p>
                    <p className="text-sm">
                      {conflict.intent === "delete"
                        ? `Ta bort “${conflict.mine.title}”`
                        : summary(
                            conflict.mine.title,
                            conflict.mine.date,
                            conflict.mine.time,
                            conflict.mine.completed,
                          )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onResolve("theirs")}>Behåll deras</AlertDialogCancel>
          <AlertDialogAction onClick={() => onResolve("mine")}>
            {conflict?.intent === "delete" ? "Ta bort ändå" : "Använd mina ändringar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
