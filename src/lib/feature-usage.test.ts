import { describe, it, expect } from "vitest";
import {
  DEFAULT_FEATURE_ORDER,
  ADAPT_THRESHOLD,
  featureOrder,
  hasEnoughSignals,
  recordUse,
  topFeature,
  type FeatureUsage,
} from "@/lib/feature-usage";

describe("adaptiv personalisering", () => {
  it("alla nya användare börjar från exakt samma grund", () => {
    expect(featureOrder({})).toEqual(DEFAULT_FEATURE_ORDER);
    expect(hasEnoughSignals({})).toBe(false);
    expect(topFeature({})).toBeNull();
  });

  it("ändrar inget innan det finns tillräckligt med egen data", () => {
    const usage: FeatureUsage = { kalender: ADAPT_THRESHOLD - 1 };
    expect(featureOrder(usage)).toEqual(DEFAULT_FEATURE_ORDER);
  });

  it("lyfter fram det användaren faktiskt använder mest", () => {
    const usage: FeatureUsage = { kalender: 10, quickflow: 2, batteri: 1 };
    expect(featureOrder(usage)[0]).toBe("kalender");
    expect(topFeature(usage)).toBe("kalender");
  });

  it("räknar upp användning utan att tappa övriga signaler", () => {
    const usage = recordUse({ quickflow: 1 }, "batteri");
    expect(usage).toEqual({ quickflow: 1, batteri: 1 });
  });
});
