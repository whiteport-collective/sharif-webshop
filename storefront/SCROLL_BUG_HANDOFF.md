# Scroll-Up Bug — Investigation Handoff

**Branch:** `codex/orders-advanced-filter-optimizations`  
**Last commit:** `0c13c5f` (stable, prod-tested)  
**Dev server:** needs restart (`npm run dev`) — stale chunk 793 from a failed instrumentation attempt

---

## What we know for certain

### 1. Production does NOT have the bug
Tested on `npm run build && next start -p 8001`. Single click on "Legg i kassen"
navigates directly to the checkout panel. No scroll-to-top. This rules out a logic
bug in the state machine and any issues with the event flow itself.

### 2. The user's key observation (this session)
> "The skeleton loaders are loading fine, but exactly when I expect the page to
> show, the viewport jumps."

This is the root-cause signal. The jump happens at the **skeleton → real card
transition**, not during the cart add operation itself.

### 3. What the skeleton transition means for the scroll engine
`scrollToSection("checkout")` computes the scroll offset using
`getBoundingClientRect()` at call time:

```tsx
// index.tsx ~line 144
const surfaceTop = surface.getBoundingClientRect().top
const targetTop = target.getBoundingClientRect().top
surface.scrollTo({ top: surface.scrollTop + (targetTop - surfaceTop), behavior })
```

If **products are still loading (skeletons showing) when the scroll fires**, the
results section has a DIFFERENT height than it will have once real cards render.
Skeleton cards use `aspect-square` for the image area; real cards may render at a
different height. This height delta shifts the position of the checkout section
AFTER the scroll has already been calculated and executed — causing the visual jump.

### 4. StrictMode adds a secondary layer
In dev mode (React 18 StrictMode), the mount effect at `index.tsx:110` fires twice:

```tsx
useEffect(() => {
  retrieveCartFresh().then((fresh) => {
    const qty = ...
    dispatch({ type: "CART_UPDATED", hasItems: qty > 0 })  // <-- fires TWICE in dev
  })
}, [])
```

If the second fire resolves while `cart: "syncing"` (during handleSelectTire), it
can dispatch `CART_UPDATED { hasItems: false }`, which forces `flow` back to
`"results"` via the state machine. This is dev-only and explains why the bug feels
worse in development than in production.

---

## The two fixes needed

### Fix A — Layout shift guard (primary, applies to prod too)
**Problem:** `scrollToSection("checkout")` fires while products are still loading.
The scroll target moves after the fact.

**Fix:** Delay the checkout scroll until `isLoading === false`, or re-fire the
scroll after `isLoading` transitions. One clean approach:

In the view-change effect (`index.tsx ~line 499`), add a dependency on `isLoading`
and re-scroll when it clears:

```tsx
useEffect(() => {
  if (view !== "checkout" || !showCheckoutSection || isLoading) return
  const frame = requestAnimationFrame(() => scrollToSection("checkout", "auto"))
  return () => cancelAnimationFrame(frame)
}, [view, showCheckoutSection, isLoading, scrollToSection])
```

Or, alternatively, add a one-shot re-scroll inside `handleSelectTire` after the
async block completes (products will have loaded by then).

### Fix B — State machine guard (secondary, dev StrictMode)
**Problem:** `CART_UPDATED { hasItems: false }` resets `flow` to `"results"` even
during an active cart sync.

**File:** `storefront/src/modules/home/components/flow-shell/state.ts`

**Fix:** Guard the flow reset when cart is syncing:

```typescript
case "CART_UPDATED":
  if (!event.hasItems) {
    // Don't reset navigation while cart sync is in progress
    if (state.cart === "syncing") {
      return { ...state, cart: "empty" }
    }
    return {
      ...state,
      cart: "empty",
      flow: state.dimensions === "valid" ? "results" : "default",
      checkout: state.checkoutLocked ? state.checkout : "idle",
      conflict: "none",
    }
  }
  return { ...state, cart: "has_items" }
```

---

## Suggested implementation order

1. **Restart dev server** — `npm run dev` in `storefront/`
2. **Apply Fix B** (5 min, low risk) — state machine guard in `state.ts`
3. **Apply Fix A** (15 min, needs testing) — re-scroll after `isLoading` clears
4. **Test sequence:**
   - Fresh page load at `/no` → search 205/55R16 → wait for skeleton → wait for
     cards to fully render → click "Legg i kassen"
   - Also test: click immediately when skeletons are still showing (should not jump)
   - Verify prod build still works: `npm run build && next start -p 8001`

---

## Files to touch

| File | Change |
|---|---|
| `src/modules/home/components/flow-shell/state.ts` | Fix B: guard in CART_UPDATED |
| `src/modules/home/components/flow-shell/index.tsx` | Fix A: re-scroll on isLoading clear |

---

## Current state of the branch

All prior work from this session is committed at `0c13c5f`:
- EU bar width (h-2.5)
- pinRecommendations flag + sort behavior
- Agent panel cart buttons
- CART_UPDATED hasItems:true guard in handleSelectTire

`git reset --hard 0c13c5f` is the stable rollback point.
