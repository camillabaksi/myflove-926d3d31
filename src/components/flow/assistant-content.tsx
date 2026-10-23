import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { MyFloveThinking } from "@/components/myflove/motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2,
  Send,
  Plus,
  Trash2,
  X,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  MessageCircle,
  Heart,
} from "lucide-react";
import { FlowMascot, type FlowStatus } from "@/components/flow-mascot";
import { FlowMicButton } from "@/components/flow/flow-mic-button";
import { chatWithFlow } from "@/lib/flow-chat.functions";
import { FlowRichText, FlowActionIcon } from "@/components/flow/flow-rich-text";
import { useTasks } from "@/hooks/use-data";
import { useLifePuzzle } from "@/hooks/use-life-puzzle";
import { useFlowPlan } from "@/hooks/use-flow-plan";
import { flowPlanContext } from "@/lib/flow-plan";
import { useFlowPersonalContext } from "@/hooks/use-flow-personal-context";
import { useMyFlowMemories } from "@/hooks/use-my-flow";

import {
  createFlowConversation,
  saveFlowMessage,
  useFlowConversations,
  useFlowMessages,
  type FlowMessage,
} from "@/hooks/use-flow-chats";
import { todayISO } from "@/lib/day";
import {
  ACTION_LABEL,
  actionCta,
  matchTask,
  paceActionTaskId,
  allowedFlowMoveDate,
  flowEditTaskPatch,
  parseFlowReply,
  type FlowAction,
} from "@/lib/flow-actions";
import { parseExerciseBlocks, savedExercisesContext } from "@/lib/saved-exercises";
import { FlowSpeakButton } from "@/components/flow/flow-speak-button";
import { useSavedExercises } from "@/hooks/use-saved-exercises";
import { useChildren } from "@/hooks/use-children";
import { useSharedShoppingList } from "@/hooks/use-shared-shopping-list";
import { FlowExerciseDraftCard, FlowSavedSuggestionCard } from "@/components/recovery/flow-exercise-cards";
import { relativeDayLabel } from "@/lib/flow-chat-history";
import { track } from "@/lib/analytics";
import { DaySpaceNote } from "@/components/day/day-space-note";

const todayStr = (): string => todayISO();

const tomorrowISO = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayISO(d);
};




const QUICK_PROMPTS = [
  { label: "Hjälp mig planera dagen", prompt: "Hjälp mig planera utifrån min kapacitet. Vad är ett rimligt nästa steg?" },
  { label: "Jag känner mig överväldigad just nu", prompt: "Jag känner mig stressad. Hjälp mig att hitta ett litet, lugnt steg." },
  { label: "Ge mig förslag på en lugn aktivitet", prompt: "Föreslå en lugn återhämtande aktivitet som passar mig just nu." },
  { label: "Hjälp mig sortera mina tankar", prompt: "Hjälp mig sortera mina tankar, ett steg i taget." },
];

/** Chatten utan sidram – används både som egen sida och som HJÄLP-läget i Flow. */
export function AssistantContent({ chatId }: { chatId?: string }) {
  const navigate = useNavigate();
  const conversationId = chatId ?? null;

  const {
    conversations,
    loading: loadingConversations,
    error: conversationsError,
    refresh,
    remove,
    rename,
  } = useFlowConversations();
  const { messages, setMessages, loading: loadingMessages, error: messagesError } = useFlowMessages(conversationId);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Ett svar som visats men inte kunnat sparas – kan försökas igen. */
  const [unsavedReply, setUnsavedReply] = useState<{ conversationId: string; messageId: string; content: string } | null>(null);
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);
  /** Blocks repeated clicks before React re-renders; the saved task ID blocks replays after reload. */
  const appliedNewActions = useRef(new Set<string>());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Påbörjad text sparas per samtal så inget försvinner om du lämnar vyn.
   * Den ligger i sessionStorage – aldrig i klartext på disken – och rensas
   * automatiskt vid utloggning (clearLocalUserData tömmer sessionStorage).
   */
  const draftKey = `myflove-flow-draft-${conversationId ?? "ny"}`;
  useEffect(() => {
    if (typeof window === "undefined") return;
    setInput(window.sessionStorage.getItem(draftKey) ?? "");
  }, [draftKey]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (input.trim()) window.sessionStorage.setItem(draftKey, input);
    else window.sessionStorage.removeItem(draftKey);
  }, [draftKey, input]);

  const chat = useServerFn(chatWithFlow);
  const { puzzle, contextPrompt } = useLifePuzzle();
  const personalContext = useFlowPersonalContext();
  const [chosenMemories, setChosenMemories] = useMyFlowMemories();
  const [memoryCandidate, setMemoryCandidate] = useState<string | null>(null);
  // Flow kommunicerar FlowPlans nästa steg – aldrig en egen rekommendation.
  const flowPlan = useFlowPlan();
  const { exercises: savedExercises } = useSavedExercises();
  const { children: childProfiles } = useChildren();
  const { tasks, activeTasks, setTaskDueDate, addTaskSteps, updateTask, toggleTask, addTask, deleteTask } =
    useTasks();
  const [doneActions, setDoneActions] = useState<Record<string, string>>({});

  /** Same source tasks as Idag and Kalender. They are not all due today. */
  const taskListContext = activeTasks
    .slice(0, 20)
    .map((t) => `- id:${t.id} · ${t.title}${t.dueDate ? ` (planerat datum ${t.dueDate})` : ""}`)
    .join("\n");

  const shopping = useSharedShoppingList();

  const runAction = (key: string, action: FlowAction) => {
    if (action.kind === "handla") {
      const items = [action.title, ...(action.steps ?? [])].filter((t): t is string => !!t);
      items.forEach((t) => shopping.addItem(t));
      setDoneActions((p) => ({ ...p, [key]: "Tillagd i inköpslistan." }));
      return;
    }
    if (action.kind === "ny") {
      if (!action.title) return;
      const taskId = paceActionTaskId(key);
      if (!taskId || savingReplyId === key.split(":")[0] || unsavedReply?.messageId === key.split(":")[0]) {
        toast.error("Spara samtalet innan aktiviteten läggs till.");
        return;
      }
      if (tasks.some((task) => task.id === taskId) || appliedNewActions.current.has(taskId)) {
        setDoneActions((p) => ({ ...p, [key]: "Redan tillagd i din dag." }));
        return;
      }
      appliedNewActions.current.add(taskId);
      try {
        // Same approved message + action creates exactly one account-owned task,
        // including on another device after cloud sync or from old chat history.
        addTask(action.title, action.date, {
          id: taskId,
          ...(action.time ? { time: action.time } : {}),
        });
        setDoneActions((p) => ({ ...p, [key]: action.date ? `Tillagd för ${action.date}.` : "Tillagd för idag." }));
      } catch {
        appliedNewActions.current.delete(taskId);
        toast.error("Kunde inte lägga till just nu. Försök igen.");
      }
      return;
    }
    const task = matchTask(action, activeTasks);
    if (!task) {
      setDoneActions((p) => ({ ...p, [key]: "Jag kan inte avgöra säkert vilken aktivitet det gäller. Öppna den i Idag eller Kalender för att ändra rätt aktivitet." }));
      return;
    }
    if (action.kind === "flytta") {
      // Never silently move to tomorrow when an AI-proposed date is missing
      // or already past. The user must approve the actual destination.
      const date = allowedFlowMoveDate(action.date, todayStr());
      if (!date) {
        setDoneActions((p) => ({ ...p, [key]: "Datumet är oklart eller har passerat. Be Pace föreslå ett nytt datum innan du flyttar." }));
        return;
      }
      setTaskDueDate(task.id, date);
      if (action.steps?.length)
        addTaskSteps(
          task.id,
          action.steps.map((title) => ({ title })),
        );
      setDoneActions((p) => ({
        ...p,
        [key]: date === tomorrowISO() ? "Flyttad till imorgon." : `Flyttad till ${date}.`,
      }));
    } else if (action.kind === "andra") {
      // One guarded source-store write retains reminder lead times, notes and
      // area instead of resetting them via the separate quick-time setter.
      const patch = flowEditTaskPatch(action, task);
      if (Object.keys(patch).length) updateTask(task.id, patch);
      setDoneActions((p) => ({ ...p, [key]: Object.keys(patch).length ? "Ändrad." : "Inget att ändra." }));
    } else if (action.kind === "ta-bort") {
      deleteTask(task.id);
      setDoneActions((p) => ({ ...p, [key]: "Borttagen." }));
    } else if (action.kind === "forenkla") {
      updateTask(task.id, { friction: "small" });
      setDoneActions((p) => ({ ...p, [key]: "Nu räcker en mindre version." }));
    } else if (action.kind === "dela") {
      addTaskSteps(
        task.id,
        (action.steps ?? ["Första lilla steget"]).map((title) => ({ title })),
      );
      setDoneActions((p) => ({ ...p, [key]: "Uppdelad i små steg." }));
    } else {
      toggleTask(task.id);
      setDoneActions((p) => ({ ...p, [key]: "Avbockad." }));
    }
  };
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isSending, conversationId]);

  /** Flows kropp följer samtalet: lyssnar när du skriver, tänker vid väntan, andas ut när svaret kom. */
  const [justAnswered, setJustAnswered] = useState(false);
  useEffect(() => {
    if (!justAnswered) return;
    const t = setTimeout(() => setJustAnswered(false), 2600);
    return () => clearTimeout(t);
  }, [justAnswered]);
  const flowStatus: FlowStatus = isSending
    ? "thinking"
    : justAnswered
      ? "done"
      : input.trim()
        ? "listening"
        : "idle";

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setError(null);
    setInput("");
    setIsSending(true);

    const optimistic: FlowMessage = { id: `tmp-${Date.now()}`, role: "user", content: trimmed };
    const history = [...messages, optimistic];
    setMessages(history);

    try {
      let id = conversationId;
      let created = false;
      if (!id) {
        id = await createFlowConversation(trimmed);
        if (!id) throw new Error("Kunde inte skapa chatten. Är du inloggad?");
        created = true;
      }
      try {
        await saveFlowMessage(id, "user", trimmed);
      } catch (saveError) {
        // Texten får aldrig försvinna tyst – lägg tillbaka den i rutan.
        setInput(trimmed);
        setMessages(messages);
        throw saveError;
      }

      // Håll anropet inom serverns gränser: max 50 meddelanden och 4000 tecken kontext.
      const exerciseContext = savedExercisesContext(
        savedExercises,
        (cid) => childProfiles.find((c) => c.id === cid)?.name,
      );
      const childNames = childProfiles.length
        ? `Barnprofiler i Familj: ${childProfiles.map((c) => c.name).join(", ")}`
        : "";
      const context =
        `${exerciseContext}\n${childNames}\n\n${flowPlanContext(flowPlan)}\n\n${personalContext}\n\n${contextPrompt}\n\nÖppna aktiviteter från samma lista som Idag och Kalender (även kommande och försenade; ett angivet datum är aktivitetens planerade datum, inte nödvändigtvis idag). Idag ${todayStr()}, imorgon ${tomorrowISO()}:\n${taskListContext}`
          .trim()
          .slice(0, 4000);
      const { reply } = await chat({
        data: {
          messages: history.slice(-40).map((m) => ({ role: m.role, content: m.content })),
          context,
        },
      });
      // Use the SAME UUID for the optimistic message and its database row.
      // Action cards can then recognize their stored task after a reload.
      const replyMessageId = crypto.randomUUID();
      setSavingReplyId(replyMessageId);
      setMessages((m) => [...m, { id: replyMessageId, role: "assistant", content: reply }]);
      setJustAnswered(true);
      let replySaved = false;
      try {
        await saveFlowMessage(id, "assistant", reply, replyMessageId);
        replySaved = true;
        setUnsavedReply(null);
      } catch {
        // An unsaved reply remains visible but cannot create untraceable tasks.
        setUnsavedReply({ conversationId: id, messageId: replyMessageId, content: reply });
        setError("Svaret kunde inte sparas. Det finns kvar här på skärmen – försök spara igen nedan.");
      } finally {
        setSavingReplyId(null);
      }
      void refresh();
      // Do not navigate away from an unsaved response that needs retrying.
      if (created && replySaved) {
        void navigate({ to: "/assistant/$chatId", params: { chatId: id }, replace: true });
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      const msg = /invalid|parse|validation/i.test(raw)
        ? "Pace kunde inte läsa meddelandet. Prova att starta en ny chatt eller skriv lite kortare."
        : raw || "Något gick fel. Prova igen om en stund.";
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const saveChosenMemory = () => {
    const text = memoryCandidate?.trim().slice(0, 300);
    if (!text) return;
    setChosenMemories(prev => prev.some(m => m.text === text) ? prev : [...prev, { id: crypto.randomUUID(), text }]);
    setMemoryCandidate(null);
  };

  const openConversation = (id: string) => {
    setHistoryOpen(false);
    setMenuFor(null);
    track("flow_conversation_opened", { source: "assistant" });
    void navigate({ to: "/assistant/$chatId", params: { chatId: id } });
  };

  const historyList = (
    <div className="space-y-2" data-testid="flow-chat-history">
      <button
        type="button"
        onClick={() => {
          setHistoryOpen(false);
          setMenuFor(null);
          void navigate({ to: "/assistant" });
        }}
        className="w-full flex items-center gap-2 rounded-2xl bg-primary/10 text-primary px-3 py-2.5 text-sm font-semibold hover:bg-primary/15 transition-colors"
      >
        <Plus size={16} /> Nytt samtal
      </button>

      {conversations.length === 0 ? (
        <div className="rounded-2xl border border-border px-3 py-4 text-center">
          <p className="text-sm font-medium">💜 Prata med Pace</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Du kan börja ett nytt samtal när du vill.
          </p>
        </div>
      ) : (
        <>
          <p className="px-1 pt-2 text-xs uppercase tracking-wide text-muted-foreground">
            Mina samtal
          </p>
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`rounded-2xl border transition-colors ${
                c.id === conversationId
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {renamingId === c.id ? (
                <form
                  className="flex items-center gap-1 p-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void rename(c.id, renameValue)
                      .then(() => setRenamingId(null))
                      .catch((err) => toast.error(err instanceof Error ? err.message : "Namnet kunde inte sparas."));
                  }}
                >
                  <input
                    autoFocus
                    value={renameValue}
                    aria-label="Nytt namn på samtalet"
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-border bg-background px-2 py-1.5 text-sm"
                  />
                  <Button type="submit" size="sm" className="rounded-xl">
                    Spara
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => setRenamingId(null)}
                  >
                    Avbryt
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-1 px-2">
                  <button
                    type="button"
                    onClick={() => openConversation(c.id)}
                    className="flex-1 min-w-0 text-left py-2.5"
                  >
                    <p className="text-sm truncate">{c.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {relativeDayLabel(c.updated_at)}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-label={`Fler val för ${c.title}`}
                    aria-expanded={menuFor === c.id}
                    onClick={() => setMenuFor((m) => (m === c.id ? null : c.id))}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              )}

              {menuFor === c.id && renamingId !== c.id && (
                <div className="flex flex-wrap gap-2 border-t border-border/60 px-2 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRenameValue(c.title);
                      setRenamingId(c.id);
                      setMenuFor(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium"
                  >
                    <Pencil size={13} /> Byt namn
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(c.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive"
                  >
                    <Trash2 size={13} /> Ta bort samtal
                  </button>
                </div>
              )}

              {confirmDelete === c.id && (
                <div className="border-t border-border/60 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Ta bort “{c.title}” permanent? Andra samtal påverkas inte.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-xl"
                      onClick={() => {
                        setConfirmDelete(null);
                        setMenuFor(null);
                        void remove(c.id)
                          .then(() => {
                            if (c.id === conversationId) void navigate({ to: "/assistant" });
                          })
                          .catch((err) => toast.error(err instanceof Error ? err.message : "Samtalet kunde inte tas bort."));
                      }}
                    >
                      Ja, ta bort
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl"
                      onClick={() => setConfirmDelete(null)}
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}
      <p data-npf="optional" className="px-1 pt-1 text-[11px] text-muted-foreground">
        Sparade samtal är bara din historik – de blir inte automatiskt en del av vad Pace lär sig om
        dig.
      </p>
    </div>
  );

  return (
    <>
      <div className="pace-flow-chat pace-serene-chat lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
        <aside className="hidden lg:block">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Historik</p>
          <div className="max-h-[70vh] overflow-y-auto pr-1">{historyList}</div>
        </aside>

        <div className="flex min-w-0 flex-col gap-3 lg:block lg:space-y-5">
          {!conversationId && !loadingConversations && conversations.length > 0 && (
            <section className="rounded-2xl bg-card/60 px-3 py-3 space-y-2 lg:hidden" aria-label="Välj samtal med Pace">

              
              {conversations.length > 0 && (
                <div className="space-y-2">
                  <button type="button" aria-expanded={recentOpen} onClick={() => setRecentOpen((open) => !open)} className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-3 py-2.5 text-left text-sm font-medium text-muted-foreground">
                    <span>Tidigare samtal ({conversations.length})</span>
                    <ChevronRight size={17} className={recentOpen ? "rotate-90 transition-transform" : "transition-transform"} />
                  </button>
                  {recentOpen && <div className="space-y-1.5">
                    {conversations.slice(0, 5).map((c) => (
                      <button key={c.id} type="button" onClick={() => openConversation(c.id)} className="w-full flex items-center gap-2 rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-left hover:bg-muted/40">
                        <MessageCircle size={15} className="shrink-0 text-primary" />
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{c.title}</span><span className="text-xs text-muted-foreground">{relativeDayLabel(c.updated_at)}</span></span>
                        <ChevronRight size={15} className="shrink-0" />
                      </button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>Visa alla samtal</Button>
                  </div>}
                </div>
              )}
            </section>
          )}

          {(messages.length > 0 || loadingMessages || isSending || error) && <section className="pace-serene-messages rounded-2xl bg-card/70 p-3 space-y-3" aria-label="Samtal med Pace">
            <div ref={scrollRef} className="max-h-[55vh] space-y-3 overflow-y-auto">
              {loadingMessages ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Hämtar samtalet…
                </div>
              ) : (
                <>
                  {messages.map((m) => {
                    const ex = m.role === "assistant" ? parseExerciseBlocks(m.content) : null;
                    const parsed =
                      m.role === "assistant"
                        ? parseFlowReply(ex?.text ?? m.content)
                        : { text: m.content, actions: [] as FlowAction[] };
                    return (
                      <div key={m.id} className="space-y-2">
                        <div
                          className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {m.role !== "user" && (
                            <FlowMascot alt="Pace – Paceables följeslagare"
                              size="sm"
                              mood="calm"
                              status={flowStatus}
                              bump
                              className="shrink-0"
                            />
                          )}
                          <div
                            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                              m.role === "user"
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "pace-flow-reply bg-secondary text-foreground rounded-bl-sm"
                            }`}
                          >
                            {m.role === "assistant" ? <FlowRichText text={parsed.text} /> : parsed.text}
                            {m.role === "assistant" && parsed.text.trim().length > 0 && (
                              <div className="mt-1 flex justify-end">
                                <FlowSpeakButton text={parsed.text} />
                              </div>
                            )}
                          </div>
                        </div>
                        {m.role === "user" && !chosenMemories.some(memory => memory.text === m.content.slice(0, 300)) && (
                          <div className="flex justify-end"><Button variant="ghost" size="sm" className="h-auto rounded-xl text-xs text-muted-foreground" onClick={() => setMemoryCandidate(m.content.slice(0, 300))}>Vill du att jag kommer ihåg det?</Button></div>
                        )}

                        {ex?.exercises.map((d, i) => (
                          <FlowExerciseDraftCard key={`${m.id}:ex${i}`} draft={d} />
                        ))}
                        {ex?.savedIds.map((sid) => (
                          <FlowSavedSuggestionCard key={`${m.id}:s${sid}`} id={sid} onAsk={(q) => void send(q)} />
                        ))}
                        {parsed.actions.map((a, i) => {
                          const key = `${m.id}:${i}`;
                          const storedTaskId = a.kind === "ny" ? paceActionTaskId(key) : undefined;
                          const alreadyAdded = !!storedTaskId && tasks.some(task => task.id === storedTaskId);
                          const pendingSave = savingReplyId === m.id || unsavedReply?.messageId === m.id;
                          const done = alreadyAdded ? "Redan tillagd i din dag." : doneActions[key];
                          return (
                            <div
                              key={key}
                              className="ml-10 max-w-[80%] rounded-2xl border border-border bg-card p-3"
                            >
                              <p className="text-sm font-medium text-foreground">
                                <FlowActionIcon kind={a.kind} />{" "}
                                {a.label ?? ACTION_LABEL[a.kind]}
                              </p>
                              {(a.title || a.date || a.time) && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {[a.title, a.date, a.time].filter(Boolean).join(" · ")}
                                </p>
                              )}
                              {a.taskTitle && a.kind !== "ny" && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {a.taskTitle}
                                </p>
                              )}
                              {a.steps && (
                                <ul className="mt-1 space-y-0.5">
                                  {a.steps.map((s) => (
                                    <li key={s} className="text-xs text-muted-foreground">
                                      · {s}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {done ? (
                                <p className="mt-2 text-xs font-medium text-primary">{done}</p>
                              ) : (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    className="rounded-xl"
                                    disabled={pendingSave}
                                    onClick={() => runAction(key, a)}
                                  >
                                    {actionCta(a)}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-xl"
                                    disabled={pendingSave}
                                    onClick={() =>
                                      setDoneActions((p) => ({ ...p, [key]: "Vi lät den vara." }))
                                    }
                                  >
                                    Nej, låt den vara
                                  </Button>
                                </div>
                              )}
                              {pendingSave && a.kind === "ny" && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Spara samtalet innan aktiviteten läggs till.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}
              {isSending && (
                <div className="flex justify-start items-end gap-2">
                  <FlowMascot alt="Pace – Paceables följeslagare" size="sm" mood="think" status="thinking" bump className="shrink-0" />
                  <div className="bg-secondary text-muted-foreground px-4 py-2 rounded-2xl rounded-bl-sm text-sm">
                    <MyFloveThinking
                      steps={["💬", "🧠", "💜", "✨"]}
                      label="Pace tänker…"
                      className="py-1"
                    />
                  </div>
                </div>
              )}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                  {error}
                  {unsavedReply && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2 rounded-xl"
                      onClick={() => {
                        const pending = unsavedReply;
                        setSavingReplyId(pending.messageId);
                        void saveFlowMessage(pending.conversationId, "assistant", pending.content, pending.messageId)
                          .then(() => {
                            setUnsavedReply(null);
                            setError(null);
                            void refresh();
                            if (!conversationId) void navigate({ to: "/assistant/$chatId", params: { chatId: pending.conversationId }, replace: true });
                          })
                          .catch(() => setError("Det gick fortfarande inte att spara. Försök igen om en liten stund."))
                          .finally(() => setSavingReplyId(null));
                      }}
                    >
                      Försök spara igen
                    </Button>
                  )}
                </div>
              )}
              {(conversationsError || messagesError) && (
                <p className="text-xs text-muted-foreground">{conversationsError ?? messagesError}</p>
              )}
            </div>
          </section>}


          {messages.length === 0 && (
            <div className="space-y-2">
              <button type="button" aria-expanded={suggestionsOpen} onClick={() => setSuggestionsOpen((open) => !open)} className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card/70 px-3 py-2.5 text-left text-sm font-medium">
                <span>Förslag just nu</span><ChevronRight size={17} className={suggestionsOpen ? "rotate-90 transition-transform" : "transition-transform"} />
              </button>
              {suggestionsOpen && <div className="pace-scene-suggestions">
                {QUICK_PROMPTS.map(({ label, prompt }) => (
                  <Button key={label} variant="outline" className="pace-scene-suggestion h-auto min-h-10 whitespace-normal rounded-xl bg-card px-3 py-2 text-left text-sm" disabled={isSending} onClick={() => prompt ? void send(prompt) : inputRef.current?.focus()}>{label}</Button>
                ))}
              </div>}
            </div>
          )}

          <div className="pace-serene-composer bg-card/90 p-2 rounded-2xl border border-border/70 focus-within:ring-2 focus-within:ring-primary/15 transition-all">
            <DaySpaceNote compact />
            <textarea
              ref={inputRef}
              id="pace-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Skriv till Pace…"
              className="w-full min-h-12 h-14 p-3 bg-transparent border-none outline-none resize-y text-base"
            />
            <div className="flex justify-end gap-2 px-2 pb-1">
              <FlowMicButton
                disabled={isSending}
                onTranscript={(text) =>
                  setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))
                }
                onError={(message) => setError(message)}
              />
              <Button
                onClick={() => void send(input)}
                disabled={!input.trim() || isSending}
                className="rounded-xl h-10 px-5"
              >
                <Send className="w-4 h-4 mr-2" />
                Skicka
              </Button>
            </div>
          </div>
        </div>
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setHistoryOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-xs bg-card border-l border-border p-4 overflow-y-auto animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">Dina samtal</p>
              <button
                type="button"
                aria-label="Stäng historik"
                onClick={() => setHistoryOpen(false)}
                className="p-2 rounded-xl hover:bg-secondary"
              >
                <X size={18} />
              </button>
            </div>
            {historyList}
          </div>
        </div>
      )}
      <Dialog open={memoryCandidate !== null} onOpenChange={open => { if (!open) setMemoryCandidate(null); }}>
        <DialogContent className="rounded-3xl"><DialogTitle>Spara hos Pace?</DialogTitle><DialogDescription>Pace använder det i framtida samtal. Du kan ändra eller ta bort det när du vill.</DialogDescription><p className="break-words rounded-2xl bg-secondary p-3 text-sm">{memoryCandidate}</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setMemoryCandidate(null)}>Inte nu</Button><Button onClick={saveChosenMemory}>Ja, kom ihåg</Button></div></DialogContent>
      </Dialog>
    </>
  );
}
