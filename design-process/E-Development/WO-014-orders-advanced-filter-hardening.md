# WO-014 - Orders Advanced Filter Hardening

**Status:** Draft - Ready for review  
**Priority:** High  
**Assigned to:** Codex  
**Review before implementation:** Freya  
**Depends on:** current `orders-advanced-filter` widget, `scripted-probe`, `scripted-order-selection`, existing `selection-store` persistence  
**Relevant areas:**
- `backend/src/admin/widgets/orders-advanced-filter/index.tsx`
- `backend/src/api/admin/agent/chat/v2/run-script/route.ts`
- `backend/src/lib/admin-agent/scripted-probe.ts`
- `backend/src/lib/admin-agent/scripted-order-selection.ts`
- `backend/src/lib/admin-agent/selection-store.ts`
- `backend/src/admin/components/agent-workspace/index.tsx`

---

## Objective

Harden the Sharif Admin "Avancerat filter" solution so it can scale beyond local demo data and behave as a real selection engine, not a URL-borne client trick.

The current solution proves the UX and filtering concept, but it still depends on:

- a client-side fetch interceptor
- full matched order IDs appended into the URL
- store-wide scanning with a hard fetch cap

That combination is acceptable for a small demo dataset.
It is not acceptable as the long-term admin solution.

This WO moves the feature toward:

- server-side materialized selections
- stable selection handles in the URL
- explicit correctness boundaries when scanning truncates
- cleaner separation between preview, apply, and list rendering

---

## Problem Statement

The current advanced filter path works like this:

1. user pastes a scripted criterion array in the modal
2. `/admin/agent/chat/v2/run-script` runs a probe over fetched orders
3. the widget receives `matched_order_ids`
4. the widget writes every matched ID into repeated `id=` query params
5. a fetch interceptor rewrites `/admin/orders` requests so the visible table only loads those IDs

This has two core problems.

### 1. Selection transport is client-borne

The matched result set is serialized into the browser URL as repeated `id` params.

That means:

- URL length scales linearly with hit count
- browser/proxy limits will eventually break it
- list rendering depends on a monkeypatched client fetch
- the selection cannot be treated as a durable backend object

### 2. Scripted probing is still partial on large stores

`fetchAllOrdersDetailed` still stops at a configured cap.

That means:

- probe results can be incomplete for larger stores
- the admin can still apply an incomplete selection as if it were authoritative
- a warning in the modal is not a sufficient correctness guard

The system currently behaves as if "warn and continue" is enough.
For an admin filter that claims to return the matching orders, that is too weak.

---

## Product Outcome

After this WO:

- advanced filter creates or activates a persistent server-side selection
- the orders page URL carries a selection handle, not a raw list of all matched IDs
- the orders table reads through a stable selection view endpoint
- probe and apply are separate operations
- a truncated probe can never be applied silently as a final selection
- native-pushdown criteria run as cheaply as possible before scripted scanning
- the admin keeps the same visible UX:
  - paste script
  - preview result count and steps
  - apply
  - clear

But the execution model becomes materially safer and more scalable.

---

## Core Decisions

### 1. Use `selection_run_id` as the transport handle

The orders URL must carry a durable selection identifier, not the matched IDs themselves.

Example:

```text
/app/orders?advanced_selection=selrun_123
```

The selection object lives in backend persistence and owns:

- title
- summary
- criteria
- steps
- latest visible step
- matched entity IDs for each materialized step

### 2. Split preview from apply

The current `run-script` endpoint is doing preview work.
It should stay a preview tool.

Preview returns:

- count
- steps
- samples
- truncated flag
- total fetched

Apply should be a separate endpoint that:

- validates the preview state or re-executes deterministically
- creates a persistent selection run
- returns `selection_run_id`

### 3. Truncation is a hard correctness boundary

If the scripted path truncates at the fetch cap, the system must not present the result as final truth.

Allowed behaviors:

- block apply and say the result is incomplete
- or route execution into a backend strategy that can complete without truncation

Not allowed:

- "9 matches, apply anyway" when only the first `N` orders were searched

### 4. Prefer native pushdown before scripted matching

The feature must try the cheapest valid execution path first.

Examples of likely pushdown candidates:

- `minimum_total`
- `maximum_total`
- `days_back`
- `date_range`
- parts of `customer_query`
- parts of `location_query`

Only criteria that cannot be expressed with native list filtering should require store-wide scripted scanning.

### 5. Remove the fetch monkeypatch as the steady-state design

The current interceptor is a transitional mechanism.
It should not be the long-term foundation of order list filtering.

Long-term behavior:

- orders list fetches use a proper backend selection view
- frontend invalidates/refetches the list normally
- no global `window.fetch` rewrite is needed

---

## Proposed Architecture

### A. Preview endpoint

Keep a route for script preview.

Example:

```text
POST /admin/agent/chat/v2/run-script
```

Returns:

```json
{
  "stage": "done",
  "count": 9,
  "steps": [],
  "samples": [],
  "script": [],
  "truncated": false,
  "total_fetched": 31
}
```

This endpoint does **not** define the active orders list.

### B. Apply endpoint

Add a new route, for example:

```text
POST /admin/agent/chat/v2/apply-script
```

Input:

- script
- optional title
- optional summary

Result:

```json
{
  "selection_run_id": "selrun_123",
  "count": 9,
  "title": "Orders over 5000 kr",
  "summary": "9 matching orders"
}
```

If preview would be truncated:

```json
{
  "stage": "blocked",
  "error": "Advanced filter cannot be applied because the scripted scan was truncated."
}
```

### C. Orders list URL

Replace:

- repeated `id=` params
- giant `advanced=<base64>`

With:

```text
?advanced_selection=selrun_123
```

Optional additional UI-state params may remain small and human-safe.

### D. Orders selection view

Use the existing selection-view pattern and make the orders table read through it whenever `advanced_selection` is present.

The backend then owns:

- step materialization
- paging
- count
- later refresh/re-execution logic

### E. Pushdown planner

Introduce a planning stage before scripted execution:

1. inspect criteria
2. split into:
   - native-capable
   - scripted-only
3. execute native filters first where possible
4. reduce candidate set
5. only then run scripted matching

This is both a performance optimization and a correctness improvement.

---

## Data Model Direction

The good news is that Sharif Admin already has most of the persistence shape needed through `selection-run` / `selection-step` / `selection-items`.

The advanced filter should reuse that instead of inventing a second transport model.

The only missing product decision is:

- whether the advanced filter preview becomes a first-class `selection_run` immediately on apply
- or whether there is an intermediate preview token

Recommendation:

- preview stays ephemeral
- apply creates a real `selection_run`

That keeps the data model simpler.

---

## Implementation Sequence

### Part 1 - Selection handle transport

- add `advanced_selection` query param support
- update the widget to store only a selection handle in the URL
- remove matched IDs from URL generation
- remove selection payload from `advanced=<base64>` state

**Acceptance criteria**

- applying advanced filter no longer appends raw order IDs to the URL
- clearing advanced filter removes only the small selection handle
- large match sets no longer risk browser URL overflow

### Part 2 - Apply endpoint

- add a dedicated apply route
- create a persistent selection run on apply
- return `selection_run_id`
- wire widget to use it

**Acceptance criteria**

- apply creates a backend selection object
- reopening the orders page with `advanced_selection=...` restores the filtered view
- no fetch monkeypatch is required for the final design path

### Part 3 - Truncation hardening

- block apply when scripted probe is truncated
- return explicit blocking error to modal
- document the failure mode in UI copy

**Acceptance criteria**

- truncated probe cannot be applied as a final order selection
- UI explains that the result is incomplete

### Part 4 - Pushdown planning

- classify criteria into native vs scripted
- execute cheap/native criteria first
- only scan remaining candidates when needed

**Acceptance criteria**

- simple cases do not full-scan the store unnecessarily
- mixed criteria reduce candidate set before scripted matching

### Part 5 - Remove legacy fetch interception

- delete the global orders fetch interceptor from the widget
- rely on selection-view and normal query invalidation

**Acceptance criteria**

- orders advanced filter works with no `window.fetch` monkeypatch
- AI sidebar/modal layering does not need pointer-event hacks for correct apply behavior

---

## Risks

### 1. Hidden coupling to the current orders list fetch pattern

The current widget works because it piggybacks on the existing orders page fetch behavior.
Moving to a selection handle may expose assumptions in Medusa admin list loading.

### 2. Native pushdown can drift from scripted semantics

If a criterion is partly pushed down and partly scripted, semantics must remain consistent.
The planner cannot change what the filter means.

### 3. Apply may need re-execution

If preview and apply are separate, decide whether apply trusts preview output or reruns deterministically.

Recommendation:

- rerun deterministically on apply
- because correctness matters more than avoiding one more execution

---

## Demo Guidance

Until this WO is implemented, the current advanced filter should be treated as:

- acceptable for local/small demo datasets
- not production-grade for large stores

That needs to be stated plainly so nobody mistakes the current URL-borne selection transport for the finished architecture.

---

## Final Recommendation

Do not spend more time polishing the current URL-plus-fetch-interceptor architecture.

It is useful as a prototype because it proved:

- the widget UX
- the scripted preview concept
- the step-by-step explanation model

But the next work should go into:

- persistent server-side selection handles
- correct apply semantics
- pushdown planning
- removal of client transport hacks

That is the shortest path from "works in demo" to "safe to trust in admin."
