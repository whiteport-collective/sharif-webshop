# WO-013-03 — Codex Fix Task: Demo Bugfixes (Euromaster 2026-05-07)

**Status:** Done — verified 2026-05-05  
**Assigned to:** Codex  
**Branch:** `codex/orders-advanced-filter-optimizations`  
**Source:** WO-013-02-demo-roundup.md (Freya browser test round, 2026-05-05)  
**Deadline:** Before Thursday 2026-05-07 morning

---

## Context

Full manual order flow was tested end-to-end (205/55R16, sommer, 4 stk → Drammen workshop → Manual Payment → Booking → Bekreftet). Order went through. 9 bugs found. Fix the 6 listed below in priority order. After each fix: verify visually in browser at https://localhost:8000. Commit individually.

---

## P0 — Must fix (blocks demo)

### FB-13: Total shows NOK 19,96 instead of NOK 1,996.00 in Bekreft bestilling

**Where:** The "Totalbeløp" field inside the `Bekreft bestilling` step summary box (the left-column card, not the right-column Handlekurv). The right column shows the correct value; only this one component is wrong.

**Root cause:** The value is almost certainly `order.total` or `cart.total` in øre (minor units, e.g. `199600`) being displayed without dividing by 100. The cart summary on the right uses a proper format utility; this component does not.

**Fix:** Find where `Totalbeløp` / order total is rendered in the confirmation step component (likely in `storefront/src/modules/checkout/components/checkout-panel-content/index.tsx` or a sub-component like `BekreftBestilling`/`ConfirmationStep`). Apply the same `formatAmount` / `convertToLocale` / divide-by-100 utility used elsewhere.

---

### FB-09: Cart jump — checkout bounces back to results after "Legg i kassen"

**Behaviour:** Clicking "Legg i kassen" on a product card:
1. Adds item to cart (cart badge updates to 4) ✓  
2. Briefly shows Leveringsmåte step with skeleton loading  
3. Snaps back to the search results section  

Customer must then click "Gå til kassen" to re-enter checkout. This bug has been attempted fixed before (commit `bd793a2 fix: prevent cart jump after add to cart`) but recurs.

**Where to look:**
- `storefront/src/modules/home/components/flow-shell/index.tsx` — FlowShell manages `activeSection` and scroll position. When cart state updates after `addToCart`, something triggers a re-render that resets the active section back to "results".
- The `addToCart` handler (likely in the product card component or a shared hook) — check what state changes it triggers and whether those cascade into a scroll/section reset in FlowShell.
- Look for any `useEffect` that watches cart state or cart count and fires a scroll or section change.

**Key question:** Is there a `useEffect([cartItems])` or `useEffect([cartCount])` in FlowShell that scrolls to results when the count changes? If so, it should NOT fire when we're already navigating to checkout.

**Fix approach:** Add a guard — when `addToCart` is called and we're navigating to the checkout step, the FlowShell should not respond to the subsequent cart state change by scrolling back. A `navigatingToCheckout` ref (set before cart mutation, cleared after checkout step mounts) is the likely fix pattern.

---

## P1 — Should fix (visible to Euromaster audience)

### FB-10: English step headings "Payment" and "Booking"

**Where:** Inside `CheckoutPanelContent`, the `<h2>` heading for the Payment step reads "Payment" and the Booking step reads "Booking". The topbar correctly shows "Betaling" and "Bestill montering".

**Fix:** Change the heading strings to Norwegian:
- "Payment" → "Betaling"  
- "Booking" → "Bestill montering" (or "Verkstedtime" — match the topbar label)

---

### FB-12: Payment completed summary in English + bad placeholder

**Where:** Once the Payment step is completed and collapsed, its summary section shows:
- "Edit" button → **"Endre"**  
- "Payment method" label → **"Betalingsmåte"**  
- "Payment details" label → **"Betalingsdetaljer"**  
- "Another step will appear" → **remove or replace** with "Faktura sendes per e-post" (for Manual Payment) or just hide this sub-row entirely  

**Fix:** Translate the strings in the Payment completed-state summary component.

---

### FB-15: Booking time slot not shown on "Takk for bestillingen!" page

**Where:** The order confirmation page (`Ordrebekreftelse`) shows green-checkmark rows for Leveringsmåte, Kundeopplysninger, and Betaling — but the chosen booking slot ("Onsdag 6. mai, 09:30") is not shown anywhere.

**Fix:** Add a "Bestilt verkstedtime" row to the confirmation summary, showing the booked date + time from the order metadata. The booking data should be available on the completed order object or passed through the confirmation state.

---

### FB-16: Swedish placeholder text in AI chat on confirmation page

**Where:** The post-order "Snakk med vår AI" text area on the confirmation page has placeholder:  
> *"Har du tankar och frågor om din bestilling..."*  

"tankar och frågor" is Swedish.

**Fix:** Change to Norwegian:  
> *"Har du tanker eller spørsmål om bestillingen din?"*

---

## Out of scope for this task (defer)

- FB-08: Duplicate product entry in DB (data, not code)
- FB-11: English cart summary labels (Subtotal/Shipping/Taxes)
- FB-14: Empty Adresse field for workshop delivery

---

## Done criteria

- [x] FB-13 fixed and visually verified: Bekreft bestilling shows NOK 1,996.00
- [x] FB-09 fixed and visually verified: "Legg i kassen" goes straight to Leveringsmåte, no bounce
- [x] FB-10 fixed: Step headings say "Betaling" and "Bestill montering"
- [x] FB-12 fixed: Payment summary in Norwegian, no "Another step will appear"
- [x] FB-15 fixed: Booking slot visible on confirmation ("Onsdag 6. mai, kl. 09:30, Drammen")
- [x] FB-16 fixed: Norwegian placeholder in AI chat
- [ ] All 6 fixes committed on branch `codex/orders-advanced-filter-optimizations` (in working tree, needs commit)
