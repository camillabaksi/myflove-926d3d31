import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { MyFloveBlock } from "@/components/myflove/block";
import { MyFloveHeader } from "@/components/myflove";

import { MyFloveThinking } from "@/components/myflove/motion";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Send,
  History,
  Plus,
  Trash2,
  X,
  ArrowLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  MessageCircle,
} from "lucide-react";
import { FlowMascot, type FlowStatus } from "@/components/flow-mascot";
import { chatWithFlow } from "@/lib/flow-chat.functions";
import { useTasks, useMoods, useFocus, useReminders } from "@/hooks/use-data";
import { useLifePuzzle } from "@/hooks/use-life-puzzle";
import { useFlowPersonalContext } from "@/hooks/use-flow-personal-context";
import { lastPlace, placeFor, shortcutsFor, type FlowPlace } from "@/lib/flow-context";
import {
  AREA_META,
  ALL_AREAS,
  areaChipStyle,
  areaTint,
  areaColor,
  type LifeArea,
} from "@/lib/life-areas";
import { Link } from "@tanstack/react-router";

import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { generateCoachMessage } from "@/lib/coach";
import {
  createFlowConversation,
  saveFlowMessage,
  useFlowConversations,
  useFlowMessages,
  type FlowMessage,
} from "@/hooks/use-flow-chats";
import { todayISO } from "@/lib/day";
import {
  ACTION_EMOJI,
  ACTION_LABEL,
  actionCta,
  matchTask,
  parseFlowReply,
  type FlowAction,
} from "@/lib/flow-actions";
import { relativeDayLabel } from "@/lib/flow-chat-history";
import { track } from "@/lib/analytics";

const todayStr = (): string => todayISO();

const tomorrowISO = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayISO(d);
};

const NEW_CHAT_FLAG = "myflove-flow-new-chat";

const GREETING =
  "Hej, jag är Flow. Jag finns här för att avlasta – inte för att ge dig mer att göra. Vad snurrar i huvudet just nu?";

const QUICK_PROMPTS = [
  "Det känns för mycket idag",
  "Hjälp mig bryta ner en uppgift",
  "Vad borde jag börja med?",
];

/** Chatten utan sidram – används både som egen sida och som HJÄLP-läget i Flow. */
export function AssistantContent({ chatId }: { chatId?: string }) {
  const navigate = useNavigate();
  const conversationId = chatId ?? null;

  const {
    conversations,
    loading: loadingConversations,
    refresh,
    remove,
    rename,
  } = useFlowConversations();
  const { messages, setMessages, loading: loadingMessages } = useFlowMessages(conversationId);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Fortsätt där du slutade: när du öppnar Flow utan att välja samtal
   * hoppar vi tillbaka in i det senaste – om du inte aktivt bad om en ny chatt.
   * "Nytt samtal" gäller bara den här vyn: flaggan konsumeras direkt så att
   * nästa gång du öppnar Flow landar du i historiken igen.
   */
  const wantsNewChat = useRef(false);
  if (typeof window !== "undefined" && !wantsNewChat.current) {
    if (window.sessionStorage.getItem(NEW_CHAT_FLAG) === "1") {
      wantsNewChat.current = true;
      window.sessionStorage.removeItem(NEW_CHAT_FLAG);
    }
  }
  useEffect(() => {
    if (conversationId || loadingConversations || isSending) return;
    if (wantsNewChat.current) return;
    const latest = conversations[0];
    if (!latest) return;
    void navigate({ to: "/assistant/$chatId", params: { chatId: latest.id }, replace: true });
  }, [conversationId, loadingConversations, conversations, isSending, navigate]);

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
  const [place, setPlace] = useState<FlowPlace | null>(null);
  useEffect(() => {
    setPlace(lastPlace());
  }, []);
  /** Byt del av livet utan att lämna Flow – ändrar bara vad Flow utgår från. */
  const switchArea = (area: LifeArea) => {
    const home: Record<LifeArea, string> = {
      vardag: "/hem",
      privat: "/familj",
      barn: "/barn",
      studier: "/studyflow",
      jobb: "/workflow",
      halsa: "/mitt-batteri",
      ekonomi: "/finances",
      socialt: "/relationer",
      egentid: "/mitt-batteri",
    };
    setPlace(placeFor(home[area]));
  };

  const { activeTasks, setTaskDueDate, addTaskSteps, updateTask, toggleTask } = useTasks();
  const [doneActions, setDoneActions] = useState<Record<string, string>>({});

  /** Uppgifterna Flow får referera till – bara titel och id, inget privat. */
  const taskListContext = activeTasks
    .slice(0, 20)
    .map((t) => `- id:${t.id} · ${t.title}${t.dueDate ? ` (datum ${t.dueDate})` : ""}`)
    .join("\n");

  const runAction = (key: string, action: FlowAction) => {
    const task = matchTask(action, activeTasks);
    if (!task) {
      setDoneActions((p) => ({ ...p, [key]: "Jag hittar inte uppgiften längre." }));
      return;
    }
    if (action.kind === "flytta") {
      const date = action.date ?? tomorrowISO();
      setTaskDueDate(task.id, date);
      if (action.steps?.length)
        addTaskSteps(
          task.id,
          action.steps.map((title) => ({ title })),
        );
      setDoneActions((p) => ({ ...p, [key]: `Flyttad till ${date}.` }));
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
  const { moods } = useMoods();
  const { currentFocus } = useFocus();
  const { activeReminders } = useReminders();
  const [sessionLog] = useCloudSyncedStorage<{ date: string; count: number }>(
    "myflow-pomodoro-sessions",
    {
      date: todayStr(),
      count: 0,
    },
  );
  const pomodoroTodaySessions = sessionLog.date === todayStr() ? sessionLog.count : 0;
  const coachMessage = generateCoachMessage({
    moods,
    activeTasks,
    currentFocus,
    activeReminders,
    pomodoroTodaySessions,
  });

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
      await saveFlowMessage(id, "user", trimmed);

      // Håll anropet inom serverns gränser: max 50 meddelanden och 4000 tecken kontext.
      const context =
        `${personalContext}\n\n${contextPrompt}\n\nDagens uppgifter (dagens datum ${todayStr()}, imorgon ${tomorrowISO()}):\n${taskListContext}`
          .trim()
          .slice(0, 4000);
      const { reply } = await chat({
        data: {
          messages: history.slice(-40).map((m) => ({ role: m.role, content: m.content })),
          context,
        },
      });
      setMessages((m) => [...m, { id: `tmp-a-${Date.now()}`, role: "assistant", content: reply }]);
      setJustAnswered(true);
      await saveFlowMessage(id, "assistant", reply);
      void refresh();
      // Navigera först när svaret är sparat – annars avbryts anropet av omladdningen.
      if (created) {
        if (typeof window !== "undefined") window.sessionStorage.removeItem(NEW_CHAT_FLAG);
        void navigate({ to: "/assistant/$chatId", params: { chatId: id }, replace: true });
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      const msg = /invalid|parse|validation/i.test(raw)
        ? "Flow kunde inte läsa meddelandet. Prova att starta en ny chatt eller skriv lite kortare."
        : raw || "Något gick fel. Prova igen om en stund.";
      setError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const openConversation = (id: string) => {
    setHistoryOpen(false);
    setMenuFor(null);
    if (typeof window !== "undefined") window.sessionStorage.removeItem(NEW_CHAT_FLAG);
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
          if (typeof window !== "undefined") window.sessionStorage.setItem(NEW_CHAT_FLAG, "1");
          void navigate({ to: "/assistant" });
        }}
        className="w-full flex items-center gap-2 rounded-2xl bg-primary/10 text-primary px-3 py-2.5 text-sm font-semibold hover:bg-primary/15 transition-colors"
      >
        <Plus size={16} /> Nytt samtal
      </button>

      {conversations.length === 0 ? (
        <div className="rounded-2xl border border-border px-3 py-4 text-center">
          <p className="text-sm font-medium">💜 Prata med Flow</p>
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
                    void rename(c.id, renameValue);
                    setRenamingId(null);
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
                        void remove(c.id);
                        if (c.id === conversationId) void navigate({ to: "/assistant" });
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
        Sparade samtal är bara din historik – de blir inte automatiskt en del av vad Flow lär sig om
        dig.
      </p>
    </div>
  );

  return (
    <>
      <MyFloveHeader
        title="Chatta med Flow"
        emojiKey="assistant"
        description="Din andra hjärna – lugn, empatisk, aldrig dömande"
        action={
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl lg:hidden"
            onClick={() => setHistoryOpen(true)}
          >
            <History size={16} className="mr-1" />
            Historik
          </Button>
        }
      >
        <p data-npf="optional" className="text-xs text-muted-foreground">
          Flow utgår från din profil och dina mönster i appen.{" "}
          <Link to="/profil" className="underline underline-offset-2">
            Justera din profil
          </Link>
        </p>
      </MyFloveHeader>
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        <aside className="hidden lg:block">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Historik</p>
          <div className="max-h-[70vh] overflow-y-auto pr-1">{historyList}</div>
        </aside>

        <div className="space-y-6 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (place && place.path !== "/assistant") void navigate({ to: place.path });
                else void navigate({ to: "/hem" });
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition-transform active:scale-95"
            >
              <ArrowLeft size={16} />
              Tillbaka till {place ? place.label : "Hem"}
            </button>
          </div>

          <nav
            aria-label="Brödsmulor"
            className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
          >
            <Link to="/hem" className="hover:text-foreground">
              Hem
            </Link>
            {place && (
              <>
                <ChevronRight size={13} aria-hidden="true" className="opacity-60" />
                <span style={{ color: areaColor(place.area) }} className="font-medium">
                  {AREA_META[place.area].emoji} {AREA_META[place.area].label}
                </span>
                <ChevronRight size={13} aria-hidden="true" className="opacity-60" />
                <Link to={place.path} className="hover:text-foreground">
                  {place.label}
                </Link>
              </>
            )}
            <ChevronRight size={13} aria-hidden="true" className="opacity-60" />
            <span className="font-medium text-foreground">Flow</span>
          </nav>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
            <FlowMascot
              size="sm"
              wave={flowStatus === "idle"}
              glow
              status={flowStatus}
              bump
              mood={
                flowStatus === "thinking" ? "think" : flowStatus === "done" ? "cheer" : undefined
              }
              className="shrink-0"
            />
            <p className="text-sm text-muted-foreground">
              {flowStatus === "thinking" ? "Flow tänker…" : "Flow lyssnar när du behöver det."}
            </p>
          </div>

          {place && (
            <div
              className="rounded-3xl border-2 p-4"
              style={{
                backgroundColor: areaTint(place.area, 0.1),
                borderColor: areaTint(place.area, 0.3),
              }}
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Du är i</p>
              <p className="text-sm font-semibold" style={{ color: areaColor(place.area) }}>
                {AREA_META[place.area].emoji} {AREA_META[place.area].label} · {place.label}
              </p>
              <p data-npf="optional" className="mt-1 text-xs text-muted-foreground">
                {AREA_META[place.area].blurb}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {shortcutsFor(place).map((sc) => (
                  <Link
                    key={sc.href}
                    to={sc.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-transform active:scale-95"
                  >
                    <span aria-hidden="true">{sc.emoji}</span>
                    {sc.label}
                  </Link>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {ALL_AREAS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => switchArea(a)}
                    style={areaChipStyle(a, a === place.area)}
                    className="rounded-full px-3 py-1 text-[11px] font-medium"
                  >
                    {AREA_META[a].emoji} {AREA_META[a].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <MyFloveBlock
            title="Idag"
            subtitle="En liten lägesbild från Flow"
            icon={MessageCircle}
            tone="lavender"
            surface="lavender"
            collapsible
            collapseId="assistant::idag"
          >
            <p className="text-sm leading-snug">{coachMessage.text}</p>
          </MyFloveBlock>

          <MyFloveBlock
            title="Samtal"
            subtitle="Skriv när du vill – Flow lyssnar"
            icon={MessageCircle}
            tone="lavender"
            surface="plain"
            className="p-4"
            bodyClassName="space-y-4"
            collapsible
            collapseId="assistant::samtal"
          >
            <div ref={scrollRef} className="max-h-[55vh] space-y-4 overflow-y-auto">
              {loadingMessages ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Hämtar samtalet…
                </div>
              ) : (
                <>
                  {messages.length === 0 && (
                    <div className="flex justify-start items-end gap-2">
                      <FlowMascot size="sm" mood="wave" bump className="shrink-0" />
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-secondary text-foreground">
                        {GREETING}
                      </div>
                    </div>
                  )}
                  {messages.map((m) => {
                    const parsed =
                      m.role === "assistant"
                        ? parseFlowReply(m.content)
                        : { text: m.content, actions: [] as FlowAction[] };
                    return (
                      <div key={m.id} className="space-y-2">
                        <div
                          className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {m.role !== "user" && (
                            <FlowMascot
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
                                : "bg-secondary text-foreground rounded-bl-sm"
                            }`}
                          >
                            {parsed.text}
                          </div>
                        </div>

                        {parsed.actions.map((a, i) => {
                          const key = `${m.id}:${i}`;
                          const done = doneActions[key];
                          return (
                            <div
                              key={key}
                              className="ml-10 max-w-[80%] rounded-2xl border border-border bg-card p-3"
                            >
                              <p className="text-sm font-medium text-foreground">
                                <span aria-hidden>{ACTION_EMOJI[a.kind]}</span>{" "}
                                {a.label ?? ACTION_LABEL[a.kind]}
                              </p>
                              {a.taskTitle && (
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
                                    onClick={() => runAction(key, a)}
                                  >
                                    {actionCta(a)}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-xl"
                                    onClick={() =>
                                      setDoneActions((p) => ({ ...p, [key]: "Vi lät den vara." }))
                                    }
                                  >
                                    Nej, låt den vara
                                  </Button>
                                </div>
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
                  <FlowMascot size="sm" mood="think" status="thinking" bump className="shrink-0" />
                  <div className="bg-secondary text-muted-foreground px-4 py-2 rounded-2xl rounded-bl-sm text-sm">
                    <MyFloveThinking
                      steps={["💬", "🧠", "💜", "✨"]}
                      label="Flow tänker…"
                      className="py-1"
                    />
                  </div>
                </div>
              )}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}
            </div>
          </MyFloveBlock>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {[puzzle.flowPrompt, ...(place ? [place.prompt] : []), ...QUICK_PROMPTS]
                .filter((p, i, arr) => p && arr.indexOf(p) === i)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => void send(p)}
                    className="px-3 py-2 rounded-full text-sm bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                  >
                    {p}
                  </button>
                ))}
            </div>
          )}

          <div className="bg-card p-2 rounded-3xl shadow-sm border border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Skriv till Flow…"
              className="w-full h-24 p-3 bg-transparent border-none outline-none resize-none text-base"
            />
            <div className="flex justify-end px-2 pb-1">
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
    </>
  );
}
