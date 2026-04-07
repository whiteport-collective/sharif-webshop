# WO-006 — Order Confirmation Inline (01.7 Spec Implementation)

**Status:** Complete  
**Priority:** High  
**Assigned to:** Freya  
**Completed:** 2026-04-07  
**Spec refs:**
- `design-process/C-UX-Scenarios/01-main-order-flow/01.7-order-confirmation/01.7-order-confirmation.md`

---

## Objective

Replace the simple centered checkmark confirmation with the full 01.7 spec: two-column layout with collapsed step summaries, star rating, AI chat, and sticky cart sidebar.

---

## What Was Built

### 1. Two-column confirmation layout

The `OrderConfirmedInline` component now shares the same `grid-cols-[3fr_2fr]` grid as the checkout steps. When `orderId` is set, the left column switches from checkout steps to the confirmation view. The cart sidebar remains visible and sticky on the right throughout.

**File:** `storefront/src/modules/checkout/components/checkout-panel-content/index.tsx`

### 2. Collapsed step summaries

Four completed steps with green checkmark icons, matching the spec:

| Step | Data shown |
|------|-----------|
| Leveringsmate | Shipping method name + price |
| Kundeopplysninger | Name, email, phone + Norwegian registration plate |
| Betaling | "Betaling gjennomfort" |
| Monteringstid | Date, time, workshop (workshop orders only) |

### 3. Registration plate element

Norwegian-style plate with blue `#1864ab` strip (white "N") and monospace reg.nr. Reads from `cart.metadata.car_registration` (the field set by the shipping-address form).

### 4. Star rating with collapse

- 5 interactive yellow stars (`#ffd43b`)
- After tapping: 1s delay, then rating section collapses into a step widget showing "Takk for bestillingen! (filled stars)"
- Clicking the collapsed widget reopens the interactive stars

### 5. AI chat

- Textarea with placeholder, `+` upload button (left), red send circle (right)
- Chat bubbles: dark right-aligned (user), light left-aligned (AI)
- Posts to `/api/dialog/[id]/message`
- Enter to send, Shift+Enter for newline

### 6. Dialog API route

**File:** `storefront/src/app/api/dialog/[id]/message/route.ts`

- Uses Claude Haiku as Sharif customer service agent
- System prompt includes order ID context
- In-memory conversation history per order (production: persist to `dialog_messages` table)
- Graceful fallback if `ANTHROPIC_API_KEY` is not set

---

## Files Changed

| File | Change |
|------|--------|
| `storefront/src/modules/checkout/components/checkout-panel-content/index.tsx` | Rewrote `OrderConfirmedInline`, added `CompletedStep`, `RegistrationPlate`, `StarRating` components. Restructured parent render to share two-column grid between checkout and confirmation. |
| `storefront/src/lib/i18n.tsx` | Added 9 new string keys for confirmation UI (both NO and EN) |
| `storefront/src/app/api/dialog/[id]/message/route.ts` | New file — dialog API route for post-order AI chat |

---

## Side Fixes

| Fix | Detail |
|-----|--------|
| Backend import path | `backend/src/api/admin/sharif-dashboard/overview/route.ts` had 5-level relative import (`../../../../../modules/sharif-settings`) — fixed to 4-level (`../../../../`) |

---

## Known Gaps

| Gap | Status |
|-----|--------|
| Rating not persisted to `dialog.rating` | Needs dialog table in local Postgres |
| Chat messages not persisted to `dialog_messages` | In-memory only — needs DB integration |
| File upload button (`+`) is visual only | Needs file picker + upload handler |
| Turbopack crashes on order placement | Using standard webpack dev server as workaround |

---

## Test Evidence

Full end-to-end order placed via browser test (2026-04-07):
- 205/55R16 Powertrac ADAMAS H/P x4
- Drammen workshop, 08:00 Onsdag 8. april
- Stripe test card 4242...
- Confirmation rendered correctly with all sections

---

_Created by Freya — Whiteport Design Studio_
