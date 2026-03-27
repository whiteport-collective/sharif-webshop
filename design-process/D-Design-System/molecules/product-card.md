# Product Card

**COMPONENT ID:** `mol-product-card`
**Atomic Level:** Molecule (image + text atoms + EU label bars + badge + price)
**Framework:** Svelte (custom component)
**Base Styling:** daisyUI `card` + `badge` + `progress` + Tailwind utilities

---

## Purpose

The primary product tile for Sharif.no. Displays a single tire product with image, name, dimension, EU label ratings, price, and stock status. Used inside a horizontal daisyUI carousel on search results and category pages. Tapping anywhere on the card opens the product detail drawer (01.3).

---

## Anatomy

```
┌───────────────────────────┐
│                           │
│      ┌─────────────┐     │
│      │             │     │
│      │  Tire Image  │     │  Square, white bg
│      │             │     │
│      └─────────────┘     │
│                           │
│  POWERTRAC ADAMAS H/P     │  Brand + Model (bold)
│  185/65R15 88H             │  Dimension (muted)
│                           │
│  ⛽ ██████░░░░  B          │  Fuel efficiency (green)
│  💧 ████████░░  A          │  Wet grip (amber)
│  🔊 ████░░░░░░  70dB      │  Noise (blue)
│                           │
│  499 kr                    │  Price (large, bold)
│  per dekk                  │  Unit (muted, small)
│                           │
│  [ In stock ]              │  Stock badge (green)
│                           │
└───────────────────────────┘
```

---

## States

### Default

Card at rest inside carousel. All data visible. Subtle shadow.

```
┌───────────────────────────┐
│  [image]                  │
│  Brand + Model            │
│  Dimension                │
│  EU labels                │
│  Price                    │
│  Stock badge              │
└───────────────────────────┘
```

- daisyUI: `card card-sm bg-base-100 shadow-sm`
- Cursor: `cursor-pointer`

### Hover / Active

Visual feedback on interaction.

| Property | Value |
|----------|-------|
| Hover | `shadow-md` + `scale-[1.02]` transition |
| Active (tap) | `scale-[0.98]` briefly |
| Transition | `transition-all duration-150 ease-out` |
| Focus-visible | `ring-2 ring-primary ring-offset-2` (keyboard nav) |

### Out of Stock

Product unavailable. Card de-emphasized.

| Property | Value |
|----------|-------|
| Image | `opacity-50 grayscale` |
| Price | Struck through, `line-through text-base-content/50` |
| Badge | Grey `badge badge-ghost` — "Ikke på lager" / "Out of stock" |
| Interaction | Card still tappable (detail drawer shows alternatives) |

### Loading / Skeleton

Placeholder while product data loads.

| Property | Value |
|----------|-------|
| Image area | `skeleton w-full aspect-square` |
| Brand + Model | `skeleton h-5 w-3/4` |
| Dimension | `skeleton h-4 w-1/2` |
| EU labels | 3x `skeleton h-3 w-full` |
| Price | `skeleton h-6 w-1/3` |
| Badge | `skeleton h-5 w-20` |
| Animation | daisyUI skeleton pulse animation |

---

## Sub-Components

### Card Container

**OBJECT ID:** `mol-product-card-container`

| Property | Value |
|----------|-------|
| Element | `<button>` (entire card is tappable) |
| daisyUI | `card card-sm bg-base-100 shadow-sm` |
| Width | `w-44` (mobile) / `w-52` (tablet+) — fixed width for carousel |
| Layout | Vertical flex, `flex-shrink-0` (prevents collapse in carousel) |
| Behavior | on:click → dispatch `product-select` event with product ID → opens detail drawer (01.3) |

### Tire Image

**OBJECT ID:** `mol-product-card-image`

| Property | Value |
|----------|-------|
| Element | `<figure>` wrapping `<img>` |
| daisyUI | `figure` (card figure) |
| Aspect | `aspect-square` |
| Background | `bg-white` (white regardless of theme) |
| Fit | `object-contain p-2` |
| Fallback | On error → show tire silhouette SVG placeholder |
| Alt text | `"{brand} {model} {dimension}"` |
| Loading | `loading="lazy"` |

### Brand + Model Name

**OBJECT ID:** `mol-product-card-title`

| Property | Value |
|----------|-------|
| Element | `<h3>` |
| daisyUI | `card-title` |
| Classes | `text-sm font-bold uppercase tracking-tight leading-tight line-clamp-2` |
| Content | Brand and model concatenated, e.g., "POWERTRAC ADAMAS H/P" |
| Overflow | Two-line clamp with ellipsis |

### Dimension String

**OBJECT ID:** `mol-product-card-dimension`

| Property | Value |
|----------|-------|
| Element | `<p>` |
| Classes | `text-xs text-base-content/60` |
| Content | Full dimension with load/speed index, e.g., "185/65R15 88H" |

### EU Label Group

**OBJECT ID:** `mol-product-card-eu-labels`

| Property | Value |
|----------|-------|
| Element | `<div>` wrapping three label rows |
| Classes | `flex flex-col gap-1 py-1` |
| Content | Three mini progress bars for Fuel, Wet Grip, Noise |

#### Fuel Efficiency Bar

**OBJECT ID:** `mol-product-card-eu-fuel`

| Property | Value |
|----------|-------|
| Element | Row: icon + `<progress>` + grade letter |
| Icon | Fuel pump (inline SVG, 12px) |
| daisyUI | `progress progress-success w-full` |
| Bar color | Green — `progress-success` |
| Classes | `h-1.5` (slim bar) |
| Value | Maps A–E to percentage: A=100, B=80, C=60, D=40, E=20 |
| Grade | `text-[10px] font-bold text-success` |

#### Wet Grip Bar

**OBJECT ID:** `mol-product-card-eu-grip`

| Property | Value |
|----------|-------|
| Element | Row: icon + `<progress>` + grade letter |
| Icon | Water drop (inline SVG, 12px) |
| daisyUI | `progress progress-warning w-full` |
| Bar color | Amber — `progress-warning` |
| Classes | `h-1.5` |
| Value | Maps A–E to percentage: A=100, B=80, C=60, D=40, E=20 |
| Grade | `text-[10px] font-bold text-warning` |

#### Noise Bar

**OBJECT ID:** `mol-product-card-eu-noise`

| Property | Value |
|----------|-------|
| Element | Row: icon + `<progress>` + dB value |
| Icon | Speaker (inline SVG, 12px) |
| daisyUI | `progress progress-info w-full` |
| Bar color | Blue — `progress-info` |
| Classes | `h-1.5` |
| Value | Maps A–C to percentage: A=100, B=66, C=33. Displayed as dB value (e.g., "70dB") |
| Grade | `text-[10px] font-bold text-info` |

### Price

**OBJECT ID:** `mol-product-card-price`

| Property | Value |
|----------|-------|
| Element | `<span>` |
| Classes | `text-lg font-bold text-base-content` |
| Content | Formatted price with currency, e.g., "499 kr" |
| Format | Integer only (no decimals for NOK), space before "kr" |

### Price Unit

**OBJECT ID:** `mol-product-card-price-unit`

| Property | Value |
|----------|-------|
| Element | `<span>` |
| Classes | `text-[10px] text-base-content/50` |
| Content | "per dekk" (NO) / "per tire" (EN) |

### Stock Badge

**OBJECT ID:** `mol-product-card-stock`

| Property | Value |
|----------|-------|
| Element | `<span>` |
| daisyUI | `badge badge-sm` |
| Variants | See stock states below |

Stock badge variants:

| Status | daisyUI Classes | NO Text | EN Text |
|--------|----------------|---------|---------|
| In stock | `badge badge-sm badge-success` | "På lager" | "In stock" |
| Low stock | `badge badge-sm badge-warning` | "Få igjen" | "Low stock" |
| Out of stock | `badge badge-sm badge-ghost` | "Ikke på lager" | "Out of stock" |

---

## Translations

| Key | NO | EN |
|-----|----|----|
| `product.price.unit` | "per dekk" | "per tire" |
| `product.stock.in` | "På lager" | "In stock" |
| `product.stock.low` | "Få igjen" | "Low stock" |
| `product.stock.out` | "Ikke på lager" | "Out of stock" |
| `product.image.fallback.alt` | "Dekkbilde ikke tilgjengelig" | "Tire image not available" |
| `product.eu.fuel` | "Drivstoff" | "Fuel" |
| `product.eu.grip` | "Veigrep" | "Wet grip" |
| `product.eu.noise` | "Støy" | "Noise" |

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Mobile (< 768px)** | Card width `w-44`. Carousel shows ~2 cards + peek of third. Horizontal scroll with snap. |
| **Tablet (768px-1024px)** | Card width `w-52`. Carousel shows ~3–4 cards. |
| **Desktop (>= 1024px)** | Card width `w-52`. Carousel shows 4–5 cards. Optional arrow buttons at carousel edges. |

Carousel integration:

| Property | Value |
|----------|-------|
| Parent | daisyUI `carousel carousel-center gap-3 p-4` |
| Snap | `carousel-item` on each card for scroll-snap alignment |
| Overflow | `overflow-x-auto` on carousel container |
| Scrollbar | Hidden (`scrollbar-none`) |

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Semantics | Card is a `<button>` — announces as interactive element |
| Label | `aria-label="{brand} {model}, {dimension}, {price}"` on card button |
| EU labels | `aria-label` on each progress: e.g., "Fuel efficiency: B" |
| Stock status | Badge text sufficient; also included in card `aria-label` |
| Image | Descriptive `alt` text: `"{brand} {model} {dimension}"` |
| Keyboard nav | Tab focuses card, Enter/Space activates (opens drawer) |
| Carousel | Carousel has `role="region"` + `aria-label="Tire products"` |
| Reduced motion | Respect `prefers-reduced-motion` — disable scale transitions |

---

## Technical Notes

- Data source: product search API returns array of product objects with image URL, brand, model, dimension, EU labels, price, stock status
- EU label grades (A–E) are mapped to progress bar percentages client-side
- Image loading: use `loading="lazy"` since cards are in a horizontal scroll — only visible cards load
- Fallback image: inline SVG tire silhouette, bundled in component (no network request)
- Price formatting: use `Intl.NumberFormat('nb-NO')` — no decimals for whole-number prices
- Card dispatches `product-select` custom event with `{ productId, dimension }` payload
- Carousel container handles scroll-snap; individual cards are stateless display components
- Skeleton state: render N placeholder cards (match expected result count or default 6) while API loads

---

## Usage in Page Specs

Referenced as:

```markdown
| Component | [Product Card](../../../D-Design-System/molecules/product-card.md) |
```

Used in:
- [01.2-Product Cards](../../C-UX-Scenarios/01-harriets-tire-purchase/01.2-product-cards/01.2-product-cards.md) — carousel of matching tires
- Future: category pages, "recommended tires" sections, recently viewed

---

_Created using Whiteport Design Studio (WDS) methodology_
