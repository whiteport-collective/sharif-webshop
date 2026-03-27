# Quantity Toggle

**COMPONENT ID:** `mol-quantity-toggle`
**Atomic Level:** Molecule (2 button atoms joined)
**Framework:** Svelte (custom component)
**Base Styling:** daisyUI `join` + `btn` + Tailwind utilities

---

## Purpose

A two-option toggle that lets the user select tire quantity: 2 or 4. Defaults to 4 tires (the common case). Switching updates the total price in real time without page reload. Designed to be dead-simple — one tap, instant feedback.

---

## Anatomy

```
┌───────────────────────────────┐
│  [ 2 dekk ]  [ 4 dekk ]      │  join container
│    ghost       primary        │  (default: 4 selected)
└───────────────────────────────┘
         │
         ▼
   Dispatches `quantity-change` event
   with { quantity: 2 | 4 }
```

---

## States

### Default (4 selected)

```
┌──────────────────────────────┐
│  [ 2 dekk ]   [■ 4 dekk ■]  │
│   btn-ghost     btn-primary  │
└──────────────────────────────┘
```

- "4 dekk" / "4 tires" is selected on mount
- Total price reflects 4x unit price

### 2 Selected

```
┌──────────────────────────────┐
│  [■ 2 dekk ■]   [ 4 dekk ]  │
│   btn-primary     btn-ghost  │
└──────────────────────────────┘
```

- Total price updates immediately to 2x unit price
- Transition: none (instant swap of classes)

### Disabled

Both buttons disabled when product data is loading or unavailable.

| Property | Value |
|----------|-------|
| daisyUI | `btn-disabled` on both buttons |
| Cursor | `cursor-not-allowed` |
| Opacity | Reduced via daisyUI default |

---

## Sub-Components

### Toggle Container

**OBJECT ID:** `mol-qty-toggle-container`

| Property | Value |
|----------|-------|
| Element | `<div>` |
| daisyUI | `join` |
| Layout | Horizontal, two buttons flush |
| Behavior | Manages selected state, dispatches `quantity-change` event |

### Option Button — 2 Tires

**OBJECT ID:** `mol-qty-toggle-btn-2`

| Property | Value |
|----------|-------|
| Element | `<button>` |
| daisyUI (unselected) | `btn btn-ghost join-item` |
| daisyUI (selected) | `btn btn-primary join-item` |
| Label (NO) | "2 dekk" |
| Label (EN) | "2 tires" |
| Behavior | on:click → set quantity to 2, dispatch event |

### Option Button — 4 Tires

**OBJECT ID:** `mol-qty-toggle-btn-4`

| Property | Value |
|----------|-------|
| Element | `<button>` |
| daisyUI (unselected) | `btn btn-ghost join-item` |
| daisyUI (selected) | `btn btn-primary join-item` |
| Label (NO) | "4 dekk" |
| Label (EN) | "4 tires" |
| Behavior | on:click → set quantity to 4, dispatch event |

---

## Translations

| Key | NO | EN |
|-----|----|----|
| `qty-toggle.option.2` | "2 dekk" | "2 tires" |
| `qty-toggle.option.4` | "4 dekk" | "4 tires" |

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Mobile (< 768px)** | Full width of parent container. Buttons share 50/50 space. |
| **Tablet (768px-1024px)** | Auto width, centered within parent. |
| **Desktop (>= 1024px)** | Auto width, positioned inline with price display. |

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Role | `role="radiogroup"` on container |
| Button role | `role="radio"` on each button |
| Selected state | `aria-checked="true"` on selected button |
| Label | `aria-label="Tire quantity"` on container |
| Keyboard nav | Arrow keys switch between options, Space/Enter confirms |
| Screen reader | Announces: "Tire quantity, 4 tires selected" |

---

## Technical Notes

- Default quantity: 4 (set on component mount)
- Component dispatches `quantity-change` custom event with `{ quantity: 2 | 4 }`
- Parent component listens for event and recalculates total price: `unitPrice * quantity`
- Price update is synchronous — no API call needed, just multiplication
- State is local to component; parent reads via event or bind
- No debounce needed — toggle is binary, no rapid-fire risk

---

## Usage in Page Specs

Referenced as:

```markdown
| Component | [Quantity Toggle](../../../D-Design-System/molecules/quantity-toggle.md) |
```

Used in:
- Product detail page — next to price display
- Cart summary — quantity adjustment

---

_Created using Whiteport Design Studio (WDS) methodology_
