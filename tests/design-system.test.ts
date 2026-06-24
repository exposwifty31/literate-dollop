import { describe, expect, it } from "vitest";

import {
  palette,
  statusColors,
  typography,
  spacing,
  radii,
  minTouchTarget,
} from "@/lib/design-system/tokens";
import { lightTheme, darkTheme, resolveTheme } from "@/lib/design-system/theme";

describe("palette", () => {
  it("exposes brand primary", () => {
    expect(palette.brand[500]).toBe("#0a7ea4");
  });

  it("exposes neutral scale", () => {
    expect(palette.neutral[0]).toBe("#ffffff");
    expect(palette.neutral[1000]).toBe("#000000");
  });
});

describe("statusColors", () => {
  it("maps all six equipment statuses", () => {
    expect(statusColors.ok).toBe("#16a34a");
    expect(statusColors.issue).toBe("#dc2626");
    expect(statusColors.maintenance).toBe("#d97706");
    expect(statusColors.sterilized).toBe("#0891b2");
    expect(statusColors.critical).toBe("#b91c1c");
    expect(statusColors.needs_attention).toBe("#c2410c");
  });

  it("returns a hex string for every status", () => {
    for (const color of Object.values(statusColors)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("typography", () => {
  it("has a full size scale", () => {
    expect(typography.size.xs).toBe(12);
    expect(typography.size.base).toBe(16);
    expect(typography.size["2xl"]).toBe(28);
  });

  it("weight values are valid RN fontWeight strings", () => {
    for (const w of Object.values(typography.weight)) {
      expect(["400", "500", "600", "700"]).toContain(w);
    }
  });
});

describe("spacing", () => {
  it("is strictly ascending", () => {
    const values = Object.values(spacing);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe("radii", () => {
  it("full radius is a large enough value to make pills", () => {
    expect(radii.full).toBeGreaterThanOrEqual(9999);
  });
});

describe("minTouchTarget", () => {
  it("meets WCAG 44pt minimum", () => {
    expect(minTouchTarget).toBeGreaterThanOrEqual(44);
  });
});

describe("lightTheme", () => {
  it("has a white background", () => {
    expect(lightTheme.color.background).toBe("#ffffff");
  });

  it("exposes all required text colours", () => {
    const { text } = lightTheme.color;
    expect(text.primary).toBeDefined();
    expect(text.secondary).toBeDefined();
    expect(text.muted).toBeDefined();
    expect(text.inverse).toBeDefined();
    expect(text.error).toBeDefined();
  });

  it("references the shared token scales", () => {
    expect(lightTheme.typography).toBe(typography);
    expect(lightTheme.spacing).toBe(spacing);
    expect(lightTheme.radii).toBe(radii);
  });
});

describe("darkTheme", () => {
  it("has a black background", () => {
    expect(darkTheme.color.background).toBe("#000000");
  });

  it("has a different primary text colour than light", () => {
    expect(darkTheme.color.text.primary).not.toBe(lightTheme.color.text.primary);
  });
});

describe("resolveTheme", () => {
  it("returns lightTheme for light", () => {
    expect(resolveTheme("light")).toBe(lightTheme);
  });

  it("returns darkTheme for dark", () => {
    expect(resolveTheme("dark")).toBe(darkTheme);
  });
});
