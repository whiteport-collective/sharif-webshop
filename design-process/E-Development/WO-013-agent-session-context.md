# WO-013 - Rich SessionContext For Agent Read Visibility

**Status:** Draft - Revised after Codex review  
**Priority:** High (demo-blocker - agent is blind during checkout)  
**Assigned to:** Mimir  
**Reviewed by:** Codex  
**Depends on:** `WO-012-agent-ordering-api.md`, current `SessionContext` in `flow-shell/types.ts`, current `FlowShell` state model from `WO-010-flow-shell-state-model.md`  

**Relevant areas:**
- `storefront/src/modules/home/components/flow-shell/types.ts`
- `storefront/src/modules/home/components/flow-shell/index.tsx`
- `storefront/src/modules/home/components/tire-search/index.tsx`
- `storefront/src/modules/home/components/agent-panel/useStreamingChat.ts`
- `storefront/src/app/api/agent/chat/route.ts`
- `storefront/src/modules/checkout/components/checkout-panel-content/index.tsx`
- `storefront/src/modules/checkout/components/addresses/index.tsx`
- `storefront/src/modules/checkout/components/shipping-address/index.tsx`
- `storefront/src/modules/checkout/components/booking/index.tsx`

---

## Objective

Make the agent aware of the browser state at the **start of each request** so read operations can return real data without a browser round-trip.

The current `sessionContext` is too thin. The server knows almost nothing about the live checkout state, so read-style tools such as `getCheckoutState` return fabricated `{ ok: true }` results instead of real state.

This work order expands `sessionContext` and moves **read visibility** to the client snapshot. It does **not** solve truthful same-turn post-mutation acknowledgements for write tools.

---

## Review Outcome

Codex review conclusion:

- The direction is correct.
- `TireSearch` can expose a live form snapshot with low risk.
- `CheckoutPanelContent` cannot expose the full proposed checkout snapshot "as-is" because address draft state and booking selection are owned by child components today.
- The proposed machine step `"shipping"` conflicts with the current FlowShell and WO-010 state model. Shipping choice happens inside the `delivery` step.
- A rich `sessionContext` can make read tools truthful, but it cannot make write-tool results truthful in the same request unless a separate browser acknowledgment path is added later.

This revised WO reflects those constraints.

---

## Problem Statement

### What the agent receives today

```ts
type SessionContext = {
  cartItems: { productId: string; qty: number }[]
  countryCode: string
  dimension: string | null
  qty: number
  scene?: FlowShellScene
  season: string
  step: string | null
  view: "home" | "results" | "checkout"
  visibleProductIds: string[]
}
```

### What is missing

**Search / results**
- Current search form field values before submit
- Whether the user has already submitted a search
- Selected product separate from cart
- Active sort

**Cart**
- Product title / brand
- Unit price and total

**Checkout**
- Machine-readable step
- Delivery type (`workshop` vs `home`)
- Available shipping methods
- Cart-confirmed selected shipping method
- Address draft completeness
- Booking slots shown in the UI
- Selected booking slot

### Current server limitation

The server receives `sessionContext` once per `/api/agent/chat` request. It does **not** receive updated browser state after a UI tool is dispatched during that same request.

That means:

- `getCheckoutState` can become truthful from snapshot data.
- `advanceCheckoutStep`, `prefillCheckoutField`, `navigateBack`, and `selectTireForCheckout` still cannot report authoritative post-action state in the same turn unless a separate acknowledgment design is added later.

---

## Product Outcome

After this WO:

- The agent knows the relevant browser state at request start.
- `getCheckoutState` is answered from `sessionContext`, not by fire-and-forget browser dispatch.
- The agent can see current search input, current checkout step, current delivery mode, shipping choices, and booking choices before replying.
- `agentFormState` is seeded from the user-visible search form rather than reset from `dimension/qty/season` only.
- Step naming stays aligned with the current FlowShell / WO-010 model.

This WO does **not** promise truthful post-mutation tool results for write tools in the same request.

---

## Core Decisions

### 1. SessionContext is a pre-turn snapshot

`sessionContext` is serialized by the client into every POST. It represents browser state **before** Claude starts the next turn.

It is authoritative for read visibility at request start, but not for post-tool state after browser mutations inside that same request.

### 2. Keep machine step names aligned to the current UI

Use the real current checkout step names:

- `delivery`
- `address`
- `payment`
- `booking`
- `confirmation`

Do **not** introduce a separate `shipping` step. Shipping method selection belongs to the `delivery` step in the current implementation.

### 3. TireSearch owns search form snapshot

`TireSearch` already owns `width`, `profile`, `rim`, `quantity`, and `season` in local state. It should expose a `getFormSnapshot()` API.

### 4. Checkout snapshot is composite, not parent-only

`CheckoutPanelContent` can provide some snapshot fields directly:

- current step
- delivery type
- shipping methods
- cart-confirmed selected shipping method
- cart total

But it cannot currently read:

- draft address fill state
- booking slot list and selection

Those must be passed up from child components (`Addresses` / `ShippingAddress`, `Booking`) via callback or local ref plumbing.

### 5. `getCheckoutState` becomes server-side

`route.ts` should answer `getCheckoutState` from `sessionContext` directly. This is the main value of the richer snapshot.

### 6. Write-tool truthfulness stays out of scope

Do not claim this WO fixes truthful `{ ok, reason, nextStep }` responses for write tools. That requires either:

- a browser-to-server acknowledgment channel, or
- explicit local simulation rules per tool.

Neither is included here.

---

## New SessionContext Shape

```ts
type SessionContext = {
  view: "home" | "results" | "checkout"
  countryCode: string
  scene?: FlowShellScene

  searchForm: {
    width: string | null
    profile: string | null
    rim: string | null
    qty: number | null
    season: string | null
    submitted: boolean
  }

  dimension: string | null
  visibleProductIds: string[]
  selectedProductId: string | null
  activeSort: string | null

  cart: {
    productId: string
    productTitle: string
    brand: string
    price: number
    qty: number
    total: number
  } | null

  checkoutStep: "delivery" | "address" | "payment" | "booking" | "confirmation" | null
  deliveryType: "workshop" | "home" | null
  address: {
    filledFields: string[]
    requiredMissingFields: string[]
    isComplete: boolean
  } | null
  shippingMethods: { id: string; name: string; price: number }[]
  selectedShippingMethodId: string | null
  bookingSlots: { id: string; label: string }[]
  selectedBookingSlotId: string | null
}
```

Notes:

- `selectedShippingMethodId` should prefer cart-confirmed state, not only optimistic local selection.
- `bookingSlots[].id` can be a synthetic stable id such as `${date}|${time}` if no backend id exists.
- `address.isComplete` should mean "required visible fields are filled", not full backend validation.

---

## Implementation Plan

### Part 1 - Extend TireSearch with `getFormSnapshot()`

**File:** `storefront/src/modules/home/components/tire-search/index.tsx`

Add a small API exposed to `FlowShell`:

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

Implementation notes:

- `width/profile/rim` come from existing local state.
- `qty` comes from `quantity`.
- `submitted` is new local state.
- Flip `submitted` to `true` on successful search submit.
- Reset it to `false` on `clearSearch` / reset callback.

**Acceptance**

- If the user manually types `205` and `55`, the snapshot reflects those values before the agent triggers search.
- `submitted` is `false` before first search and resets when the form is cleared.

---

### Part 2 - Add checkout snapshot plumbing

**Files:**
- `storefront/src/modules/checkout/components/checkout-panel-content/index.tsx`
- `storefront/src/modules/checkout/components/addresses/index.tsx`
- `storefront/src/modules/checkout/components/shipping-address/index.tsx`
- `storefront/src/modules/checkout/components/booking/index.tsx`

Extend `AgentCheckoutAPI`:

```ts
type AgentCheckoutAPI = {
  advanceStep: () => { ok: boolean; step?: string; reason?: string }
  getState: () => { ok: boolean; step: string; availableShippingMethods: ...; cartTotal: number | null }
  prefillField: (field: string, value: string) => { ok: boolean; reason?: string }
  getSnapshot: () => CheckoutSnapshot
}

type CheckoutSnapshot = {
  step: "delivery" | "address" | "payment" | "booking" | "confirmation"
  deliveryType: "workshop" | "home" | null
  address: {
    filledFields: string[]
    requiredMissingFields: string[]
    isComplete: boolean
  } | null
  shippingMethods: { id: string; name: string; price: number }[]
  selectedShippingMethodId: string | null
  bookingSlots: { id: string; label: string }[]
  selectedBookingSlotId: string | null
}
```

Implementation notes:

- `step`, `deliveryType`, and `shippingMethods` are available in `CheckoutPanelContent`.
- `selectedShippingMethodId` should use cart-confirmed state when possible:
  `data?.cart.shipping_methods?.at(-1)?.shipping_option_id ?? null`
- `Addresses` / `ShippingAddress` should report a lightweight draft snapshot upward.
- `Booking` should report generated slot list and current selected slot upward.
- `CheckoutPanelContent` composes those child snapshots into `getSnapshot()`.

Do **not** read address completeness from DOM queries in the parent if child-state plumbing is available. The source of truth should stay close to the child state that already owns the inputs.

**Acceptance**

- `getSnapshot()` returns real `shippingMethods` and the cart-confirmed selected shipping method.
- While the user types in address inputs, `address.filledFields` changes in the next request snapshot.
- On booking step, the snapshot includes visible slots and the selected slot.

---

### Part 3 - Expand `FlowShell.getSessionContext()`

**File:** `storefront/src/modules/home/components/flow-shell/index.tsx`

Replace the current thin context builder with a richer one that reads from:

- `tireSearchRef.current?.getFormSnapshot()`
- `agentCheckoutRef.current?.getSnapshot()`
- `selectedTire`
- `products`
- `activeSort`
- existing `activeSection`, `countryCode`, `scene`

Implementation notes:

- Add a `tireSearchRef` registration path similar to `agentCheckoutRef`.
- Keep `checkoutStep` null outside checkout view.
- Keep `selectedProductId` separate from cart.
- `cart` should be derived from `selectedTire`.

**Acceptance**

- Logged request payload for `/api/agent/chat` shows the richer shape populated across home, results, and checkout flows.

---

### Part 4 - Move `getCheckoutState` server-side

**File:** `storefront/src/app/api/agent/chat/route.ts`

Change behavior:

- Remove `getCheckoutState` from the fire-and-forget UI tool set.
- Intercept it on the server and answer from `sessionContext`.

Example:

```ts
if (toolUse.name === "getCheckoutState") {
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

The browser may still receive a tool-call event for UI display if desired, but the authoritative `tool_result` must come from the request snapshot.

**Acceptance**

- During delivery step, asking "which delivery options do I have?" returns real shipping methods.
- During booking step, asking "which times are available?" returns the visible slot list from snapshot data.

---

### Part 5 - Seed `agentFormState` from `searchForm`

**File:** `storefront/src/app/api/agent/chat/route.ts`

Replace the current request-start seeding logic so the server reads the user-visible search form first:

```ts
const agentFormState: AgentFormState = {
  width: sessionContext?.searchForm?.width ?? initW,
  profile: sessionContext?.searchForm?.profile ?? initP,
  rim: sessionContext?.searchForm?.rim ?? initR,
  qty: sessionContext?.searchForm?.qty ? String(sessionContext.searchForm.qty) : null,
  season: sessionContext?.searchForm?.season ?? null,
}
```

**Acceptance**

- If the user has already typed width manually, the agent does not ask for width again unless it is actually missing.

---

### Part 6 - Update shared types and prompt

**Files:**
- `storefront/src/modules/home/components/flow-shell/types.ts`
- `storefront/src/modules/home/components/agent-panel/useStreamingChat.ts`
- `storefront/src/lib/agent/system-prompt.ts`

Update the shared `SessionContext` type to the richer shape and ensure the prompt clearly surfaces:

- current view
- search form state
- cart summary
- current checkout step
- delivery type

**Acceptance**

- `buildSystemPrompt()` includes cart and checkout context when present.

---

## Out of Scope

- Truthful same-turn post-mutation tool results for write tools
- Browser-to-server acknowledgment channel
- Reworking checkout validation rules beyond exposing draft completeness
- Reworking booking slot generation or persistence
- State-machine changes already covered by WO-010

---

## Test Plan

### Snapshot completeness

1. Open localhost:3001 and inspect POSTs to `/api/agent/chat`.
2. Verify request `sessionContext` across states:
   - Home: `searchForm` reflects typed values before submit
   - Results: `selectedProductId`, `activeSort`, and `cart` are populated when relevant
   - Delivery: `checkoutStep === "delivery"` and `shippingMethods` contains real options
   - Address: `address.filledFields` updates as the user types
   - Booking: `bookingSlots` and `selectedBookingSlotId` reflect visible selection

### Server-side read tool

1. Go to delivery step.
2. Ask the agent for available delivery options.
3. Verify the reply uses real method names from `getCheckoutState`.

### Search form sync

1. Type `205` in width before chatting.
2. Ask the agent to complete the rest of the search.
3. Verify the agent treats width as already present.

### Scope guard

1. Ask the agent to advance checkout with missing required address fields.
2. Verify the system does **not** claim this WO guarantees truthful post-mutation state in the same request.

---

## Final Acceptance

This WO is complete when:

- The richer `sessionContext` is sent on every chat request.
- `getCheckoutState` is answered from `sessionContext`.
- The agent can read real search, cart, delivery, address-completeness, and booking snapshot data at request start.
- Step naming remains aligned with the current FlowShell / WO-010 model.
- The work order text no longer claims richer snapshot data solves same-turn write-tool acknowledgments.

---

## Follow-up: Agent Write Access to Checkout (2026-04-22)

Added on top of the original WO-013 to close the write side — `prefillCheckoutField` now covers `shipping_method_id` and `booking_slot_id` in addition to address fields, and the system prompt authorizes the agent to use them mid-checkout.

Commits on `main`:
- `38cf786` — Shipping component exposes ref-based agent setter; `prefillCheckoutField` routes `shipping_method_id`.
- `4ee42e9` — Booking component same pattern for `booking_slot_id` (auto-expands day, grows visibleDays if needed).
- `51c7104` — System prompt authorizes `prefillCheckoutField` for shipping/booking when the customer is in checkout.

### Test list — manuell verifisering

Gå gjennom listan i ordning. Start med en tom handlekurv og gå till `http://localhost:3001/`. Öppna chatten via ikonen uppe till höger.

**1. Shipping method via chat**
- [ ] Sök 205/55R16, lägg första däcket i kassen.
- [ ] På leveringssteget: skriv "Ta Fjellhamar" (eller "hemleverans") i chatten.
- [ ] Radio-knappen ska få amber ring-puls ~1,2 s och bli vald.
- [ ] Pris/cart-total uppdateras om du väljer hemleverans (699 kr).

**2. Booking slot via chat**
- [ ] Fortsätt till Kundeopplysninger, fyll i alla fält inkl. bilregistreringsnummer.
- [ ] Gå till Booking-steget (eller tryck Edit på Booking om det redan är kompletterat).
- [ ] Skriv "Välg första lediga tid" i chatten.
- [ ] Första tidsrutan (t.ex. 08:00) ska få amber ring-puls och bli grön.
- [ ] Agenten ska kort bekräfta vilket datum/tid den valde.

**3. Agenten väljer specifik tid**
- [ ] På booking-steget: skriv "Boka kl. 13 i morgon".
- [ ] Dagen expanderas automatiskt om den var kollapsad; 13:00 blir vald med amber puls.

**4. Agenten avböjer off-topic**
- [ ] Skriv "vad är huvudstaden i Frankrike?" under kassan.
- [ ] Agenten ska avböja i en mening och erbjuda hjälp med bestillningen — inte försöka svara.

**5. Address prefill fortsätter fungera (regression)**
- [ ] Börja om med ny kurv.
- [ ] På Kundeopplysninger: skriv "Jag heter Anna Svensson, anna@test.no, 40123456, Storgata 1, 0123 Oslo".
- [ ] Agenten fyller i alla fält; varje fält får amber puls vid fyllning.

### Known issues att notera under testet

- Booking-sektionen spammar "Maximum update depth exceeded" i konsolen (preexisterande; se `project_open_bugs`).
- Om chatten har långt historik kan svaret ta 5–10 s — detta är Gemini-latens, inte en bugg.
