import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useVisualCalendar } from "./use-visual-calendar";

const state = vi.hoisted(() => ({ childrenLoading: false, childrenError: null as string | null, householdLoading: false,
  familyLoading: false, familyError: null as Error | null, externalLoading: false, externalError: null as Error | null }));
vi.mock("@clerk/react", () => ({ useUser: () => ({ isSignedIn: true, user: { id: "a" } }) }));
vi.mock("@/hooks/use-data", () => ({ useTasks: () => ({ tasks: [] }), useReminders: () => ({ reminders: [] }) }));
vi.mock("@/hooks/use-study-schedule", () => ({ useStudySchedule: () => ({ lectures: [] }) }));
vi.mock("@/hooks/use-quickflow", () => ({ useQuickflow: () => ({ items: [] }) }));
vi.mock("@/hooks/use-priority-list", () => ({ usePriorityList: () => ({ items: [] }) }));
vi.mock("@/hooks/use-instance-status", () => ({ useInstanceStatus: () => ({ isInstanceDone: () => false }) }));
vi.mock("@/hooks/use-children", () => ({ useChildren: () => ({ items: [], children: [], loading: state.childrenLoading, error: state.childrenError }) }));
vi.mock("@/lib/cloud-storage", () => ({ useCloudSyncedStorage: (_key: string, initial: unknown) => [initial] }));
vi.mock("@/hooks/use-calendar-sync", () => ({ useCalendarConnection: () => ({ anyConnected: true }), useExternalEvents: () => ({
  data: { events: [{ id: "booking", provider: "google", title: "Bokat möte", date: "2026-10-15", time: "14:00", endTime: "15:00" }] },
  isFetching: state.externalLoading, error: state.externalError,
}) }));
vi.mock("@workspace/api-client-react", () => ({
  getGetMyHouseholdQueryKey: () => ["household"], getListFamilyEventsQueryKey: () => ["family"],
  useGetMyHousehold: () => ({ data: { id: "household-a" }, isFetching: state.householdLoading, error: null }),
  useListFamilyEvents: () => ({ data: [], isFetching: state.familyLoading, error: state.familyError }),
}));
beforeEach(() => { state.childrenLoading = false; state.childrenError = null; state.householdLoading = false;
  state.familyLoading = false; state.familyError = null; state.externalLoading = false; state.externalError = null; });
describe("Complete calendar input for replanning", () => {
  it("retains known bookings but waits for every authorized source before allowing new time slots", () => {
    state.familyLoading = true;
    const { result, rerender } = renderHook(() => useVisualCalendar(["2026-10-15"]));
    expect(result.current.days["2026-10-15"][0].title).toBe("Bokat möte");
    expect(result.current.planningReady).toBe(false);
    state.familyLoading = false; state.childrenLoading = true; rerender();
    expect(result.current.planningReady).toBe(false);
    state.childrenLoading = false; rerender();
    expect(result.current.planningReady).toBe(true);
  });
  it("never treats failed child, family or external reads as an empty/free schedule", () => {
    state.childrenError = "unavailable";
    const { result, rerender } = renderHook(() => useVisualCalendar(["2026-10-15"]));
    expect(result.current.planningError).toBe(true); expect(result.current.planningReady).toBe(false);
    state.childrenError = null; state.familyError = new Error("unavailable"); rerender();
    expect(result.current.planningReady).toBe(false);
    state.familyError = null; state.externalError = new Error("unavailable"); rerender();
    expect(result.current.planningError).toBe(true); expect(result.current.planningReady).toBe(false);
    state.externalError = null; state.externalLoading = true; rerender();
    expect(result.current.planningError).toBe(false); expect(result.current.planningReady).toBe(false);
  });
});
