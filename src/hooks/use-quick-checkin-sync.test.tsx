import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCallback, useRef } from "react";
import { useLocalStorage } from "@/lib/storage";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";

const server = vi.hoisted(() => ({
  rows: [] as { id: string; level: number; logged_at: string; note?: string | null }[],
  failWrites: false,
  read: null as Promise<{ data: typeof server.rows; error: null }> | null,
  reads: 0,
}));
vi.mock("@/lib/secure-local", () => ({
  SECURE_UNLOCK_EVENT: "test-unlock",
  secureGetItem: (key: string) => window.localStorage.getItem(key),
  secureSetItem: (key: string, value: string) => window.localStorage.setItem(key, value),
}));
vi.mock("@/lib/cloud-storage", () => ({
  getSyncUser: async () => ({ id: "u1" }),
  useCloudSyncedStorage: <T,>(key: string, initial: T) => {
    const initialRef = useRef(initial);
    const [value, setValue] = useLocalStorage(key, initial);
    const set = useCallback(
      (update: T | ((previous: T) => T)) => {
        const stored = window.localStorage.getItem(key);
        const previous = stored ? JSON.parse(stored) : initialRef.current;
        const next =
          typeof update === "function" ? (update as (previous: T) => T)(previous) : update;
        window.localStorage.setItem(key, JSON.stringify(next));
        setValue(next);
      },
      [key, setValue],
    );
    return [value, set] as const;
  },
}));
vi.mock("@/hooks/use-data", () => ({
  useMoods: () => {
    const [moods, setMoods] = useCloudSyncedStorage("myflow-moods", []);
    return { moods, setMoods };
  },
}));
// Ingen serverhändelse skickas tillbaka: lokala vyer ska ändå uppdateras.
vi.mock("@/lib/account-realtime", () => ({ subscribeToAccountTable: () => () => undefined }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: "u1" } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        gte: () => query,
        order: () => {
          server.reads++;
          return server.read ?? Promise.resolve({ data: [...server.rows], error: null });
        },
        then: (resolve: (result: unknown) => unknown) =>
          Promise.resolve({ data: [...server.rows], error: null }).then(resolve),
      };
      return {
        ...query,
        upsert: (row: (typeof server.rows)[number]) => ({
          select: () => ({
            single: async () => {
              if (server.failWrites) throw new Error("Offline");
              server.rows = [...server.rows.filter((entry) => entry.id !== row.id), row];
              return { data: row, error: null };
            },
          }),
        }),
      };
    },
  },
}));

import { useQuickCheckin } from "@/hooks/use-quick-checkin";

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("myflove-data-owner", "u1");
  server.rows = [];
  server.failWrites = false;
  server.read = null;
  server.reads = 0;
});

describe("incheckningens sparande och delade visning", () => {
  it("uppdaterar en redan öppen vy och behåller energi och mående efter omladdning", async () => {
    const writer = renderHook(() => useQuickCheckin());
    const reader = renderHook(() => useQuickCheckin());
    await waitFor(() => expect(server.reads).toBe(2));
    await act(async () => {
      writer.result.current.logMood(8, "Efter promenaden");
      await writer.result.current.logEnergy(4);
    });
    await waitFor(() => {
      expect(reader.result.current.todayEnergy?.level).toBe(2);
      expect(reader.result.current.todayMood?.note).toBe("Efter promenaden");
    });
    writer.unmount();
    reader.unmount();
    const reopened = renderHook(() => useQuickCheckin());
    await waitFor(() => expect(server.reads).toBe(3));
    expect(reopened.result.current.energyValue).toBe(4);
    expect(reopened.result.current.moodValue).toBe(8);
    expect(reopened.result.current.todayEnergyEntries).toHaveLength(1);
    expect(reopened.result.current.todayMoods).toHaveLength(1);
  });

  it("behåller observationen vid nätverksfel och synkar den en gång när nätet fungerar", async () => {
    server.failWrites = true;
    const writer = renderHook(() => useQuickCheckin());
    const reader = renderHook(() => useQuickCheckin());
    await waitFor(() => expect(server.reads).toBe(2));
    await act(async () =>
      expect(await writer.result.current.logEnergy(8, "Efter vila")).toEqual({ synced: false }),
    );
    await waitFor(() => expect(reader.result.current.todayEnergy?.level).toBe(4));
    writer.unmount();
    reader.unmount();
    const offline = renderHook(() => useQuickCheckin());
    await waitFor(() => expect(server.reads).toBe(3));
    expect(offline.result.current.todayEnergyEntries).toHaveLength(1);
    offline.unmount();
    server.failWrites = false;
    const online = renderHook(() => useQuickCheckin());
    await waitFor(() => expect(server.rows).toHaveLength(1));
    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem("myflove-energy-pending")!)).toHaveLength(0),
    );
    expect(server.rows[0].note).toBe("Efter vila");
    expect(online.result.current.todayEnergyEntries).toHaveLength(1);
  });

  it("låter inte en gammal molnläsning radera en nyss sparad observation", async () => {
    let finish!: (result: { data: typeof server.rows; error: null }) => void;
    server.read = new Promise((resolve) => {
      finish = resolve;
    });
    const writer = renderHook(() => useQuickCheckin());
    await waitFor(() => expect(server.reads).toBe(1));
    await act(async () => {
      await writer.result.current.logEnergy(6);
    });
    await act(async () => finish({ data: [], error: null }));
    expect(writer.result.current.todayEnergyEntries).toHaveLength(1);
    expect(writer.result.current.todayEnergy?.level).toBe(3);
  });
  it("låter inte ett sent svar skriva till ett annat kontos cache", async () => {
    let finish!: (result: { data: typeof server.rows; error: null }) => void;
    server.read = new Promise((resolve) => {
      finish = resolve;
    });
    const view = renderHook(() => useQuickCheckin());
    await waitFor(() => expect(server.reads).toBe(1));
    window.localStorage.setItem("myflove-data-owner", "u2");
    await act(async () =>
      finish({
        data: [{ id: "u1-log", level: 4, logged_at: new Date().toISOString() }],
        error: null,
      }),
    );
    expect(view.result.current.todayEnergyEntries).toHaveLength(0);
    expect(window.localStorage.getItem("myflove-energy-log")).toBeNull();
  });
});
