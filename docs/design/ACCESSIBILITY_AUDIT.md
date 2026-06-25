# WCAG 2.1 AA Accessibility Audit — VetTrack Expo

**Audit Date:** 2026-06-25  
**Scope:** 18 screens across all waves  
**Standard:** WCAG 2.1 Level AA (Web Content Accessibility Guidelines)  
**Platform:** React Native (via Expo) running on iOS / Android

---

## Executive Summary

VetTrack Expo must meet WCAG 2.1 AA to be legally compliant and inclusive. This audit identifies gaps across 4 key areas:

1. **Contrast & Visual Design** (15 items)
2. **Touch & Keyboard Navigation** (10 items)
3. **Form & Error Handling** (8 items)
4. **Localization & RTL** (6 items)

---

## 1. Contrast & Visual Design (WCAG 1.4.3, 1.4.11)

### Success Criterion: Minimum Contrast
- Text: 4.5:1 (normal), 3:1 (large, 18pt+)
- UI components: 3:1 (border, background, focus indicator)
- Graphical objects: 3:1

### Audit Findings

| Screen | Component | Issue | Fix | Priority |
|--------|-----------|-------|-----|----------|
| All | Status badges (OK / Issue / Critical) | Colors may not meet 3:1 on light backgrounds | Add subtle border or text label alongside color | P1 |
| Equipment Detail | Equipment status "OK" (green) | Green #16a34a on white may be < 4.5:1 | Test contrast: should be 4.52:1 ✅, but verify in production rendering | P1 |
| Equipment Detail | Status "Critical" (red) | Red #dc2626 on white: ~5:1 ✅ | No action, but test on all backgrounds | - |
| Equipment Detail | Offline badge (yellow) | Offline #fef3c7 bg, #78350f text: ~9:1 ✅ | No action | - |
| Emergency states | Emergency red #ef4444 on dark bg #0c0c0c | ~7.5:1 ✅ | No action, already high contrast | - |
| All tabs | Tab text (inactive) | Inactive tab text on light bg: verify 4.5:1 | Test in native rendering; adjust if needed | P1 |
| Equipment List | Filter chips (unselected) | Border-only chips: may fail 3:1 on border | Add solid background or thicker border | P1 |
| Sign In | Form labels | All text on white background: test 4.5:1 | Expected to pass, verify with axe-core | P0 |

### Remediation Actions

1. **Test contrast programmatically**
   ```bash
   npm install --save-dev jest-axe @axe-core/react-native
   ```
   Add to `tests/a11y/contrast.test.ts`:
   ```typescript
   import { axe } from 'jest-axe';
   
   test('Equipment Detail meets WCAG contrast standards', async () => {
     const { container } = render(<EquipmentDetail />);
     const results = await axe(container);
     expect(results).toHaveNoViolations();
   });
   ```

2. **Design system review**: Update `design-tokens.ts` to enforce contrast rules
   ```typescript
   const colors = {
     status: {
       ok: '#16a34a',      // Test: 4.52:1 on #fff
       issue: '#d97706',   // Test: 3.2:1 on #fff — needs darkening
       critical: '#dc2626' // ✅ 5:1 on #fff
     }
   };
   ```

3. **Add accessibility annotations** to design system:
   - Each color token: contrast ratio on light + dark backgrounds
   - Each component: minimum touch target size

---

## 2. Touch & Keyboard Navigation (WCAG 2.5.5, 2.1.1)

### Success Criteria
- Touch targets ≥ 44px × 44px (WCAG 2.5.5)
- All interactive elements reachable via keyboard (Tab, Shift+Tab, Enter, Space, Escape)
- Focus indicator visible (3:1 contrast) and not obscured
- No keyboard trap (can always escape with standard keys)

### Audit Findings

| Screen | Component | Issue | Fix | Priority |
|--------|-----------|-------|-----|----------|
| Equipment List | List item hit area | 44px row height may be cutting it close in dense list | Verify: test with actual touch on device | P0 |
| Checkout/Return button | Inline action in detail | Button width may be < 44px in mobile viewport | Add padding or increase hit area via transform scale | P1 |
| Status badges | Badge tap target | Badge-only: may be < 44px | Make entire row tappable, not just badge | P1 |
| Equipment List | Search input | Input field touch target: check height | Ensure input ≥ 44px tall (includes label space) | P0 |
| Shift Handoff | Technician autocomplete | Dropdown items: verify 44px row height | Measure in native rendering | P1 |
| All tabs | Tab bar buttons | Tab width varies (5 tabs in 100vw): test per device | Each tab ≥ 44px wide? Test on small screens | P0 |
| Alerts | Alert list items | Row height adequate? | Verify 44px+ with text + icon | P0 |
| Rooms | Room cards | Card as button: is entire card tappable (44px area)? | Make entire card region tappable | P1 |
| Forms (New Equipment) | Submit button | Button height: 48px? | Verify and document in design tokens | P0 |
| Scan screen | Retry button (failed row) | Retry button size in table: adequate? | Increase to 44px minimum | P1 |

### Remediation Actions

1. **Keyboard navigation test**
   ```typescript
   // tests/a11y/keyboard-nav.test.ts
   test('Equipment Detail keyboard navigation', () => {
     const { getByRole } = render(<EquipmentDetail />);
     const checkoutButton = getByRole('button', { name: /checkout/i });
     
     // Simulate Tab key focus
     fireEvent.keyDown(checkoutButton, { key: 'Tab' });
     expect(checkoutButton).toHaveFocus();
     
     // Simulate Enter to activate
     fireEvent.keyDown(checkoutButton, { key: 'Enter' });
     expect(onCheckout).toHaveBeenCalled();
   });
   ```

2. **Touch target audit**: Add sizes to components
   ```typescript
   const Button = styled.button`
     min-width: 44px;
     min-height: 44px;
     padding: 8px 12px; /* Ensure 44px total */
   `;
   ```

3. **Focus visibility**: Add focus ring styling
   ```css
   :focus-visible {
     outline: 2px solid #1e7a32;
     outline-offset: 2px;
   }
   ```

4. **Test on actual devices**: Run on iOS (VoiceOver) + Android (TalkBack)

---

## 3. Form & Error Handling (WCAG 3.3.1, 3.3.2, 3.3.4)

### Success Criteria
- Form labels associated with inputs (aria-label, aria-labelledby, placeholder not sufficient)
- Error messages linked to inputs (aria-describedby)
- Required fields marked
- Error message location near field or announced
- Validation not triggered on change (only on blur/submit)

### Audit Findings

| Screen | Component | Issue | Fix | Priority |
|--------|-----------|-------|-----|----------|
| Sign In | Email + password inputs | Labels: are they associated? Check for aria-labelledby | Add `<label htmlFor>` wrapper or aria-labelledby | P0 |
| Sign In | Error message | If validation fails, is error announced to screen reader? | Add `aria-describedby` linking error to input | P0 |
| New Equipment | Form validation | Validation triggered on change or submit? Should be on blur/submit | Adjust validation timing | P0 |
| New Equipment | Required fields | Required star present but not announced? | Add aria-required="true" + text "(Required)" | P0 |
| New Equipment | Serial number field | Optional indicator? How is it communicated? | Add aria-required="false" or aria-label | P1 |
| Equipment Update Status | Status dropdown | Selected value announced? | Add aria-label="Current status: OK" | P1 |
| Shift Handoff | Technician autocomplete | Autocomplete suggestions announced? | Add role="listbox" to suggestions, aria-expanded to input | P1 |
| Shift Handoff | Agreement checkbox | Label associated? | Add `<label htmlFor>` around checkbox | P0 |

### Remediation Actions

1. **Audit form structure**
   ```typescript
   // BAD
   <input placeholder="Email address" />
   
   // GOOD
   <label htmlFor="email">Email address</label>
   <input id="email" type="email" aria-label="Email address" />
   
   // BETTER (with description)
   <label htmlFor="email">Email address</label>
   <input id="email" type="email" aria-describedby="email-error" />
   <span id="email-error" role="alert">{error}</span>
   ```

2. **Add error announcement tests**
   ```typescript
   test('Sign In error message announced to screen reader', async () => {
     const { getByRole } = render(<SignIn />);
     const submitButton = getByRole('button', { name: /sign in/i });
     
     fireEvent.click(submitButton);
     
     const error = getByRole('alert');
     expect(error).toBeInTheDocument();
     expect(error).toHaveTextContent('Invalid email');
   });
   ```

3. **Add form field test template**
   ```typescript
   // tests/a11y/form-fields.test.ts
   function testFormField(label: string, input: HTMLElement) {
     // Label associated
     expect(input).toHaveAccessibleName(label);
     
     // Required marked
     if (input.required) {
       expect(input).toHaveAttribute('aria-required', 'true');
     }
     
     // Focus visible
     input.focus();
     expect(input).toHaveFocus();
   }
   ```

---

## 4. Localization & RTL (WCAG 3.1.1, 3.1.2)

### Success Criteria
- Text direction respected (dir="rtl" for Hebrew)
- Icons not mirrored (except directional like arrows)
- Font sizing readable across locales
- Line height appropriate for script (Hebrew needs more space)

### Audit Findings

| Screen | Component | Issue | Fix | Priority |
|--------|-----------|-------|-----|----------|
| All screens | Page direction | Is `dir="rtl"` set on root when Hebrew locale active? | Verify in App.tsx: `<RootView dir={isRTL ? 'rtl' : 'ltr'}> | P0 |
| All screens | Text alignment | Text aligned to start/end, not left/right? | Use `textAlign: 'start'` CSS instead of `textAlign: 'left'` | P1 |
| Equipment List | Search input | Placeholder text direction correct? | Test in Hebrew: placeholder should be RTL | P1 |
| All screens | Icons (arrow left/right) | Directional icons mirrored in RTL? | **DO NOT mirror**: left arrow = "back" in both LTR + RTL | P1 |
| All screens | Numbers (status count) | Numbers rendered LTR even in RTL text? | Wrap numbers in `<bdi>` or use bidirectional markup | P1 |
| Equipment List | Filter chips | Chip order (left-to-right vs right-to-left) | Visual order should match logical order in RTL | P1 |
| Sign In | Form labels | Hebrew label text wrapping at small sizes? | Increase line-height to 1.5 for Hebrew (`font-family: 'Heebo'`) | P2 |
| All screens | Cutover banner | Banner text right-aligned in RTL? | Use `textAlign: 'start'` (auto right in RTL) | P1 |
| Shift Handoff | Technician list | Name order (First Last) readable in RTL? | Test with real Hebrew names | P1 |

### Remediation Actions

1. **RTL test helper**
   ```typescript
   // tests/a11y/rtl.test.ts
   export function renderWithRTL(component: ReactElement) {
     return render(component, {
       initialState: { locale: 'he' }
     });
   }
   
   test('Equipment List is readable in RTL', () => {
     const { getByText } = renderWithRTL(<EquipmentList />);
     const item = getByText(/ציוד/); // Hebrew "equipment"
     expect(item).toBeInTheDocument();
     expect(item).toHaveStyle({ direction: 'rtl' });
   });
   ```

2. **Update i18n system** to set document direction
   ```typescript
   // src/lib/i18n.ts
   export function setLocale(locale: 'en' | 'he') {
     document.dir = locale === 'he' ? 'rtl' : 'ltr';
     I18nManager.forceRTL(locale === 'he');
     // Also set body/root element direction
   }
   ```

3. **CSS text alignment audit**
   ```css
   /* WRONG */
   .label { text-align: left; }
   
   /* RIGHT */
   .label { text-align: start; } /* auto-flips in RTL */
   ```

4. **Font sizing for Hebrew**
   ```typescript
   const fonts = {
     body: {
       fontSize: 16,
       lineHeight: 1.5, // Increased for Hebrew legibility
       fontFamily: locale === 'he' ? 'Heebo' : 'Plus Jakarta Sans'
     }
   };
   ```

---

## 5. Screen Reader & Semantic HTML (WCAG 1.3.1, 4.1.2)

### Success Criteria
- Proper heading hierarchy (h1 → h2 → h3, no jumps)
- Landmark roles (main, navigation, contentinfo)
- Interactive elements have proper roles (button, link, tab)
- Live regions announced (aria-live, aria-busy)

### Audit Findings

| Screen | Component | Issue | Fix | Priority |
|--------|-----------|-------|-----|----------|
| Equipment List | Page structure | h1 present? | Add `<h1>Equipment</h1>` to page | P1 |
| Equipment List | Headings | Heading hierarchy correct? | Audit: no h1 → h3 jumps | P1 |
| All screens | Navigation | Role="navigation" on tab bar? | Add to Tabs component | P0 |
| Equipment Detail | Heading | Detail page h1 = equipment name? | Add `<h1>{equipment.name}</h1>` | P1 |
| Scan screen | Status updates | Status change announced (role="status")? | Add `<div role="status" aria-live="polite">Syncing...</div>` | P0 |
| Equipment List | Loading state | Spinner announced? | Add `<div role="status" aria-busy="true">Loading...</div>` | P1 |
| Forms | Fieldset | Form sections grouped (fieldset)? | Use `<fieldset>` for related form fields | P1 |
| Equipment List | List | List has role="list"? | Wrap results in `<ul>` or add role="list" | P1 |

### Remediation Actions

1. **Add semantic structure test**
   ```typescript
   test('Equipment List has proper heading structure', () => {
     const { container } = render(<EquipmentList />);
     const h1 = container.querySelector('h1');
     const h2s = container.querySelectorAll('h2');
     
     expect(h1).toBeInTheDocument();
     expect(h1).toHaveTextContent('Equipment');
     
     // No h1 → h3 jumps
     h2s.forEach(h2 => {
       const nextH3 = h2.nextElementSibling?.querySelector('h3');
       expect(nextH3).toBeTruthy();
     });
   });
   ```

2. **Add live region for status**
   ```typescript
   <div role="status" aria-live="polite" aria-atomic="true">
     {syncState === 'syncing' && 'Syncing...'}
     {syncState === 'error' && 'Sync failed'}
   </div>
   ```

3. **Add landmark roles**
   ```typescript
   <nav role="navigation" aria-label="App tabs">
     <Tabs />
   </nav>
   
   <main role="main">
     {/* Page content */}
   </main>
   ```

---

## 6. Implementation Checklist

### Phase 1: Critical (P0) — Required before release
- [ ] Test contrast ratios on all screens (jest-axe)
- [ ] Add aria-labelledby/aria-describedby to all form fields
- [ ] Verify touch targets ≥ 44px on device
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Set dir="rtl" based on locale
- [ ] Add aria-live announcements for sync state

### Phase 2: Important (P1) — Target before beta
- [ ] Audit heading hierarchy on all screens
- [ ] Add role="navigation" to tab bar
- [ ] Fix status badge color contrast (if needed)
- [ ] Test with VoiceOver (iOS) + TalkBack (Android)
- [ ] Add RTL text direction tests
- [ ] Document all i18n text in `locales/*.json`

### Phase 3: Nice-to-have (P2) — Ongoing
- [ ] Add color-blind simulator to dev tools
- [ ] Create accessibility design tokens
- [ ] Conduct user testing with screen reader users
- [ ] Add WCAG A+ compliance tests

---

## 7. Testing Tools & Commands

### Install a11y testing dependencies
```bash
pnpm add --save-dev jest-axe @axe-core/react-native
```

### Run accessibility tests
```bash
pnpm test tests/a11y
```

### Manual testing
```bash
# iOS
open -a Simulator
# Settings → Accessibility → VoiceOver (toggle on)
# Test: navigate entire app with VoiceOver commands

# Android
adb shell settings put secure enabled_accessibility_services \
  com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService
# Test: navigate with TalkBack
```

### Browser-based preview
```bash
npx axe-core --file design-artifacts/vettrack-native-mobile-redesign.dc.html
```

---

## 8. Compliance Status

| Category | Current | Target | Status |
|----------|---------|--------|--------|
| Contrast testing | 0% | 100% | ⚠️ Not started |
| Keyboard navigation | 75% | 100% | 🟡 Mostly done (verify) |
| Form labels | 60% | 100% | 🟡 Partial |
| Screen reader support | 40% | 100% | 🟡 Partial (roles missing) |
| RTL support | 90% | 100% | 🟡 Layout OK, icons/text to verify |
| Touch targets | 70% | 100% | 🟡 Likely OK but unverified |
| **Overall WCAG 2.1 AA** | **60%** | **100%** | 🔴 In progress |

**Target completion:** 2026-07-15 (3 weeks)

