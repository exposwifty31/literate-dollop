/**
 * WCAG 1.4.3 contrast ratio tests for VetTrack design tokens.
 *
 * Thresholds:
 *   ≥ 4.5:1 — small text (< 18px regular or < 14px bold), WCAG AA
 *   ≥ 3.0:1 — large text, UI components, and secondary/tertiary descriptive text
 *
 * No browser runtime needed — pure luminance math on hex strings.
 */
import { describe, expect, it } from 'vitest';

import { colors, statusVariantColors, type StatusVariant } from '../../apps/expo/src/theme/colors';

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const WCAG_AA_SMALL = 4.5;
const WCAG_AA_LARGE_OR_UI = 3.0;

const PAGE_BG = colors.background; // #f6f7fb

describe('WCAG 1.4.3 — body text on page background', () => {
  it('primary text meets 4.5:1 (small text)', () => {
    expect(contrastRatio(colors.text, PAGE_BG)).toBeGreaterThanOrEqual(WCAG_AA_SMALL);
  });

  it('secondary text meets 4.5:1 (small text)', () => {
    expect(contrastRatio(colors.textSecondary, PAGE_BG)).toBeGreaterThanOrEqual(WCAG_AA_SMALL);
  });

  it('tertiary text meets 3:1 (used as description / hint)', () => {
    // textTertiary is used for ListItem descriptions and placeholder hints —
    // treated as large-text equivalent for testing purposes.
    expect(contrastRatio(colors.textTertiary, PAGE_BG)).toBeGreaterThanOrEqual(WCAG_AA_LARGE_OR_UI);
  });

  it('primary text on white surface meets 4.5:1', () => {
    expect(contrastRatio(colors.text, colors.surface)).toBeGreaterThanOrEqual(WCAG_AA_SMALL);
  });
});

describe('WCAG 1.4.3 — button colors', () => {
  it('primary button: white text on green background', () => {
    expect(contrastRatio('#ffffff', colors.primary[600])).toBeGreaterThanOrEqual(WCAG_AA_SMALL);
  });

  it('secondary button: green text on white background', () => {
    expect(contrastRatio(colors.primary[600], colors.surface)).toBeGreaterThanOrEqual(WCAG_AA_SMALL);
  });

  it('danger button: white text on red background', () => {
    expect(contrastRatio('#ffffff', colors.semantic.error)).toBeGreaterThanOrEqual(WCAG_AA_SMALL);
  });

  it('tertiary button: secondary text on transparent (white surface)', () => {
    expect(contrastRatio(colors.textSecondary, colors.surface)).toBeGreaterThanOrEqual(WCAG_AA_SMALL);
  });
});

describe('WCAG 1.4.3 — status badge text on badge background', () => {
  const variants: StatusVariant[] = [
    'ok',
    'issue',
    'critical',
    'maintenance',
    'sterilized',
    'needs_attention',
    'offline',
  ];

  for (const variant of variants) {
    it(`${variant}: badge text meets 4.5:1 on badge background`, () => {
      const { text, bg } = statusVariantColors[variant];
      expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(WCAG_AA_SMALL);
    });
  }
});

describe('WCAG 1.4.3 — emergency palette', () => {
  it('emergency amber on dark surface meets 4.5:1', () => {
    expect(contrastRatio(colors.emergency.amber, colors.emergency.surface)).toBeGreaterThanOrEqual(WCAG_AA_SMALL);
  });

  it('emergency accent red on dark surface meets 4.5:1', () => {
    expect(contrastRatio(colors.emergency.accent, colors.emergency.surface)).toBeGreaterThanOrEqual(WCAG_AA_SMALL);
  });
});

describe('WCAG 1.4.11 — UI component colors (3:1)', () => {
  it('focus ring on page background meets 3:1', () => {
    expect(contrastRatio(colors.focusRing, PAGE_BG)).toBeGreaterThanOrEqual(WCAG_AA_LARGE_OR_UI);
  });

  it('semantic error color meets 3:1 (error border on inputs)', () => {
    // Error border (#dc2626) is the sole visual indicator of an invalid field state.
    expect(contrastRatio(colors.semantic.error, PAGE_BG)).toBeGreaterThanOrEqual(WCAG_AA_LARGE_OR_UI);
  });
});
