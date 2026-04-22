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

### Test-plan — manuell verifisering per skjerm

Gå gjennom skjermene i ordning. Start alltid med tom kurv og fresh state (`localStorage.clear()` + reload) når du begynner om. Noter bugger inline som `BUG:` under aktuell checkbox.

#### Skjerm 1 — Startsida (`/`)

**1.1 Dimensjonsfelt (width / profile / rim)**
- [ ] Width aktiv; profile og rim disabled ved load
- [ ] Skriv `205` i width → profile blir aktiv
- [ ] Skriv `55` i profile → rim blir aktiv
- [ ] Skriv `16` i rim → `R` vises mellom profile og rim
- [ ] Backspace i tom rim → fokus hopper til profile, `R` forsvinner
- [ ] Endre width etter alle fylt → profile + rim tømmes (kaskad)

**1.2 Lim inn dimension**
- [ ] Lim inn `205/55R16` i width → alle tre segment fylles automatisk
- [ ] Lim inn `205 55 16` (mellomrom) → samme resultat

**1.3 Antall + Type dropdowns**
- [ ] Antall default `4 stk`; velg 2 / 6 / 8
- [ ] Type default `Sommerdekk`; velg Vinter / Helår
- [ ] Valgene persisterer når du navigerer tilbake til `/`

**1.4 Populærdekk-hint**
- [ ] Under width vises populære bredder
- [ ] Klikk et forslag → fyller feltet

**1.5 Finn dekk-knappen**
- [ ] Disabled når dimensjon er ufullstendig (eller fokuserer første tomme felt ved klikk)
- [ ] Enabled når 205/55R16 er fylt
- [ ] Klikk → loading state → navigerer til `/dekk/205-55R16-sommer-4`

**1.6 Header**
- [ ] Logo `SHARIF` klikkbar → går tilbake til `/`
- [ ] Hamburger-meny åpner side-meny
- [ ] Språkvelger NO ↔ EN/SE
- [ ] Cart-ikonet viser ingen badge når tom
- [ ] Chat-ikonet åpner assistentpanel fra høyre

**1.7 Landing content**
- [ ] Under search-formen: Kvalitetsdekk / Montering inkludert / Rask levering-kort synlige
- [ ] "60+ merker · Montering inkludert · Fra 499 kr"-teksten synlig

**1.8 Chat fra hjem**
- [ ] Åpne chat → tom state "Hva leter du etter?"
- [ ] Skriv `Jag har en Volvo V70 2015, vilka däck passar?` → agent svarer med dimensjoner
- [ ] Skriv `205/55R16` direkte → agent skal bruke `setSearchField` + `triggerSearch` og navigere til resultat

---

#### Skjerm 2 — Søkeresultater (`/dekk/…`)

**2.1 Produktkort**
- [ ] Alle kort viser bilde, merke, modell, dimensjon, pris per dekk, EU-label (drivstoff / grep / støy)
- [ ] Pris × antall synlig
- [ ] "Legg i kassen"-knapp på hvert kort

**2.2 Sortering**
- [ ] Header-sort-velger: Pris (default), Best samlet, Grep, Støy, Drivstoff, Ytelse
- [ ] Sortering bytter med View Transition-animasjon
- [ ] Sortering vedvarer ved refresh

**2.3 Dimensjons-chip i header**
- [ ] Viser `205/55R16 · Sommer · 4 stk`
- [ ] `X` på chippen nullstiller søket og går til `/`

**2.4 Tilbake-navigasjon**
- [ ] Browser back fra resultat → startsida
- [ ] Scroll-opp-gest fra toppen av resultatlisten → tilbake-chip animerer ned

**2.5 Legg i kassen**
- [ ] Klikk "Legg i kassen" → cart-badge går til 4 (eller valgt antall)
- [ ] Automatisk scrollar ned til kasse-panelet
- [ ] Cart popup viser det valgte dekket

**2.6 Chat fra resultat**
- [ ] `Vilket har lägst brus?` → agent bruker `highlightProducts` (gul ring rundt match) og svarer med modellnavn
- [ ] `Ta den billigaste` → agent velger første etter pris og legger i kassen

---

#### Skjerm 3 — Kasse: Leveringsmåte

**3.1 Alternativer**
- [ ] Drammen — montering inkl. (0 kr) — auto-valgt
- [ ] Fjellhamar — montering inkl. (0 kr)
- [ ] Hjemlevering (699 kr)
- [ ] Prisene oppdaterer cart-total når man bytter

**3.2 Velg + fortsett**
- [ ] Radio kan velges med klikk
- [ ] "Fortsett" går til Kundeopplysninger
- [ ] Browser back fra Kundeopplysninger → tilbake til Leveringsmåte

**3.3 Header-tittel**
- [ ] Headeren viser "Leveringsmåte" mens steget er aktivt
- [ ] Skifter til "Kundeopplysninger" ved neste steg

**3.4 Chat på leveringssteget**
- [ ] `Ta Fjellhamar` → Fjellhamar-radio får amber ring (~1,2 s) + blir valgt
- [ ] `Hjemlevering istället` → Hjemlevering velges, total oppdateres med 699 kr
- [ ] `Vilka alternativ finns?` → agent leser fra `sessionContext.shippingMethods` og lister reelle navn + priser

---

#### Skjerm 4 — Kasse: Kundeopplysninger

**4.1 Felt**
- [ ] Fornavn *, Etternavn *, E-post *, Telefon *, Bilregistreringsnummer *
- [ ] Når "Kundeopplysninger" (workshop): adresse-blokk skjult
- [ ] Når "Leveringsadresse" (hjemlevering): inkluderer adresse, postnummer, by

**4.2 Validering**
- [ ] Tom påkrevd felt + submit → browser-native "Please fill in this field"
- [ ] E-post må ha gyldig format

**4.3 Submit**
- [ ] "Fortsett til betaling" går til Betaling-steget
- [ ] Summering i høyre kolonne oppdateres

**4.4 Chat-prefill**
- [ ] `Jag heter Anna Svensson, anna@test.no, 40123456` → fyller fornavn, etternavn, e-post, telefon med amber-puls pr. felt
- [ ] Ved hjemlevering: `Storgata 1, 0123 Oslo` → fyller address, postnummer, by
- [ ] Bilregistreringsnummer fylles ikke av agenten i dag — manuelt krav

---

#### Skjerm 5 — Kasse: Betaling

**5.1 Betalingsmetoder**
- [ ] Credit card (Stripe Elements) lastes inn
- [ ] Manual Payment (test-only) velgbar

**5.2 Kjøpsvilkår**
- [ ] "Jeg har lest og godkjenner kjøpsvilkårene" må krysses av før bestilling
- [ ] Uten avkryssing: "Gjennomfør betaling" disabled

**5.3 Hjemlevering-flyt**
- [ ] Klikk "Gjennomfør betaling" → Stripe/Manual flow → ordrebekreftelse

**5.4 Workshop-flyt**
- [ ] Etter betaling: stegene går videre til Booking (ikke direkte ordre)

---

#### Skjerm 6 — Kasse: Booking (kun workshop-bestillinger)

**6.1 Layout**
- [ ] Verkstednavn + adresse synlig øverst (Drammen / Fjellhamar)
- [ ] Første dag auto-expandert med 6 tidsruter: 08:00, 09:30, 11:00, 13:00, 14:30, 16:00
- [ ] Øvrige dager kollapsede med chevron-pil

**6.2 Tidsvalg**
- [ ] Klikk på dag-header → expand/collapse toggle
- [ ] Klikk på tidsrute → blir grønn, andre forblir røde
- [ ] "Vis fler dager" legger til 5 dager (maks 30)
- [ ] "Gjennomfør bestilling"-knapp disabled til tid er valgt

**6.3 Helger utelatt**
- [ ] Listen skipper lørdag + søndag

**6.4 Chat på booking-steget**
- [ ] `Velg første ledige tid` → 08:00 første dag får amber ring + blir grønn
- [ ] `Boka kl. 13 i morgon` → dagen expanderes, 13:00 velges
- [ ] `Vilka tider finns?` → agent lister fra `bookingSlots`

---

#### Skjerm 7 — Kasse: Bekreft bestilling (workshop-only)

**7.1 Summering**
- [ ] Leveringsmåte-rad
- [ ] Adresse-rad
- [ ] Monteringstid-rad (dato, klokkeslett, verksted)
- [ ] Totalbeløp fet

**7.2 Bekreft**
- [ ] "Bekreft og betal"-knappen trigger PaymentButton → ordre

---

#### Skjerm 8 — Ordrebekreftelse

**8.1 Collapsed step-summary**
- [ ] Leveringsmåte ✓ med navn + pris
- [ ] Kundeopplysninger ✓ med navn + kontakt + bilregnr (plate-styling)
- [ ] Betaling ✓ "Betaling gjennomført"
- [ ] Monteringstid ✓ (workshop) med dato + tid + verksted

**8.2 Takk + stjerner**
- [ ] "Takk for bestillingen!" med ordrenummer (#XXXX)
- [ ] Stjernerating 1–5; ved klikk kollapses seksjonen etter 1 s
- [ ] Kollapsert visning: ✓ "Takk! ★★★★★ — Ordrenummer #XXXX"

**8.3 Chat etter bestilling**
- [ ] "Skriv din melding…"-input synlig
- [ ] Skriv `När kommer bekräftelsen?` → agent svarer
- [ ] Svar fra `/api/dialog/{orderId}/message`-endpoint

**8.4 Cart-cleanup**
- [ ] Cart-badge går til 0 etter ordre
- [ ] Hjem-ikonet/logoen fortsatt klikkbar

---

#### Tverr-skjerm: Agent-beteende

**X.1 Off-topic scope guard**
- [ ] `Vad är huvudstaden i Frankrike?` → avvises i én setning
- [ ] `Hur lagar man pasta?` → avvises

**X.2 Språkbytte**
- [ ] Bytt til EN i header → chat svarer på engelsk
- [ ] Skriv svensk midt i norsk session → agenten bytter språk

**X.3 Eskalering**
- [ ] `Jag vill snacka med Moohsen` → `escalateToAdmin` trigges

**X.4 Ordrenummer-oppslag**
- [ ] `Jag vill kolla min beställning, e-post är …` → `sendOneTimeCode` trigges

---

### Known issues å notere under testet

- Booking-seksjonen spammer "Maximum update depth exceeded" i konsolen (preexisterende; se `project_open_bugs`).
- Lang chat-historikk → 5–10 s svartid (Gemini-latens, ikke bug).
