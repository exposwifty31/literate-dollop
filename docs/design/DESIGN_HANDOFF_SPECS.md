# Design Handoff Specs — VetTrack Expo Screens

**Prepared:** 2026-06-25  
**Author:** Design team  
**Implementation start:** Week of 2026-06-25  
**Figma source:** `design-artifacts/vettrack-native-mobile-redesign.dc.html`

---

## Quick Start for Developers

1. **Color palette** → See "Design Tokens" section
2. **Typography** → Font family, sizes, line-height specs
3. **Components** → Reusable button, card, form field specs
4. **Spacing & layout** → Grid system (8px base)
5. **Screen specs** → Per-screen component inventory

---

## Design Tokens

### Color System

```typescript
// apps/expo/src/theme/colors.ts
export const colors = {
  // Primary
  primary: {
    50: '#e9f4ea',
    100: '#c8e4cc',
    200: '#a8d4ae',
    600: '#1e7a32',
    700: '#1e4a25',
  },
  
  // Status / Equipment states
  status: {
    ok: '#16a34a',          // Green: equipment available
    issue: '#d97706',       // Amber: maintenance needed
    critical: '#b91c1c',    // Dark red: critical issue
    offline: '#fef3c7',     // Light amber bg for offline state
    offlineText: '#78350f', // Dark amber text
  },
  
  // Semantic
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0284c7',
  
  // Emergency (Code Blue)
  emergency: {
    bg: '#0c0c0c',          // Near-black
    surface: '#18181b',     // Slightly lighter
    accent: '#ef4444',      // Bright red
    amber: '#fbbf24',       // Amber for warnings
  },
  
  // Neutrals
  background: '#f6f7fb',
  surface: '#ffffff',
  border: '#d8dce6',
  borderStrong: '#bcc2d4',
  text: '#111a12',
  textSecondary: '#2e394d',
  textTertiary: '#5a6884',
  
  // Accessibility
  focusRing: '#1e7a32',     // 3:1 contrast on all backgrounds
};
```

### Typography

```typescript
// apps/expo/src/theme/typography.ts
export const typography = {
  // Font families
  fontFamily: {
    primary: "'Plus Jakarta Sans', system-ui, sans-serif",
    hebrew: "'Heebo', system-ui, sans-serif",
    monospace: "'JetBrains Mono', monospace",
  },
  
  // Scale (base: 16px)
  h1: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: -0.02,
    // Usage: Page titles (Equipment, Alerts, etc.)
  },
  
  h2: {
    fontSize: 22,
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: -0.01,
    // Usage: Section headings within page
  },
  
  h3: {
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: 0,
    // Usage: Card titles
  },
  
  body: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.5,
    // Usage: Paragraph text
  },
  
  bodySmall: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.43,
    // Usage: Secondary text, captions
  },
  
  caption: {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.33,
    // Usage: Labels, badges
  },
  
  label: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.43,
    textTransform: 'none', // Never use ALL CAPS
    // Usage: Button labels, form labels
  },
  
  mono: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.5,
    // Usage: Status codes, serial numbers
  },
};

// Line height adjustment for Hebrew
export function getTypography(locale: 'en' | 'he') {
  const base = typography.body;
  return locale === 'he'
    ? { ...base, lineHeight: 1.6 } // Increased for readability
    : base;
}
```

### Spacing System (8px grid)

```typescript
export const spacing = {
  // Core increments
  0: 0,
  1: 4,    // xs
  2: 8,    // sm
  3: 12,   // md
  4: 16,   // lg
  5: 20,   // xl
  6: 24,   // 2xl
  7: 28,
  8: 32,
  
  // Aliases for common use
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  
  // Padding & margin defaults
  pageHorizontal: 16,  // Side padding on screens
  pageVertical: 24,    // Top/bottom padding
};
```

### Components: Atomic Design Specs

#### Button
```typescript
// Minimum size: 44px × 44px (touch target)
interface Button {
  variant: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size: 'sm' | 'md' | 'lg'; // 32px | 44px | 48px
  isLoading?: boolean;
  isDisabled?: boolean;
  icon?: React.ReactNode; // Left icon only
  label: string;
  onPress: () => void;
}

// Primary (green)
height: 44px;
paddingHorizontal: 16px;
backgroundColor: #1e7a32;
textColor: white;
borderRadius: 8px;
fontWeight: 600;
fontSize: 14px;

// Secondary (outline)
borderWidth: 2px;
borderColor: #1e7a32;
textColor: #1e7a32;
height: 44px;

// Danger (red)
backgroundColor: #dc2626;
textColor: white;

// Focus state (all variants)
outline: 2px solid #1e7a32;
outlineOffset: 2px;
```

#### Card
```typescript
interface Card {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'critical';
}

// Default card
backgroundColor: white;
borderRadius: 12px;
border: 1px solid #d8dce6;
boxShadow: 0 1px 3px rgba(15, 23, 42, 0.08);
padding: 16px;

// Critical card (equipment issue)
borderColor: #dc2626;
borderWidth: 2px;
backgroundColor: #fff5f5; // Light red tint

// Status badge in card
borderRadius: 20px;
paddingHorizontal: 8px;
paddingVertical: 4px;
fontSize: 12px;
fontWeight: 600;
// OK: green background, white text
// Issue: amber background, dark text
// Critical: red background, white text
```

#### Form Field
```typescript
interface FormField {
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
}

// Label
fontSize: 14px;
fontWeight: 600;
marginBottom: 8px;
color: #111a12;

// Input
height: 44px;
paddingHorizontal: 12px;
paddingVertical: 10px;
borderRadius: 8px;
borderWidth: 1px;
borderColor: #d8dce6;
fontSize: 16px;

// Focus
borderColor: #1e7a32;
outline: 2px solid #1e7a32;
outlineOffset: 2px;

// Error
borderColor: #dc2626;
borderWidth: 2px;
errorMessageColor: #dc2626;
errorMessageFontSize: 12px;
errorMessageMarginTop: 4px;

// Required indicator
asterisk: ' *';
color: #dc2626;
```

#### List Item
```typescript
interface ListItem {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  onPress?: () => void;
}

// Row height: minimum 56px (44px touch target + padding)
height: 56px;
paddingHorizontal: 16px;
paddingVertical: 8px;
borderBottomWidth: 1px;
borderBottomColor: #d8dce6;

// Title
fontSize: 16px;
fontWeight: 500;
color: #111a12;

// Description (optional)
fontSize: 14px;
color: #5a6884;
marginTopvn: 4px;

// Icon (left)
size: 24px;
marginRightLeft: 12px; // RTL-aware

// Badge (right)
marginLeftRight: 8px; // RTL-aware
```

#### Sheet Modal (Bottom sheet)
```typescript
interface Sheet {
  title: string;
  children: React.ReactNode;
  onDismiss: () => void;
  dismissible?: boolean;
}

// Background
backgroundColor: rgba(0, 0, 0, 0.5); // Overlay
backdropFilter: blur(4px);

// Sheet container
backgroundColor: white;
borderRadius: 20px 20px 0 0; // Only top corners
paddingHorizontal: 16px;
paddingVertical: 24px;
paddingBottom: 32px; // Account for safe area

// Handle bar (visual indicator)
height: 4px;
width: 40px;
borderRadius: 2px;
backgroundColor: #d8dce6;
alignSelf: center;
marginBottom: 16px;

// Close button (X icon, top-right)
position: absolute;
top: 16px;
right: 16px;
```

---

## Screen-Specific Specs

### 1. Sign In `/(auth)/sign-in`

#### Layout
```
┌─────────────────────┐
│  VetTrack Logo      │ (32x32px)
│  "Sign in to your   │
│   VetTrack clinic"  │
│                     │
│  [Email input]      │
│  [Password input]   │
│                     │
│  [Sign in button]   │
│  [Forgot?]          │
│                     │
│  [Privacy policy]   │
└─────────────────────┘
```

#### Components
- Logo: 32×32px, centered at top
- Heading: h2, centered
- Email input: Form field, email type
- Password input: Form field, password type, show/hide toggle
- Sign in button: Primary, 44px height, full width
- "Forgot password?" link: Secondary text, 14px
- Privacy link: caption, 12px, centered

#### Interaction
- Email field: Focus shows green focus ring
- Validation: On submit, not on change
- Loading: Button shows spinner, form disabled
- Error: Toast or inline message below form

#### i18n
- All text keys: `auth.signin.*`
- Example: `t('auth.signin.heading')`

#### RTL
- All text aligns to start (auto LTR/RTL)
- Input directionality: auto-detect

---

### 2. Home `/(app)/(tabs)/index`

#### Layout
```
┌──────────────────────┐
│ Equipment  5    ⚙️   │ (header chip)
│                      │
│ ┌────────────────┐   │
│ │ Shift Card     │   │
│ │ St. Mary's     │   │
│ │ 08:00 - 16:00  │   │
│ │ 3 technicians  │   │
│ │                │   │
│ │ [Handoff]      │   │
│ └────────────────┘   │
│                      │
│ Quick Links:         │
│ [Scan] [My Equip.] │  (icon + label)
│                      │
│ [Offline banner]     │ (if offline)
│                      │
│ [Cutover banner]     │ (if flag on)
└──────────────────────┘
```

#### Components
- Header: Equipment count chip (rounded pill, gray bg, icon)
- Shift card: Card variant elevated, 3 lines of info, button
- Quick links: Horizontal scroll, 2 items visible
- Offline banner: Yellow bg, orange text, sticky
- Cutover banner: Custom variant, dismissible

#### States
- No active shift: Show "Start Shift" button instead of card
- Offline + no cache: Show empty state message
- Loading: Skeleton card while fetching

---

### 3. Equipment List `/(app)/(tabs)/equipment`

#### Layout
```
┌──────────────────────┐
│ Search bar           │ (search input, full width)
│                      │
│ Filters:             │
│ [All] [OK] [Issue]   │ (chip buttons, horizontal scroll)
│ [Critical]           │
│                      │
│ ┌────────────────┐   │
│ │ Equipment 1    │   │ (list item)
│ │ Location 3     │   │
│ │ ✓ OK           │   │ (status badge right)
│ └────────────────┘   │
│                      │
│ ┌────────────────┐   │
│ │ Equipment 2    │   │
│ │ Location 1     │   │
│ │ ⚠️ Issue        │   │
│ └────────────────┘   │
│                      │
│ [Load more...]       │ (pagination button)
└──────────────────────┘
```

#### Components
- Search bar: Form field, search icon left, clearable
- Filter chips: Chip component variant, toggleable
- List item: Equipment card, 56px height, status badge right
- Status badge: Color-coded (green/amber/red) + text label
- Pagination: Button at bottom, "Load more"

#### Interaction
- Search: Filter by name/ID in real-time
- Filter: Click chip to toggle, updates list
- Tap item: Navigate to detail (push route)

---

### 4. Equipment Detail `/(app)/equipment/[id]`

#### Layout
```
┌──────────────────────┐
│ < Back    ⋯          │ (header: back + menu)
│                      │
│ Equipment Name       │ (h2)
│ [Status badge]       │
│                      │
│ ┌────────────────┐   │
│ │ Location:      │   │ (info rows)
│ │ Room 3         │   │
│ │                │   │
│ │ Last User:     │   │
│ │ Jane Doe       │   │
│ │                │   │
│ │ Checked out:   │   │
│ │ 2 hours ago    │   │
│ └────────────────┘   │
│                      │
│ [Checkout] [Return]  │ (action buttons)
│ [Update Status]      │
│ [Edit Equipment]     │
└──────────────────────┘
```

#### Components
- Header: Back button (left), menu button (right)
- Title: h2, equipment name
- Status badge: Card-level (larger)
- Info rows: Body text key + secondary text value
- Action buttons: Primary for main action (checkout/return), secondary for others

#### States
- Just checked out: "Return" button active, "Checkout" disabled
- Available: "Checkout" active, "Return" disabled
- Offline: All buttons enabled, added to queue on tap

---

### 5. Update Status Sheet

#### Layout
```
┌──────────────────────┐
│ ─────                │ (handle bar)
│ Update Status        │ (title) X (close)
│                      │
│ Current Status:      │ (label)
│ [Dropdown: OK ▼]     │ (picker)
│                      │
│ Notes (optional):    │ (label)
│ [Text area]          │ (multi-line input)
│                      │
│ [Save]  [Cancel]     │ (buttons)
└──────────────────────┘
```

#### Components
- Handle bar: Visual affordance (4px × 40px gray bar)
- Title: h3, top-centered with close button
- Status picker: Select component with enum options
- Notes field: Text area, placeholder text
- Buttons: Full width, stacked

#### Interaction
- Picker change: Form becomes dirty
- Save: Call PATCH API, close sheet on success
- Cancel: Dismiss without changes

---

### 6. Shift Handoff `/(app)/shift/handoff`

#### Layout
```
┌──────────────────────┐
│ Shift Handoff        │ (h1)
│                      │
│ Current Shift:       │
│ ┌────────────────┐   │
│ │ St. Mary's     │   │ (card)
│ │ 08:00 - 16:00  │   │
│ │ 3 Technicians  │   │
│ └────────────────┘   │
│                      │
│ Handoff Notes:       │ (label)
│ [Text area]          │ (multi-line input)
│                      │
│ Handoff to:          │ (label)
│ [Technician search]  │ (autocomplete input)
│                      │
│ [✓] I confirm this   │ (checkbox + label)
│     handoff          │
│                      │
│ [Handoff Now]        │ (primary button)
└──────────────────────┘
```

#### Components
- Shift card: Elevated variant, info only (no action)
- Text area: Multi-line input, 100+ char limit
- Autocomplete: Input + popover suggestions (44px rows)
- Checkbox: Styled with label, required to enable submit
- Submit button: Primary, disabled until all required fields filled

---

### 7. Rooms List `/(app)/(tabs)/rooms`

#### Layout
```
┌──────────────────────┐
│ Rooms                │ (h1)
│                      │
│ ┌────────────────┐   │
│ │ Room 1         │   │ (list item / card)
│ │ 5 equipment    │   │
│ └────────────────┘   │
│                      │
│ ┌────────────────┐   │
│ │ Room 2         │   │
│ │ 3 equipment    │   │
│ └────────────────┘   │
│                      │
│ ┌────────────────┐   │
│ │ Room 3         │   │
│ │ 8 equipment    │   │
│ └────────────────┘   │
└──────────────────────┘
```

#### Components
- List: Rooms displayed as list items / cards
- Item: Title + count, 56px height, tappable

#### Interaction
- Tap: Navigate to room detail (push route)

---

### 8. Alerts `/(app)/(tabs)/alerts`

#### Layout
```
┌──────────────────────┐
│ Alerts (3)           │ (h1 with count)
│                      │
│ Filters:             │
│ [All] [Critical]     │ (chip buttons)
│ [Overdue]            │
│                      │
│ ┌────────────────┐   │
│ │ 🔴 Critical    │   │ (alert item)
│ │ Equipment 1    │   │
│ │ Needs repair   │   │
│ │ 2 days ago     │   │
│ └────────────────┘   │
│                      │
│ ┌────────────────┐   │
│ │ ⚠️ Overdue      │   │
│ │ Equipment 2    │   │
│ │ Checkout 5h    │   │
│ │ ago            │   │
│ └────────────────┘   │
└──────────────────────┘
```

#### Components
- Filter chips: Toggleable, color-coded
- Alert item: Icon + alert type (color) + description + timestamp
- Icon: 24×24px, colored (red for critical, amber for overdue)

#### States
- No alerts: Empty state message
- Loading: Skeleton cards

---

## Design System Component Library

All components below should exist as reusable files in `apps/expo/src/components/`.

### Button.tsx
- Props: variant, size, loading, disabled, icon, label, onPress
- Exports: `<Button />`

### Card.tsx
- Props: title, description, icon, action, variant
- Exports: `<Card />`

### FormField.tsx
- Props: label, value, error, required, disabled, placeholder, type, onChange
- Exports: `<FormField />`

### ListItem.tsx
- Props: title, description, icon, badge, onPress
- Exports: `<ListItem />`

### Chip.tsx
- Props: label, selected, onPress, icon
- Exports: `<Chip />`

### Badge.tsx
- Props: label, variant (ok/issue/critical/offline)
- Exports: `<Badge />`

### Sheet.tsx (Bottom sheet modal)
- Props: title, children, onDismiss, dismissible
- Exports: `<Sheet />`

### StatusBadge.tsx (Specific for equipment status)
- Props: status, size (sm/md/lg)
- Exports: `<StatusBadge />`

---

## Responsive Breakpoints

While building for mobile-first (iOS + Android), support these viewport widths:

```typescript
export const breakpoints = {
  xs: 0,    // Mobile (default)
  sm: 480,  // Large phone
  md: 768,  // Tablet portrait
  lg: 1024, // Tablet landscape
};
```

Most screens designed for mobile (375–428px width). Tablet layouts deferred (Phase 4+).

---

## Dark Mode (Future)

Placeholder for dark mode support (out of scope for Phase 3–5). Color tokens above assume light mode.

---

## Developer Checklist Before Implementation

- [ ] All color hex codes match design tokens
- [ ] Typography uses specified font family + sizes
- [ ] Spacing follows 8px grid consistently
- [ ] Touch targets all ≥ 44px
- [ ] Focus states visible (green outline)
- [ ] Form labels associated with inputs
- [ ] Error states designed (inline message + color)
- [ ] Loading states designed (skeleton / spinner)
- [ ] Empty states designed (icon + message)
- [ ] RTL layout tested (text direction, icon mirroring)
- [ ] i18n text keys match `locales/*.json`
- [ ] Contrast ratios verified (4.5:1 text, 3:1 UI)

