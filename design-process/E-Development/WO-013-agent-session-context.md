# WO-013 — Fat SessionContext (Agent State Visibility)

**Status:** Draft — Ready for Codex review
**Priority:** High (demo-blocker — agent is blind during checkout)
**Assigned to:** Mimir
**Review before implementation:** Codex
**Depends on:** `WO-012-agent-ordering-api.md`, current `SessionContext` in `flow-shell/types.ts`
**Relevant areas:**
- `storefront/src/modules/home/components/flow-shell/types.ts` (SessionContext type)
- `storefront/src/modules/home/components/flow-shell/index.tsx` (getSessionContext)
- `storefront/src/modules/home/components/agent-panel/useStreamingChat.ts` (sends context)
- `storefront/src/app/api/agent/chat/route.ts` (reads context, dispatches tools)
- `storefront/src/modules/checkout/components/checkout-panel-content/index.tsx` (source of checkout state)
- `storefront/src/modules/home/components/tire-search/` (source of search form state)

---

## Objective

Make the agent fully aware of what is happening in the browser at every step of the order flow — without adding a round-trip between server and browser.

The agent currently receives a thin `sessionContext` snapshot. Most checkout state (selected shipping method, booking slots, address fill status, delivery type) is invisible to it. UI tools that should return real data return a fabricated `{ ok: true }` because the server has no way to query the browser mid-turn.

The fix: expand `sessionContext` so the client serializes its complete state into every request. The server is then authoritative before calling Claude — no browser queries needed mid-turn.

---

## Problem Statement

### What the agent receives today

```ts
type SessionContext = {
  view: "home" | "results" | "checkout"
  countryCode: string
  dimension: string | null
  qty: number
  season: string
  scene?: FlowShellScene
  step: string | null           // localized display title, e.g. "Adresse"
  visibleProductIds: string[]
  cartItems: { productId: string; qty: number }[]
}
```

### What is missing — by flow step

**Global:**
- Cart total (price) — agent cannot quote the order sum
- Selected product title + brand — agent has `productId`, not the name
- `step` is a localized display string, not a machine key — unreliable for routing logic

**Home:**
- Current search form values (width/profile/rim/qty/season) — server-side `agentFormState` resets every request; values typed by the user are not reflected
- Whether a search has been submitted

**Results:**
- Which product is highlighted/selected (separate from cart)
- Active sort order
- Whether last search returned zero results

**Checkout: Delivery:**
- Delivery type selected (`workshop` vs `home`) — determines whether booking step exists

**Checkout: Address:**
- Which fields are filled
- Whether the form is currently valid (safe to advance)

**Checkout: Shipping:**
- Available shipping methods (id, name, price) — currently fire-and-forget from `getCheckoutState`
- Selected shipping method id

**Checkout: Booking:**
- Available booking slots (id, label) — fetched independently by the Booking component
- Selected booking slot id

### The fabricated `{ ok: true }` problem

UI tools in `route.ts` are dispatched via fire-and-forget SSE. The server sends `tool_call` to the browser and immediately returns `{ ok: true }` as the `tool_result` to Claude — without receiving anything back from the browser.

Affected tools:
| Tool | Should return | Actually returns |
|---|---|---|
| `selectTireForCheckout` | `{ ok, cartTotal, productTitle }` | `{ ok: true }` |
| `advanceCheckoutStep` | `{ ok, step }` | `{ ok: true }` |
| `getCheckoutState` | real step + methods + slots | `{ ok: true }` |
| `prefillCheckoutField` | `{ ok, reason }` on failure | `{ ok: true }` always |
| `navigateBack` | `{ ok, from, to }` | `{ ok: true }` |

With a fat `sessionContext`, the server can answer `getCheckoutState` entirely from the incoming request — no browser query needed. Mutation tools (`prefillCheckoutField`, `advanceCheckoutStep`) still need a `{ ok, reason }` return, but the server can read pre- and post-state from context rather than waiting for browser confirmation.

---

## Product Outcome

After this WO:

- The agent knows the complete state of the browser at the start of every turn.
- `getCheckoutState` is answered from `sessionContext`, not dispatched to the browser.
- The agent can quote cart total, product name, current step, available shipping methods, and available booking slots from the first message in a turn — no extra tool call needed.
- Fabricated `{ ok: true }` responses are eliminated for read tools.
- `step` is a reliable machine key throughout route.ts.

---

## Core Decisions

### 1. Client owns state, agent owns reasoning

`sessionContext` is a client-side snapshot serialized into every POST. The client has all the truth (React state, refs, Medusa cart data). The server never queries the browser during a turn. This is stateless and requires no sessionId or server-side store.

### 2. Checkout state is provided by CheckoutPanelContent via callback

`CheckoutPanelContent` already exposes `AgentCheckoutAPI` via `onRegisterAgentCheckout`. Extend this to also expose a `getSnapshot()` method that `FlowShell` calls when building `sessionContext`.

Same pattern for `TireSearch` — it already has refs for field values; expose `getFormSnapshot()`.

### 3. `step` becomes a machine key

`checkoutStepTitle` (localized display string) stays for UI. A new `checkoutStep` machine key (`"delivery" | "address" | "shipping" | "booking" | "payment" | "confirmation"`) is added to `sessionContext`. Route.ts uses the machine key for all routing logic.

### 4. Booking slots come from CheckoutPanelContent snapshot

The Booking component fetches slots internally. `CheckoutPanelContent` passes them up via snapshot. This avoids prop-drilling — the checkout ref already sits at FlowShell level.

### 5. `getCheckoutState` becomes a server-side read

Route.ts handles `getCheckoutState` by reading `sessionContext` directly — same as it reads `sessionContext.dimension` for `triggerSearch`. The tool is no longer dispatched to the browser. The tool definition and `UI_TOOL_NAMES` set are updated accordingly.

---

## New SessionContext Shape

```ts
type SessionContext = {
  // Existing
  view: "home" | "results" | "checkout"
  countryCode: string
  scene?: FlowShellScene

  // Search form — replaces agentFormState server-side reset
  searchForm: {
    width: string | null
    profile: string | null
    rim: string | null
    qty: number | null
    season: string | null
    submitted: boolean        // has triggerSearch been run?
  }

  // Results
  dimension: string | null    // formatted "205/55R16" or null
  visibleProductIds: string[]
  selectedProductId: string | null   // highlighted, may differ from cart
  activeSort: string | null

  // Cart
  cart: {
    productId: string
    productTitle: string
    brand: string
    price: number             // unit price
    qty: number
    total: number             // price × qty
  } | null

  // Checkout
  checkoutStep: "delivery" | "address" | "shipping" | "booking" | "payment" | "confirmation" | null
  deliveryType: "workshop" | "home" | null
  address: {
    filledFields: string[]    // field names that have non-empty values
    isValid: boolean          // form passes validation
  } | null
  shippingMethods: { id: string; name: string; price: number }[]
  selectedShippingMethodId: string | null
  bookingSlots: { id: string; label: string }[]
  selectedBookingSlotId: string | null
}
```

---

## Implementation Plan

### Part 1 — Extend AgentCheckoutAPI with snapshot

**File:** `storefront/src/modules/checkout/components/checkout-panel-content/index.tsx`

Add `getSnapshot()` to `AgentCheckoutAPI`:

```ts
type AgentCheckoutAPI = {
  advanceStep: () => { ok: boolean; step?: string; reason?: string }
  getState: () => { ok: boolean; step: string; ... }   // keep for backward compat
  prefillField: (field: string, value: string) => { ok: boolean; reason?: string }
  getSnapshot: () => CheckoutSnapshot   // NEW
}

type CheckoutSnapshot = {
  step: "delivery" | "address" | "shipping" | "booking" | "payment" | "confirmation"
  deliveryType: "workshop" | "home" | null
  address: { filledFields: string[]; isValid: boolean } | null
  shippingMethods: { id: string; name: string; price: number }[]
  selectedShippingMethodId: string | null
  bookingSlots: { id: string; label: string }[]
  selectedBookingSlotId: string | null
}
```

`getSnapshot` reads from current component state synchronously. It is called by FlowShell when building `getSessionContext()` — not by the agent directly.

**Acceptance:** `agentCheckoutRef.current?.getSnapshot()` returns full checkout state including booking slots when on booking step.

---

### Part 2 — Extend TireSearch with form snapshot

**File:** `storefront/src/modules/home/components/tire-search/` (index or form component)

Add `getFormSnapshot()` via ref:

```ts
type TireSearchAPI = {
  getFormSnapshot: () => {
    width: string | null
    profile: string | null
    rim: string | null
    qty: number | null
    season: string | null
    submitted: boolean
  }
}
```

`submitted` flips to `true` after the first successful `triggerSearch` and resets on `onClearSearch`.

FlowShell registers the ref via `onRegisterTireSearch={(api) => { tireSearchRef.current = api }}`.

**Acceptance:** after user fills width and profile manually, `getSessionContext().searchForm` reflects those values before agent calls `triggerSearch`.

---

### Part 3 — Expand getSessionContext in FlowShell

**File:** `storefront/src/modules/home/components/flow-shell/index.tsx`

Replace current thin `getSessionContext` with the full shape. Pull from:
- `agentCheckoutRef.current?.getSnapshot()` for checkout state
- `tireSearchRef.current?.getFormSnapshot()` for search form state
- `selectedTire` for cart (productTitle comes from `selectedTire.product.title`)
- `products`, `activeSort` for results state
- existing `activeSection`, `countryCode`, `scene`

```ts
const getSessionContext = useCallback((): SessionContext => {
  const checkout = agentCheckoutRef.current?.getSnapshot() ?? null
  const form = tireSearchRef.current?.getFormSnapshot() ?? null

  return {
    view: activeSection,
    countryCode,
    scene,
    searchForm: form ?? { width: null, profile: null, rim: null, qty: null, season: null, submitted: false },
    dimension: searchMeta.dimension || null,
    visibleProductIds: products.map((p) => p.id ?? ""),
    selectedProductId: selectedTire?.product.id ?? null,
    activeSort: activeSort ?? null,
    cart: selectedTire ? {
      productId: selectedTire.product.id ?? "",
      productTitle: selectedTire.product.title ?? "",
      brand: (selectedTire.product as any).brand ?? "",
      price: selectedTire.unitPrice ?? 0,
      qty: selectedTire.initialQty,
      total: (selectedTire.unitPrice ?? 0) * selectedTire.initialQty,
    } : null,
    checkoutStep: checkout?.step ?? null,
    deliveryType: checkout?.deliveryType ?? null,
    address: checkout?.address ?? null,
    shippingMethods: checkout?.shippingMethods ?? [],
    selectedShippingMethodId: checkout?.selectedShippingMethodId ?? null,
    bookingSlots: checkout?.bookingSlots ?? [],
    selectedBookingSlotId: checkout?.selectedBookingSlotId ?? null,
  }
}, [activeSection, activeSort, countryCode, products, scene, searchMeta.dimension, selectedTire])
```

**Acceptance:** log `sessionContext` on every chat send — all fields populated correctly for each view/step combination.

---

### Part 4 — Move getCheckoutState server-side in route.ts

**File:** `storefront/src/app/api/agent/chat/route.ts`

Remove `getCheckoutState` from `UI_TOOL_NAMES`. Handle it explicitly:

```ts
} else if (toolUse.name === "getCheckoutState") {
  toolResults.push({
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: JSON.stringify({
      ok: true,
      step: sessionContext?.checkoutStep ?? null,
      deliveryType: sessionContext?.deliveryType ?? null,
      address: sessionContext?.address ?? null,
      shippingMethods: sessionContext?.shippingMethods ?? [],
      selectedShippingMethodId: sessionContext?.selectedShippingMethodId ?? null,
      bookingSlots: sessionContext?.bookingSlots ?? [],
      selectedBookingSlotId: sessionContext?.selectedBookingSlotId ?? null,
      cart: sessionContext?.cart ?? null,
    }),
  })
}
```

The browser still receives the `tool_call` event (so the agent panel can show "Sjekker bestillingstilstand") — but the `tool_result` is now real data from context, not fabricated.

**Acceptance:** ask agent "hva er status i kassen?" during shipping step — `tool_result` includes real `shippingMethods` list.

---

### Part 5 — Update SessionContext type and useStreamingChat

**Files:**
- `storefront/src/modules/home/components/flow-shell/types.ts` — replace `SessionContext` with new shape
- `storefront/src/modules/home/components/agent-panel/useStreamingChat.ts` — ensure full context is included in POST body (it already forwards the ref value — no change needed if `getSessionContext` is updated)
- `storefront/src/lib/agent/system-prompt.ts` — update `buildSystemPrompt` to surface key fields in the system prompt clearly (cart total, step, delivery type)

**Acceptance:** `buildSystemPrompt` output includes cart summary and current step when relevant.

---

### Part 6 — Sync agentFormState with sessionContext.searchForm

**File:** `storefront/src/app/api/agent/chat/route.ts`

Today, `agentFormState` is initialized from `sessionContext.dimension` + `qty` + `season` at request start. After this WO, initialize from the richer `sessionContext.searchForm`:

```ts
const agentFormState: AgentFormState = {
  width: sessionContext?.searchForm?.width ?? initW,
  profile: sessionContext?.searchForm?.profile ?? initP,
  rim: sessionContext?.searchForm?.rim ?? initR,
  qty: sessionContext?.searchForm?.qty ? String(sessionContext.searchForm.qty) : null,
  season: sessionContext?.searchForm?.season ?? null,
}
```

This means fields the *user* typed manually are visible to the agent before it calls `setSearchField`. The agent won't ask for `width` if the user already filled it.

**Acceptance:** user types "205" in width field, opens chat, says "sett resten". Agent's first `triggerSearch` attempt reports `width` already set, only asks for missing fields.

---

## Out of Scope

- StateEvent / grá status-rader (WO-012 Part 4b) — separate concern
- Headless drive mode (WO-012 Part 5) — separate WO
- Hands-off payment gate (WO-012 Part 4) — unblocked by this WO but not included here
- Booking slot fetching logic — this WO assumes `CheckoutPanelContent` already has slots in state; it reads them, does not change how they are fetched

---

## Test Plan

**Snapshot completeness:**
1. Open localhost:3001. Open DevTools, intercept POST to `/api/agent/chat`.
2. At each step, verify `sessionContext` in request body matches browser state:
   - Home: `searchForm` reflects typed values
   - Results: `cart` includes productTitle, `visibleProductIds` populated
   - Checkout address: `checkoutStep === "address"`, `address.filledFields` updates as user types
   - Checkout shipping: `shippingMethods` lists real options, `selectedShippingMethodId` updates on click
   - Checkout booking: `bookingSlots` lists real slots, `selectedBookingSlotId` updates on selection

**getCheckoutState server-side:**
1. Navigate to shipping step.
2. Ask agent: "hvilke leveringsalternativer har jeg?"
3. Verify: agent lists real shipping methods by name — not a generic answer.

**Form sync:**
1. Type `205` in width field manually.
2. Open agent, say "finn 205/55R16 sommerdekk".
3. Agent should set profile/rim/qty/season only — not re-set width.

**No fabricated ok: true:**
1. At address step, ask agent to advance to shipping before filling required fields.
2. Agent should report `{ ok: false, reason: "..." }` from `advanceCheckoutStep` — not silently succeed.
