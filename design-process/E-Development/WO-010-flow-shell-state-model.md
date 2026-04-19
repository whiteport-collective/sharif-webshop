# WO-010 - Flow Shell State Model And Navigation Guards

**Status:** Draft - Ready for review  
**Priority:** Critical  
**Assigned to:** Codex  
**Review before implementation:** Freya  
**Depends on:** `WO-006-01-checkout-feedback.md`, `WO-006-02-checkout-feedback-round2.md`, current storefront FlowShell implementation  
**Relevant areas:**
- `storefront/src/modules/home/components/flow-shell`
- `storefront/src/modules/checkout/components`
- cart, checkout, booking, assistant/chat overlay behavior

---

## Objective

Refactor the storefront flow shell to use explicit application states, guarded transitions, and derived scenes.

The immediate goal is to remove unstable behavior such as:

- unexpected scroll jumps
- inconsistent back/forward behavior
- cart state and UI state drifting apart
- checkout steps being accessible or editable at the wrong time
- AI/assistant behavior not matching the current user situation

This is not a cosmetic refactor.
It is a control-model refactor so the UI has one clear source of truth.

---

## Problem Statement

The current flow behaves like a state machine, but the state is spread across several independent flags and side effects:

- current view
- selected tire
- cart contents
- checkout step
- booking expansion and selection
- browser history
- scroll synchronization
- assistant open/closed state

Because these are not modeled explicitly, the app can enter invalid or ambiguous combinations.

Observed symptoms:

- entering checkout scrolls inconsistently
- removing cart items can cause scroll jumps
- back navigation after payment is not clearly guarded
- button labels and CTA targets can become inconsistent
- UI can briefly show one stage and then snap back to another

---

## Product Outcome

After this WO:

- the storefront has a canonical app state model
- forward and backward navigation are separate events
- scroll behavior is an effect of allowed state transitions, not a navigation source on its own
- checkout and booking steps are guarded by payment and completion status
- cart, dimensions, checkout, booking, and assistant overlay are modeled explicitly
- components consume narrow derived selectors instead of ad hoc raw flags
- AI/assistant behavior can be mapped to deterministic user scenes

---

## Core Decisions

### 1. Canonical state first

We define one canonical `AppState` for the flow shell and derive all user-facing behavior from it.

### 1b. `flow` owns section visibility, `checkout` owns step progress

`flow` must describe which main section is currently active.
It must not also try to describe detailed checkout completion.

`checkout` owns internal step progress for the checkout area.

This avoids overlap between:

- visible section
- completion state
- editability

### 2. Forward and backward navigation are different events

`NAV_FORWARD` and `NAV_BACK` are not symmetric.
They must be modeled separately and guarded separately.

### 3. Scroll is an effect, not the source of truth

Scrolling may follow a valid transition, but scroll position itself must not decide the logical app state.

### 4. Assistant state is orthogonal

The assistant being open or closed is a separate overlay state.
It must not be mixed into checkout progression logic.

### 5. Components do not inspect the full matrix directly

Components should consume derived selectors or scene props, not raw global flags.

### 6. Paid states block backward editing

After payment is authorized or captured, backward navigation into editable checkout states must be explicitly blocked or redirected to a safe read-only state.

### 7. Dimension changes do not clear cart automatically

If the user changes or removes dimensions while the cart already contains items:

- keep the cart contents
- do not clear the cart automatically
- allow the user to continue because they may be buying tires for more than one car
- surface the mismatch explicitly through a conflict state and inline warning

---

## State Model

### Canonical domains

At minimum the storefront state model must include:

- `flow`
- `dimensions`
- `cart`
- `checkout`
- `payment`
- `booking`
- `assistant`

### Proposed canonical values

#### `flow`

- `default`
- `results`
- `checkout`
- `booking`
- `complete`

#### `dimensions`

- `empty`
- `partial`
- `valid`
- `invalid`

#### `cart`

- `empty`
- `has_items`
- `syncing`
- `error`

#### `checkout`

- `idle`
- `cart_review`
- `editing_address`
- `address_complete`
- `editing_payment`
- `payment_complete`

#### `payment`

- `idle`
- `pending`
- `authorized`
- `captured`
- `failed`

#### `booking`

- `idle`
- `day_expanded`
- `slot_selected`
- `confirmed`

#### `assistant`

- `closed`
- `open`

---

## Derived Scenes

The app should derive scenes from canonical state instead of hardcoding behavior per component.

Example scene set:

- `default_no_dimensions`
- `browsing`
- `ready_to_checkout`
- `cart_with_mounting`
- `address_entry_active`
- `payment_entry_active`
- `awaiting_booking`
- `booking_ready_to_confirm`
- `complete`
- `dimension_conflict`
- `cart_empty_after_removal`
- `returning_from_mini_cart`
- `assistant_open_on_results`
- `assistant_open_on_checkout`

These scene names are product-facing logic units.
They should drive:

- CTA copy
- visibility
- scroll targets
- allowed transitions
- assistant prompt/response profile

---

## Required Events

At minimum define explicit events for:

### Search and results

- `DIMENSIONS_UPDATED`
- `DIMENSIONS_CLEARED`
- `SEARCH_SUBMITTED`
- `RESULTS_LOADED`
- `RESULTS_EMPTY`

### Cart

- `CART_ITEM_ADDED`
- `CART_ITEM_REMOVED`
- `CART_EMPTIED`
- `MOUNTING_ADDED`
- `MOUNTING_REMOVED`
- `CART_SYNC_STARTED`
- `CART_SYNC_FAILED`

### Navigation

- `NAV_FORWARD`
- `NAV_BACK`
- `NAV_TO_RESULTS`
- `NAV_TO_CART`
- `NAV_TO_ADDRESS`
- `NAV_TO_PAYMENT`
- `NAV_TO_BOOKING`
- `NAV_TO_COMPLETE`

### Checkout

- `ADDRESS_COMPLETED`
- `PAYMENT_STARTED`
- `PAYMENT_AUTHORIZED`
- `PAYMENT_CAPTURED`
- `PAYMENT_FAILED`

### Booking

- `BOOKING_DAY_EXPANDED`
- `BOOKING_DAY_COLLAPSED`
- `BOOKING_MORE_DAYS_SHOWN`
- `BOOKING_SLOT_SELECTED`
- `BOOKING_CONFIRMED`

### Assistant

- `ASSISTANT_OPENED`
- `ASSISTANT_CLOSED`

---

## Navigation Guards

Guards must be explicit and testable.

### Required rules

- `NAV_BACK` from `booking` to editable payment is blocked when payment is already `authorized` or `captured`
- `NAV_BACK` from `complete` to editable checkout is blocked
- `NAV_FORWARD` to `payment` is blocked if address is incomplete
- `NAV_FORWARD` to `booking` is blocked if payment is not `authorized` or `captured`
- removing dimensions while cart has items must produce an explicit conflict state, not an implicit UI guess
- removing the final cart item while dimensions still exist must return the user to product results
- removing dimension choices must return the user to the start page and hide product results
- after payment is completed, upward scroll and backward navigation must be blocked so only booking remains active

### Conflict handling

The following condition must be explicit:

- `dimension_conflict`

System behavior in this case is defined, not inferred:

- keep cart and warn
- do not clear cart automatically
- show an inline warning in the header
- offer:
  - `Start new search`
  - `Cancel`

Purpose:

- the user may be shopping for more than one car
- the app must preserve intent while making the conflict visible

### Cart removal behavior

If the user removes products from the cart but still has active dimension choices:

- keep the dimension choices
- return the user to the product list
- do not keep checkout active

### Dimension removal behavior

If the user removes the dimension choices themselves:

- return the user to the start page
- keep the start page content visible
- hide the product list

### Post-payment navigation behavior

If the user has completed payment:

- upward scroll is no longer allowed as backward navigation
- backward navigation into editable checkout states is no longer allowed
- booking remains the only active remaining step

### Post-booking completion behavior

After booking is confirmed:

- transition to a separate `complete` flow state
- do not reuse the booking view as the final state
- the `complete` view contains:
  - confirmation content
  - rating input
  - AI chat field for review, questions, or customer service
- backward navigation into booking or editable checkout remains blocked
- the user can no longer go back into checkout at all
- any later change request must be initiated through the chat, not by reopening checkout UI

---

## Scroll Rules

Scroll behavior must be owned by the state model.

### Required rules

- entering checkout-related states scrolls to the correct target for that state
- entering booking scrolls so the booking CTA is clearly visible
- expanding booking days or showing more days scrolls again if needed to keep the booking CTA visible
- removing items from cart must not cause unrelated stage jumps
- scroll back must not act as a proxy for illegal backward navigation

### Implementation rule

Scroll actions must be triggered from allowed transitions or scene effects.
They must not directly infer the logical state of the flow.

---

## Assistant Mapping

Assistant behavior should be mapped to derived scenes, not raw component conditions.

Examples:

- on `browsing`, help compare products
- on `ready_to_checkout`, push toward checkout
- on `awaiting_booking`, explain booking as next step
- on `dimension_conflict`, explain the conflict clearly

This WO does not require a full AI behavior rewrite.
It requires the state model needed to support it cleanly.

---

## Implementation Plan

### Part 1 - State Inventory

Document all current FlowShell states and side effects that influence:

- section visibility
- cart rendering
- checkout progression
- booking rendering
- assistant visibility
- history
- scroll

**Acceptance criteria**

- every existing flow-affecting flag is mapped
- invalid combinations are identified
- all current scroll triggers are listed

### Part 2 - Canonical AppState

Create a canonical state model and reducer or state machine for FlowShell.

**Acceptance criteria**

- one source of truth exists for flow progression
- forward/back transitions are explicit
- payment and booking guards are explicit

### Part 3 - Derived Selectors And Scenes

Create derived selectors and scene helpers.

**Acceptance criteria**

- components no longer need broad knowledge of raw state
- CTA labels, visibility, and assistant context can be derived from selectors
- conflict states are modeled explicitly

### Part 4 - Scroll And History Refactor

Move scroll and history behavior behind state transitions.

**Acceptance criteria**

- scroll is triggered by transitions, not parallel heuristics
- checkout and booking transitions are stable
- back behavior respects payment/booking guards

### Part 5 - Component Adoption

Update FlowShell components to consume selectors and events instead of ad hoc local branching.

**Acceptance criteria**

- tire list CTA reflects state consistently
- cart and mini-cart transitions are consistent
- checkout stages do not snap unpredictably
- booking CTA visibility is stable

---

## Non-Goals

- full visual redesign
- replacing all storefront state with a global framework-wide store
- rewriting assistant behavior in the same pass
- changing business logic unrelated to flow state

---

## Review Gate For Freya

Before implementation starts, Freya should review:

1. the proposed canonical state domains
2. the event list
3. the transition guards
4. the derived scene approach
5. whether any product-facing state names need adjustment before code

Freya should specifically check that:

- the model is readable enough for future UI work
- the state naming matches intended UX language
- no hidden visual behavior still depends on raw DOM position or scroll heuristics

Freya review incorporated:

- `flow` now owns visible section only
- `checkout` owns internal step progression
- technical scene names were replaced with more UX-facing names
- cart is preserved during dimension conflict

---

## Final Acceptance

This WO is complete when:

- FlowShell has an explicit state model
- checkout progression is guard-driven
- backward navigation after payment is blocked correctly
- cart and dimension conflicts are explicit
- scroll behavior is a transition effect rather than implicit logic
- the known class of scroll-jump/state-drift bugs is materially reduced
