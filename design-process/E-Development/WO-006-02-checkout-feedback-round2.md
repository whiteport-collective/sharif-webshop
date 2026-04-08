# WO-006-02 — Checkout Feedback Round 2

**Status:** Open  
**Reporter:** Mårten + Freya  
**Date:** 2026-04-07  
**Context:** Live walkthrough verifying WO-006-01 fixes and catching new issues

---

## FB-20: Scroll snap stickiness is messy and unpleasant

**Observed:** The slide/snap between home → results → checkout sections feels jerky and sticky. CSS `snap-mandatory` fights with content scrolling inside sections that exceed viewport height.

**Root cause:** `snap-y snap-mandatory` on the scroll surface + `snap-start` / `scrollSnapStop: always` on each `min-h-screen` section. When content is taller than the viewport, the mandatory snap pulls the user to the nearest snap point on every scroll stop, making it impossible to scroll freely within a section.

**File:** `storefront/src/modules/home/components/flow-shell/index.tsx:552`

**Fix:** Remove CSS snap entirely (`snap-y snap-mandatory`, `snap-start`, `scrollSnapStop`). Keep programmatic `scrollToSection()` for view transitions — it already handles smooth scrolling between sections. The gesture handlers and buttons drive all section navigation.

**Severity:** High — core UX interaction (FB-05 carry-over)  
**Assigned to:** Freya

---

## FB-21: Too much space above tire results list

**Observed:** Det är fortfarande för mycket plats ovanför däcken i produktlistan. The gap between the header and the first tire card row is excessive.

**Root cause:** Results section has `pt-14` (56px header offset) and `TireResultsHeader` adds another `pt-5` (20px). Total: 76px above the count/sort line.

**File:** `storefront/src/modules/products/components/tire-results-header/index.tsx:75`

**Fix:** Reduce `TireResultsHeader` top padding from `pt-5` to `pt-2`.

**Severity:** Medium — visual spacing  
**Assigned to:** Freya

---

## FB-22: Changing language in checkout scrolls user to tire section

**Observed:** Switching language (NO ↔ EN) while in the checkout view causes the page to scroll back to the results section.

**Root cause:** The `useEffect` that calls `scrollToSection(view)` fires whenever its dependencies change. Language change causes a re-render, and the effect re-runs even though `view` hasn't changed — scrolling the user away from checkout.

**File:** `storefront/src/modules/home/components/flow-shell/index.tsx:318-327`

**Fix:** Add a `prevViewRef` guard so the effect only scrolls when `view` actually changes, not on re-renders.

**Severity:** Medium — unexpected navigation  
**Assigned to:** Freya

---

## FB-23: Order confirmation never appears after placing order

**Observed:** After completing checkout, the confirmation section (OrderConfirmedInline) does not appear. User never sees the "Takk for bestillingen" screen with collapsed step summaries, rating stars, and AI chat.

**Root cause (investigation):** Code flow is correct: `PaymentButton` → `placeOrderInPanel()` → `onSuccess(orderId)` → `setOrderId()` → renders `OrderConfirmedInline`. However, only Stripe is configured as a payment provider (no manual/test fallback). If the Stripe payment fails (insecure connection, invalid card, or missing payment session), `onSuccess` never fires. Errors may be swallowed silently.

**File:** `storefront/src/modules/checkout/components/payment-button/index.tsx`  
**Config:** `backend/medusa-config.ts:26-34` — only `pp_stripe` configured

**Fix:** Needs browser debug to confirm root cause. Options:
1. Add a manual test payment provider to Medusa for dev testing
2. Connect Chrome DevTools and trace the actual Stripe error
3. Add visible error feedback in PaymentButton so failures aren't silent

**Severity:** High — confirmation flow is untestable without working payment  
**Assigned to:** Freya (needs browser session)

---

## FB-24: Home delivery button still says "Place order" (English)

**Observed:** The PaymentButton on the payment step for home delivery orders shows "Place order" instead of "Fullfør bestilling". The booking step correctly shows "Boka montering" via `t.bookMounting`, but the home delivery path has no `buttonLabel` prop.

**File:** `storefront/src/modules/checkout/components/payment/index.tsx:207`

**Fix:** Add `buttonLabel="Fullfør bestilling"` (or `t.finalizeOrder`) to the home delivery `PaymentButton`.

**Severity:** Low — label consistency  
**Assigned to:** Freya

---

## Verification of WO-006-01 Fixes (code review)

| ID | Check | Result |
|----|-------|--------|
| V-01 | Collapsed step summaries show real data | ✅ Code correct — `OrderConfirmedInline` reads shipping method, customer name/email/phone, reg plate, booking time from cart |
| V-02 | Terms checkbox on payment step | ✅ Present — checkbox disables button when unchecked |
| V-03 | "Boka montering" label on booking step | ✅ `buttonLabel={t.bookMounting}` → "Boka montering" |
| V-04 | Shipping collapsed summary | ✅ Shows method name + price |
| V-05 | Address collapsed summary | ✅ Shows name, email, phone |
| V-06 | Payment button labels | ⚠️ Workshop correct ("Velg monteringstid"), home delivery still English (FB-24) |

---

## Summary

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| FB-20 | Scroll snap stickiness | High | Open |
| FB-21 | Too much space above tire list | Medium | Open |
| FB-22 | Language change scrolls away from checkout | Medium | Open |
| FB-23 | Order confirmation never appears | High | Open — needs browser |
| FB-24 | Home delivery button label English | Low | Open |

---

_Feedback round 2 by Freya — Whiteport Design Studio_
