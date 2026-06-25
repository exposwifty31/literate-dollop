/**
 * WCAG 2.5.5 / iOS HIG touch target size checks.
 * Minimum interactive area: 44×44pt.
 *
 * Tests verify the design token constants — component-level minHeight is
 * enforced by StyleSheet and covered by the component accessibility tests.
 */
import { describe, expect, it } from 'vitest';

import { touchTarget, listItemHeight } from '../../apps/expo/src/theme/spacing';

const MIN_TOUCH = 44;

describe('touch target tokens (WCAG 2.5.5 / iOS HIG)', () => {
  it('touchTarget.md is the default interactive size (≥ 44px)', () => {
    expect(touchTarget.md).toBeGreaterThanOrEqual(MIN_TOUCH);
  });

  it('touchTarget.lg is the large size (≥ 44px)', () => {
    expect(touchTarget.lg).toBeGreaterThanOrEqual(MIN_TOUCH);
  });

  it('touchTarget.sm is intentionally sub-44px and documented as non-critical only', () => {
    // sm=32 is allowed for purely decorative or secondary chrome — never primary actions.
    // This test documents the intent; CI will fail if sm is accidentally set to ≥44.
    expect(touchTarget.sm).toBeLessThan(MIN_TOUCH);
  });

  it('listItemHeight.default provides a touch-safe row height', () => {
    expect(listItemHeight.default).toBeGreaterThanOrEqual(MIN_TOUCH);
  });

  it('listItemHeight.default includes padding above the 44px minimum (≥ 56px)', () => {
    // 56px = 44px touch target + 12px vertical padding (design spec)
    expect(listItemHeight.default).toBeGreaterThanOrEqual(56);
  });
});
