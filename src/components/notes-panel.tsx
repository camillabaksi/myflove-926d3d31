import { useState } from "react";
import { toast } from "sonner";
import { NotebookPen, Trash2, Wand2 } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";
import NoteConvertDialog, { type ConvertTarget } from "@/components/note-convert-dialog";
import { suggestForNote, type FlowNote } from "@/lib/notes";
import { DESTINATION_META, shoppingTitleFrom, type QuickflowDestination } from "@/lib/quickflow";
import { AREA_META } from "@/lib/life-areas";

/**
 * Anteckningar – det du bara ville få ur huvudet.
 * Inget krav, ingen deadline. Flow föreslår, du bestämmer.
 */
export default function NotesPanel() {
  const { openNotes, updateNote, removeNote, addNote } = useNotes();
  const { addTask } = useTasks();
  const { addReminder } = useReminders();
  const { addItem: addShoppingItem } = useSharedShoppingList();

  const [draft, setDraft] = useState("");
  const [convertNote, setConvertNote] = useState<FlowNote | null>(null);

  const today = () => new Date().toISOString().slice(0, 10);

  const convert = (note: FlowNote, d: QuickflowDestination) => {
    if (d === "inkop") addShoppingItem(shoppingTitleFrom(note.text));
    else if (d === "studier") addTask(note.text, undefined, { area: "studier" });
    else if (d === "jobb") addTask(note.text, undefined, { area: "jobb" });
    else if (d === "paminnelse") addReminder(note.text, today(), "09:00");
    else return;
    updateNote(note.id, { convertedAt: Date.now(), convertedTo: d });
    toast.success(`Anteckningen blev ${DESTINATION_META[d].label.toLowerCase()}.`);
  };

  const CONVERSIONS: QuickflowDestination[] = ["paminnelse", "inkop", "studier", "jobb"];

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          addNote(draft);
          setDraft("");
          toast.success("Sparad som anteckning – inget krav på åtgärd. 💜");
        }}
        className="surface-card p-4 flex flex-wrap gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Skriv en anteckning – bara för att få ut det"
          className="flex-1 min-w-[12rem] rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <button
          type="submit"
          className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
        >
          <NotebookPen size={16} /> Spara
        </button>
      </form>

      {openNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Inga anteckningar än. Det du sparar här får bara finnas.
        </p>
      ) : (
        openNotes.map((note) => {
          const suggestion = suggestForNote(note);
          return (
            <div key={note.id} className="surface-card p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-lg">📝</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink break-words">{note.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {note.area ? `${AREA_META[note.area].label} · ` : ""}
                    Ingen deadline, inget krav.
                  </p>
                  {suggestion && (
                    <p className="text-xs text-primary">
                      Det här skulle kunna bli {DESTINATION_META[suggestion].label.toLowerCase()} – om du vill.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeNote(note.id)}
                  aria-label="Ta bort anteckning"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setConvertNote(note)}
                  className="w-full rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <Wand2 size={16} /> Omvandla till …
                </button>
                <div className="flex flex-wrap gap-2">
                  {CONVERSIONS.map((d) => (
                    <Chip
                      key={d}
                      onClick={() => convert(note, d)}
                      highlight={d === suggestion}
                      title={DESTINATION_META[d].hint}
                    >
                      {DESTINATION_META[d].emoji} {DESTINATION_META[d].label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          );
        })
      )}

      <NoteConvertDialog
        note={convertNote}
        open={convertNote !== null}
        onOpenChange={(v) => !v && setConvertNote(null)}
        onConverted={(target: ConvertTarget) => {
          if (convertNote) {
            updateNote(convertNote.id, {
              convertedAt: Date.now(),
              convertedTo: target === "energi" ? "energi" : target,
            });
          }
          setConvertNote(null);
        }}
      />
    </div>
  );
}

function Chip({
  onClick,
  children,
  highlight,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  highlight?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
        highlight
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}
