# CTA Button

**COMPONENT ID:** `atom-cta-button`
**Atomic Level:** Atom (single interactive element)
**Framework:** Svelte (custom component)
**Base Styling:** daisyUI `btn btn-primary btn-lg btn-block` + Tailwind utilities

---

## Purpose

The primary call-to-action button used throughout the Sharif.no purchase flow. Full-width, large, and brand-red to draw maximum attention. Every major step in the user journey is advanced by tapping this button: "Find tires", "I'll take these", "Pay now", "Confirm time".

---

## Anatomy

```
┌─────────────────────────────────────┐
│           Button Label              │  Full-width, centered text
└─────────────────────────────────────┘
```

---

## States

### Default

The button is ready to be tapped. Bold red background, white text.

```
┌─────────────────────────────────────┐
│           Finn dekk                 │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| daisyUI | `btn btn-primary btn-lg btn-block` |
| Background | `bg-primary` (brand red) |
| Text | `text-primary-content` (white), `font-bold text-lg` |
| Height | Min 48px (3rem) |
| Border radius | daisyUI default (`rounded-btn`) |
| Shadow | `shadow-sm` |

### Hover (Desktop)

| Property | Value |
|----------|-------|
| Background | Slightly darker red (daisyUI `btn-primary` hover) |
| Shadow | `shadow-md` |
| Transition | 150ms ease |

### Active (Pressed)

| Property | Value |
|----------|-------|
| Background | Darker red (daisyUI `btn-primary` active) |
| Transform | `scale(0.98)` — subtle press-in effect |
| Shadow | `shadow-sm` |
| Transition | 50ms ease |

### Loading

Shown while an async action is processing (e.g., submitting payment).

```
┌─────────────────────────────────────┐
│         ⟳  Processing...           │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| daisyUI | `btn btn-primary btn-lg btn-block` + child `loading loading-spinner loading-sm` |
| Spinner | daisyUI loading component rendered as a child `<span>` before the label |
| Text | Changes to loading-specific label |
| Interaction | `pointer-events-none` — not tappable during loading |

### Disabled

The button is not yet actionable (e.g., required fields incomplete).

| Property | Value |
|----------|-------|
| daisyUI | `btn btn-primary btn-lg btn-block btn-disabled` |
| Opacity | `opacity-50` |
| Cursor | `cursor-not-allowed` |
| Interaction | Click events suppressed |

---

## Sub-Components

### Label

**OBJECT ID:** `atom-cta-label`

| Property | Value |
|----------|-------|
| Element | `<span>` inside `<button>` |
| Classes | `font-bold text-lg` |
| Content | Context-dependent label text |

### Price Suffix (optional)

**OBJECT ID:** `atom-cta-price`

| Property | Value |
|----------|-------|
| Element | `<span>` after label text |
| Classes | `font-normal text-base ml-1` |
| Content | Price when relevant (e.g., "— 1 996 kr") |
| Visibility | Only shown on payment CTA |

Translation keys:

| Key | NO | EN |
|-----|----|----|
| `cta.find_tires` | "Finn dekk" | "Find tires" |
| `cta.take_these` | "Disse vil jeg ha!" | "I'll take these!" |
| `cta.pay_now` | "Betal nå" | "Pay now" |
| `cta.pay_now_price` | "Betal nå — {price} kr" | "Pay now — {price} kr" |
| `cta.confirm_time` | "Bekreft tid" | "Confirm time" |
| `cta.loading` | "Behandler..." | "Processing..." |
| `cta.continue` | "Gå videre" | "Continue" |

---

## Container

**OBJECT ID:** `atom-cta-container`

| Property | Value |
|----------|-------|
| Element | `<button>` |
| Type | `button` (or `submit` when inside a form) |
| daisyUI | `btn btn-primary btn-lg btn-block` |
| Padding | daisyUI default for `btn-lg` |
| Behavior | Tap → dispatches click event or submits parent form |

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Mobile (< 768px)** | Full-width, fixed to bottom of viewport with safe-area padding (`pb-safe`). Background matches button or has subtle frosted glass. |
| **Tablet (768px-1024px)** | Full-width within content area. May be inline (not fixed to bottom). |
| **Desktop (>= 1024px)** | Full-width within its container column. Not fixed to bottom. Max-width follows parent. |

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Element | Native `<button>` element (not `<div>` or `<a>`) |
| Label | Button text serves as accessible name. If price suffix present, `aria-label` provides full description. |
| Disabled | `disabled` attribute (not just visual class) + `aria-disabled="true"` |
| Loading | `aria-busy="true"` during loading state. Label changes to loading text. |
| Focus | Visible focus ring (`focus-visible:ring-2 ring-primary-content ring-offset-2`) |
| Keyboard | Enter and Space activate the button |
| Touch target | Minimum 48px height (ensured by `btn-lg`) |
| Contrast | White text on red background meets WCAG AA (verify brand-primary ratio >= 4.5:1) |

---

## Technical Notes

- The button label is a prop — each view passes the appropriate translation key
- Loading state is triggered by binding a `loading` boolean prop
- Disabled state is typically computed: `disabled={!formValid}` — re-evaluates reactively
- On mobile, the fixed-bottom positioning uses `fixed bottom-0 left-0 right-0 p-4` with a safe area inset for notched devices
- When fixed to bottom, a spacer div of equal height is added to the page to prevent content from being hidden behind the button
- The button never navigates directly — it dispatches events or submits forms, and the parent view handles routing

---

## Usage in Page Specs

Referenced as:

```markdown
| Component | [CTA Button](../../../D-Design-System/atoms/cta-button.md) |
```

Used in:
- [01.1-Dimension Input](../../C-UX-Scenarios/01-harriets-tire-purchase/01.1-dimension-input/01.1-dimension-input.md) — "Finn dekk" / "Find tires"
- [01.3-Product Detail](../../C-UX-Scenarios/01-harriets-tire-purchase/01.3-product-detail/01.3-product-detail.md) — "Disse vil jeg ha!" / "I'll take these!"
- [01.4-Quantity & Shop](../../C-UX-Scenarios/01-harriets-tire-purchase/01.4-quantity-and-shop/01.4-quantity-and-shop.md) — "Gå videre" / "Continue"
- [01.5-Payment](../../C-UX-Scenarios/01-harriets-tire-purchase/01.5-payment/01.5-payment.md) — "Betal nå — {price} kr" / "Pay now — {price} kr"
- [01.6-Book Mounting](../../C-UX-Scenarios/01-harriets-tire-purchase/01.6-book-mounting/01.6-book-mounting.md) — "Bekreft tid" / "Confirm time"

---

_Created using Whiteport Design Studio (WDS) methodology_
