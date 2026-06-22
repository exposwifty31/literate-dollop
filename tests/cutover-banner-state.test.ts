import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  computeCutoverBannerVisible,
  dismissCutoverBanner,
  getCutoverBannerVariant,
  isCutoverBannerDismissed,
  resolveCutoverBannerVisible,
} from "@/lib/cutover/cutover-banner-state";
import { isCapacitorRetired, setCutoverFlagsForTests } from "@/lib/cutover/cutover-config";
import { clearMockAsyncStorage } from "./mocks/async-storage";
import enDict from "../apps/expo/locales/en.json";
import heDict from "../apps/expo/locales/he.json";

describe("computeCutoverBannerVisible", () => {
  it("is visible only when enabled and not dismissed", () => {
    expect(computeCutoverBannerVisible({ enabled: true, dismissed: false })).toBe(true);
    expect(computeCutoverBannerVisible({ enabled: true, dismissed: true })).toBe(false);
    expect(computeCutoverBannerVisible({ enabled: false, dismissed: false })).toBe(false);
  });
});

describe("resolveCutoverBannerVisible", () => {
  beforeEach(() => {
    clearMockAsyncStorage();
  });
  afterEach(() => {
    setCutoverFlagsForTests(null);
    clearMockAsyncStorage();
  });

  it("shows by default when the flag is enabled and never dismissed", async () => {
    setCutoverFlagsForTests({ bannerEnabled: true });
    expect(await resolveCutoverBannerVisible()).toBe(true);
  });

  it("hides once dismissed (dismissal persists)", async () => {
    setCutoverFlagsForTests({ bannerEnabled: true });
    await dismissCutoverBanner();
    expect(await isCutoverBannerDismissed()).toBe(true);
    expect(await resolveCutoverBannerVisible()).toBe(false);
  });

  it("hides when the flag is disabled regardless of dismissal", async () => {
    setCutoverFlagsForTests({ bannerEnabled: false });
    expect(await resolveCutoverBannerVisible()).toBe(false);
  });
});

describe("H7 kill-switch (capacitorRetired)", () => {
  afterEach(() => setCutoverFlagsForTests(null));

  it("defaults to not-retired (coexistence) — flips only after the store cutover", () => {
    setCutoverFlagsForTests(null);
    expect(isCapacitorRetired()).toBe(false);
    expect(getCutoverBannerVariant()).toBe("coexistence");
  });

  it("selects the retired banner variant when the kill-switch is on", () => {
    setCutoverFlagsForTests({ capacitorRetired: true });
    expect(getCutoverBannerVariant()).toBe("retired");
  });
});

describe("cutover banner copy parity", () => {
  it("defines identical key sets in en and he", () => {
    const en = enDict as { cutoverBanner: Record<string, string> };
    const he = heDict as { cutoverBanner: Record<string, string> };
    expect(en.cutoverBanner).toBeDefined();
    expect(Object.keys(he.cutoverBanner).sort()).toEqual(Object.keys(en.cutoverBanner).sort());
    for (const value of Object.values(he.cutoverBanner)) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it("includes the retired variant keys in both locales", () => {
    const en = enDict as { cutoverBanner: Record<string, string> };
    expect(en.cutoverBanner.retiredTitle).toBeTruthy();
    expect(en.cutoverBanner.retiredMessage).toBeTruthy();
  });
});
