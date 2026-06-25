import { describe, expect, it } from "vitest";

import { colors, statusVariantColors } from "../apps/expo/src/theme/colors";
import { spacing, touchTarget, listItemHeight } from "../apps/expo/src/theme/spacing";
import { typeScale } from "../apps/expo/src/theme/typography";

describe("colors", () => {
  it("primary 600 matches the Ivory forest-green brand", () => {
    expect(colors.primary[600]).toBe("#1e7a32");
  });

  it("status.ok is accessible green", () => {
    expect(colors.status.ok).toBe("#16a34a");
  });

  it("emergency.bg is near-black for Code Blue overlay", () => {
    expect(colors.emergency.bg).toBe("#0c0c0c");
  });

  it("focusRing has 3:1 contrast colour", () => {
    expect(colors.focusRing).toBe("#1e7a32");
  });
});

describe("statusVariantColors", () => {
  const variants = ["ok", "issue", "critical", "maintenance", "sterilized", "needs_attention", "offline"] as const;

  it("every variant has bg, text, and border keys", () => {
    for (const v of variants) {
      const palette = statusVariantColors[v];
      expect(palette).toHaveProperty("bg");
      expect(palette).toHaveProperty("text");
      expect(palette).toHaveProperty("border");
    }
  });

  it("ok variant uses ok colour family", () => {
    expect(statusVariantColors.ok.bg).toBe(colors.status.okBg);
    expect(statusVariantColors.ok.border).toBe(colors.status.ok);
  });

  it("critical variant uses error red for border", () => {
    expect(statusVariantColors.critical.border).toBe(colors.status.critical);
  });
});

describe("spacing", () => {
  it("pageHorizontal is 16px", () => {
    expect(spacing.pageHorizontal).toBe(16);
  });

  it("8px grid: sm=8, md=12, lg=16, xl=20, 2xl=24", () => {
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
    expect(spacing.xl).toBe(20);
    expect(spacing["2xl"]).toBe(24);
  });
});

describe("touchTarget", () => {
  it("default touch target meets 44px WCAG minimum", () => {
    expect(touchTarget.md).toBeGreaterThanOrEqual(44);
    expect(touchTarget.lg).toBeGreaterThanOrEqual(44);
  });

  it("list item height clears 44px touch target", () => {
    expect(listItemHeight.default).toBeGreaterThanOrEqual(44);
  });
});

describe("typeScale", () => {
  it("h1 is the largest heading", () => {
    expect(typeScale.h1.fontSize).toBeGreaterThan(typeScale.h2.fontSize);
    expect(typeScale.h2.fontSize).toBeGreaterThan(typeScale.h3.fontSize);
  });

  it("body text is 16px for readability", () => {
    expect(typeScale.body.fontSize).toBe(16);
  });

  it("caption is smallest at 12px", () => {
    expect(typeScale.caption.fontSize).toBe(12);
  });
});
