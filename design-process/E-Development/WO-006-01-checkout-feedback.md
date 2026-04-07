# WO-006-01 — Checkout & Storefront Feedback

**Status:** Open  
**Reporter:** Marten  
**Date:** 2026-04-07  
**Context:** Full walkthrough of the storefront from home to order confirmation

---

## FB-01: Scrollbar layout shift on "Finn dekk"

**Observed:** When clicking "Finn dekk" to go from the home view to the results grid, a scrollbar appears and pushes the page ~15px to the left (layout jump).

**Root cause:** The scroll surface uses `overflow-y-auto` — scrollbar only appears when content exceeds viewport. Home section fits in viewport (no scrollbar), results section doesn't (scrollbar appears).

**File:** `storefront/src/modules/home/components/flow-shell/index.tsx:552`

**Fix:** Add `scrollbar-gutter: stable` to the scroll surface style. This reserves scrollbar space without showing it, preventing layout shift.

**Severity:** Low — visual polish  
**Assigned to:** Freya (inline fix)

---

## FB-02: Start page needs more content sections

**Observed:** The home page only shows the tire search form and a single line of text ("60+ merker..."). This makes the page feel empty and also contributes to FB-01 (no scrollbar present).

**Requested:** Add realistic landing page sections below the search form — value propositions, brand logos, trust signals, etc. These sections should be **hidden when dimensions are defined** (i.e., when `showResultsSection` is true).

**File:** `storefront/src/app/[countryCode]/(main)/page.tsx:65-69` (current `landingContent`)

**Fix:** Expand `landingContent` with 3-4 marketing sections. They already hide correctly via the `!showResultsSection && landingContent` guard in FlowShell line 580.

**Severity:** Medium — demo readiness  
**Assigned to:** Freya (inline fix)

---

## FB-03: Support drawer pushes nav icons sideways

**Observed:** When opening the support panel (chat icon bottom-right), the nav bar icons in the header slide out with the drawer, causing a visual glitch.

**Root cause:** The support drawer is a fixed sidebar (`fixed right-0`) but the header icons aren't isolated from its layout effect.

**File:** `storefront/src/modules/home/components/flow-shell/index.tsx:728`

**Fix:** Ensure the header icon row has its own stacking context and doesn't shift when the aside slides in. The support chat button should visually highlight (active state) when the drawer is open.

**Severity:** Low — visual polish  
**Assigned to:** Freya

---

## FB-04: "Finn dekk" button should be red

**Observed:** The "Finn dekk" button is dark/black (`bg-ui-fg-base`), while all other action buttons in the checkout flow are red (`bg-red-600`). The primary CTA should be visually consistent.

**File:** `storefront/src/modules/home/components/tire-search/index.tsx:419`

**Fix:** Change `bg-ui-fg-base text-ui-bg-base` to `bg-red-600 text-white hover:bg-red-700`.

**Severity:** Low — visual consistency  
**Assigned to:** Freya (inline fix)

---

## FB-05: Scroll snapping is broken / not smooth

**Observed:** The scroll-snap between home and results sections is not working smoothly. It either doesn't snap or jumps too fast into position. Previous behavior was smooth and sticky — user could not stop halfway between slides.

**Root cause:** Likely a Codex change to the scroll surface or snap properties. The snap classes are present (`snap-y snap-mandatory`, `snap-start`) but the behavior feels off.

**File:** `storefront/src/modules/home/components/flow-shell/index.tsx:550-558`

**Fix:** Investigate what changed. Verify `scroll-snap-type: y mandatory` and `scroll-snap-stop: always` are both active. May need to check if Codex added competing scroll handlers or changed the container sizing.

**Severity:** High — core UX interaction  
**Assigned to:** Freya (investigate + fix)

---

## FB-06: Too much space above tire results list

**Observed:** There is excessive vertical space above the tire grid in the results section, pushing the actual products down.

**File:** `storefront/src/modules/home/components/flow-shell/index.tsx` — results section padding/margin

**Fix:** Reduce top padding on the results section. Currently `pt-14` may be stacking with other spacing.

**Severity:** Low — visual polish  
**Assigned to:** Freya (inline fix)

---

## FB-07: Checkout — completed Leveringsmate step missing values and Edit button

**Observed:** In checkout, when the user completes the delivery step and moves to customer details, the Leveringsmate summary doesn't match the wireframe. The heading should say "Montering" (not "Leveringsmate") when workshop is selected. Edit button styling may be off.

**File:** `storefront/src/modules/checkout/components/shipping/index.tsx`

**Fix:** When `isWorkshop`, the collapsed heading should read "Montering" instead of "Leveringsmate". Verify Edit/Endre button is present and visible.

**Severity:** Medium — checkout UX  
**Assigned to:** Freya

---

## FB-08: Checkout — Kundeopplysninger step shows no values when completed

**Observed:** After filling in customer details and proceeding to payment, the collapsed Kundeopplysninger section shows no customer data (name, email, phone). It should show the filled-in values like the wireframe.

**File:** `storefront/src/modules/checkout/components/addresses/index.tsx`

**Fix:** When step is completed (step past "address"), render customer name, email, phone, and reg.nr in the collapsed summary.

**Severity:** Medium — checkout UX  
**Assigned to:** Freya

---

## FB-09: Stripe warning — "anslutning inte ar saker"

**Observed:** Stripe payment form shows a red warning: "Automatisk ifyllning av betalningsmetoder har inaktiverats eftersom formularets anslutning inte ar saker." Browser autofill is disabled for card details.

**Root cause:** The dev server runs on `http://localhost:8000` — no TLS. Stripe flags the connection as insecure.

**Fix:** Enable HTTPS on the Next.js dev server using `--experimental-https`. This auto-generates a self-signed cert via `mkcert`. Update the `dev` script in `package.json`.

**File:** `storefront/package.json` (dev script)

**Severity:** Medium — blocks realistic payment testing  
**Assigned to:** Freya (inline fix)

---

## FB-10: "Continue to booking" should say "Place order" / "Fullfør bestilling"

**Observed:** The payment step button says "Continue to booking" — it should say "Fullfør bestilling" (Place order) since the user is committing to the purchase at this point. For workshop orders that need a booking step, the button should still say "Fortsett til montering" or similar.

**File:** `storefront/src/modules/checkout/components/payment/index.tsx`

**Fix:** Change button label. For workshop orders: "Velg monteringstid". For home delivery: "Fullfør bestilling" (this IS the final step).

**Severity:** Medium — checkout UX clarity  
**Assigned to:** Freya

---

## FB-11: Missing terms & conditions checkbox on payment step

**Observed:** There is no "Jeg godkjenner kjopsvilkarene" checkbox before placing the order. Norwegian e-commerce law requires explicit acceptance of terms before purchase.

**Fix:** Add a checkbox below the payment method list: "Jeg har lest og godkjenner [kjopsvilkarene]". The Place Order / Continue button should be disabled until checked.

**File:** `storefront/src/modules/checkout/components/payment/index.tsx`

**Severity:** High — legal requirement  
**Assigned to:** Freya

---

## FB-12: Booking step button should say "Boka montering"

**Observed:** The Place Order button on the booking step says "Place order". It should say "Boka montering" — the action is booking a mounting appointment, which also places the order.

**File:** `storefront/src/modules/checkout/components/booking/index.tsx`

**Fix:** Change the button label to "Boka montering" (NO) / "Book fitting" (EN).

**Severity:** Low — label consistency  
**Assigned to:** Freya

---

## FB-13: Checkout steps should not reload the page

**Observed:** Moving between checkout steps (Leveringsmate -> Kundeopplysninger -> Betaling -> Booking) causes what looks like a full page reload — content jumps and flickers instead of transitioning smoothly in place. The user should stay on the same page with only the active step content changing.

**Root cause:** Each step transition likely triggers a `router.refresh()` or re-fetches cart data, causing the entire checkout panel to re-render and scroll position to reset.

**File:** `storefront/src/modules/checkout/components/checkout-panel-content/index.tsx`

**Fix:** Step transitions should be purely client-side state changes (`setStep(next)`). Cart data re-fetch should be minimal and not cause full re-render. Scroll position should stay stable — only the active step section animates open while completed steps collapse smoothly above.

**Severity:** High — core checkout UX  
**Assigned to:** Freya (investigate)

---

## FB-14: Registration plate should be right-aligned per wireframe

**Observed:** The Norwegian registration plate element (blue N strip + reg.nr) in the order confirmation sits left-aligned under the customer details. In the wireframe (01.7b) it is positioned to the right of the customer info.

**File:** `storefront/src/modules/checkout/components/checkout-panel-content/index.tsx` — `CompletedStep` / `RegistrationPlate`

**Fix:** Move the plate to a `flex justify-between` row or float it right within the Kundeopplysninger step summary, matching the wireframe layout.

**Severity:** Low — visual alignment  
**Assigned to:** Freya

---

## FB-15: Rating stars too small

**Observed:** The 5 interactive stars in the confirmation rating section are too small — they should be bigger and take up more visual space to invite interaction.

**File:** `storefront/src/modules/checkout/components/checkout-panel-content/index.tsx` — `StarRating`

**Fix:** Increase star size from `text-2xl` to `text-4xl` or larger. Add more gap between stars (`gap-2` or `gap-3`).

**Severity:** Low — visual polish  
**Assigned to:** Freya

---

## FB-18: Lock scroll-up and hide dimension header on confirmation

**Observed:** After order is placed and confirmation shows, the user can still scroll up and the tire dimension header ("205/55R16 · 4 stk · Sommerdekk") is still visible. Both should be disabled/hidden — the order is terminal, there's nothing to go back to.

**File:** `storefront/src/modules/home/components/flow-shell/index.tsx`

**Fix:** When `onConfirmationReached()` fires:
1. Remove the dimension/search meta text from the header
2. Disable the scroll-up back gesture (already partially handled via `backLocked` ref in CheckoutPanelContent, but FlowShell header needs to respond too)

**Severity:** Medium — post-order UX  
**Assigned to:** Freya

---

## FB-16: Remove "Tilbake til forsiden" button from confirmation

**Observed:** The big red "Tilbake til forsiden" button at the bottom of the order confirmation is too prominent. It draws attention away from the rating and AI chat — which are the actual engagement points. The user can navigate home via the logo or menu.

**File:** `storefront/src/modules/checkout/components/checkout-panel-content/index.tsx` — `OrderConfirmedInline`

**Fix:** Remove the button entirely. Navigation home is available via header.

**Severity:** Low — visual de-clutter  
**Assigned to:** Freya

---

## Summary

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| FB-01 | Scrollbar layout shift | Low | Fixed |
| FB-02 | Empty start page | Medium | Fixed |
| FB-03 | Support drawer pushes icons | Low | Open |
| FB-04 | "Finn dekk" not red | Low | Fixed |
| FB-05 | Scroll snapping broken | High | Open |
| FB-06 | Too much space above tire list | Low | Open |
| FB-07 | Leveringsmate heading + values | Medium | Fixed |
| FB-08 | Kundeopplysninger no values | Medium | Fixed |
| FB-09 | Stripe insecure connection warning | Medium | Fixed |
| FB-10 | Button label "Continue to booking" | Medium | Fixed |
| FB-11 | Missing terms checkbox | High | Fixed |
| FB-12 | Booking button: "Boka montering" | Low | Fixed |
| FB-13 | Checkout page reloads between steps | High | Fixed |
| FB-14 | Reg plate alignment (right) | Low | Fixed |
| FB-15 | Rating stars too small | Low | Fixed |
| FB-16 | Remove "Tilbake til forsiden" button | Low | Fixed |
| FB-17 | Attach file button not wired up | Low | Deferred — AI impl WO |
| FB-18 | Lock scroll-up + hide dimension header on confirmation | Medium | Open |
| FB-19 | "Finn dekk" should never be disabled — focus first empty field | Medium | Fixed |

---

_Feedback collected by Freya — Whiteport Design Studio_
