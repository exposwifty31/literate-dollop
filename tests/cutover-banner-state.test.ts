import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  computeCutoverBannerVisible,
  dismissCutoverBanner,
  isCutoverBannerDismissed,
  resolveCutoverBannerVisible,
} from "@/lib/cutover/cutover-banner-state";
import { setCutoverFlagsForTests } from "@/lib/cutover/cutover-config";
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
});
