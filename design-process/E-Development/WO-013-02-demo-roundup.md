# WO-013-02 — Demo Roundup (Euromaster, 2026-05-07)

**Status:** In progress
**Reporter:** Freya (browser-driven via chrome-devtools)
**Date started:** 2026-05-05
**Branch:** `codex/orders-advanced-filter-optimizations`
**Scope:** Basic order flow only (manual, no AI). 8 skjermar, ~80 sjekkpunkter.

---

## Setup

- Storefront: https://localhost:8000 (Next.js 15.3.9 with experimental-https self-signed cert)
- Backend: http://localhost:9000 (Medusa develop, ready in 66s)
- Demo path: 205/55R16, sommer, 4 stk → workshop delivery → manual payment → booking

---

## Findings

### FB-08 — Duplicate product in results (data quality)
**Screen:** Søkeresultater  
**Severity:** Low (cosmetic / data)  
**Description:** POWERTRAC ADAMAS H/P 205/55R16 91V appears twice in the results grid. The two entries differ in capitalisation ("ADAMAS H/P" vs "Adamas H/P") and EU drivstoff rating (D vs C). Same price (499 kr). Likely two separate database entries for the same product.  
**Fix:** Deduplicate in Medusa admin — delete or merge the duplicate product variant.

---

### FB-09 — Cart jump after "Legg i kassen" (recurrence of FB-06)
**Screen:** Søkeresultater → Leveringsmåte  
**Severity:** High (flow blocker for first-time users)  
**Description:** Clicking "Legg i kassen" on a tire card briefly opens the checkout panel (Leveringsmåte skeleton visible, cart badge updates to 4), then the view snaps back to the search results page. The item IS correctly added to cart (card shows "Gå til kassen" + trash icon after the jump), but the customer must click a second time to proceed.  
**Workaround:** Click "Gå til kassen" on the product card.  
**Fix:** Investigate `addToCart` action — likely a state update triggers a re-render that scrolls/navigates back to the results section before the checkout panel finishes mounting.

---

### FB-10 — English step headings: "Payment" and "Booking"
**Screen:** Betaling step, Booking step (panel content headings)  
**Severity:** Medium (localisation — visible to demo audience)  
**Description:** The `<h2>` headings inside the checkout panel content show "Payment" and "Booking" in English. The header bar (topbar) correctly shows "Betaling" and "Bestill montering". The mismatch is jarring — the same step has two different names depending on where you look.  
**Fix:** Replace the hardcoded English strings in `CheckoutPanelContent` step headings with Norwegian: "Betaling" and "Bestill montering" (or "Verkstedtime").

---

### FB-11 — English cart summary labels
**Screen:** All checkout steps (right column)  
**Severity:** Low (localisation)  
**Description:** The Handlekurv summary panel shows: "Subtotal (excl. shipping and taxes)", "Shipping", "Taxes" in English. Should be Norwegian: "Subtotal (eks. frakt og avgifter)" / "Delsum", "Frakt", "MVA".  
**Fix:** Translate the label strings in the cart summary component.

---

### FB-12 — Payment completed summary entirely in English
**Screen:** Booking step and Bekreft bestilling (completed Payment section)  
**Severity:** Medium (localisation + confusing placeholder)  
**Description:** Once Payment is completed, the summary shows:
- "Edit" button → should be "Endre"
- "Payment method" → should be "Betalingsmåte"
- "Manual Payment" (product name — OK to keep)
- "Payment details" → should be "Betalingsdetaljer"
- "Another step will appear" → cryptic placeholder, should be removed or replaced with something meaningful for Manual Payment (e.g. "Faktura sendes per e-post")  
**Fix:** Translate labels in the Payment completed-step summary component. Replace "Another step will appear" with appropriate Manual Payment copy.

---

### FB-13 — CRITICAL: Wrong total in Bekreft bestilling (÷100 formatting bug)
**Screen:** Bekreft bestilling  
**Severity:** Critical (shows wrong price before customer confirms order)  
**Description:** The "Totalbeløp" field in the Bekreft bestilling summary box shows **NOK 19,96** instead of **NOK 1,996.00**. The cart summary on the right correctly shows NOK 1,996.00. The ÷100 pattern strongly suggests the total is being passed in øre (minor units) and displayed without conversion to kroner.  
**Fix:** Find where `order.total` (or equivalent) is rendered in `ConfirmationStep` / `BekreftBestilling` component. Ensure the value is divided by 100 (or use the same formatting utility used by the cart summary). This **must** be fixed before the Thursday demo.

---

### FB-14 — Empty "Adresse" field for workshop delivery in confirmation
**Screen:** Bekreft bestilling  
**Severity:** Low (cosmetic)  
**Description:** The Bekreft bestilling summary box shows an "Adresse" label with no value below it. For workshop (Drammen) delivery there is no customer shipping address — the field should either be hidden when empty, or replaced with the workshop address ("Tordenskiolds gate 73, 3044 Drammen").  
**Fix:** Conditionally hide the Adresse row when shipping method is workshop pickup, or populate it with the workshop address.

---

### FB-15 — Booking time slot missing from order confirmation summary
**Screen:** Ordrebekreftelse ("Takk for bestillingen!")  
**Severity:** Medium (customer doesn't see their booked time in confirmation)  
**Description:** The order confirmation page shows green checkmarks for Leveringsmåte, Kundeopplysninger, and Betaling — but the selected booking slot ("Onsdag 6. mai, 09:30") is not displayed anywhere on the confirmation screen.  
**Fix:** Add a "Bestilt tid" / "Verkstedtime" row to the confirmation summary, showing the booked date and time.

---

### FB-16 — Swedish text in AI chat placeholder on confirmation page
**Screen:** Ordrebekreftelse  
**Severity:** Medium (wrong language — visible to every customer after order)  
**Description:** The "Snakk med vår AI" text area placeholder reads: *"Har du tankar och frågor om din bestilling..."* — this is Swedish ("tankar och frågor"), not Norwegian ("tanker og spørsmål").  
**Fix:** Change placeholder to Norwegian: *"Har du tanker eller spørsmål om bestillingen din?"*

---

## Summary table

| ID | Screen | Severity | Description |
|----|--------|----------|-------------|
| FB-08 | Søkeresultater | Low | Duplicate POWERTRAC ADAMAS H/P product |
| FB-09 | Results → Checkout | **High** | Cart jump — checkout bounces back to results |
| FB-10 | Betaling / Booking panels | Medium | English headings "Payment" / "Booking" |
| FB-11 | All checkout (right col) | Low | English cart summary labels |
| FB-12 | Booking / Bekreft | Medium | English Payment summary + bad placeholder |
| FB-13 | Bekreft bestilling | **Critical** | Total shows NOK 19,96 instead of 1,996.00 |
| FB-14 | Bekreft bestilling | Low | Empty Adresse field for workshop delivery |
| FB-15 | Ordrebekreftelse | Medium | Booking slot missing from confirmation |
| FB-16 | Ordrebekreftelse | Medium | Swedish placeholder text in AI chat |

**Must fix before Thursday:** FB-09, FB-13  
**Should fix before Thursday:** FB-10, FB-12, FB-15, FB-16  
**Can defer:** FB-08, FB-11, FB-14

---

## Act 2 — AI flow findings (2026-05-05)

Second test round: open-ended tire elicitation via chat panel.

### FB-17 — Agent skips year/trim before asking for dimension
**Screen:** Chat panel (home)  
**Severity:** Medium  
**Description:** When customer says "Volkswagen Golf", agent immediately asks for tire dimension without first asking year/trim. A 2019 Golf 1.5 TSI takes 205/55R16 as standard — a knowledgeable advisor would suggest this. Better flow: ask year + trim first, then propose the factory dimension for confirmation, or offer reg.nr lookup.  
**Fix:** Expand elicitation prompt to use car model + year knowledge before asking for dimension. Add "or tell me your registration number and I'll look it up" as fallback.

---

### FB-18 — Agent refuses to infer dimension from known car spec
**Screen:** Chat panel  
**Severity:** Medium  
**Description:** When told "2019 Golf 1.5 TSI", agent says "kan ikke gjette dekkdimensjonen basert på bilmodell og årgang alene". This is incorrect — the agent has training data that knows 205/55R16 is standard for that car. For the demo this is a visible weakness.  
**Fix:** Agent should use LLM knowledge to propose the most common factory dimension for a given model/year/trim, and ask for confirmation rather than refusing.

---

### FB-19 — Agent shows results without a specific recommendation
**Screen:** Results + chat panel  
**Severity:** Low (nice to have for demo)  
**Description:** After triggering search ("Jeg har nå søkt... Jeg fant 9 forskjellige dekk. Viser deg resultatene nå."), agent doesn't highlight any specific tire. For a customer who said "city driving + longer summer trips", Nokian Wetproof (B wet grip, 72dB) or Bridgestone Turanza T005 would be the natural recommendation.  
**Fix:** After search completes, agent should highlight 1-2 tires matching the expressed driving profile using `highlightProducts` tool.

---

### FB-20 — Stale cart state bleeds between test runs
**Screen:** Results  
**Severity:** Low (test environment issue)  
**Description:** Previous test run left ADAMAS H/P in cart, so the first product card shows "Gå til kassen" instead of "Legg i kassen". For a live demo with a fresh customer this is misleading.  
**Fix:** Add a cart reset / demo reset option, or ensure each demo starts with a fresh cart. Could be a URL param `?reset=1` that clears the cart on load.

---

## Updated summary table

| ID | Screen | Severity | Description | Status |
|----|--------|----------|-------------|--------|
| FB-08 | Søkeresultater | Low | Duplicate POWERTRAC ADAMAS H/P | Deferred |
| FB-09 | Results → Checkout | **High** | Cart jump — checkout bounces | ✅ Fixed |
| FB-10 | Betaling / Booking panels | Medium | English headings | ✅ Fixed |
| FB-11 | All checkout (right col) | Low | English cart summary labels | Deferred |
| FB-12 | Booking / Bekreft | Medium | English Payment summary | ✅ Fixed |
| FB-13 | Bekreft bestilling | **Critical** | Total NOK 19,96 instead of 1,996 | ✅ Fixed |
| FB-14 | Bekreft bestilling | Low | Empty Adresse for workshop | Deferred |
| FB-15 | Ordrebekreftelse | Medium | Booking slot missing | ✅ Fixed |
| FB-16 | Ordrebekreftelse | Medium | Swedish chat placeholder | ✅ Fixed |
| FB-17 | Chat — home | Medium | Agent skips year/trim question | Open |
| FB-18 | Chat — home | Medium | Agent refuses dimension inference | Open |
| FB-19 | Results + chat | Low | No product recommendation after search | Open |
| FB-20 | Results | Low | Stale cart in new customer flow | Open |

**Must fix before Thursday:** All P0 done ✅  
**Should fix before Thursday:** FB-10/12/15/16 done ✅  
**New AI items (post-demo):** FB-17, FB-18, FB-19  
**Can defer:** FB-08, FB-11, FB-14, FB-20
