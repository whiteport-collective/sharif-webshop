# Design Log — Sharif Webshop

## 2026-04-19 mimir

- MODEL:Opus — Bygg Avancerat-popover för orders-admin. Filter-option "Avancerat" i filter-dropdownen, popover med raw `<textarea>` för JSON + `Kör`-knapp + step-results-lista (step_index, label, input_count → output_count, samples). Ömsesidig exklusivitet: Avancerat aktivt rensar native chips, välja native chip rensar Avancerat. När agent-chatten returnerar `ui_action: { type: "apply_scripted_selection" }` ska popovern öppnas prefilled med scriptet. Ny backend-endpoint `/admin/agent/chat/v2/run-script` tar `{ script: ScriptedCriterion[] }` och returnerar `{ count, steps, samples }` — ingen LLM-plan, bara kör `runScriptedProbe`-logiken från [v2/route.ts](backend/src/api/admin/agent/chat/v2/route.ts). Validera med `ScriptedCriterionSchema` från [planner.ts](backend/src/lib/admin-agent/planner.ts). Verifiera i browsern: orders-sidan → Avancerat → klistra in `[{"kind":"minimum_total","label":"över 5000","amount":5000}]` → Kör → se 9 träffar.

## 2026-04-19 freya

- MODEL:Sonnet — Skriv WO för agent-assisterat orderflöde. Spec ska täcka: (1) hemsida — sätta 5 sökfält + trigga sökning + scrolla till resultat; (2) resultatsida — hämta produktlista, ge produktinfo, trigga "Gå till kassen"-knapp; (3) kassen — fylla adress, välja leveransmetod, sätta bokningstid; (4) betalning — hands-off, kunden fyller i själv. Basa på befintlig AgentToolHandlers-scaffolding i flow-shell/index.tsx och AgentToolContext. Fil: design-process/E-Development/WO-012-agent-ordering-api.md

## 2026-04-19 freya

- MODEL:Sonnet — Browser-testa hela checkout-flödet end-to-end på localhost: Delivery (Drammen) → Address → Booking (välj tid) → Payment (Stripe test card 4242...) → verifiera OrderConfirmedInline visas, scroll upp blockerat, cart-badge = 0. Testa även non-workshop home-delivery flöde (ska hoppa över booking). Om OK: commit ändringarna i `storefront/src/modules/checkout/components/{checkout-panel-content,booking,payment,addresses}/index.tsx` + `flow-shell/index.tsx` med separata meningsfulla commits, sedan merga `freya/fix-back-to-results` → `main`.

## 2026-04-19 mimir

- MODEL:Opus — Öppna localhost:9000/app, logga in, navigera till Orders-vyn, skriv "Hur många ordrar finns det totalt?" i admin-chatten. Verifiera att svaret är ett riktigt antal (inte failure-text). Testa även "visa ordrar från igår" (ska filtrera listan + narrera), "avbryt order [id]" (ska visa bekräftelsekort). Fixa eventuella fel.

## 2026-04-19 mimir

- MODEL:Opus — Öppna localhost:9000/app, logga in, navigera till Orders-vyn, skriv "Hur många ordrar finns det totalt?" i admin-chatten. Verifiera att svaret är ett riktigt antal (inte failure-text). Testa även "visa ordrar från igår" (ska filtrera listan + narrera), "avbryt order [id]" (ska visa bekräftelsekort). Fixa eventuella fel.

## 2026-04-19 mimir

- MODEL:Opus — Öppna localhost:9000/app, logga in, navigera till Orders-vyn, skriv "Hur många ordrar finns det totalt?" i admin-chatten. Verifiera att svaret är ett riktigt antal (inte failure-text). Testa även "visa ordrar från igår" (ska filtrera listan + narrera), "avbryt order [id]" (ska visa bekräftelsekort). Fixa eventuella fel.

## 2026-04-19 freya

- MODEL:Sonnet — Merga freya/fix-back-to-results till main. Läs sedan WO-011-scroll-back-chip.md i design-process/E-Development/. Implementera ScrollBackChip-komponent i storefront/src/modules/home/components/flow-shell/scroll-back-chip.tsx. Integrera i index.tsx: tracka scrollDirection via lastScrollTop ref på surfaceRef scroll-events, visa chip när canNavigateBack && scrollingUp && !atTop, klick navigerar tillbaka. Befintlig backLocked-logik behålls — chip är additivt lager.

## 2026-04-19 freya

- MODEL:Sonnet — Merga freya/fix-back-to-results till main. Läs sedan WO-011-scroll-back-chip.md i design-process/E-Development/. Implementera ScrollBackChip-komponent i storefront/src/modules/home/components/flow-shell/scroll-back-chip.tsx. Integrera i index.tsx: tracka scrollDirection via lastScrollTop ref på surfaceRef scroll-events, visa chip när canNavigateBack && scrollingUp && !atTop, klick navigerar tillbaka. Befintlig backLocked-logik behålls — chip är additivt lager.

## 2026-04-19 freya

- MODEL:Sonnet — Merga freya/fix-back-to-results till main. Läs sedan WO-011-scroll-back-chip.md i design-process/E-Development/. Implementera ScrollBackChip-komponent i storefront/src/modules/home/components/flow-shell/scroll-back-chip.tsx. Integrera i index.tsx: tracka scrollDirection via lastScrollTop ref på surfaceRef scroll-events, visa chip när canNavigateBack && scrollingUp && !atTop, klick navigerar tillbaka. Befintlig backLocked-logik behålls — chip är additivt lager.

## 2026-04-19 mimir

- MODEL:Opus — Läs backend/src/api/admin/agent/chat/route.ts + backend/src/lib/admin-agent/agent-space.ts + tools.ts. Förstå nuvarande intent-detection-logik. Refaktorera till tvåstegs-flöde: (1) LLM-call för intent + följdfrågor, (2) tool-call med view-manifest för filter/action-komposition. Ta bort hårdkodning mot Sharif/orders — gör det app-agnostiskt. Frontend skickar tool-manifest i varje anrop. Verifiera att "Hur många ordrar finns det totalt?" ger ett riktigt svar.

## 2026-04-19 mimir

- MODEL:Opus — Läs backend/src/api/admin/agent/chat/route.ts + backend/src/lib/admin-agent/agent-space.ts + tools.ts. Förstå nuvarande intent-detection-logik. Refaktorera till tvåstegs-flöde: (1) LLM-call för intent + följdfrågor, (2) tool-call med view-manifest för filter/action-komposition. Ta bort hårdkodning mot Sharif/orders — gör det app-agnostiskt. Frontend skickar tool-manifest i varje anrop. Verifiera att "Hur många ordrar finns det totalt?" ger ett riktigt svar.

## 2026-04-19 mimir

- MODEL:Opus — Läs backend/src/api/admin/agent/chat/route.ts + backend/src/lib/admin-agent/agent-space.ts + tools.ts. Förstå nuvarande intent-detection-logik. Refaktorera till tvåstegs-flöde: (1) LLM-call för intent + följdfrågor, (2) tool-call med view-manifest för filter/action-komposition. Ta bort hårdkodning mot Sharif/orders — gör det app-agnostiskt. Frontend skickar tool-manifest i varje anrop. Verifiera att "Hur många ordrar finns det totalt?" ger ett riktigt svar.

## 2026-04-19 mimir

- MODEL:Opus — Läs backend/src/api/admin/agent/chat/route.ts + backend/src/lib/admin-agent/agent-space.ts + tools.ts. Förstå nuvarande intent-detection-logik. Refaktorera till tvåstegs-flöde: (1) LLM-call för intent + följdfrågor, (2) tool-call med view-manifest för filter/action-komposition. Ta bort hårdkodning mot Sharif/orders — gör det app-agnostiskt. Frontend skickar tool-manifest i varje anrop. Verifiera att "Hur många ordrar finns det totalt?" ger ett riktigt svar.

## 2026-04-19 mimir

- MODEL:Opus — Läs backend/src/api/admin/agent/chat/route.ts + backend/src/lib/admin-agent/agent-space.ts + tools.ts. Förstå nuvarande intent-detection-logik. Refaktorera till tvåstegs-flöde: (1) LLM-call för intent + följdfrågor, (2) tool-call med view-manifest för filter/action-komposition. Ta bort hårdkodning mot Sharif/orders — gör det app-agnostiskt. Frontend skickar tool-manifest i varje anrop. Verifiera att "Hur många ordrar finns det totalt?" ger ett riktigt svar.

## 2026-04-19 mimir

- MODEL:Opus — Läs backend/src/api/admin/agent/chat/route.ts + backend/src/lib/admin-agent/agent-space.ts + tools.ts. Förstå nuvarande intent-detection-logik. Refaktorera till tvåstegs-flöde: (1) LLM-call för intent + följdfrågor, (2) tool-call med view-manifest för filter/action-komposition. Ta bort hårdkodning mot Sharif/orders — gör det app-agnostiskt. Frontend skickar tool-manifest i varje anrop. Verifiera att "Hur många ordrar finns det totalt?" ger ett riktigt svar.

## 2026-04-19 mimir

- MODEL:Opus — Läs backend/src/api/admin/agent/chat/route.ts + backend/src/lib/admin-agent/agent-space.ts + tools.ts. Förstå nuvarande intent-detection-logik. Refaktorera till tvåstegs-flöde: (1) LLM-call för intent + följdfrågor, (2) tool-call med view-manifest för filter/action-komposition. Ta bort hårdkodning mot Sharif/orders — gör det app-agnostiskt. Frontend skickar tool-manifest i varje anrop. Verifiera att "Hur många ordrar finns det totalt?" ger ett riktigt svar.

## 2026-04-19 freya

- MODEL:Opus — Boot: reflektera över din uppstart — hur många tool calls tog det, vad kom från semantic_context vs filläsningar, och notera skillnaden. Implementera sedan SSE streaming i tool-anthropic Supabase edge function så att admin-chatten fungerar via Vertex AI/Gemini. Fil: c:/dev/WDS/design-space/database/supabase/functions/tool-anthropic/index.ts. Uppgift: detektera "stream": true i request body, anropa Vertex streaming endpoint (...generateContent?alt=sse), översätt Gemini SSE-chunks till Anthropic SSE-format (event: content_block_delta / data: {"delta":{"type":"text_delta","text":"..."}}), deploya till project uztngidbpduyodrabokm. Icke-streaming-path lämnas orörd. Verifiera end-to-end i admin-chatten på localhost:9000/app efter deploy.

## 2026-04-19 freya

- MODEL:Opus — Implement SSE streaming in the `tool-anthropic` Supabase edge function so that admin chat works via Vertex AI/Gemini. File: `c:/dev/WDS/design-space/database/supabase/functions/tool-anthropic/index.ts`. Task: detect `"stream": true` in request body → call Vertex streaming endpoint (`...generateContent?alt=sse`) → translate Gemini SSE chunks to Anthropic SSE format (`event: content_block_delta` / `data: {"delta":{"type":"text_delta","text":"..."}}`) → deploy to project `uztngidbpduyodrabokm`. Non-streaming path stays as-is. Verify end-to-end in admin chat at localhost:9000/app after deploy.

## 2026-04-19 freya

- MODEL:Opus — Implement SSE streaming in the `tool-anthropic` Supabase edge function so that admin chat works via Vertex AI/Gemini. File: `c:/dev/WDS/design-space/database/supabase/functions/tool-anthropic/index.ts`. Task: detect `"stream": true` in request body → call Vertex streaming endpoint (`...generateContent?alt=sse`) → translate Gemini SSE chunks to Anthropic SSE format (`event: content_block_delta` / `data: {"delta":{"type":"text_delta","text":"..."}}`) → deploy to project `uztngidbpduyodrabokm`. Non-streaming path stays as-is. Verify end-to-end in admin chat at localhost:9000/app after deploy.

## 2026-04-09 freya

- Fix cart badge not clearing after delete: in `storefront/src/modules/home/components/quantity-shop/index.tsx` `handleRemoveItem`, after `router.refresh()`, force a client-side cart count update or revalidate the cart badge path.

## 2026-04-09 freya

- Test checkout flow end-to-end in browser: select a tire → verify checkout section scrolls correctly (heading visible, no bounce back) → place order → verify confirmation section scrolls into view.

## 2026-04-09 freya

- Fix scroll-back after tire selection: add `backLocked.current = true` + 600ms timeout at the start of `handleSelectTire` in `storefront/src/modules/home/components/flow-shell/index.tsx` — same pattern already used in `openCheckoutPanel`.

## 2026-04-09 freya

- Adjust the support chat column (AgentPanel) — width, header styling, and overall feel on desktop. Start in `storefront/src/modules/home/components/agent-panel/index.tsx`.

## 2026-04-08 freya

- Fix FB-05 first: add `scroll-mt-14` to results and checkout `<section>` elements in `storefront/src/modules/home/components/flow-shell/index.tsx`. Then FB-04: restore `<TireResultsHeader>` as sticky at top of results section and remove the inline sort from the header right zone. Branch: `codex/admin-ai-platform-phase1`.

## 2026-04-08 freya

- Rewrite the FlowShell header dimension area in `storefront/src/modules/home/components/flow-shell/index.tsx:457-515`. Remove all `activeSection`-based conditionals from the dimension chip and action buttons. The header should be one stable bar: logo + dimension chip (when search active) + "Endre" link (always scrolls to search form) + small x icon to clear search. The left icon (hamburger/back) should also not blink — use the back arrow whenever results exist, hamburger only on clean home state (no `searchMeta.dimension`).

## 2026-04-08 freya

- Implement virtual URL routing: add Next.js catch-all route `[countryCode]/[[...search]]/page.tsx`, update FlowShell to call `history.replaceState` with `/no/205-55R16/Sommer` on search, parse URL segments on load to restore search state, and show a dimension chip next to the SHARIF logo in the nav when a search dimension is present in the URL.

## 2026-04-08 freya

- Adjust the home section layout in `storefront/src/modules/home/components/flow-shell/index.tsx:563` so the first `border-t` (trust bar) sits at the viewport fold. The form container uses `min-h-[calc(100vh-3.5rem)]` — find an approach that keeps the form visually centered but leaves ~200px for landing content to peek above the fold. Consider moving the tagline into the form area or using a different centering strategy.

## 2026-04-07 freya

- Open https://localhost:8000/no in Chrome, hard-refresh, and visually verify all scroll/spacing/support-drawer fixes from this session. Then browser-debug why order confirmation doesn't appear after payment.

## 2026-04-07 freya

- Create WO-006-02 feedback file and run a second feedback round focusing on the fixes from this session — verify collapsed step summaries show real data after a completed order, test terms checkbox on payment step, and confirm "Boka montering" button label on booking step.

## 2026-04-07 freya

- Implement the new OrderConfirmedInline component in storefront/src/modules/checkout/components/checkout-panel-content/index.tsx: replace the current simple checkmark+text confirmation with collapsed step summaries showing filled-in data, the rating-to-step-widget flow, and the AI chat textarea that posts to /api/dialog/[id]/message.

## 2026-04-07 mimir

- Run `cd c:/dev/Sharif/sharif-webshop/backend && npx medusa db:migrate` to create sharif_setting + sharif_escalation tables, then boot with `claude --chrome` and execute test checklist from Agent Space message dc25b27e.

## 2026-04-07 freya

- Fix the nav logo display — confirm sharif-logo.png renders correctly at storefront/src/modules/layout/templates/nav/index.tsx using <img src="/sharif-logo.png">. Then source real tire product images: ask Mårten where the actual tire photos are and upload them via Medusa admin at localhost:9000/app.

## 2026-04-07 freya

- Boot in brownfield mode: scan design-process/ against actual storefront + backend code, present gap map of what is specced vs built, then offer to write Work Orders for gaps and hand to Mimir.

## 2026-04-06 freya

- Redraw 03.3 Orders as a list-only wireframe (no detail panel visible — clicking a row navigates to 03.3b). Read `c:/dev/WDS/whiteport-design-studio/src/skills/wireframe/SKILL.md` first. Also update `design-process/C-UX-Scenarios/03-admin-dashboard/03.3-orders/03.3-orders.md`: change "Opens order detail panel (right side)" → "Navigates to order detail page (03.3b)" in the user actions table.

## 2026-04-06 freya

- Draw wireframe 03.1 Login in Excalidraw at `design-process/C-UX-Scenarios/03-admin-dashboard/Sketches/03.1-login.excalidraw` — desktop canvas (1440×900), Sharif logo top-left, email+password form centered, minimal. Present to user for approval before 03.2.

## 2026-04-06 freya

- Codex: implement the agent chat panel — start with `src/app/api/agent/chat/route.ts` per `design-process/C-UX-Scenarios/02-man-purchasing-flow/02-agent-architecture.md`, then tool schemas in `src/lib/agent/tools.ts`, then the streaming hook and browser bridge.

## 2026-04-05 freya

- Test the full checkout flow in browser: search 205/55R16, select a tire, verify checkout panel opens immediately with skeleton (no delay), confirm scroll-up back gesture works from checkout to results, verify scroll-down on results works after coming back from checkout.

Chronological record of what was delivered each session.
Newest entries at top.

---

## 2026-04-05 sharif-dev

- Checkout refactored as a real FlowShell panel — no page navigation, slides up over results
- `CheckoutPanelContent` client component: fetches cart data on mount, manages step state, inline confirmation
- All checkout step components (Shipping, Addresses, Payment, Booking) updated with optional step/onStepChange props
- Server actions added: `setAddressesInPanel`, `placeOrderInPanel`, `saveBookingToCart` (return values, no redirect)
- Booking persisted to cart.metadata → shown on order confirmed page + inline confirmation
- Skeleton loading state for checkout panel
- Scroll-up back gesture lockout (backLocked ref, 600ms, deltaY < -40) applied to all panels
- Cart idempotency check: skips addToCart if variant already in cart
- Spec updated: 01-harriets-tire-purchase.md, 01.4-delivery-and-mounting.md rewritten; 01.5 + 01.6 marked superseded

---

## 2026-04-03 Freya (session 2 — Hydra build)

**Design system**
- New molecule spec: `D-Design-System/molecules/buy-button/buy-button.md` — `mol-buy-button`, three states: idle (red), in-cart (green + trash), unavailable (muted)
- Storyboard PNG added: `molecules/buy-button/Sketches/buy-button-states.png`

**Hydra storefront built (sharif-server-storefront)**
- `tire-card-cta/index.tsx` — buy button with all three states implemented
- `tire-card/index.tsx` — `isInCart` + `onRemoveTire` props wired through
- `quantity-shop/index.tsx` — full 01.4 implementation: shop selector (Fjellhamar / Drammen / Hjemlevering), postal code + shipping zone lookup, live cart summary with line items + remove, sticky "Betal nå — X kr" CTA, Stripe payment session initiation, product detail overlay (iframe)
- `flow-shell/index.tsx` — `handleSelectTire` / `handleRemoveTire`, panel transitions, `pointer-events-none` on off-screen panels
- `tire-results-header/index.tsx` — removed "Bäst performance" sort option
- `search-tires.ts` + `page.tsx` — switched to `cache: "no-store"` so seeded products appear immediately

**Demo data**
- Seeded 6 × 205/55R16 products with varied EU ratings (499–1249 kr) + `tire_type` metadata. 50 units inventory each.

**Known issue**
- "Velg disse" button unresponsive — qty-shop panel never appears. Root cause not identified (browser tools unavailable). MCP fixed with `--isolated` flag for next session.

---

## 2026-04-03 Freya (session 1 — specs)

- Completed 01.6 Book Mounting — post-payment time slot booking confirmation page spec
- Scenario 01 (Harriet's Tire Purchase) now fully complete: 01.1–01.6 all done, quality review passed (7/7 views, 4/4 practices, rated Excellent)

---

## Prior sessions (reconstructed)

- 01.5 Payment — Stripe embedded checkout spec
- 01.4 Quantity & Shop — pick count + mounting location spec
- 01.3 Product Detail — AI story + EU labels in overlay spec
- 01.2 Product Cards — swipeable card browse spec
- 01.1 Dimension Input — tire dimension entry with visual guide spec
- 01 Harriet's Tire Purchase scenario overview — persona, flow, 6 views mapped
- UX Scenarios overview (00-ux-scenarios.md) — scenario set defined: 01 Harriet primary, 02 Ole EV, 03 Harriet Discovery, 04 Moohsen Inventory
