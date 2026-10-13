import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: () => Promise.reject(new Error("offline")),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from: () => {
      throw new Error("offline");
    },
  },
}));
import { bindAccount, parkActiveData } from "./account-scope";
import { clearLocalUserData } from "./local-data";
import { __resetCloudSync } from "./cloud-storage";
import {
  applyTheme,
  getAlarmFormat,
  getAlarmSoundId,
  normalizePersonalPreferences,
  PERSONALIZATION_KEY,
  PREFERENCE_DEFAULTS,
  readPersonalization,
  THEMES,
  usePersonalization,
} from "./personalization";
import {
  applyAreaColors,
  AREA_COLOR_OPTIONS,
  AREA_CUSTOMIZATION_KEY,
  EMPTY_AREA_CUSTOMIZATION,
  normalizeAreaCustomization,
  useAreaCustomization,
} from "./area-premium";

beforeEach(() => {
  localStorage.clear();
  __resetCloudSync();
  document.documentElement.removeAttribute("style");
  document.documentElement.classList.remove("dark");
  bindAccount("A", { adoptUnowned: false });
});

describe("personliga val", () => {
  it("sparar snabba separata ändringar och läser alarmval direkt efter omladdning", async () => {
    const h = renderHook(() => usePersonalization(true));
    act(() => {
      h.result.current.update({ theme: "salvia" });
      h.result.current.update({ alarmSound: "harpa", alarmFormat: "tyst" });
      h.result.current.setAppearance("morkt");
    });
    await waitFor(() => expect(h.result.current.personalization.theme).toBe("salvia"));
    expect(getAlarmSoundId()).toBe("harpa");
    expect(getAlarmFormat()).toBe("tyst");
    expect(document.documentElement).toHaveClass("dark");
    h.unmount();
    __resetCloudSync();
    const restored = renderHook(() => usePersonalization());
    expect(restored.result.current.personalization).toEqual({
      theme: "salvia",
      alarmSound: "harpa",
      alarmFormat: "tyst",
      appearance: "morkt",
    });
  });

  it("tar med gamla explicita val utan att skriva över befintliga kontoval", async () => {
    localStorage.setItem("myflove-theme", "rosa");
    localStorage.setItem("myflove-alarm-sound", "natur");
    const h = renderHook(() => usePersonalization(true));
    await waitFor(() => expect(h.result.current.personalization.theme).toBe("rosa"));
    expect(getAlarmSoundId()).toBe("natur");
    h.unmount();
    localStorage.setItem(
      PERSONALIZATION_KEY,
      JSON.stringify({ ...PREFERENCE_DEFAULTS, theme: "turkos" }),
    );
    __resetCloudSync();
    const existing = renderHook(() => usePersonalization(true));
    await act(async () => {
      await Promise.resolve();
    });
    expect(existing.result.current.personalization.theme).toBe("turkos");
  });

  it("skiljer både gamla val och nya kontoval mellan A och B", () => {
    localStorage.setItem("myflove-theme", "rosa");
    localStorage.setItem(
      PERSONALIZATION_KEY,
      JSON.stringify({ ...PREFERENCE_DEFAULTS, alarmSound: "natur" }),
    );
    parkActiveData();
    bindAccount("B", { adoptUnowned: false });
    expect(readPersonalization()).toEqual(PREFERENCE_DEFAULTS);
    expect(localStorage.getItem("myflove-theme")).toBeNull();
    parkActiveData();
    bindAccount("A", { adoptUnowned: false });
    expect(getAlarmSoundId()).toBe("natur");
    expect(localStorage.getItem("myflove-theme")).toBe("rosa");
  });

  it("behåller äldre val även när utloggning sker innan importen monteras", async () => {
    localStorage.setItem("myflove-theme", "rosa");
    await clearLocalUserData();
    bindAccount("B", { adoptUnowned: false });
    expect(readPersonalization().theme).toBe("paceable");
    parkActiveData();
    bindAccount("A", { adoptUnowned: false });
    expect(readPersonalization().theme).toBe("rosa");
  });

  it("följer systemets mörkläge när inställningsvyn inte är öppen", () => {
    let matches = false;
    let change: () => void = () => {};
    const original = window.matchMedia;
    window.matchMedia = vi.fn(() => ({
      get matches() {
        return matches;
      },
      addEventListener: (_: string, cb: () => void) => {
        change = cb;
      },
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    localStorage.setItem(
      PERSONALIZATION_KEY,
      JSON.stringify({ ...PREFERENCE_DEFAULTS, theme: "ljusbla", appearance: "auto" }),
    );
    const h = renderHook(() => usePersonalization(true));
    expect(document.documentElement).not.toHaveClass("dark");
    act(() => {
      matches = true;
      change();
    });
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.getPropertyValue("--personal-primary")).toBe(
      THEMES.find((t) => t.id === "ljusbla")!.dark.primary,
    );
    h.unmount();
    window.matchMedia = original;
  });

  it("uppdaterar den öppna appen när kontoval kommer från molnsynken", async () => {
    const h = renderHook(() => usePersonalization(true));
    act(() => {
      localStorage.setItem(
        PERSONALIZATION_KEY,
        JSON.stringify({
          ...PREFERENCE_DEFAULTS,
          theme: "persika",
          appearance: "morkt",
          alarmSound: "harpa",
        }),
      );
      window.dispatchEvent(
        new CustomEvent("myflow-local-storage", { detail: { key: PERSONALIZATION_KEY } }),
      );
    });
    await waitFor(() => expect(h.result.current.personalization.theme).toBe("persika"));
    expect(document.documentElement.dataset.theme).toBe("persika");
    expect(document.documentElement).toHaveClass("dark");
    expect(getAlarmSoundId()).toBe("harpa");
  });

  it("släpper de personliga färgerna när appen lämnas", () => {
    document.documentElement.style.setProperty("--primary", "276 19% 21%");
    const h = renderHook(() => usePersonalization(true));
    act(() => h.result.current.update({ theme: "rosa" }));
    expect(document.documentElement.dataset.personalizedApp).toBe("true");
    h.unmount();
    expect(document.documentElement.dataset.personalizedApp).toBeUndefined();
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("276 19% 21%");
    expect(document.documentElement.style.getPropertyValue("--personal-primary")).toBe("");
  });

  it("validerar okända val och låter teman lämna energifärger i fred", () => {
    expect(normalizePersonalPreferences({ theme: "missing", alarmFormat: "invalid" })).toEqual(
      PREFERENCE_DEFAULTS,
    );
    document.documentElement.style.setProperty("--energy-high", "150 50% 30%");
    for (const theme of THEMES) applyTheme(theme.id);
    expect(document.documentElement.style.getPropertyValue("--energy-high")).toBe("150 50% 30%");
  });
});

describe("livskategorier", () => {
  it("sparar områden separat, uppdaterar bara färger och återställer dem", async () => {
    const h = renderHook(() => useAreaCustomization());
    act(() => {
      h.result.current.setColor("barn", AREA_COLOR_OPTIONS[0].hue);
      h.result.current.setColor("jobb", AREA_COLOR_OPTIONS[1].hue);
    });
    await waitFor(() =>
      expect(h.result.current.customization.overrides.jobb?.hue).toBe(AREA_COLOR_OPTIONS[1].hue),
    );
    const stored = JSON.parse(localStorage.getItem(AREA_CUSTOMIZATION_KEY)!);
    expect(stored.overrides.barn.hue).toBe(AREA_COLOR_OPTIONS[0].hue);
    expect(stored.overrides.jobb.hue).toBe(AREA_COLOR_OPTIONS[1].hue);
    applyAreaColors(stored, true);
    expect(document.documentElement.style.getPropertyValue("--calendar-barn")).toBe("150 45% 70%");
    expect(document.documentElement.style.getPropertyValue("--calendar-vardag")).toBe("");
    act(() => h.result.current.resetColors());
    await waitFor(() => expect(h.result.current.customization.overrides).toEqual({}));
    applyAreaColors(EMPTY_AREA_CUSTOMIZATION);
    expect(document.documentElement.style.getPropertyValue("--calendar-barn")).toBe("");
  });
  it("avvisar ogiltiga CSS-färger och okända område-id", () => {
    const result = normalizeAreaCustomization({
      overrides: { barn: { hue: "red; --primary: red" }, invalid: { hue: "150 45% 35%" } },
    });
    expect(result.overrides.barn?.hue).toBeUndefined();
    expect(Object.keys(result.overrides)).toEqual([]);
  });
});

// WCAG luminance, independent of CSS rendering: filled controls need readable text.
function luminance(hsl: string) {
  const [h, s, l] = hsl.split(" ").map(parseFloat);
  const sat = s / 100,
    light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const rgb = [0, 8, 4].map((n) => {
    const k = (n + h / 30) % 12;
    const c = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
it("har läsbar knapptext i varje ljust och mörkt tema", () => {
  for (const theme of THEMES)
    for (const palette of [theme.light, theme.dark]) {
      const values = [luminance(palette.primary), luminance(palette.primaryForeground)].sort(
        (a, b) => b - a,
      );
      expect((values[0] + 0.05) / (values[1] + 0.05), theme.id).toBeGreaterThanOrEqual(4.5);
    }
});
