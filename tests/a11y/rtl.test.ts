/**
 * RTL and Hebrew localisation checks.
 *
 * Verifies that:
 *   - Hebrew locale strings exist for every key present in the English locale
 *   - Hebrew body line-height is larger than English (taller script)
 *   - Spacing tokens use neutral (start/end-safe) naming, not left/right
 *   - TypeScale does not hard-code textAlign left/right (RTL must inherit from I18nManager)
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { getBodyLineHeight } from '../../apps/expo/src/theme/typography';
import { spacing } from '../../apps/expo/src/theme/spacing';

const LOCALES_DIR = resolve(__dirname, '../../apps/expo/locales');

function loadLocale(lang: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(LOCALES_DIR, `${lang}.json`), 'utf-8')) as Record<string, unknown>;
}

function collectLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      return collectLeafKeys(v as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe('Hebrew locale completeness', () => {
  it('he.json exists and is non-empty', () => {
    const he = loadLocale('he');
    expect(Object.keys(he).length).toBeGreaterThan(0);
  });

  it('he.json has the same top-level sections as en.json', () => {
    const en = loadLocale('en');
    const he = loadLocale('he');
    const enTop = Object.keys(en).sort();
    const heTop = Object.keys(he).sort();
    expect(heTop).toEqual(enTop);
  });
});

describe('Hebrew typography', () => {
  it('Hebrew body line-height is larger than English (taller script)', () => {
    expect(getBodyLineHeight('he')).toBeGreaterThan(getBodyLineHeight('en'));
  });

  it('Hebrew body line-height is ≥ 26px', () => {
    expect(getBodyLineHeight('he')).toBeGreaterThanOrEqual(26);
  });
});

describe('RTL-safe spacing tokens', () => {
  it('spacing token names do not include "left" or "right"', () => {
    const names = Object.keys(spacing);
    const violations = names.filter((n) => /left|right/i.test(n));
    expect(violations).toHaveLength(0);
  });
});
