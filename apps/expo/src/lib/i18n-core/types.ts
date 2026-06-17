export type Locale = "en" | "he";

export type TranslationParams = Record<string, string | number | boolean>;

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "he"] as const;

/**
 * Structural fallback dictionary locale. `translate()` falls back to this
 * dictionary when a key is missing from the requested locale. Phase 6 keeps
 * this anchored to English so the fallback chain stays intact.
 *
 * Do NOT flip this to `"he"`. Use `INITIAL_LOCALE` for resolver defaults.
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * Initial locale for callers with no stored preference. Hebrew is the
 * product default (§19 locked decision 1) without disturbing the English
 * dictionary-fallback role of `DEFAULT_LOCALE`.
 */
export const INITIAL_LOCALE: Locale = "he";
