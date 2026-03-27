# Shop Card

**COMPONENT ID:** `mol-shop-card`
**Atomic Level:** Molecule (shop name heading + address text + availability hint + selection border)
**Framework:** Svelte (custom component)
**Base Styling:** daisyUI `card card-border` + Tailwind utilities

---

## Purpose

A selection card representing a physical mounting location (e.g., Fjellhamar or Drammen). The user taps a shop card to choose where their tires will be mounted. Provides at-a-glance information: shop name, address, and availability hint. Two visual states clearly communicate the current selection.

---

## Anatomy

```
┌─────────────────────────────────────┐
│  Shop Name                          │
│  Street Address, City               │
│                                     │
│  ✅ Plenty of slots this week       │  Availability hint
└─────────────────────────────────────┘
```

---

## States

### Default (Unselected)

The card is visible but not chosen. Neutral border signals it is tappable.

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│  Fjellhamar                         │
│  Strømsveien 245, 1471 Lørenskog   │
│                                     │
│  Mange ledige tider denne uken      │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

| Property | Value |
|----------|-------|
| daisyUI | `card card-border bg-base-100` |
| Border | `border-base-300` (gray, 1px) |
| Cursor | `cursor-pointer` |
| Shadow | None |

### Selected

The card is the active choice. Red border and subtle background shift confirm selection.

```
┌─────────────────────────────────────┐
│  Fjellhamar                     ✓   │
│  Strømsveien 245, 1471 Lørenskog   │
│                                     │
│  Mange ledige tider denne uken      │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| daisyUI | `card card-border border-primary border-2 bg-base-100` |
| Border | `border-primary` (brand red, 2px) |
| Checkmark | Small check icon in top-right corner, `text-primary` |
| Shadow | `shadow-sm` |
| Transition | Border color 150ms ease |

### Hover (Desktop)

| Property | Value |
|----------|-------|
| daisyUI | `hover:shadow-md` |
| Border | `hover:border-primary/50` (semi-transparent red) |
| Transition | 150ms ease |

### Disabled (No Availability)

| Property | Value |
|----------|-------|
| daisyUI | `card card-border opacity-50` |
| Cursor | `cursor-not-allowed` |
| Hint text | Changes to "Fully booked" / "Fullt booket" |
| Interaction | Not selectable |

---

## Sub-Components

### Shop Name

**OBJECT ID:** `mol-shop-card-name`

| Property | Value |
|----------|-------|
| Element | `<h3>` |
| daisyUI | `card-title text-lg font-bold` |
| Content | Shop location name |

### Address

**OBJECT ID:** `mol-shop-card-address`

| Property | Value |
|----------|-------|
| Element | `<p>` |
| Classes | `text-sm text-base-content/70` |
| Content | Street address, postal code, city |

### Availability Hint

**OBJECT ID:** `mol-shop-card-availability`

| Property | Value |
|----------|-------|
| Element | `<p>` |
| Classes | `text-sm text-success font-medium mt-2` |
| Content | Availability status text |
| Color | `text-success` when available, `text-error` when fully booked |

Translation keys:

| Key | NO | EN |
|-----|----|----|
| `shop.fjellhamar.name` | "Fjellhamar" | "Fjellhamar" |
| `shop.fjellhamar.address` | "Strømsveien 245, 1471 Lørenskog" | "Strømsveien 245, 1471 Lørenskog" |
| `shop.drammen.name` | "Drammen" | "Drammen" |
| `shop.drammen.address` | "Engene 42, 3015 Drammen" | "Engene 42, 3015 Drammen" |
| `shop.availability.plenty` | "Mange ledige tider denne uken" | "Plenty of slots this week" |
| `shop.availability.few` | "Få ledige tider" | "Few slots left" |
| `shop.availability.none` | "Fullt booket" | "Fully booked" |
| `shop.select_label` | "Velg monteringssted" | "Select mounting location" |

---

## Container

**OBJECT ID:** `mol-shop-card-container`

| Property | Value |
|----------|-------|
| Element | `<button>` wrapping card content (for full-card tap target) |
| daisyUI | `card card-border card-sm` |
| Padding | `p-4` via `card-body` |
| Layout | Vertical stack — name, address, availability hint |
| Behavior | Tap → dispatches `shop-selected` event with `{ shopId }` |

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Mobile (< 768px)** | Cards stack vertically, full width. Generous tap target (min 48px height). |
| **Tablet (768px-1024px)** | Cards side by side in a 2-column grid. |
| **Desktop (>= 1024px)** | Cards side by side, max-width constrained to content area. Hover states active. |

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Role | `role="radio"` on each card (part of a radio group) |
| Group | Parent container has `role="radiogroup"` with `aria-label` from `shop.select_label` |
| Selected | `aria-checked="true"` on selected card, `"false"` on others |
| Label | `aria-label` combines shop name + address |
| Keyboard nav | Arrow keys move between cards, Space/Enter selects |
| Focus | Visible focus ring (`focus-visible:ring-2 ring-primary ring-offset-2`) |
| Disabled | `aria-disabled="true"` when fully booked |

---

## Technical Notes

- Shop data comes from the API — name, address, and availability are dynamic
- Only one card can be selected at a time (radio behavior)
- Selection is stored in the order store and persists across view navigation
- Availability hint updates based on real-time slot data from the booking API
- Card uses `<button>` element (not `<div>`) to ensure native click/keyboard behavior

---

## Usage in Page Specs

Referenced as:

```markdown
| Component | [Shop Card](../../../D-Design-System/molecules/shop-card.md) |
```

Used in:
- [01.4-Quantity & Shop](../../C-UX-Scenarios/01-harriets-tire-purchase/01.4-quantity-and-shop/01.4-quantity-and-shop.md) — shop selection step
- Future: any view requiring mounting location choice

---

_Created using Whiteport Design Studio (WDS) methodology_
