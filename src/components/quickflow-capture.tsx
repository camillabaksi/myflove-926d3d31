import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QuickflowImageImport from "@/components/quickflow-image-import";
import {
  Brain,
  Calendar,
  Check,
  Loader2,
  Mic,
  Pencil,
  Sparkles,
  MapPin,
  Trash2,
  NotebookPen,
  FolderOpen,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WhyHint from "@/components/why-hint";
import AdaptiveActivityCard from "@/components/adaptive-activity-card";
import { detectIntent } from "@/lib/adaptive-activity";
import { useLang } from "@/hooks/use-language";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useSavedStores, useTasks } from "@/hooks/use-data";
import { parseQuickflowDateTime } from "@/lib/quickflow-datetime";
import { useQuickflow } from "@/hooks/use-quickflow";
import { useQuickflowPrioritization } from "@/hooks/use-quickflow-prioritization";
import { splitTasks } from "@/lib/quickflow-priority";
import { useNotes } from "@/hooks/use-notes";
import { useNoteFolders } from "@/hooks/use-note-folders";
import { looksLikeLongNote } from "@/lib/quickflow-longtext";
import { track } from "@/lib/analytics";
import {
  LEVEL_META,
  WHEN_PRESETS,
  formatWhen,
  suggestWhen,
  type QuickflowLevel,
} from "@/lib/quickflow";

function toLocalInputValue(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * QuickFlows ENDA ingång: skriv eller prata fritt → Flow delar upp →
 * du granskar → Flow föreslår en ordning → du godkänner.
 * Samma komponent används på QuickFlow-sidan, i bottennavigeringens +,
 * på hemskärmens + och på desktopens flytande knapp (variant="global").
 */
export function QuickflowCapture({
  variant = "card",
}: {
  variant?: "card" | "compact" | "global";
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [level, setLevel] = useState<QuickflowLevel>("snabbt");
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [placeOpen, setPlaceOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Användarens val för lång text: null = Flows förslag visas, annars beslutat. */
  const [longChoice, setLongChoice] = useState<"note" | "keep" | null>(null);
  /** Användarens egen version av uppdelningen – null = Flows förslag gäller. */
  const [edited, setEdited] = useState<string[] | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const { add } = useQuickflow();
  const { addNote, updateNote } = useNotes();
  const { folders } = useNoteFolders();
  const { savedStores } = useSavedStores();
  const { addTask } = useTasks();
  /** Användaren har tackat nej till kalenderförslaget för aktuell text. */
  const [calDeclined, setCalDeclined] = useState(false);
  const { prioritizeTitles } = useQuickflowPrioritization();
  const navigate = useNavigate();
  const voice = useVoiceInput((t) => setText((prev) => (prev ? `${prev} ${t}` : t)));

  const suggestion = useMemo(() => (text.trim() ? suggestWhen(level, text) : null), [text, level]);

  const trimmed = text.trim();
  const isLongNote = useMemo(() => looksLikeLongNote(trimmed), [trimmed]);
  const detected = useMemo(() => splitTasks(text), [text]);
  /** Lång text hålls ihop – vi delar aldrig sönder en tanketömning av oss själva. */
  const items =
    edited ??
    (trimmed
      ? isLongNote && longChoice !== "keep"
        ? [trimmed]
        : detected.length > 0
          ? detected
          : [trimmed]
      : []);
  const hasText = items.length > 0;
  /** En enda sak med tydlig avsikt kan Flow anpassa efter dagens kapacitet. */
  const adaptable = items.length === 1 && detectIntent(items[0]) !== "generisk" ? items[0] : null;
  const [adaptOpen, setAdaptOpen] = useState(false);
  /** "tvätta fredag 10-14" → förslag att lägga det direkt i kalendern. */
  const dateSuggestion = useMemo(
    () =>
      items.length === 1 && !calDeclined && edited === null
        ? parseQuickflowDateTime(items[0])
        : null,
    [items, calDeclined, edited],
  );

  // Ny text = nytt förslag från Flow.
  useEffect(() => {
    setEdited(null);
    setEditingIndex(null);
    setLongChoice(null);
    setFolderOpen(false);
    setCalDeclined(false);
  }, [text]);

  // Bottennavigeringens +, hemskärmens + och desktop-FAB öppnar samma flöde.
  useEffect(() => {
    if (variant !== "global") return;
    const openGlobal = () => setOpen(true);
    window.addEventListener("myflove:quickflow", openGlobal);
    return () => window.removeEventListener("myflove:quickflow", openGlobal);
  }, [variant]);

  const reset = () => {
    setText("");
    setLevel("snabbt");
    setCustomOpen(false);
    setCustomValue("");
    setPlaceOpen(false);
    setMoreOpen(false);
    setFolderOpen(false);
    setLongChoice(null);
    setBusy(false);
    setEdited(null);
    setEditingIndex(null);
  };

  const removeItem = (index: number) => {
    setEdited(items.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const value = editingValue.trim();
    setEdited(items.map((t, i) => (i === editingIndex ? value || t : t)));
    setEditingIndex(null);
  };

  /** Huvudflödet: godkänn uppdelningen → Flow föreslår en ordning. Inga tider skapas. */
  const approveAndPrioritize = async () => {
    const titles = items.filter(Boolean);
    if (titles.length === 0 || busy) return;
    setBusy(true);
    track("quickflow_created", { source: "quickflow", method: "prioritera" });
    await prioritizeTitles(titles);
    setOpen(false);
    reset();
    toast.success(
      titles.length > 1
        ? `${titles.length} ${t("saker är ute ur huvudet. 💙")}`
        : t("Ute ur huvudet. 💙"),
      { description: t("De ligger i din lista – Flow har föreslagit en ordning.") },
    );
    void navigate({ to: "/quickflow" });
  };

  const save = (opts: { remindAt?: number; placeId?: string; placeName?: string }) => {
    const titles = items.filter(Boolean);
    if (titles.length === 0) return;
    let mergedAny = false;
    titles.forEach((title) => {
      const { merged } = add({ text: title, level, ...opts });
      if (merged) mergedAny = true;
    });
    setOpen(false);
    reset();
    toast.success(
      mergedAny
        ? t("Några fanns redan – jag slog ihop dem. 💙")
        : t("Lugn. Jag håller det åt dig. 💙"),
      {
        description: opts.remindAt
          ? `Jag säger till ${formatWhen(opts.remindAt).toLowerCase()}.`
          : opts.placeName
            ? `Jag knuffar dig när du är nära ${opts.placeName}.`
            : titles.length > 1
              ? `${titles.length} ${t("saker ligger som öppna tankar – jag frågar dig senare.")}`
              : t("Den ligger som en öppen tanke – jag frågar dig senare."),
      },
    );
  };

  /**
   * Tanken får bara finnas – hela originaltexten landar som EN anteckning.
   * Inga Quickflow-poster skapas, så det blir aldrig dubbletter.
   */
  const saveAsNote = (folderId?: string) => {
    if (!trimmed) return;
    const note = addNote(trimmed);
    if (folderId) updateNote(note.id, { folderId });
    track("quickflow_created", { source: "quickflow", method: "anteckning" });
    setOpen(false);
    reset();
    const folder = folders.find((f) => f.id === folderId);
    toast.success(t("Sparad som anteckning. 📝"), {
      description: folder
        ? `Den ligger i ${folder.emoji} ${folder.name} – hela texten är kvar.`
        : t(
            "Hela texten är kvar. Du hittar den under Anteckningar – lägg den i en mapp när du vill.",
          ),
    });
  };

  /** Lägg texten med datum/tid direkt i kalendern efter användarens ja. */
  const saveToCalendar = () => {
    if (!dateSuggestion) return;
    addTask(dateSuggestion.title, dateSuggestion.date, {
      time: dateSuggestion.startTime ?? undefined,
      endTime: dateSuggestion.endTime ?? undefined,
      note: "Källa: QuickFlow",
    });
    track("quickflow_created", { source: "quickflow", method: "kalender" });
    setOpen(false);
    reset();
    toast.success(t("Inlagd i kalendern. 📅"), {
      description: `${dateSuggestion.title} – ${dateSuggestion.label}.`,
    });
  };

  return (
    <>
      {variant === "global" ? null : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            variant === "compact"
              ? "inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover-scale"
              : "group w-full flex items-center gap-4 p-5 rounded-3xl border-2 border-dashed border-primary/40 bg-card hover:border-primary hover:shadow-lifted transition-all text-left active:scale-[0.99]"
          }
        >
          <span
            className={
              variant === "compact"
                ? "sr-only"
                : "w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"
            }
          >
            <Brain size={24} />
          </span>
          {variant === "compact" ? (
            <>
              <Brain size={16} /> {t("Skriv eller prata")}
            </>
          ) : (
            <span className="flex-1 min-w-0">
              <span className="block text-lg font-semibold text-ink">
                {t("Skriv eller säg det som det är")}
              </span>
              <span className="block text-sm text-muted-foreground">
                {t("Du granskar alltid förslaget innan något sparas.")}
              </span>
            </span>
          )}
        </button>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-h-[85dvh] max-w-[720px] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>{t("Vad har du i huvudet?")}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {t("Skriv eller säg det som det är.")}
            </p>
          </DialogHeader>

          <div className="min-w-0 space-y-4">
            <div className="relative">
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder={t(
                  "T.ex. Hämta barnen, handla, ring skolan, tvätta och fixa inför imorgon",
                )}
                className="w-full rounded-2xl border border-border bg-background p-3 pr-12 text-base outline-none focus:border-primary"
              />
              {voice.isSupported && (
                <button
                  type="button"
                  onClick={voice.toggleListening}
                  aria-label={voice.isListening ? t("Sluta lyssna") : t("Prata in")}
                  className={`absolute right-2 top-2 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    voice.isListening
                      ? "bg-coral text-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mic size={16} />
                </button>
              )}
            </div>

            {!text.trim() && <QuickflowImageImport />}


            {isLongNote && longChoice === null && (
              <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <p className="flex items-start gap-2 text-sm text-ink">
                  <NotebookPen size={16} className="mt-0.5 shrink-0 text-primary" />
                  <span>
                    <span className="block font-semibold">
                      {t("Det här ser ut som en längre anteckning.")}
                    </span>
                    <span className="block text-muted-foreground">
                      {t("Vill du spara den som en anteckning? Hela texten behålls som den är.")}
                    </span>
                  </span>
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => saveAsNote()}
                    className="w-full rounded-xl sm:flex-1"
                  >
                    {t("📝 Spara som anteckning")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLongChoice("keep")}
                    className="w-full rounded-xl sm:flex-1"
                  >
                    {t("Behåll i Quickflow")}
                  </Button>
                </div>
              </div>
            )}

            {dateSuggestion && (
              <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <p className="flex items-start gap-2 text-sm text-ink">
                  <Calendar size={16} className="mt-0.5 shrink-0 text-primary" />
                  <span>
                    <span className="block font-semibold">
                      {t("Ska jag lägga det här i kalendern?")}
                    </span>
                    <span className="block text-muted-foreground">
                      {dateSuggestion.title} – {dateSuggestion.label}
                    </span>
                  </span>
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    onClick={saveToCalendar}
                    className="w-full rounded-xl sm:flex-1"
                  >
                    {t("📅 Ja, lägg i kalendern")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCalDeclined(true)}
                    className="w-full rounded-xl sm:flex-1"
                  >
                    {t("Nej, bara spara")}
                  </Button>
                </div>
              </div>
            )}

            {adaptable && (
              <div className="space-y-2">
                {adaptOpen ? (
                  <AdaptiveActivityCard
                    text={adaptable}
                    source="quickflow"
                    onDone={() => {
                      setAdaptOpen(false);
                      setOpen(false);
                      reset();
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdaptOpen(true)}
                    className="press w-full rounded-2xl border-2 border-border bg-lavender/25 px-3 py-3 text-left text-sm font-medium text-ink hover:border-primary"
                  >
                    <Sparkles size={14} className="mr-2 inline" aria-hidden />
                    {t("Anpassa efter min kapacitet idag")}
                  </button>
                )}
              </div>
            )}

            {hasText && (
              <div className="space-y-2">
                {items.length > 1 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("Så här har jag förstått det")}
                    </p>
                    <WhyHint label="uppdelningen">
                      {t(
                        "Flow delar upp texten i separata saker så att inget klumpas ihop. Du kan ändra eller ta bort – du bestämmer.",
                      )}
                    </WhyHint>
                  </div>
                )}

                <ul className="space-y-2">
                  {items.map((title, index) => (
                    <li
                      key={`${title}-${index}`}
                      className="flex min-w-0 items-center gap-2 rounded-2xl border-2 border-border bg-card p-2.5"
                    >
                      {editingIndex === index ? (
                        <>
                          <Input
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveEdit();
                              }
                            }}
                            className="h-10 min-w-0 flex-1 rounded-xl"
                            aria-label={t("Redigera uppgiften")}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={saveEdit}
                            className="h-10 shrink-0 rounded-xl"
                          >
                            {t("Spara")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Check size={16} className="shrink-0 text-primary" aria-hidden="true" />
                          <span className="min-w-0 flex-1 break-words text-sm text-foreground">
                            {title}
                          </span>
                          <button
                            type="button"
                            aria-label={`${t("Redigera")} ${title}`}
                            onClick={() => {
                              setEditingIndex(index);
                              setEditingValue(title);
                            }}
                            className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border text-muted-foreground hover:border-primary hover:text-primary"
                          >
                            <Pencil size={15} />
                          </button>
                          {items.length > 1 && (
                            <button
                              type="button"
                              aria-label={`${t("Ta bort")} ${title}`}
                              onClick={() => removeItem(index)}
                              className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                <p className="pt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {t("Vad vill du göra med det här?")}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    onClick={() => void approveAndPrioritize()}
                    disabled={busy}
                    className="w-full justify-start rounded-xl"
                  >
                    {busy ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Zap size={16} className="mr-2" />
                    )}
                    {t("Saker att göra")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => saveAsNote()}
                    className="w-full justify-start rounded-xl"
                  >
                    <NotebookPen size={16} className="mr-2" /> {t("Spara som anteckning")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMoreOpen(false);
                      setFolderOpen((v) => !v);
                    }}
                    aria-expanded={folderOpen}
                    className="w-full justify-start rounded-xl"
                  >
                    <FolderOpen size={16} className="mr-2" /> {t("Lägg i mapp")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFolderOpen(false);
                      setMoreOpen(true);
                    }}
                    className="w-full justify-start rounded-xl"
                  >
                    <Clock size={16} className="mr-2" /> {t("Påminn mig senare")}
                  </Button>
                </div>

                {folderOpen && (
                  <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
                    <p className="text-xs text-muted-foreground">
                      {t("Sparas som anteckning i vald mapp – hela texten behålls.")}
                    </p>
                    {folders.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "Du har inga mappar än. Spara den som anteckning nu och skapa mappar under Anteckningar när du vill.",
                        )}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {folders.map((folder) => (
                          <button
                            key={folder.id}
                            type="button"
                            onClick={() => saveAsNote(folder.id)}
                            className="rounded-full border border-border bg-background px-4 py-2 text-sm hover:border-primary"
                          >
                            {folder.emoji} {folder.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {t("Inga tider eller deadlines skapas – bara en ordning du kan ändra.")}
                </p>
              </div>
            )}

            {hasText && (
              <div className="space-y-3 border-t border-border/60 pt-3">
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className="text-sm text-muted-foreground underline underline-offset-4"
                >
                  {moreOpen ? t("Dölj fler val") : t("Fler val – påminnelse eller anteckning")}
                </button>

                {moreOpen && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t("Hur känns det?")}
                      </p>
                      <div className="grid gap-2">
                        {(Object.keys(LEVEL_META) as QuickflowLevel[]).map((key) => {
                          const meta = LEVEL_META[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setLevel(key)}
                              className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
                                level === key
                                  ? meta.className
                                  : "border-border bg-card hover:border-primary/40"
                              }`}
                            >
                              <span className="text-lg leading-none">{meta.emoji}</span>
                              <span>
                                <span className="block text-sm font-medium">{t(meta.label)}</span>
                                <span className="block text-xs text-muted-foreground">
                                  {t(meta.hint)}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t("⏰ När ska jag påminna dig?")}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {WHEN_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => save({ remindAt: preset.compute() ?? undefined })}
                            className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary"
                          >
                            {t(preset.label)}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setPlaceOpen(false);
                            setCustomOpen((v) => !v);
                            if (!customValue)
                              setCustomValue(toLocalInputValue(Date.now() + 3_600_000));
                          }}
                          className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary"
                        >
                          {t("På ett datum")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomOpen(false);
                            setPlaceOpen((v) => !v);
                          }}
                          className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary"
                        >
                          <MapPin size={13} className="inline mr-1 -mt-0.5" />
                          {t("När jag kommer till en plats")}
                        </button>
                        <button
                          type="button"
                          onClick={() => save({})}
                          className="w-full rounded-full border border-sage bg-sage/30 px-4 py-2 text-sm hover:border-primary"
                        >
                          {t("💭 Bara spara tanken")}
                        </button>
                        <button
                          type="button"
                          onClick={() => saveAsNote()}
                          className="w-full rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary"
                        >
                          {t("📝 Spara som anteckning")}
                        </button>
                      </div>

                      {customOpen && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <input
                            type="datetime-local"
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const at = new Date(customValue).getTime();
                              if (Number.isFinite(at)) save({ remindAt: at });
                            }}
                            className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
                          >
                            {t("Spara")}
                          </button>
                        </div>
                      )}

                      {placeOpen && (
                        <div className="space-y-2 pt-1">
                          {savedStores.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              {t(
                                "Du har inga sparade platser än. Lägg till en plats under Inköp, så kan jag knuffa dig när du är i närheten.",
                              )}
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {savedStores.map((store) => (
                                <button
                                  key={store.id}
                                  type="button"
                                  onClick={() => save({ placeId: store.id, placeName: store.name })}
                                  className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary"
                                >
                                  <MapPin size={13} className="inline mr-1 -mt-0.5" />
                                  {store.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {suggestion && (
                        <button
                          type="button"
                          onClick={() => save({ remindAt: suggestion.at })}
                          className="w-full flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-left hover:border-primary"
                        >
                          <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
                          <span>
                            <span className="block text-sm font-medium text-ink">
                              {t("Jag vet inte – hjälp mig")}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              Jag föreslår {formatWhen(suggestion.at).toLowerCase()}.{" "}
                              {suggestion.why}
                            </span>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default QuickflowCapture;
