# WO-007 — FlowShell Header Refactor

**Status:** Ready
**Assigned:** Freya (spec) → Mimir (build)
**File:** `storefront/src/modules/home/components/flow-shell/index.tsx`
**Branch:** `codex/admin-ai-platform-phase1` (partial refactor in ec8837b — needs verification)

---

## Problem

1. **Header instability** — dimension chip actions swapped based on `activeSection` scroll state, causing flicker at section boundaries. Center title overlapped chip on mobile.
2. **Duplicate support surfaces** — a phone button opens a thin support aside with a phone number, while a separate floating chat bubble (bottom-right) opens the real agent chat panel. Two entry points doing almost the same thing.

---

## Scope

### In scope
- Refactor header into stable three-zone layout
- Merge support button + agent chat into one button/panel
- Remove floating chat bubble from bottom-right corner
- Remove old support `<aside>` panel

### Out of scope
- Agent chat panel internals (message rendering, streaming, input)
- Search form behavior
- Checkout panel content

---

## State variables that affect the header

| Variable | Type | Source |
|----------|------|--------|
| `activeSection` | `"home" \| "results" \| "checkout"` | Scroll observer on surface element |
| `searchMeta.dimension` | `string` | Set by `runSearch()` on form submit |
| `products` | `StoreProduct[]` | Set when search API returns |
| `isLoading` | `boolean` | True during search fetch |
| `hideBack` | `boolean` | Set true on checkout confirmation |
| `checkoutStepTitle` | `string` | Reported by `CheckoutPanelContent` |
| `menuOpen` | `boolean` | Hamburger side-menu state |
| `chatOpen` | `boolean` | Agent chat panel (replaces `supportOpen`) |
| `langMenuOpen` | `boolean` | Language picker dropdown |
| `lang` | `"no" \| "en"` | Active language |

---

## Complete header state matrix

### Derived flags

```
hasSearch    = searchMeta.dimension !== "" && products.length > 0
inCheckout   = activeSection === "checkout"
hasStepTitle = inCheckout && checkoutStepTitle !== ""
isConfirmed  = hideBack === true
```

### States

| # | Flow state | hasSearch | Left icon | Center zone | Right zone |
|---|-----------|-----------|-----------|-------------|------------|
| 1 | Landing (fresh) | false | Hamburger ☰ | (empty) | Chat · Lang · Cart |
| 2 | Loading (search in progress) | false | Hamburger ☰ | (empty) | Chat · Lang · Cart |
| 3 | Home with results loaded | true | Hamburger ☰ | Dimension chip | Chat · Lang · Cart |
| 4 | Results (scrolled down) | true | Back ↑ | Dimension chip | Chat · Lang · Cart |
| 5 | Checkout (step active) | true | Back ↑ | Step title | Chat · Lang · Cart |
| 6 | Checkout (no step title yet) | true | Back ↑ | Dimension chip | Chat · Lang · Cart |
| 7 | Order confirmed | true | (spacer) | (empty) | Chat · Lang · Cart |

---

## Zone specifications

### Left zone — nav icon + logo

```
<div flex-none items-center gap-2>
  [nav icon]
  [logo]
</div>
```

| Condition | Icon | Action |
|-----------|------|--------|
| `activeSection === "home"` | Hamburger ☰ | `setMenuOpen(toggle)` |
| `hideBack === true` | Empty spacer `<div w-9 />` | — |
| Otherwise | Back ↑ arrow | See back logic below |

**Back arrow action:**
- `activeSection === "checkout"` → `checkoutBackRef.current()` (checkout internal step-back)
- `activeSection === "results"` → `history.back()` (returns to home)

Logo: `<img src="/sharif-logo.png" className="h-7 w-auto" />` — always visible.

### Center zone — dimension chip OR checkout step title

```
<div flex-1 min-w-0 items-center justify-center px-2>
  [content based on priority]
</div>
```

**Priority order (first match wins):**

1. **Checkout step title** — when `activeSection === "checkout" && checkoutStepTitle`
   ```
   <span truncate text-sm font-semibold>{checkoutStepTitle}</span>
   ```

2. **Dimension chip** — when `hasSearch` is true
   ```
   ┌────────────────────────────────────────────┐
   │  205/55R16 · Sommerdekk   Endre    [×]    │
   │  (truncate)               (flex-none)      │
   └────────────────────────────────────────────┘
   ```

   | Element | Classes | Action |
   |---------|---------|--------|
   | Dimension text | `truncate text-xs font-medium text-ui-fg-subtle` | Display. Shows `{dimension} · {seasonLabel}`. Truncates on narrow screens. |
   | "Endre" link | `flex-none text-xs text-ui-fg-muted underline` | `scrollToSection("home")` — smooth scroll to search form |
   | × icon | `flex-none h-5 w-5 rounded-full` | Clears everything: resets searchMeta, products, view, selectedTire, URL → "/" |

   **Key rule:** The chip NEVER changes content or visibility based on `activeSection`. It only depends on `hasSearch`.

3. **Empty** — no search active and not in checkout.

### Right zone — action buttons

```
<div flex-none items-center gap-1>
  [chat button]
  [lang picker]
  [cart badge]
</div>
```

| # | Button | Icon | State behavior | Action |
|---|--------|------|----------------|--------|
| 1 | **Chat** | 💬 chat bubble icon | Active styling when `chatOpen` (filled bg, darker border) | `setChatOpen(toggle)` — opens agent chat panel from right |
| 2 | **Language** | 🇳🇴 / 🇬🇧 flag emoji | Shows dropdown when `langMenuOpen` | `setLangMenuOpen(toggle)` |
| 3 | **Cart** | Passed in as `cartBadge` prop | — | Defined externally |

---

## Agent chat panel (replaces both old surfaces)

### Existing implementation (keep as-is)

The agent chat is already fully built:
- **API route:** `storefront/src/app/api/agent/chat/route.ts` — SSE streaming, Anthropic SDK, tool loop
- **Streaming hook:** `storefront/src/modules/home/components/agent-panel/useStreamingChat.ts` — SSE parsing, tool dispatch, localStorage persistence
- **Tool context:** `storefront/src/modules/home/components/agent-panel/AgentToolContext.tsx` — bridges agent tool calls to FlowShell actions (fillDimensionField, triggerSearch, selectTire, scrollToProduct, prefillCheckoutField, openPaymentStep)
- **Panel UI:** `storefront/src/modules/home/components/agent-panel/index.tsx` — full chat UI with messages, input, clear history

None of the above internals change. Only the open/close trigger moves.

### What gets removed
1. **Floating chat bubble** — the `<button fixed bottom-5 right-5>` toggle in AgentPanel (lines 49–61)
2. **Support aside** — the `<aside fixed right-0 top-14>` phone-number placeholder in FlowShell (lines 770–780)
3. **`supportOpen` state** — replaced by `chatOpen`

### What changes
- **AgentPanel** drops its internal `open` state. Receives `open` + `onClose` as props instead.
- **Header chat button** in right zone controls `chatOpen` state (lives in FlowShell).
- **`CheckoutPanelContent`** prop rename: `supportOpen` → `chatOpen`.

### AgentPanel prop changes

```tsx
// Before (manages own state, has floating toggle)
<AgentPanel getSessionContext={getSessionContext} />

// After (controlled by parent)
<AgentPanel
  open={chatOpen}
  onClose={() => setChatOpen(false)}
  getSessionContext={getSessionContext}
/>
```

AgentPanel keeps its panel JSX (header, messages, input) but removes the floating button and the internal `useState(false)` for open. The `open` prop controls visibility. The `onClose` prop is called by the panel's × button.

---

## Layout structure (full)

```
<header>  h-14, absolute top, z-[90], border-b, white bg
  ├── Left     flex-none, items-center, gap-2
  │   ├── Nav icon (hamburger | back | spacer)
  │   └── Logo
  ├── Center   flex-1, min-w-0, items-center, justify-center, px-2
  │   └── (step title | dimension chip | empty)
  └── Right    flex-none, items-center, gap-1
      ├── Chat button (💬)
      ├── Lang picker (🇳🇴/🇬🇧 + dropdown)
      └── Cart badge
</header>

<AgentPanel>  slides from right, z-[80], below header
  ├── Panel header (title + clear + close)
  ├── Messages area
  └── Input area
</AgentPanel>
```

---

## Migration checklist

- [ ] Rename `supportOpen` → `chatOpen` in FlowShell state
- [ ] Replace phone icon with chat icon in right zone button
- [ ] Pass `chatOpen` + `onToggle` to AgentPanel as props
- [ ] Remove floating toggle button from AgentPanel
- [ ] Remove AgentPanel internal `open` state
- [ ] Remove old support `<aside>` from FlowShell
- [ ] Update `CheckoutPanelContent` prop: `supportOpen` → `chatOpen`
- [ ] Verify three-zone layout renders correctly across all 7 states

## Acceptance criteria

- [ ] States 1–7 all render as specified in the matrix
- [ ] Dimension chip never changes based on `activeSection` scroll
- [ ] No element overlap on 390px viewport
- [ ] Back arrow correctly dispatches to checkout step-back vs history.back
- [ ] "Endre" smooth-scrolls to search form
- [ ] × clears search and returns to state 1
- [ ] Checkout step title replaces chip in center zone
- [ ] Order confirmation hides back arrow, shows spacer
- [ ] Chat button in header opens agent panel (no floating bubble)
- [ ] No phone button or support aside remains
- [ ] Chat panel slides in/out correctly from right edge

---

## Human test protocol

Walk through these in order on a mobile viewport (390px). Each step builds on the previous — don't refresh between steps unless noted.

### 1. Fresh landing

Open the site. You should see:
- [ ] Hamburger ☰ on the left
- [ ] Sharif logo next to it
- [ ] Center area is empty (no dimension text)
- [ ] Right side: chat button (💬), language flag (🇳🇴), cart icon
- [ ] No floating chat bubble in the bottom-right corner

### 2. Chat button

- [ ] Tap the 💬 chat button → agent panel slides in from the right
- [ ] Panel shows "Sharif-rådgiver" header, empty state message, input field
- [ ] Type "hei" and send → agent responds (streaming)
- [ ] Tap × in panel header → panel slides closed
- [ ] Chat button in header returns to normal (not active) styling

### 3. Language picker

- [ ] Tap the 🇳🇴 flag → dropdown shows "Norsk" and "English"
- [ ] Tap "English" → flag changes to 🇬🇧, page text updates
- [ ] Tap 🇬🇧 → switch back to Norsk
- [ ] Dropdown closes after selection

### 4. Hamburger menu

- [ ] Tap ☰ → side menu slides in
- [ ] Tap × or outside → menu closes

### 5. Fill the search form

Fill in 205 / 55 / 16, select "Sommerdekk", 4 stk. **Don't tap "Finn dekk" yet.**
- [ ] Header is still in state 1 (no dimension chip)

### 6. Submit search

Tap "Finn dekk". Wait for results to load.
- [ ] "N dekk funnet" appears in the results area
- [ ] Dimension chip appears in the header center: "205/55R16 · Sommerdekk"
- [ ] "Endre" link visible next to the text
- [ ] Small × icon visible next to "Endre"
- [ ] Header text is not overlapping or truncated badly

### 7. Dimension chip — Endre

- [ ] Tap "Endre" → page smooth-scrolls back to the search form
- [ ] Dimension chip stays visible in the header during and after scroll
- [ ] You are back on the home section, form fields still filled

### 8. Dimension chip — clear (×)

- [ ] Tap × next to the dimension chip
- [ ] Dimension chip disappears from header
- [ ] Page returns to fresh landing state (form fields reset, no results)
- [ ] URL is back to "/"

### 9. Search again and scroll to results

Fill the form again (205/55/16) and tap "Finn dekk".
- [ ] Scroll down to the tire results grid
- [ ] Header changes: hamburger becomes ↑ back arrow
- [ ] Dimension chip stays the same — no blink or text swap while scrolling
- [ ] Scroll slowly across the home/results boundary — no flicker

### 10. Back arrow on results

- [ ] Tap the ↑ back arrow in the header
- [ ] Page scrolls/navigates back to the home section
- [ ] Hamburger ☰ returns

### 11. Select a tire → checkout

Scroll to results, tap "Legg i kassen" on any tire.
- [ ] Checkout section appears, page scrolls to it
- [ ] Header: ↑ back arrow, checkout step title in center (e.g. "Levering")
- [ ] Dimension chip is replaced by the step title — not both showing

### 12. Back arrow on checkout

- [ ] Tap ↑ back arrow → goes back one checkout step (or returns to results if on first step)
- [ ] Step title updates accordingly

### 13. Complete checkout → order confirmed

Walk through checkout to the confirmation screen.
- [ ] Back arrow disappears (replaced by empty spacer — logo doesn't jump)
- [ ] Center zone is empty (no step title, no chip)
- [ ] Right zone buttons still accessible

### 14. Desktop check (1280px)

Resize to desktop width. Repeat steps 5–8 quickly.
- [ ] Header layout is balanced — chip has room, no truncation needed
- [ ] Chat panel doesn't cover the whole screen (360px sidebar)

### 15. Edge cases

- [ ] Open chat panel + scroll between sections → header stays stable behind panel
- [ ] Open language picker while dimension chip is showing → dropdown doesn't overlap chip
- [ ] Tap chat button while already on checkout → panel opens, checkout stays in place
