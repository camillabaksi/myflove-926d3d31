import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  FolderPlus,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  Wand2,
  X,
} from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { useNoteFolders } from "@/hooks/use-note-folders";
import { useQuickflowHabits } from "@/hooks/use-quickflow-habits";
import { FOLDER_EMOJIS, FOLDER_SUGGESTIONS } from "@/lib/note-folders";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useTasks, useReminders, useDumpIdeas } from "@/hooks/use-data";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";
import NoteConvertDialog, { type ConvertTarget } from "@/components/note-convert-dialog";
import { suggestForNote, type FlowNote } from "@/lib/notes";
import {
  DESTINATION_META,
  guessArea,
  shoppingTitleFrom,
  type QuickflowDestination,
} from "@/lib/quickflow";
import { ALL_AREAS, AREA_META, type LifeArea } from "@/lib/life-areas";
import { useLang } from "@/hooks/use-language";

/**
 * Anteckningar – det du bara ville få ur huvudet.
 * Inget krav, ingen deadline. Flow föreslår, du bestämmer.
 */
export default function NotesPanel() {
  const { t } = useLang();
  const { openNotes, updateNote, removeNote, addNote } = useNotes();
  const { addTask } = useTasks();
  const { addReminder } = useReminders();
  const { addItem: addShoppingItem } = useSharedShoppingList();
  const { ideas, clearIdeas } = useDumpIdeas();
  const { add: addQuickflow } = useQuickflow();

  // Engångsflytt: gamla idébanken bor numera här bland anteckningarna.
  const movedIdeas = useRef(false);
  useEffect(() => {
    if (movedIdeas.current || ideas.length === 0) return;
    movedIdeas.current = true;
    const count = ideas.length;
    ideas.forEach((idea) => addNote(idea.text, guessArea(idea.text)));
    clearIdeas();
    toast.success(
      count === 1
        ? t("Din gamla idé ligger nu bland anteckningarna.")
        : t("Dina {{count}} gamla idéer ligger nu bland anteckningarna.").replace(
            "{{count}}",
            String(count),
          ),
    );
    // Körs en gång när idéerna hunnit laddas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideas.length]);

  const [draft, setDraft] = useState("");
  const [convertNote, setConvertNote] = useState<FlowNote | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editArea, setEditArea] = useState<LifeArea | "">("");

  const { folders, addFolder, renameFolder, removeFolder } = useNoteFolders();
  const { recordAction, topFolderId } = useQuickflowHabits();
  const [activeFolder, setActiveFolder] = useState<string | "all" | "none">("all");
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderEmoji, setNewFolderEmoji] = useState("📁");

  const moveToFolder = (note: FlowNote, folderId: string | undefined) => {
    updateNote(note.id, { folderId });
    if (folderId) recordAction("mapp", folderId);
    const folder = folders.find((f) => f.id === folderId);
    toast.success(
      folder ? `${t("Flyttad till")} ${folder.emoji} ${folder.name}.` : t("Ligger utan mapp nu."),
    );
  };

  const createFolder = (name: string, emoji: string) => {
    if (!name.trim()) return;
    if (folders.some((f) => f.name.toLowerCase() === name.trim().toLowerCase())) {
      toast(t("Du har redan en mapp med det namnet."));
      return;
    }
    addFolder(name, emoji);
    toast.success(t("Mappen {{name}} är skapad.").replace("{{name}}", `${emoji} ${name.trim()}`));
  };

  const startEdit = (note: FlowNote) => {
    setEditingId(note.id);
    setEditText(note.text);
    setEditArea(note.area ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditArea("");
  };

  const saveEdit = (note: FlowNote) => {
    const text = editText.trim();
    if (!text) return;
    updateNote(note.id, { text, area: editArea === "" ? undefined : editArea });
    cancelEdit();
    toast.success(t("Anteckningen är uppdaterad. 💜"));
  };

  const deleteNote = (note: FlowNote) => {
    removeNote(note.id);
    if (editingId === note.id) cancelEdit();
    toast(t("Anteckningen är borttagen."), {
      action: {
        label: t("Ångra"),
        onClick: () => addNote(note.text, note.area),
      },
    });
  };

  const today = () => new Date().toISOString().slice(0, 10);

  const convert = (note: FlowNote, d: QuickflowDestination) => {
    if (d === "inkop") addShoppingItem(shoppingTitleFrom(note.text));
    else if (d === "studier") addTask(note.text, undefined, { area: "studier" });
    else if (d === "jobb") addTask(note.text, undefined, { area: "jobb" });
    else if (d === "paminnelse") addReminder(note.text, today(), "09:00");
    else return;
    updateNote(note.id, { convertedAt: Date.now(), convertedTo: d });
    toast.success(
      t("Anteckningen blev {{target}}.").replace(
        "{{target}}",
        t(DESTINATION_META[d].label).toLowerCase(),
      ),
    );
  };

  /** Tillbaka till Fånga – anteckningen blir ett aktivt flow-block igen. */
  const backToQuickflow = (note: FlowNote) => {
    addQuickflow({ text: note.text, level: "tanke" });
    removeNote(note.id);
    if (editingId === note.id) cancelEdit();
    toast.success(t("Tanken ligger i Fånga igen. 💜"), {
      action: {
        label: t("Ångra"),
        onClick: () => addNote(note.text, note.area),
      },
    });
  };

  const CONVERSIONS: QuickflowDestination[] = ["paminnelse", "inkop", "studier", "jobb"];

  const visibleNotes = openNotes.filter((n) =>
    activeFolder === "all"
      ? true
      : activeFolder === "none"
        ? !n.folderId
        : n.folderId === activeFolder,
  );

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          addNote(draft);
          setDraft("");
          toast.success(t("Sparad som anteckning – inget krav på åtgärd. 💜"));
        }}
        className="surface-card p-4 flex flex-wrap gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("Skriv en anteckning – bara för att få ut det")}
          className="flex-1 min-w-[12rem] rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <button
          type="submit"
          className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
        >
          <NotebookPen size={16} /> {t("Spara")}
        </button>
      </form>

      <div className="surface-card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip onClick={() => setActiveFolder("all")} highlight={activeFolder === "all"}>
            {t("Alla")}
          </Chip>
          {folders.map((folder) => (
            <Chip
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              highlight={activeFolder === folder.id}
            >
              {folder.emoji} {folder.name}
            </Chip>
          ))}
          <Chip onClick={() => setActiveFolder("none")} highlight={activeFolder === "none"}>
            {t("Utan mapp")}
          </Chip>
          <button
            type="button"
            onClick={() => setShowFolderManager((v) => !v)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:border-primary/50"
          >
            <FolderPlus size={14} /> {t("Mina mappar")}
          </button>
        </div>

        {showFolderManager && (
          <div className="space-y-3 border-t border-border/60 pt-3">
            <p className="text-xs text-muted-foreground">
              {t(
                "Mapparna är helt dina. Skapa, byt namn eller ta bort – anteckningarna finns kvar.",
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                value={newFolderEmoji}
                onChange={(e) => setNewFolderEmoji(e.target.value)}
                aria-label={t("Välj ikon")}
                className="rounded-xl border border-border bg-card px-2 py-2 text-sm outline-none"
              >
                {FOLDER_EMOJIS.map((emoji) => (
                  <option key={emoji} value={emoji}>
                    {emoji}
                  </option>
                ))}
              </select>
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t("Ny mapp, t.ex. Familj")}
                className="min-w-[10rem] flex-1 rounded-2xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={() => {
                  createFolder(newFolderName, newFolderEmoji);
                  setNewFolderName("");
                }}
                disabled={!newFolderName.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                <Plus size={16} /> {t("Skapa")}
              </button>
            </div>

            {folders.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {FOLDER_SUGGESTIONS.map((s) => (
                  <Chip key={s.name} onClick={() => createFolder(s.name, s.emoji)}>
                    {s.emoji} {s.name}
                  </Chip>
                ))}
              </div>
            )}

            {folders.map((folder) => (
              <div key={folder.id} className="flex items-center gap-2">
                <input
                  value={folder.name}
                  onChange={(e) => renameFolder(folder.id, { name: e.target.value })}
                  aria-label={`${t("Byt namn på")} ${folder.name}`}
                  className="flex-1 rounded-xl border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-primary/50"
                />
                <button
                  type="button"
                  aria-label={`${t("Ta bort mappen")} ${folder.name}`}
                  onClick={() => {
                    removeFolder(folder.id);
                    if (activeFolder === folder.id) setActiveFolder("all");
                    toast(t("Mappen är borttagen – anteckningarna ligger kvar utan mapp."));
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {visibleNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {openNotes.length === 0
            ? t("Inga anteckningar än. Det du sparar här får bara finnas.")
            : t("Inget i den här mappen än.")}
        </p>
      ) : (
        visibleNotes.map((note) => {
          const suggestion = suggestForNote(note);
          return (
            <div key={note.id} className="surface-card p-4 space-y-3">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                  />
                  <select
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value as LifeArea | "")}
                    className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none"
                  >
                    <option value="">{t("Inget livsområde")}</option>
                    {ALL_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {t(AREA_META[area].label)}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(note)}
                      disabled={!editText.trim()}
                      className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40"
                    >
                      <Check size={16} /> {t("Spara ändring")}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-full border border-border bg-card px-4 py-2 text-sm inline-flex items-center gap-2"
                    >
                      <X size={16} /> {t("Avbryt")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="text-lg">📝</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink break-words">{note.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {note.folderId
                        ? `${folders.find((f) => f.id === note.folderId)?.emoji ?? "📁"} ${
                            folders.find((f) => f.id === note.folderId)?.name ?? t("Mapp")
                          } · `
                        : ""}
                      {note.area ? `${t(AREA_META[note.area].label)} · ` : ""}
                      {t("Ingen deadline, inget krav.")}
                    </p>
                    {suggestion && (
                      <p className="text-xs text-primary">
                        {t("Det här skulle kunna bli {{target}} – om du vill.").replace(
                          "{{target}}",
                          t(DESTINATION_META[suggestion].label).toLowerCase(),
                        )}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(note)}
                    aria-label={t("Redigera anteckning")}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNote(note)}
                    aria-label={t("Ta bort anteckning")}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <div className={`space-y-2 ${editingId === note.id ? "hidden" : ""}`}>
                <button
                  type="button"
                  onClick={() => setConvertNote(note)}
                  className="w-full rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <Wand2 size={16} /> {t("Omvandla till …")}
                </button>
                <button
                  type="button"
                  onClick={() => backToQuickflow(note)}
                  className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2"
                >
                  <Undo2 size={16} /> {t("Tillbaka till Fånga")}
                </button>
                {folders.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t("Lägg i mapp:")}</span>
                    {folders.map((folder) => (
                      <Chip
                        key={folder.id}
                        onClick={() =>
                          moveToFolder(note, note.folderId === folder.id ? undefined : folder.id)
                        }
                        highlight={
                          note.folderId === folder.id ||
                          (!note.folderId && folder.id === topFolderId)
                        }
                      >
                        {folder.emoji} {folder.name}
                      </Chip>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {CONVERSIONS.map((d) => (
                    <Chip
                      key={d}
                      onClick={() => convert(note, d)}
                      highlight={d === suggestion}
                      title={t(DESTINATION_META[d].hint)}
                    >
                      {DESTINATION_META[d].emoji} {t(DESTINATION_META[d].label)}
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
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        highlight
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}
