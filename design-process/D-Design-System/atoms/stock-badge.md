# Stock Badge

**COMPONENT ID:** `atom-stock-badge`
**Atomic Level:** Atom (single badge element)
**Framework:** Svelte (custom component)
**Base Styling:** daisyUI `badge` + Tailwind utilities

---

## Purpose

Displays the stock availability status of a product as a color-coded badge. Used in product cards and product detail pages to give the customer immediate visual feedback on whether a tire is available for purchase.

---

## Anatomy

```
┌──────────────┐
│  ● På lager  │   Badge with optional dot indicator + status text
└──────────────┘
```

---

## States

### In Stock

Product is available with normal stock levels.

| Property | Value |
|----------|-------|
| daisyUI | `badge badge-success` |
| Color | Green (success) |
| Text NO | "På lager" |
| Text EN | "In stock" |
| Dot | `●` green, `mr-1` |

### Low Stock

Product is available but stock is running low.

| Property | Value |
|----------|-------|
| daisyUI | `badge badge-warning` |
| Color | Amber (warning) |
| Text NO | "Få igjen" |
| Text EN | "Low stock" |
| Dot | `●` amber, `mr-1` |

### Out of Stock

Product is not currently available.

| Property | Value |
|----------|-------|
| daisyUI | `badge badge-ghost` |
| Color | Gray (ghost) |
| Text NO | "Ikke på lager" |
| Text EN | "Out of stock" |
| Dot | `●` gray, `mr-1` |

---

## Sub-Components

### Status Dot

**OBJECT ID:** `atom-stock-badge-dot`

| Property | Value |
|----------|-------|
| Element | `<span>` |
| Content | `●` (Unicode bullet) |
| Styling | `text-xs mr-1` — inherits color from badge variant |
| Purpose | Adds visual weight and quick scannability alongside the text |

### Status Text

**OBJECT ID:** `atom-stock-badge-text`

| Property | Value |
|----------|-------|
| Element | `<span>` |
| Styling | `text-xs font-medium` |
| Content | Translation key based on stock status |

---

## Translation Keys

| Key | NO | EN |
|-----|----|----|
| `stock.in-stock` | "På lager" | "In stock" |
| `stock.low-stock` | "Få igjen" | "Low stock" |
| `stock.out-of-stock` | "Ikke på lager" | "Out of stock" |

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Mobile (< 768px)** | Badge at default size (`text-xs`). Positioned within product card flow. |
| **Tablet (768px-1024px)** | Same as mobile. |
| **Desktop (>= 1024px)** | Same as mobile. Badge size remains consistent across viewports. |

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Semantic | `role="status"` on badge element |
| Label | `aria-label` with full status text, e.g., "Stock status: In stock" |
| Color independence | Status text always visible alongside color — never color-only |
| Screen reader | Dot is `aria-hidden="true"` to avoid announcing the bullet character |

---

## Technical Notes

- Component accepts a `status` prop: `"in-stock"` | `"low-stock"` | `"out-of-stock"`
- Stock status is determined by inventory count thresholds defined in the backend configuration
- Suggested thresholds: in-stock (> 8 units), low-stock (1-8 units), out-of-stock (0 units) — exact values configurable
- Component is display-only — dispatches no events
- When status is `"out-of-stock"`, the parent product card should also disable the add-to-cart action

---

## Usage in Page Specs

Referenced as:

```markdown
| Component | [Stock Badge](../../../D-Design-System/atoms/stock-badge.md) |
```

Used in:
- Product cards — positioned near price, below tire name
- Product detail page — beside price or in the buy box area

---

_Created using Whiteport Design Studio (WDS) methodology_
