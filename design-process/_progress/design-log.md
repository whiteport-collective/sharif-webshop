# Design Log — Sharif Webshop

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
