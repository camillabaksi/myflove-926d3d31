import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, NotebookPen, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useChildren } from "@/hooks/use-children";
import { useTasks } from "@/hooks/use-data";
import { useVisualCalendar } from "@/hooks/use-visual-calendar";
import { useDayCapacity } from "@/hooks/use-day-capacity";
import { useLang } from "@/hooks/use-language";
import { useActiveArea } from "@/lib/life-areas";
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

export const PLANNING_PERIODS = [
  ["today", "Idag"],
  ["tomorrow", "Imorgon"],
  ["week", "Veckan"],
] as const;

export function PlanningEntry({
  childrenOnly = false,
  children,
}: {
  childrenOnly?: boolean;
  children?: ReactNode;
}) {
  const { t } = useLang();
  if (childrenOnly)
    return (
      <Link
        to="/planera"
        search={{ audience: "children", period: "today" }}
        className="flex min-h-16 items-center gap-3 rounded-2xl border border-border/60 bg-lavender/40 px-4 py-3 text-ink hover:bg-lavender/60"
      >
        <Users size={20} className="shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium">{t("Barnens schema")}</span>
          <span className="block text-sm text-muted-foreground">
            {t("Se och planera deras dagar")}
          </span>
        </span>
        <ChevronRight size={18} className="shrink-0" aria-hidden />
      </Link>
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
            className="min-h-11 rounded-full px-2 text-sm"
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
}: {
  owner: string;
  audience: "me" | "children";
  requestedPeriod?: PlanningPeriod;
}) {
  const { t, locale } = useLang();
  const navigate = useNavigate();
  const forChildren = audience === "children";
  const childStore = useChildren();
  const children = childStore.children.filter((child) => child.owner_id === owner);
  const { addPlannedTasks } = useTasks();
  const { activeArea } = useActiveArea();
  const today = todayISO();
  const [period, setPeriod] = useState<PlanningPeriod>(requestedPeriod ?? "today");
  const [date, setDate] = useState(requestedPeriod === "tomorrow" ? addDaysISO(today, 1) : today);
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<PlanningDraft[]>([]);
  const [stage, setStage] = useState<"write" | "review">("write");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const pending = useRef<PlanningDraft[] | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!requestedPeriod) return;
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
      if (forChildren) await childStore.addPlannedActivities(pending.current, owner);
      else
        addPlannedTasks(
          planningTasks(pending.current, activeArea === "alla" ? "vardag" : activeArea),
          owner,
        );
      if (!mounted.current || !isActiveOwner(owner)) return;
      toast.success(
        `${batch.length} ${t(batch.length === 1 ? "aktivitet sparad." : "aktiviteter sparade.")}`,
      );
      pending.current = null;
      setLocked(false);
      setRows([]);
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
    <div className="space-y-6">
      <section
        className="rounded-3xl border border-border/60 bg-mint/25 p-4 sm:p-6"
        aria-label={t(forChildren ? "Planera barnens dagar" : "Planera i din takt")}
      >
        <h2 className="font-display text-xl font-medium">
          {t(forChildren ? "Planera barnens dagar" : "Planera i din takt")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            forChildren
              ? "Flera aktiviteter. För ett eller flera barn."
              : "En dag eller en vecka. Lite i taget.",
          )}
        </p>
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
          className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,6rem),1fr))] gap-1 rounded-3xl border border-border/60 bg-card p-1"
          role="group"
          aria-label={t("Välj planeringsperiod")}
        >
          {PLANNING_PERIODS.map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={period === value ? "default" : "ghost"}
              aria-pressed={period === value}
              className="min-h-11 rounded-full px-2 text-sm"
              onClick={() => void navigate({ to: "/planera", search: { audience, period: value } })}
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
            <div
              className="grid grid-cols-4 gap-1 sm:grid-cols-7"
              role="group"
              aria-label={t("Veckans dagar")}
            >
              {week.map((day) => (
                <Button
                  key={day}
                  variant={date === day ? "secondary" : "ghost"}
                  aria-pressed={date === day}
                  className="h-auto min-h-14 min-w-0 flex-col rounded-xl px-1 py-2 text-sm"
                  onClick={() => setDate(day)}
                >
                  <span>
                    {new Date(`${day}T12:00:00`).toLocaleDateString(locale, { weekday: "short" })}
                  </span>
                  <span>{Number(day.slice(-2))}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
        <h3 className="mt-5 font-display text-lg">{dateLabel(date)}</h3>
        {!forChildren && date !== today && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("En förhandsplan. Orken får du känna efter den dagen.")}
          </p>
        )}
        {stage === "write" ? (
          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              review();
            }}
          >
            <label className="block text-sm font-medium" htmlFor={`activities-${audience}`}>
              {t("Vad vill du planera?")}
            </label>
            <p id={`help-${audience}`} className="text-sm text-muted-foreground">
              {t("Skriv en aktivitet per rad.")}
            </p>
            <Textarea
              id={`activities-${audience}`}
              aria-describedby={`help-${audience}`}
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={4}
              maxLength={12500}
              placeholder={t(
                forChildren
                  ? "Frukost\nUtelek\nLugn stund"
                  : "Handla middag\nTvätta\nEn liten promenad",
              )}
              className="resize-y rounded-2xl bg-card text-base leading-8"
            />
            <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
              <span aria-live="polite">
                {lineCount} {t(lineCount === 1 ? "aktivitet" : "aktiviteter")}
              </span>
              <span>{t("Inte sparade än")}</span>
            </div>
            {forChildren && !selected.length && (
              <p className="text-sm text-muted-foreground">
                {t("Välj barn innan du granskar aktiviteterna.")}
              </p>
            )}
            <Button
              type="submit"
              disabled={!lineCount || !ready || (forChildren && !selected.length)}
              className="min-h-12 w-full whitespace-normal rounded-full"
            >
              {t("Granska aktiviteter")} ({lineCount})<ArrowRight size={16} aria-hidden />
            </Button>
          </form>
        ) : (
          <form
            className="mt-5 space-y-4"
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
            <p className="text-sm text-muted-foreground">
              {t("Byt dag om du vill. Klockslag är frivilligt.")}
            </p>
            <fieldset disabled={locked || saving} className="min-w-0 space-y-4">
              <legend className="sr-only">{t("Aktiviteter att spara")}</legend>
              {rows.map((row, index) => (
                <div key={row.id} className="min-w-0 border-t border-border/60 pt-4">
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
                  <div className="mt-3 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3">
                    <label className="min-w-0 text-sm">
                      {t("Dag")}
                      <Input
                        type="date"
                        required
                        value={row.date}
                        onChange={(event) => patchRow(row.id, { date: event.target.value })}
                        className="mt-1 min-h-11 min-w-0 bg-card text-base"
                      />
                    </label>
                    <label className="min-w-0 text-sm">
                      {t("Start · frivilligt")}
                      <Input
                        type="time"
                        value={row.time}
                        onChange={(event) => patchRow(row.id, { time: event.target.value })}
                        className="mt-1 min-h-11 min-w-0 bg-card text-base"
                      />
                    </label>
                    <label className="min-w-0 text-sm">
                      {t("Slut · frivilligt")}
                      <Input
                        type="time"
                        value={row.endTime}
                        onChange={(event) => patchRow(row.id, { endTime: event.target.value })}
                        className="mt-1 min-h-11 min-w-0 bg-card text-base"
                      />
                    </label>
                  </div>
                  <details className="mt-2">
                    <summary className="flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground">
                      {t("Plats · frivilligt")}
                    </summary>
                    <label className="block text-sm">
                      <span className="sr-only">{t("Plats")}</span>
                      <Input
                        value={row.location}
                        onChange={(event) => patchRow(row.id, { location: event.target.value })}
                        maxLength={160}
                        className="min-h-11 bg-card text-base"
                      />
                    </label>
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
              className="min-h-12 w-full whitespace-normal rounded-full"
            >
              {saving
                ? t("Sparar...")
                : locked
                  ? t("Försök igen")
                  : `${t("Spara aktiviteter")} (${rows.length})`}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t(
                forChildren
                  ? "Aktiviteterna läggs i de valda barnens scheman när du sparar."
                  : "Alla läggs till när du trycker på Spara.",
              )}
            </p>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-4 break-words text-sm text-destructive">
            {error}
          </p>
        )}
      </section>
      <section aria-label={t(forChildren ? "I barnens schema" : "Redan i planen")}>
        <h2 className="font-display text-xl font-medium">
          {t(forChildren ? "I barnens schema" : "Redan i planen")}
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
          <ul className="mt-3 divide-y divide-border/60">
            {[...shown]
              .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"))
              .map((entry) => (
                <li key={entry.id} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3 py-4">
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
