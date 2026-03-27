# Trust Bar

**COMPONENT ID:** `atom-trust-bar`
**Atomic Level:** Atom (single text element)
**Framework:** Svelte (or plain HTML)
**Base Styling:** Tailwind utilities (no daisyUI component needed)

---

## Purpose

A compact, single-line value proposition bar that communicates trust and key selling points at a glance. Three short statements separated by middle dots. Quiet and unobtrusive — muted small text, centered. Appears near the top of key pages to reassure the customer before they engage.

---

## Anatomy

```
┌─────────────────────────────────────────────────────────┐
│   60+ år med dekk · Montering inkludert · Fra 499 kr    │  Single line, centered
└─────────────────────────────────────────────────────────┘
```

---

## States

### Default

The only state. Static text, no interaction.

| Property | Value |
|----------|-------|
| Element | `<p>` |
| Tailwind | `text-sm text-base-content/50 text-center` |
| Separator | ` · ` (space + middle dot + space, `\u00B7`) |
| Content (NO) | "60+ år med dekk · Montering inkludert · Fra 499 kr" |
| Content (EN) | "60+ years of tires · Mounting included · From 499 kr" |

No hover, focus, or active states. Purely informational.

---

## Sub-Components

### Trust Bar Text

**OBJECT ID:** `atom-trust-text`

| Property | Value |
|----------|-------|
| Element | `<p>` |
| Tailwind | `text-sm text-base-content/50 text-center` |
| Content | Three trust statements joined by ` · ` |
| Line behavior | Single line on desktop/tablet. May wrap on very narrow mobile — acceptable. |

---

## Translations

| Key | NO | EN |
|-----|----|----|
| `trust.item.1` | "60+ år med dekk" | "60+ years of tires" |
| `trust.item.2` | "Montering inkludert" | "Mounting included" |
| `trust.item.3` | "Fra 499 kr" | "From 499 kr" |
| `trust.separator` | " · " | " · " |

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Mobile (< 768px)** | Full width, centered. Text may wrap to two lines on very small screens — acceptable. |
| **Tablet (768px-1024px)** | Single line, centered. |
| **Desktop (>= 1024px)** | Single line, centered. |

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Semantics | `<p>` element — no special role needed |
| Screen reader | Reads naturally as a sentence |
| Contrast | `text-base-content/50` provides sufficient contrast on `base-100` background (verify against WCAG AA for small text) |
| aria-label | Not needed — text content is self-describing |

---

## Technical Notes

- Pure presentational component — no state, no events, no API calls
- Content can be driven by i18n translation keys or hardcoded per locale
- The "Fra 499 kr" value may need to be dynamic if minimum price changes — consider accepting a `minPrice` prop
- Middle dot (`·`) is Unicode `U+00B7`, not a bullet (`•`) or period (`.`)
- No daisyUI component class needed — plain Tailwind is sufficient for this atom

---

## Usage in Page Specs

Referenced as:

```markdown
| Component | [Trust Bar](../../../D-Design-System/atoms/trust-bar.md) |
```

Used in:
- Homepage — below hero / dimension input
- Product listing page — top of results area
- Product detail page — below header

---

_Created using Whiteport Design Studio (WDS) methodology_
