import { describe, expect, it } from "vitest";
import { interpolate, resolve, translate } from "@/lib/i18n-core/interpolate";
import { isInternalKey } from "@/lib/i18n-core/internal-keys";
import type { TranslationDictionary } from "@/lib/i18n-core/types";

describe("interpolate", () => {
  it("substitutes a simple named placeholder", () => {
    expect(interpolate("Hello {name}", { name: "Dan" })).toBe("Hello Dan");
  });

  it("leaves an unknown placeholder untouched", () => {
    expect(interpolate("Hello {name}", {})).toBe("Hello {name}");
  });

  it("selects the matching plural branch and substitutes #", () => {
    const template = "{count, plural, one {# item} other {# items}}";
    expect(interpolate(template, { count: 1 })).toBe("1 item");
    expect(interpolate(template, { count: 5 })).toBe("5 items");
  });

  it("honors an exact =N plural match before one/other", () => {
    const template = "{count, plural, =0 {none} one {# item} other {# items}}";
    expect(interpolate(template, { count: 0 })).toBe("none");
  });

  it("resolves a select branch and falls back to other", () => {
    const template = "{role, select, admin {Admin} other {Member}}";
    expect(interpolate(template, { role: "admin" })).toBe("Admin");
    expect(interpolate(template, { role: "vet" })).toBe("Member");
  });
});

describe("resolve", () => {
  const dict: TranslationDictionary = {
    layout: { nav: { home: "Home" } },
  };

  it("walks a dotted key path to a string leaf", () => {
    expect(resolve(dict, "layout.nav.home")).toBe("Home");
  });

  it("returns undefined for a missing path", () => {
    expect(resolve(dict, "layout.nav.missing")).toBeUndefined();
  });
});

describe("translate", () => {
  const en: TranslationDictionary = { greet: "Hi {name}" };

  it("interpolates params against the resolved template", () => {
    expect(translate(en, "greet", { name: "Dan" })).toBe("Hi Dan");
  });

  it("falls back to the key path when missing in both dictionaries", () => {
    expect(translate({}, "missing.key", undefined, { fallbackDict: {} })).toBe("missing.key");
  });

  it("falls back to the fallback dictionary when the primary lacks the key", () => {
    expect(translate({}, "greet", { name: "Dan" }, { fallbackDict: en })).toBe("Hi Dan");
  });
});

describe("isInternalKey", () => {
  it("flags any segment beginning with an underscore", () => {
    expect(isInternalKey("_meta")).toBe(true);
    expect(isInternalKey("_meta.terminology")).toBe(true);
    expect(isInternalKey("foo._bar")).toBe(true);
  });

  it("treats normal key paths as rendering keys", () => {
    expect(isInternalKey("layout.nav.home")).toBe(false);
    expect(isInternalKey("")).toBe(false);
  });
});
