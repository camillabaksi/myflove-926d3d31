import { useMemo } from "react";
import { useUser } from "@clerk/react";
import { useTasks, useReminders } from "@/hooks/use-data";
import { useStudySchedule } from "@/hooks/use-study-schedule";
import { useQuickflow } from "@/hooks/use-quickflow";
import { usePriorityList } from "@/hooks/use-priority-list";
import { useChildren } from "@/hooks/use-children";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { occursOn, type Routine } from "@/lib/recurrence";
import { repeatUntilFromNotes } from "@/lib/child-visual-schedule";
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
  const { items: childItems, children } = useChildren();
  const { isSignedIn } = useUser();
  const { data: household } = useGetMyHousehold({ query: { queryKey: getGetMyHouseholdQueryKey(), enabled: !!isSignedIn } });
  const { data: family = [] } = useListFamilyEvents({ query: { queryKey: getListFamilyEventsQueryKey(), enabled: !!isSignedIn && !!household?.id } });
  const connection = useCalendarConnection();
  const first = dates[0] ?? "";
  const last = dates[dates.length - 1] ?? "";
  const external = useExternalEvents(first, last, !!isSignedIn && connection.anyConnected);
  const days = useMemo(() => {
    const result = projectCalendar(dates, { tasks, reminders, lectures, quickflow, priority, routines });
    for (const date of dates) {
      const out = result[date];
      if (!out) continue;
      for (const entry of out) {
        if (entry.source === "reminder" && entry.recurring) entry.done = isInstanceDone(`reminder-${entry.sourceId}`, date);
      }
      for (const e of family) if (e.date === date) out.push({
        id: `f-${e.id}`, sourceId: String(e.id), source: "family", title: e.title,
        date, time: e.time ?? undefined, editable: false, done: false, href: "/familj", label: "Familj",
      });
      // These are existing RLS-visible items, never the linked account's private parent profile.
      for (const e of childItems) {
        if (e.kind !== "activity" || !occursOn(e.date, e.repeat, date)) continue;
        if (e.repeat !== "none" && (repeatUntilFromNotes(e.notes) ?? "9999") < date) continue;
        out.push({ id: `c-${e.id}`, sourceId: e.id, source: "child", title: e.title,
          date, time: e.time?.slice(0, 5), done: e.completed, editable: false,
          href: "/barn", label: children.find(c => c.id === e.child_id)?.name ?? "Delad aktivitet" });
      }
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
  }, [dates, tasks, reminders, lectures, quickflow, priority, routines, childItems, children, family, external.data, isInstanceDone]);
  return { days, externalError: external.error, externalLoading: external.isFetching };
}