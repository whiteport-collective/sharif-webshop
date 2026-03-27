# EU Label Display

**COMPONENT ID:** `mol-eu-label-display`
**Atomic Level:** Molecule (3 progress bar atoms + label texts + expandable detail panel)
**Framework:** Svelte (custom component)
**Base Styling:** daisyUI `progress` + Tailwind utilities

---

## Purpose

Visualizes EU tire energy label data (rolling resistance, wet grip, noise) in two variants: a compact mini view for product cards and an expanded detail view for the product detail page. Data is sourced from the supplier Excel columns RR (A-E), WG (A-E), and Noise (dB value + class A-C).

---

## Anatomy

### Mini Variant (Product Card)

```
┌──────────────────────────────────┐
│  [██░░░] A  [███░░] B  [████░] 70dB │  Three inline progress bars
└──────────────────────────────────┘
```

### Expanded Variant (Product Detail)

```
┌──────────────────────────────────────────┐
│  Fuel Efficiency                         │
│  [████████░░░░░░░░░░░░] A               │  Full-width bar
│  "Low rolling resistance — saves fuel"   │  Plain-language explanation
├──────────────────────────────────────────┤
│  Wet Grip                                │
│  [████████████░░░░░░░░] B               │
│  "Good braking on wet roads"             │
├──────────────────────────────────────────┤
│  Noise Level                             │
│  [██████████████░░░░░░] 70 dB  (B)      │
│  "Moderate exterior noise"               │
└──────────────────────────────────────────┘
```

---

## States

### Mini — Default

Three compact horizontal progress bars displayed side by side. Each bar shows the grade letter (A-E) or dB value. No labels — icons or color alone indicate the category.

- daisyUI: `progress progress-xs w-12` per bar
- Layout: `flex items-center gap-2`
- Grade text: `text-xs font-semibold`

### Expanded — Default (Collapsed Explanations)

Full-width bars with category labels above. Explanations hidden.

- daisyUI: `progress progress-sm w-full`
- Labels: `text-sm font-medium`
- Grade: `text-sm font-bold` beside bar

### Expanded — Explanations Visible

Tap on a bar row to expand plain-language explanation below it.

| Property | Value |
|----------|-------|
| Trigger | Tap/click on bar row |
| Animation | Slide-down, 150ms ease-out |
| Explanation text | `text-xs text-base-content/70` |
| Collapse | Tap same row again, or tap another row |

### No Data

When supplier data is missing for a field, the bar is replaced with a dash and muted text.

- Display: `—` in place of bar
- Text: `text-xs text-base-content/50`

---

## Sub-Components

### Fuel Efficiency Bar

**OBJECT ID:** `mol-eu-label-fuel`

| Property | Value |
|----------|-------|
| Element | `<progress>` |
| daisyUI | `progress progress-success` |
| Color | Green (success) |
| Value mapping | A=100, B=80, C=60, D=40, E=20 |
| Max | 100 |
| Grade display | Letter (A-E) shown to the right of bar |
| Data source | Supplier Excel column `RR` |

### Wet Grip Bar

**OBJECT ID:** `mol-eu-label-grip`

| Property | Value |
|----------|-------|
| Element | `<progress>` |
| daisyUI | `progress progress-warning` |
| Color | Amber (warning) |
| Value mapping | A=100, B=80, C=60, D=40, E=20 |
| Max | 100 |
| Grade display | Letter (A-E) shown to the right of bar |
| Data source | Supplier Excel column `WG` |

### Noise Level Bar

**OBJECT ID:** `mol-eu-label-noise`

| Property | Value |
|----------|-------|
| Element | `<progress>` |
| daisyUI | `progress progress-info` |
| Color | Blue (info) |
| Value mapping | dB value mapped to percentage: `min(100, max(0, (noise - 62) / (76 - 62) * 100))` — range 62-76 dB |
| Max | 100 |
| Grade display | dB value + noise class letter (A-C) shown to the right of bar |
| Data source | Supplier Excel columns `Noise` (dB) and noise class (A-C) |

### Explanation Panel

**OBJECT ID:** `mol-eu-label-explanation`

| Property | Value |
|----------|-------|
| Element | `<div>` collapsible below each bar row |
| daisyUI | (none — Tailwind only) |
| Styling | `text-xs text-base-content/70 pt-1 pb-2` |
| Content | Translation key per category + grade |
| Visibility | Expanded variant only. Hidden by default. Toggle on tap. |

---

## Translation Keys

### Labels

| Key | NO | EN |
|-----|----|----|
| `eu-label.fuel.label` | "Drivstoffeffektivitet" | "Fuel Efficiency" |
| `eu-label.grip.label` | "Veigrep (vått)" | "Wet Grip" |
| `eu-label.noise.label` | "Støynivå" | "Noise Level" |
| `eu-label.noise.unit` | "dB" | "dB" |
| `eu-label.no-data` | "Ingen data" | "No data" |

### Fuel Efficiency Explanations

| Key | NO | EN |
|-----|----|----|
| `eu-label.fuel.a` | "Svært lavt rullemotstand — best drivstoffbesparelse" | "Very low rolling resistance — best fuel savings" |
| `eu-label.fuel.b` | "Lavt rullemotstand — god drivstoffbesparelse" | "Low rolling resistance — good fuel savings" |
| `eu-label.fuel.c` | "Middels rullemotstand" | "Moderate rolling resistance" |
| `eu-label.fuel.d` | "Høyere rullemotstand" | "Higher rolling resistance" |
| `eu-label.fuel.e` | "Høyest rullemotstand — høyere drivstofforbruk" | "Highest rolling resistance — higher fuel consumption" |

### Wet Grip Explanations

| Key | NO | EN |
|-----|----|----|
| `eu-label.grip.a` | "Kortest bremselengde på vått underlag" | "Shortest braking distance on wet surfaces" |
| `eu-label.grip.b` | "God bremselengde på vått underlag" | "Good braking distance on wet surfaces" |
| `eu-label.grip.c` | "Middels bremselengde på vått underlag" | "Moderate braking distance on wet surfaces" |
| `eu-label.grip.d` | "Lengre bremselengde på vått underlag" | "Longer braking distance on wet surfaces" |
| `eu-label.grip.e` | "Lengst bremselengde på vått underlag" | "Longest braking distance on wet surfaces" |

### Noise Level Explanations

| Key | NO | EN |
|-----|----|----|
| `eu-label.noise.a` | "Lavt utvendig støynivå" | "Low exterior noise level" |
| `eu-label.noise.b` | "Middels utvendig støynivå" | "Moderate exterior noise level" |
| `eu-label.noise.c` | "Høyere utvendig støynivå" | "Higher exterior noise level" |

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Mobile (< 768px)** | Mini: bars stack vertically if card is narrow (< 200px), otherwise inline. Expanded: full-width bars, explanation text wraps freely. |
| **Tablet (768px-1024px)** | Mini: always inline. Expanded: same as mobile. |
| **Desktop (>= 1024px)** | Mini: always inline. Expanded: bars use max-width of 400px within the detail layout. |

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Container label | `aria-label="EU tire energy label"` on wrapper |
| Bar labels | `aria-label` on each progress element: e.g., "Fuel efficiency: grade A" |
| Progress value | `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` on each `<progress>` |
| Explanation toggle | `aria-expanded` on bar row, `aria-controls` pointing to explanation panel |
| Screen reader | Grade and dB value announced as text, not relying on color alone |
| Color contrast | Grade letters displayed as text alongside colored bars for color-blind users |

---

## Technical Notes

- Data source: supplier Excel import — fields `RR` (char A-E), `WG` (char A-E), `Noise` (integer dB), noise class (char A-C)
- Missing data: if any field is null/empty, that bar shows the no-data state; component still renders remaining bars
- The component accepts a `variant` prop: `"mini"` or `"expanded"` (default: `"mini"`)
- Expanded explanation toggle is purely client-side — no data fetch on expand
- Component dispatches no events — display only
- Grade-to-value mapping is defined as a shared constant for reuse in sorting/filtering logic

---

## Usage in Page Specs

Referenced as:

```markdown
| Component | [EU Label Display](../../../D-Design-System/molecules/eu-label-display.md) |
```

Used in:
- Product cards (mini variant) — search results, category listings
- Product detail page (expanded variant) — specifications section

---

_Created using Whiteport Design Studio (WDS) methodology_
