import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";

// Utan inloggad användare sparas energi lokalt – perfekt för att testa
// att varje loggning blir en egen observation.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from: () => {
      throw new Error("ska inte anropas utan användare");
    },
  },
}));
vi.mock("@/lib/storage", () => ({
  useLocalStorage: <T,>(_key: string, initial: T) => useState<T>(initial),
}));
vi.mock("@/hooks/use-data", () => ({
  useMoods: () => {
    const [moods, setMoods] = useState<{ id: string; score: number; note?: string; date: number }[]>(
      [],
    );
    return { moods, setMoods };
  },
}));

import { useQuickCheckin, toScale5 } from "@/hooks/use-quick-checkin";

describe("useQuickCheckin – flera observationer per dag", () => {
  it("varje måendeloggning blir en egen tidsstämplad observation", () => {
    const { result } = renderHook(() => useQuickCheckin());
    act(() => result.current.logMood(4, "Jag sov bara 4 timmar."));
    act(() => result.current.logMood(8, "Har varit ute och känner mig bättre."));
    act(() => result.current.logMood(6));

    expect(result.current.todayMoods).toHaveLength(3);
    expect(result.current.todayMoods[0].note).toBe("Jag sov bara 4 timmar.");
    expect(result.current.todayMoods[1].note).toBe("Har varit ute och känner mig bättre.");
    expect(result.current.todayMoods[2].note).toBeUndefined();
    // Äldst → nyast, med riktiga tidsstämplar.
    expect(result.current.todayMoods[0].date).toBeLessThanOrEqual(result.current.todayMoods[1].date);
    expect(result.current.todayMoods[1].date).toBeLessThanOrEqual(result.current.todayMoods[2].date);
    // Tidigare observationer skrivs inte över.
    expect(result.current.todayMoods[0].score).toBe(toScale5(4));
    expect(result.current.todayMoods[1].score).toBe(toScale5(8));
  });

  it("varje energiloggning blir en egen observation (inga överskrivningar)", async () => {
    const { result } = renderHook(() => useQuickCheckin());
    await act(async () => {
      await result.current.logEnergy(3); // morgon: lågt
      await result.current.logEnergy(6); // eftermiddag: bättre
      await result.current.logEnergy(9); // kväll: starkt
    });

    expect(result.current.todayEnergyEntries).toHaveLength(3);
    expect(result.current.todayEnergyEntries.map((e) => e.level)).toEqual([
      toScale5(3),
      toScale5(6),
      toScale5(9),
    ]);
    for (const e of result.current.todayEnergyEntries) {
      expect(e.logged_at).toBeTruthy();
    }
    // Senaste observationen är dagens aktuella värde.
    expect(result.current.todayEnergy?.level).toBe(toScale5(9));
  });
});
