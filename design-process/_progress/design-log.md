# Design Log — Sharif Webshop

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
