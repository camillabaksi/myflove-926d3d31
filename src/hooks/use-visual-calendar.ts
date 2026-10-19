import { useMemo } from "react";
import { useUser } from "@clerk/react";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useQuickflow } from "@/hooks/use-quickflow";
import { usePriorityList } from "@/hooks/use-priority-list";
import { useChildren } from "@/hooks/use-children";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { occursOn, type Routine } from "@/lib/recurrence";
import type { RoutineOccurrenceException } from "@/lib/routine-occurrence-exceptions";
import { projectFamilyCalendar } from "@/lib/family-calendar";
import type { ChildScheduleEntry } from "@/components/child-schedule";
import { useCalendarConnection, useExternalEvents } from "@/hooks/use-calendar-sync";
import { useGetMyHousehold, useListFamilyEvents, getGetMyHouseholdQueryKey, getListFamilyEventsQueryKey } from "@workspace/api-client-react";
import { projectCalendar, type CalendarEntry } from "@/lib/visual-calendar";
import { useInstanceStatus } from "@/hooks/use-instance-status";

export function useVisualCalendar(dates: string[]) {
  const { tasks } = useTasks();
  const { reminders } = useReminders();
  const { lectures } = useStudySchedule();
  const { items: quickflow } = useQuickflow();
  const { items: priority } = usePriorityList();
  const { isInstanceDone } = useInstanceStatus();
  const [routines] = useCloudSyncedStorage<Routine[]>("myflove-routines", []);
  const [routineExceptions] = useCloudSyncedStorage<RoutineOccurrenceException[]>("myflove-routine-occurrence-exceptions", []);
  const [doneLog] = useCloudSyncedStorage<Record<string, string[]>>("myflove-done-log", {});
  const { items: childItems, children, loading: childrenLoading, error: childrenError } = useChildren();
  const { isSignedIn, user } = useUser();
  const [schedules] = useCloudSyncedStorage<Record<string, ChildScheduleEntry[]>>("myflove-child-schedules", {});
  const householdQuery = useGetMyHousehold({ query: { queryKey: getGetMyHouseholdQueryKey(), enabled: !!isSignedIn } });
  const { data: household } = householdQuery;
  const familyQuery = useListFamilyEvents({ query: { queryKey: getListFamilyEventsQueryKey(), enabled: !!isSignedIn && !!household?.id } });
  const { data: family = [] } = familyQuery;
  const connection = useCalendarConnection();
  const first = dates[0] ?? "";
  const last = dates[dates.length - 1] ?? "";
  const external = useExternalEvents(first, last, !!isSignedIn && connection.anyConnected);
  const days = useMemo(() => {
    const result = projectCalendar(dates, { tasks, reminders, lectures, quickflow, priority, routines, routineExceptions });
    for (const date of dates) {
      const out = result[date];
      if (!out) continue;
      for (const entry of out) {
        if (entry.source === "reminder" && entry.recurring) entry.done = isInstanceDone(`reminder-${entry.sourceId}`, date);
        if (entry.source === "routine") entry.done = (doneLog[entry.occurrenceDate ?? date] ?? []).includes(`routine-${entry.sourceId}`);
        if (entry.source === "study") entry.done = (doneLog[date] ?? []).includes(entry.id);
      }
      for (const e of family) if (e.date === date) out.push({
        id: `f-${e.id}`, sourceId: String(e.id), source: "family", title: e.title,
        date, time: e.time ?? undefined, editable: false, done: false, href: "/familj", label: "Familj",
      });
      out.push(...projectFamilyCalendar(date, children, childItems, schedules, user?.id));
      for (const e of external.data?.events ?? []) if (e.date === date) out.push({
        id: `external-${e.provider}-${e.id}`, sourceId: e.id, source: "external", title: e.title,
        date, time: e.time, endTime: e.endTime, done: false, editable: false,
        label: e.provider === "google" ? "Google Kalender" : "Outlook",
      });
      const unique = new Map<string, CalendarEntry>();
      for (const entry of out) unique.set(entry.id, entry);
      result[date] = [...unique.values()].sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
    }
    return result;
  }, [dates, tasks, reminders, lectures, quickflow, priority, routines, routineExceptions, doneLog, childItems, children, family, external.data, isInstanceDone, schedules, user?.id]);
  const familyMembers = useMemo(() => {
    const members = new Map(children.map(c => [c.id, { id: c.id, name: c.name }]));
    for (const item of childItems) if (item.kind === "activity" && !members.has(item.child_id)) members.set(item.child_id, { id: item.child_id, name: "Delad barnaktivitet" });
    return [...members.values()];
  }, [children, childItems]);
  const planningError = childrenError || householdQuery.error || familyQuery.error || external.error;
  const planningReady = !childrenLoading && !householdQuery.isFetching && !familyQuery.isFetching && !external.isFetching && !planningError;
  return { days, familyMembers, externalError: external.error, externalLoading: external.isFetching, planningReady: !!planningReady, planningError: !!planningError };
}
