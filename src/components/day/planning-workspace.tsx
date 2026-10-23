import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, NotebookPen, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useChildren } from "@/hooks/use-children";
import { useTasks, useReminders, type Reminder } from "@/hooks/use-data";
import { useVisualCalendar } from "@/hooks/use-visual-calendar";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { useLang } from "@/hooks/use-language";
import { useActiveArea, AREA_META, type LifeArea } from "@/lib/life-areas";
import { suggestActivityArea } from "@/lib/smart-area-suggestions";
import { isActiveOwner } from "@/lib/account-scope";
import { getSyncUser, useCloudSyncedStorage } from "@/lib/cloud-storage";
import { addDaysISO, todayISO } from "@/lib/day";
import { dateHeadingLabel } from "@/lib/date-presentation";
import {
  applyFamilyPresence,
  familyLayerEntries,
  DEFAULT_FAMILY_LAYER,
  type FamilyLayerPreferences,
} from "@/lib/family-calendar";
import { isFamilyEntry, periodDates } from "@/lib/visual-calendar";
import {
  draftPlanningLines,
  planningTasks,
  childPlanningRows,
  validatePlanningDrafts,
  type PlanningDraft,
  type PlanningPeriod,
} from "@/lib/planning";
import { DayReplanButton } from "@/components/day/day-replan";
import OptionalSavedStrategies from "@/components/day/optional-saved-strategies";
import { addStrategyToPlanningDraft } from "@/lib/saved-strategy-planning";
import {
  readPlanningHandoff,
  rememberPlanningHandoff,
  discardPlanningHandoff,
  type PlanningHandoff,
} from "@/lib/planning-handoff";

export const PLANNING_PERIODS = [
  ["today", "Idag"],
  ["tomorrow", "Imorgon"],
  ["week", "Veckan"],
] as const;

export function PlanningEntry({
  childrenOnly = false,
  compact = false,
  children,
}: {
  childrenOnly?: boolean;
  /** Kompakt rad på Idag: rubrik och periodval på samma rad, utan tom yta. */
  compact?: boolean;
  children?: ReactNode;
}) {
  const { t } = useLang();
  if (childrenOnly)
    return (
      <Link
        to="/planera"
        search={{ audience: "children", period: "today" }}
        className="flex min-h-11 items-center gap-2 rounded-xl border border-border/60 bg-lavender/25 px-3 py-2 text-ink hover:bg-lavender/40"
      >
        <Users size={20} className="shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{t("Barnens schema")}</span>
        </span>
        <ChevronRight size={18} className="shrink-0" aria-hidden />
      </Link>
    );
  if (compact)
    return (
      <details className="group rounded-xl border border-border/60 bg-mint/15 px-3 py-1" aria-label={t("Planera i din takt")}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
          <NotebookPen size={17} className="shrink-0 text-primary" aria-hidden />
          <span className="flex-1">{t("Planera i din takt")}</span>
          <ChevronRight size={17} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
        </summary>
        <nav className="flex flex-wrap gap-2 border-t border-border/40 py-3" aria-label={t("Välj planeringsperiod")}>
          {PLANNING_PERIODS.map(([period, label]) => (
            <Button key={period} asChild variant="outline" className="min-h-10 rounded-xl bg-card/70 px-3 text-sm shadow-none">
              <Link to="/planera" search={{ audience: "me", period }}>{t(label)}</Link>
            </Button>
          ))}
        </nav>
        {children && <div className="pb-2">{children}</div>}
      </details>
    );
  return (
    <section
      className="rounded-2xl border border-border/60 bg-mint/30 p-4"
      aria-label={t("Planera i din takt")}
    >
      <div className="flex items-start gap-3">
        <NotebookPen size={20} className="mt-1 shrink-0 text-primary" aria-hidden />
        <div>
          <h3 className="font-display text-lg font-medium">{t("Planera i din takt")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("En dag eller en vecka. Lite i taget.")}
          </p>
        </div>
      </div>
      <nav
        className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,6rem),1fr))] gap-2"
        aria-label={t("Välj planeringsperiod")}
      >
        {PLANNING_PERIODS.map(([period, label]) => (
          <Button
            key={period}
            asChild
            variant="outline"
            className="min-h-11 rounded-xl px-2 text-sm shadow-none"
          >
            <Link to="/planera" search={{ audience: "me", period }}>
              {t(label)}
            </Link>
          </Button>
        ))}
      </nav>
      {children}
    </section>
  );
}

/** Both audience panels stay mounted while switching views. Drafts never enter storage or analytics. */
export function PlanningWorkspace({
  owner,
  audience,
  requestedPeriod,
  revealSupports = false,
}: {
  owner: string;
  audience: "me" | "children";
  requestedPeriod?: PlanningPeriod;
  /** Only opens the saved-support section. Never edits or saves a draft. */
  revealSupports?: boolean;
}) {
  const { t, locale } = useLang();
  const navigate = useNavigate();
  // Restore only an unfinished, same-account draft from an earlier visit to Planera.
  // Nothing here is synced or turned into an activity until the usual save action.
  const [restored] = useState(() => readPlanningHandoff(owner, audience));
  const [target, setTarget] = useState<"me" | "children" | "both">(restored?.target ?? audience);
  const forChildren = target !== "me";
  const forMe = target !== "children";
  const childStore = useChildren();
  const children = childStore.children.filter((child) => child.owner_id === owner);
  const { addPlannedTasks } = useTasks();
  const { addPlannedPeriods } = useReminders();
  const { activeArea } = useActiveArea();
  const today = todayISO();
  const [period, setPeriod] = useState<PlanningPeriod>(restored?.period ?? requestedPeriod ?? "today");
  const [date, setDate] = useState(restored?.date ?? (requestedPeriod === "tomorrow" ? addDaysISO(today, 1) : today));
  const [weekAnchor, setWeekAnchor] = useState(restored?.weekAnchor ?? today);
  const [selected, setSelected] = useState<string[]>(restored?.selected ?? []);
  const [text, setText] = useState(restored?.text ?? "");
  const [rows, setRows] = useState<PlanningDraft[]>(restored?.rows ?? []);
  const [periodAreas, setPeriodAreas] = useState<Record<string, LifeArea>>(restored?.periodAreas ?? {});
  const [stage, setStage] = useState<"write" | "review">(restored?.stage ?? "write");
  // Show a short existing-plan preview on narrow screens; keep the full list on desktop.
  const [showAllExisting, setShowAllExisting] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const pending = useRef<PlanningDraft[] | null>(null);
  const busy = useRef(false);
  // A completed child write must not be repeated if the own-task write needs retrying.
  const childrenWritten = useRef(false);
  const mounted = useRef(true);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const handoffRef = useRef<PlanningHandoff>({
    target, period, date, weekAnchor, selected, text, rows, periodAreas, stage,
  });
  // Capture current controlled input on every render, including review edits.
  handoffRef.current = { target, period, date, weekAnchor, selected, text, rows, periodAreas, stage };
  const initialRequestedPeriod = useRef(requestedPeriod);
  useEffect(() => {
    mounted.current = true;
    // Clear the handoff only after mounting; React may run initializers twice.
    discardPlanningHandoff(owner, audience);
    return () => {
      mounted.current = false;
      // Do not hand off a partial/failed save: repeating it after remount could
      // duplicate a child write. Ordinary unsaved drafts are safe to restore.
      if (!busy.current && !lockedRef.current && !pending.current && !childrenWritten.current) {
        rememberPlanningHandoff(owner, audience, handoffRef.current);
      }
    };
  }, [owner, audience]);
  useEffect(() => {
    if (!requestedPeriod) return;
    // Returning from Insikter must not overwrite the selected date/week.
    // Comparing route input also remains safe if StrictMode re-runs effects.
    if (restored && initialRequestedPeriod.current === requestedPeriod) return;
    initialRequestedPeriod.current = requestedPeriod;
    setPeriod(requestedPeriod);
    setDate(requestedPeriod === "tomorrow" ? addDaysISO(todayISO(), 1) : todayISO());
    setWeekAnchor(todayISO());
  }, [requestedPeriod]);
  const week = useMemo(() => periodDates(weekAnchor, "vecka"), [weekAnchor]);
  const dates = useMemo(() => (period === "week" ? week : [date]), [period, week, date]);
  const { days, planningReady, planningError, externalError } = useVisualCalendar(dates);
  const capacityOf = useDayCapacity();
  const entries = days[date] ?? [];
  const [familyPreferences] = useCloudSyncedStorage<FamilyLayerPreferences>(
    "myflove-calendar-family-layer",
    DEFAULT_FAMILY_LAYER,
  );
  const planningEntries = applyFamilyPresence(entries, familyPreferences);
  const ownedIds = children.map((child) => child.id);
  const ready =
    isActiveOwner(owner) &&
    (!forChildren || (childStore.userId === owner && !childStore.loading && !childStore.error));
  const shown = forChildren
    ? familyLayerEntries(
        entries.filter((entry) => entry.source === "child"),
        { ...DEFAULT_FAMILY_LAYER, children: selected },
      )
    : entries.filter((entry) => !isFamilyEntry(entry));
  // Changing date or whose calendar is shown starts a fresh, compact preview.
  useEffect(() => {
    setShowAllExisting(false);
  }, [date, target, selected.join("|")]);
  const lineCount = text.split(/\r?\n/).filter((line) => line.trim()).length;
  const dateLabel = (day: string, short = false) =>
    dateHeadingLabel(
      new Date(`${day}T12:00:00`).toLocaleDateString(locale, {
        weekday: short ? "short" : "long",
        day: "numeric",
        ...(short ? {} : { month: "long" }),
      }),
      locale,
    );
  const patchRow = (id: string, patch: Partial<PlanningDraft>) =>
    setRows((previous) => previous.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const review = () => {
    try {
      if (!ready || (forChildren && !selected.length))
        throw Error("Välj minst ett barn innan du fortsätter.");
      setRows(draftPlanningLines(text, date, forChildren ? selected : [], rows));
      setStage("review");
      setError("");
    } catch (cause) {
      setError(t(cause instanceof Error ? cause.message : "Kontrollera aktiviteterna."));
    }
  };
  async function save() {
    if (busy.current || !ready) return;
    try {
      const batch = pending.current ?? rows;
      validatePlanningDrafts(batch);
      if (forChildren) childPlanningRows(batch, owner, ownedIds);
      busy.current = true;
      setSaving(true);
      setError("");
      if ((await getSyncUser())?.id !== owner || !isActiveOwner(owner) || !mounted.current)
        throw Error("Kontot har ändrats. Öppna planeringen igen.");
      // Freeze an attempted batch until it is confirmed, so a network retry uses identical IDs/content.
      pending.current ??= structuredClone(batch);
      setLocked(true);
      if (forChildren && !childrenWritten.current) {
        await childStore.addPlannedActivities(pending.current, owner);
        childrenWritten.current = true;
      }
      if (forMe) {
        addPlannedTasks(
          planningTasks(pending.current, activeArea === "alla" ? "vardag" : activeArea).map(task => ({ ...task, area: periodAreas[task.id] ?? suggestActivityArea(task.title) ?? task.area })),
          owner,
        );
        // Stable draft IDs make retries safe, including after partial child writes.
        const periods: Reminder[] = pending.current.filter(row => row.endDate).map(row => ({
          id: row.id, title: row.title.trim(), date: row.date, endDate: row.endDate,
          repeat: "none", completed: false, createdAt: Date.now(),
          note: row.location.trim() || "Sammanhängande period",
          energyImpact: "unknown",
          area: periodAreas[row.id] ?? suggestActivityArea(row.title) ?? (activeArea === "alla" ? "vardag" : activeArea),
        }));
        addPlannedPeriods(periods);
      }
      if (!mounted.current || !isActiveOwner(owner)) return;
      toast.success(
        `${batch.length} ${t(batch.length === 1 ? "aktivitet sparad." : "aktiviteter sparade.")}`,
      );
      pending.current = null;
      childrenWritten.current = false;
      discardPlanningHandoff(owner, audience);
      // Prevent a same-tick navigation from handing off the just-saved batch.
      handoffRef.current = {
        ...handoffRef.current, text: "", rows: [], periodAreas: {}, stage: "write",
      };
      setLocked(false);
      setRows([]);
      setPeriodAreas({});
      setText("");
      setStage("write");
    } catch (cause) {
      if (mounted.current && isActiveOwner(owner))
        setError(
          t(
            cause instanceof Error
              ? cause.message
              : "Sparandet kunde inte bekräftas. Dina aktiviteter ligger kvar, försök igen.",
          ),
        );
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  return (
    <div className="pace-mobile-controls pace-planning-workspace mx-auto grid max-w-6xl items-start gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
      <section
        className="min-w-0 rounded-3xl border border-border/60 bg-[#FFFEFC] p-4 shadow-sm sm:p-5"
        aria-label={t("Lägg till aktiviteter")}
      >
        <h2 className="font-display text-2xl font-medium tracking-tight text-[#512654]">
          {t("Lägg till aktiviteter")}
        </h2>
        {stage === "write" && children.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-[#512654]">
              {t(target === "both" ? "Planera för mig och barnen" : audience === "children" ? "Planera för barnen" : "Planera för mig")}
            </span>
            {target === "both" ? (
              <Button type="button" variant="ghost" className="min-h-11 rounded-xl text-sm" onClick={() => { setTarget(audience); setError(""); }}>
                {t("Ångra gemensam planering")}
              </Button>
            ) : (
              <Button type="button" variant="outline" className="min-h-11 rounded-xl text-sm" onClick={() => { setTarget("both"); setError(""); }}>
                {t("Planera för mig och barnen")}
              </Button>
            )}
          </div>
        )}
        {forChildren && (
          <>
            {childStore.error && (
              <p role="alert" className="mt-3 text-sm">
                {t("Barnens schema kunde inte hämtas.")}{" "}
                <Button variant="ghost" onClick={() => childStore.reload()}>
                  {t("Försök igen")}
                </Button>
              </p>
            )}
            {childStore.loading ? (
              <p role="status" className="mt-3 text-sm">
                {t("Laddar barnens schema...")}
              </p>
            ) : children.length === 0 ? (
              <p className="mt-3 text-sm">
                <Link to="/barn" className="underline underline-offset-4">
                  {t("Lägg till eller hantera barn")}
                </Link>
              </p>
            ) : (
              stage === "write" && (
                <fieldset className="mt-4">
                  <legend className="text-sm font-medium">{t("Vilka barn gäller det?")}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {children.map((child) => (
                      <label
                        key={child.id}
                        className="flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(child.id)}
                          onChange={(event) =>
                            setSelected((previous) =>
                              event.target.checked
                                ? [...previous, child.id]
                                : previous.filter((id) => id !== child.id),
                            )
                          }
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="min-w-0 break-words">{child.name}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )
            )}
          </>
        )}
        <div
          className="pace-segmented mt-4"
          role="group"
          aria-label={t("Välj planeringsperiod")}
        >
          {PLANNING_PERIODS.map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={period === value ? "default" : "ghost"}
              aria-pressed={period === value}
              className="pace-segment"
              onClick={() => {
                // Update the local controls even if the URL already holds
                // the selected period after restoring a different draft.
                setPeriod(value);
                setDate(value === "tomorrow" ? addDaysISO(todayISO(), 1) : todayISO());
                setWeekAnchor(todayISO());
                void navigate({ to: "/planera", search: { audience, period: value } });
              }}
            >
              {t(label)}
            </Button>
          ))}
        </div>
        {period === "week" && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11"
                aria-label={t("Föregående vecka")}
                onClick={() => {
                  const next = addDaysISO(weekAnchor, -7);
                  setWeekAnchor(next);
                  setDate(periodDates(next, "vecka")[0]!);
                }}
              >
                <ChevronLeft size={18} />
              </Button>
              <p className="min-w-0 flex-1 break-words text-center text-sm">
                {dateLabel(week[0]!, true)} – {dateLabel(week[6]!, true)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11"
                aria-label={t("Nästa vecka")}
                onClick={() => {
                  const next = addDaysISO(weekAnchor, 7);
                  setWeekAnchor(next);
                  setDate(periodDates(next, "vecka")[0]!);
                }}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1 min-[390px]:grid-cols-7 sm:gap-2" role="group" aria-label={t("Veckans dagar")}>
              {week.map((day) => {
                const dayEntries = days[day] ?? [];
                const count = forChildren
                  ? familyLayerEntries(dayEntries.filter((entry) => entry.source === "child"), { ...DEFAULT_FAMILY_LAYER, children: selected }).length
                  : dayEntries.filter((entry) => !isFamilyEntry(entry)).length;
                return (
                  <button
                    key={day}
                    type="button"
                    aria-label={`${dateLabel(day, true)} · ${count} ${t(count === 1 ? "planerad aktivitet" : "planerade aktiviteter")}`}
                    aria-pressed={date === day}
                    onClick={() => setDate(day)}
                    className={`flex min-h-[72px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${date === day ? "bg-[#EFE5F0] text-[#512654]" : "bg-[#FAF9F6] text-ink hover:bg-[#F6F0F4]"}`}
                  >
                    <span className="text-[11px] font-medium capitalize leading-4 sm:text-xs" aria-hidden="true">
                      {new Date(`${day}T12:00:00`).toLocaleDateString(locale, { weekday: "short" })}
                    </span>
                    <span className="text-base font-semibold tabular-nums leading-5" aria-hidden="true">
                      {Number(day.slice(-2))}
                    </span>
                    <span className="text-[10px] tabular-nums leading-4 text-muted-foreground" aria-hidden="true">
                      {count > 0 ? `${count} plan.` : "–"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <h3 className="mt-5 border-t border-[#EDE5E9] pt-4 font-display text-lg">{dateLabel(date)}</h3>
        {!forChildren && date !== today && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("En förhandsplan. Orken får du känna efter den dagen.")}
          </p>
        )}
        {stage === "write" ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              review();
            }}
          >
            <label className="block text-sm font-medium" htmlFor={`activities-${audience}`}>
              {t("Vad vill du planera?")}
            </label>
            <p id={`help-${audience}`} className="text-sm text-muted-foreground">
              {t("En aktivitet per rad. Lägg till detaljer efteråt om du vill.")}
            </p>
            <Textarea
              id={`activities-${audience}`}
              aria-describedby={`help-${audience}`}
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={3}
              maxLength={12500}
              placeholder={t(
                forChildren
                  ? "Frukost\nUtelek\nLugn stund"
                  : "Handla middag\nTvätta\nEn liten promenad",
              )}
              className="resize-y rounded-2xl border-[#E8DDE6] bg-[#FAF9F6] text-base leading-7 focus-visible:ring-[#9C80A3]"
            />
            {!forChildren && (
              <OptionalSavedStrategies
                mode="planning"
                revealToken={revealSupports ? "from-saved-supports" : undefined}
                draftText={text}
                onAddToDraft={(title) => setText((previous) => addStrategyToPlanningDraft(previous, title))}
              />
            )}
            {forChildren && !selected.length && (
              <p className="text-sm text-muted-foreground">
                {t("Välj barn innan du granskar aktiviteterna.")}
              </p>
            )}
            <Button
              type="submit"
              disabled={!lineCount || !ready || (forChildren && !selected.length)}
              className="pace-ds-button min-h-12 w-full bg-primary text-primary-foreground"
            >
              {t("Granska aktiviteter")} ({lineCount})<ArrowRight size={16} aria-hidden />
            </Button>
          </form>
        ) : (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg">{t("Så här blir din plan")}</h3>
              <Button
                type="button"
                variant="ghost"
                disabled={locked || saving}
                className="min-h-11 rounded-full text-sm underline underline-offset-4"
                onClick={() => {
                  setText(rows.map((row) => row.title).join("\n"));
                  setStage("write");
                  setError("");
                }}
              >
                {t("Ändra listan")}
              </Button>
            </div>
            <fieldset disabled={locked || saving} className="min-w-0 space-y-4">
              <legend className="sr-only">{t("Aktiviteter att spara")}</legend>
              {rows.map((row, index) => (
                <div key={row.id} className="min-w-0 border-t border-border/60 pt-3">
                  <div className="flex items-center gap-2">
                    <label className="min-w-0 flex-1">
                      <span className="sr-only">
                        {t("Aktivitet")} {index + 1}
                      </span>
                      <Input
                        value={row.title}
                        onChange={(event) => patchRow(row.id, { title: event.target.value })}
                        maxLength={240}
                        required
                        className="min-h-11 bg-card text-base"
                      />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="min-h-11 min-w-11 shrink-0"
                      aria-label={`${t("Ta bort")}: ${row.title}`}
                      onClick={() =>
                        setRows((previous) => previous.filter((item) => item.id !== row.id))
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <label className="mt-2 flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={!!row.endDate} onChange={(event) => patchRow(row.id, event.target.checked ? { endDate: addDaysISO(row.date, 1), time: "", endTime: "" } : { endDate: undefined })} />Pågår flera dagar</label>
                  <div className="mt-2 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-2">
                    <label className="min-w-0 text-sm">
                      {row.endDate ? "Från" : t("Dag")}
                      <Input
                        type="date"
                        required
                        value={row.date}
                        onChange={(event) => patchRow(row.id, { date: event.target.value, ...(row.endDate && event.target.value > row.endDate ? { endDate: addDaysISO(event.target.value, 1) } : {}) })}
                        className="mt-1 min-h-11 w-full min-w-0 bg-card text-base"
                      />
                    </label>
                    {row.endDate && (
                      <label className="min-w-0 text-sm">
                        Till och med
                        <Input type="date" min={row.date} required value={row.endDate} onChange={(event) => patchRow(row.id, { endDate: event.target.value })} className="mt-1 min-h-11 w-full min-w-0 bg-card text-base" />
                      </label>
                    )}
                  </div>
                  <details className="mt-2 rounded-xl border border-border/60 bg-secondary/15 px-3" data-testid={`planning-optional-${index}`}>
                    <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span>
                        {t(row.endDate ? (forMe ? "Plats och område" : "Plats") : (forMe ? "Tid, plats och område" : "Tid och plats"))} <span className="text-xs">({t("valfritt")})</span>
                      </span>
                      {(row.time || row.endTime || row.location || periodAreas[row.id]) && <span className="shrink-0 text-xs text-primary">Ifyllt</span>}
                    </summary>
                    <div className="space-y-3 pb-3">
                      {!row.endDate && (
                        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-2">
                          <label className="min-w-0 text-sm">
                            {t("Start · frivilligt")}
                            <Input type="time" value={row.time} onChange={(event) => patchRow(row.id, { time: event.target.value })} className="mt-1 min-h-11 w-full min-w-0 bg-card text-base" />
                          </label>
                          <label className="min-w-0 text-sm">
                            {t("Slut · frivilligt")}
                            <Input type="time" value={row.endTime} onChange={(event) => patchRow(row.id, { endTime: event.target.value })} className="mt-1 min-h-11 w-full min-w-0 bg-card text-base" />
                          </label>
                        </div>
                      )}
                      <label className="block text-sm">
                        {t("Plats · frivilligt")}
                        <Input value={row.location} onChange={(event) => patchRow(row.id, { location: event.target.value })} maxLength={160} className="mt-1 min-h-11 w-full bg-card text-base" />
                      </label>
                      {forMe && (
                        <label className="block text-sm">
                          {t("Område · valfritt")}
                          <select
                            aria-label={`${t("Område")} · ${row.title}`}
                            value={periodAreas[row.id] ?? suggestActivityArea(row.title) ?? (activeArea === "alla" ? "vardag" : activeArea)}
                            onChange={(event) => setPeriodAreas((prev) => ({ ...prev, [row.id]: event.target.value as LifeArea }))}
                            className="mt-1 min-h-11 w-full rounded-xl border border-input bg-card px-3 text-base"
                          >
                            {Object.entries(AREA_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                  </details>
                  {forChildren && (
                    <fieldset className="mt-2">
                      <legend className="text-sm text-muted-foreground">{t("Gäller för")}</legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {children.map((child) => (
                          <label
                            key={child.id}
                            className="flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={row.childIds.includes(child.id)}
                              onChange={(event) =>
                                patchRow(row.id, {
                                  childIds: event.target.checked
                                    ? [...row.childIds, child.id]
                                    : row.childIds.filter((id) => id !== child.id),
                                  childItemIds: {
                                    ...row.childItemIds,
                                    [child.id]: row.childItemIds[child.id] ?? crypto.randomUUID(),
                                  },
                                })
                              }
                              className="h-4 w-4 accent-primary"
                            />
                            <span className="min-w-0 break-words">{child.name}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                </div>
              ))}
            </fieldset>
            {locked && !saving && (
              <p role="status" className="text-sm text-muted-foreground">
                {t("Dina aktiviteter ligger kvar. Försök bekräfta samma sparande igen.")}
              </p>
            )}
            <Button
              type="submit"
              disabled={!rows.length || !ready || saving}
              className="pace-ds-button min-h-12 w-full bg-primary text-primary-foreground"
            >
              {saving
                ? t("Sparar...")
                : locked
                  ? t("Försök igen")
                  : `${t("Spara aktiviteter")} (${rows.length})`}
            </Button>
            {forChildren && (
              <p className="text-sm text-muted-foreground">
                {t(forMe
                  ? "Aktiviteterna sparas i din plan och de valda barnens scheman."
                  : "Aktiviteterna sparas i de valda barnens scheman.")}
              </p>
            )}
          </form>
        )}
        {error && (
          <p role="alert" className="mt-4 break-words text-sm text-destructive">
            {error}
          </p>
        )}
      </section>
      <section className="min-w-0 rounded-2xl border border-[#EDE5E9] bg-[#FFFEFC] p-3 shadow-sm sm:p-4 lg:sticky lg:top-6" aria-label={t(forChildren ? "I barnens schema" : "Redan i planen")}>
        <h2 className="font-display text-2xl font-medium tracking-tight text-[#512654]">
          {t(forChildren ? "I barnens schema" : "Redan i planen")}
          {(!forChildren || selected.length > 0) && shown.length > 0 && (
            <span className="ml-2 text-sm font-normal tabular-nums text-muted-foreground">({shown.length})</span>
          )}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{dateLabel(date)}</p>
        {(!planningReady || externalError) && (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {t(
              planningError || externalError
                ? "Kalenderunderlaget kunde inte hämtas helt."
                : "Laddar kalendern...",
            )}
          </p>
        )}
        {forChildren && !selected.length ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("Välj barn för att se deras schema.")}
          </p>
        ) : shown.length ? (
          <ul className="mt-3 divide-y divide-[#EFE9EB]">
            {[...shown]
              .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"))
              .map((entry, index) => (
                <li
                  key={entry.id}
                  className={`grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-xl px-2 py-3 even:bg-[#F7F3F1] ${!showAllExisting && index >= 3 ? "hidden lg:grid" : "grid"}`}
                >
                  <span className="text-sm text-muted-foreground">
                    {entry.time || t("Utan tid")}
                    {entry.endTime && <span className="block">–{entry.endTime}</span>}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-base">{entry.title}</p>
                    {entry.label && (
                      <p className="mt-1 text-sm text-muted-foreground">{entry.label}</p>
                    )}
                    {entry.location && (
                      <p className="mt-1 text-sm text-muted-foreground">{entry.location}</p>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        ) : (
          planningReady && (
            <p className="mt-3 text-sm text-muted-foreground">{t("Inget inplanerat här ännu.")}</p>
          )
        )}
        {(!forChildren || selected.length > 0) && shown.length > 3 && (
          <Button
            type="button"
            variant="ghost"
            className="mt-2 min-h-11 w-full rounded-xl text-sm lg:hidden"
            aria-expanded={showAllExisting}
            onClick={() => setShowAllExisting((previous) => !previous)}
          >
            {showAllExisting ? t("Visa färre") : `${t("Visa alla")} ${shown.length}`}
          </Button>
        )}
      </section>
      {!forChildren && date === today && (
        <DayReplanButton
          date={date}
          entries={planningEntries}
          capacity={capacityOf(today).percent}
          calendarReady={planningReady}
          calendarError={planningError}
        />
      )}
      <Button asChild variant="ghost" className="min-h-11 whitespace-normal rounded-full">
        <Link to={forChildren ? "/barn" : "/kalender"}>
          {t(forChildren ? "Hantera barn och bildstöd" : "Öppna kalendern")}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
