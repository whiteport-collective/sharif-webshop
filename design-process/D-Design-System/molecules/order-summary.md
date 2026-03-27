# Order Summary

**COMPONENT ID:** `mol-order-summary`
**Atomic Level:** Molecule (product name + quantity + price lines + mounting location)
**Framework:** Svelte (custom component)
**Base Styling:** daisyUI `card card-compact bg-base-200` + Tailwind utilities

---

## Purpose

A compact, read-only summary of the current order. Shows the selected product, quantity, pricing breakdown, and chosen mounting location. Appears in the quantity/shop view (01.4) as a live-updating preview and in the payment view (01.5) as the final order confirmation block.

---

## Anatomy

```
┌─────────────────────────────────────┐
│  Continental PremiumContact 6        │  Product name
│  205/55 R16 91V                      │  Dimension
│                                      │
│  4 stk × 999 kr                      │  Quantity × unit price
│                          ─────────── │
│                   Totalt: 3 996 kr   │  Total
│                                      │
│  📍 Fjellhamar                       │  Mounting location
└─────────────────────────────────────┘
```

---

## States

### Partial (Building)

Shown during the order flow as the user makes choices. Fields appear progressively as data becomes available.

| Field | Visibility |
|-------|-----------|
| Product name + dimension | Always (once product selected) |
| Quantity + unit price | After quantity is set |
| Total | After quantity is set |
| Mounting location | After shop is selected |

- Missing fields are not shown (no placeholder or skeleton)

### Complete

All fields populated. Ready for payment.

```
┌─────────────────────────────────────┐
│  Continental PremiumContact 6        │
│  205/55 R16 91V                      │
│                                      │
│  4 stk × 499 kr                     │
│                          ─────────── │
│                   Totalt: 1 996 kr   │
│                                      │
│  📍 Fjellhamar                       │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| daisyUI | `card card-compact bg-base-200` |
| Border | None (relies on background contrast) |
| Padding | `p-4` via `card-body` |

---

## Sub-Components

### Product Name

**OBJECT ID:** `mol-order-summary-product`

| Property | Value |
|----------|-------|
| Element | `<h3>` |
| Classes | `font-bold text-base` |
| Content | Product brand + model name |

### Dimension Line

**OBJECT ID:** `mol-order-summary-dimension`

| Property | Value |
|----------|-------|
| Element | `<p>` |
| Classes | `text-sm text-base-content/70` |
| Content | Full dimension string (e.g., "205/55 R16 91V") |

### Quantity and Unit Price

**OBJECT ID:** `mol-order-summary-quantity`

| Property | Value |
|----------|-------|
| Element | `<p>` |
| Classes | `text-sm mt-3` |
| Content | `{count} stk × {unitPrice} kr` |
| Format | Quantity as integer, price with space as thousands separator |

### Total Line

**OBJECT ID:** `mol-order-summary-total`

| Property | Value |
|----------|-------|
| Element | `<p>` |
| Classes | `text-right font-bold text-lg` |
| Content | `Totalt: {total} kr` |
| Separator | Horizontal rule or border-top above total |

### Mounting Location

**OBJECT ID:** `mol-order-summary-location`

| Property | Value |
|----------|-------|
| Element | `<p>` |
| Classes | `text-sm mt-2 flex items-center gap-1` |
| Icon | Map pin icon before text |
| Content | Selected shop name |

Translation keys:

| Key | NO | EN |
|-----|----|----|
| `order.quantity_line` | "{count} stk × {price} kr" | "{count} pcs × {price} kr" |
| `order.total` | "Totalt" | "Total" |
| `order.currency` | "kr" | "kr" |
| `order.mounting_at` | "Montering hos" | "Mounting at" |
| `order.summary_label` | "Ordresammendrag" | "Order summary" |

---

## Container

**OBJECT ID:** `mol-order-summary-container`

| Property | Value |
|----------|-------|
| Element | `<section>` wrapping card |
| daisyUI | `card card-compact bg-base-200 rounded-box` |
| Padding | `card-body p-4` |
| Layout | Vertical stack — product info, pricing, location |
| Max width | Fills parent container |

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Mobile (< 768px)** | Full-width card. Stacked below or above main content depending on view. |
| **Tablet (768px-1024px)** | May appear in a sidebar column next to the main form. |
| **Desktop (>= 1024px)** | Sidebar position, sticky when scrolling (`sticky top-20`). Max-width 320px. |

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Landmark | `<section>` with `aria-label` from `order.summary_label` |
| Heading | `<h3>` for product name provides document structure |
| Price | `aria-label` on total: "Total price: {amount} kroner" |
| Live updates | `aria-live="polite"` on container so screen readers announce changes |
| Mounting location | Icon is `aria-hidden="true"`, text carries the meaning |

---

## Technical Notes

- Component is reactive — bound to the order store, updates automatically as user changes quantity or selects a shop
- Price formatting uses Norwegian locale: space as thousands separator, no decimals for whole kroner
- In payment view (01.5), the component is read-only and all fields are guaranteed populated
- In quantity/shop view (01.4), fields appear progressively
- No interactive elements inside this component — it is purely informational

---

## Usage in Page Specs

Referenced as:

```markdown
| Component | [Order Summary](../../../D-Design-System/molecules/order-summary.md) |
```

Used in:
- [01.4-Quantity & Shop](../../C-UX-Scenarios/01-harriets-tire-purchase/01.4-quantity-shop/01.4-quantity-shop.md) — live preview of order
- [01.5-Payment](../../C-UX-Scenarios/01-harriets-tire-purchase/01.5-payment/01.5-payment.md) — final order confirmation
- Future: order confirmation / receipt page

---

_Created using Whiteport Design Studio (WDS) methodology_
