## Learned

**React onWheel vs addEventListener in CSS-transformed elements**: When a scroll container (`overflow-y-auto`) is nested inside a CSS-transformed element (`transition-transform`), some browsers create a composited layer that delays or drops wheel events for `addEventListener` handlers. Using React's `onWheel` prop bypasses this — it uses React's event delegation off the root and is reliable. Touch events are unaffected; keep those with `addEventListener + passive: true`.

**Trackpad momentum bleed between panels**: When a scroll gesture dismisses a panel (checkout → results), the remaining trackpad momentum immediately fires on the newly revealed panel and triggers its own back gesture. Fix: set `backLocked = true` in the `onBack` callback — same 600ms lockout used elsewhere — before switching view. This is a general pattern for any panel stack built with CSS transforms + scroll gestures.

**Skeleton-first checkout opening**: Don't block panel opening on async cart operations. Open the panel immediately, show the existing skeleton, and use a `cartLoading` prop to hold the inner data fetch until the parent signals the cart op is complete. This avoids both the perceived delay AND the race condition (panel fetching cart before addToCart finishes).

**Booking accordion UX**: Flat day list + separate time grid below is harder to compare. Accordion per day (multiple open simultaneously) lets users scan availability across days before committing. First day auto-opens. Selected time shown inline in the day header row even when collapsed.

## Context

All work is in `c:/dev/Sharif/sharif-server-storefront` (Medusa v2 + Next.js Hydra storefront), not in this repo. Files changed:

- `src/modules/checkout/components/checkout-panel-content/index.tsx`
  - Wheel gesture: switched from `addEventListener` to React `onWheel` prop
  - Touch gesture: kept as `addEventListener` with passive:true
  - Added `cartLoading` prop — delays cart fetch while parent `addToCart` is in flight
  - `goBackRef` pattern so handler always sees current step/orderId without re-registering

- `src/modules/home/components/flow-shell/index.tsx`
  - `cartLoading` state added
  - `handleSelectTire`: panel opens immediately, `addToCart` runs in background
  - `onBack` callback now sets `backLocked = true` for 600ms before `setView("results")`
  - `router.refresh()` after cart op completes (not blocking)
  - Service buttons bumped to `z-[60]`

- `src/modules/checkout/components/booking/index.tsx`
  - Full redesign: accordion days (multiple open), times inline per day, "Vis fler dager" button
  - `expandedDays` Set for multi-open state, first day auto-expanded
  - Selected time shown as `· HH:MM` in day header even when collapsed
  - `visibleDays` state, loads 5 at a time, capped at 30

## Plan

Sharif demo prep: the checkout panel flow (search → results → checkout → booking → confirm) is now functional end-to-end. Open items are visual polish and demo-readiness. The wider plan is a two-scenario demo for Moohsen: Scenario 01 (Harriet tire purchase) + Scenario 04 (Moohsen inventory management).

## Next

Test the full checkout flow in browser: search 205/55R16, select a tire, verify checkout panel opens immediately with skeleton (no delay), confirm scroll-up back gesture works from checkout to results, verify scroll-down on results works after coming back from checkout.

## Spec Sync

`design-process/C-UX-Scenarios/01-harriets-tire-purchase/01.4-delivery-and-mounting/01.4-delivery-and-mounting.md` — Booking step now uses accordion widget (days expandable, times inline). The spec describes the old flat list + separate time grid. Update needed.
