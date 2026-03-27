# Dimension Input

**COMPONENT ID:** `mol-dimension-input`
**Atomic Level:** Molecule (3 input atoms + suggestion list + paste handler)
**Framework:** Svelte (custom component)
**Base Styling:** daisyUI `input` + `menu` + Tailwind utilities

---

## Purpose

The hero interaction of Sharif.no. Three connected input fields that guide the user through entering a tire dimension (width / profile / rim) with contextual suggestions filtered from the product database. Designed for one-hand mobile use with the native numeric keyboard.

---

## Anatomy

```
┌─────────────────────────────────────┐
│  [ width ] / [ profile ] / [ rim ]  │  Container
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  suggestion 1                       │
│  suggestion 2                       │  Suggestion List
│  suggestion 3  ←                    │  (shared, repositions
│  suggestion 4                       │   per active field)
│  ...                                │
└─────────────────────────────────────┘
         │ (rim field only)
         ▼
┌─────────────────────────────────────┐
│  R       ZR       C                 │  Letter Row
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  OS native numeric keyboard         │  inputmode="numeric"
└─────────────────────────────────────┘
```

---

## States

### Inactive (default)

The component sits within the page flow showing placeholder text.

```
┌─────────────────────────────────────┐
│  205  /  55  /  R16                 │  Placeholder (text-placeholder color)
└─────────────────────────────────────┘
```

- daisyUI: `input input-bordered input-lg w-full`
- Placeholder: `205 / 55 / R16`
- Tap anywhere → activates

### Active (field focused)

The entire component animates to the top of the viewport. The suggestion list fills the space between the field and the keyboard. Background dims.

| Property | Value |
|----------|-------|
| Animation | Slide up to top of viewport (below global header) |
| Background | Dimmed overlay behind component (brand-black, 50% opacity) |
| Keyboard | OS numeric keyboard opens (`inputmode="numeric"`) |
| Duration | 200ms ease-out |

### Field Progression

| Step | Active Field | Separator | Suggestion Source | Auto-advance |
|------|-------------|-----------|-------------------|--------------|
| 1 | **Width** | — | All widths in product DB | On exact match (e.g., typed "205" matches "205") |
| 2 | **Profile** | `/` appears | Profiles available for selected width | On exact match |
| 3 | **Rim** | `R` pre-filled | Rim sizes available for selected width+profile | On exact match → close, trigger search |

### Complete

All three fields filled. Component animates back to inline position. "Find tires" CTA activates.

### Error

Invalid combination (no products exist). Field border turns `error` color. Inline message below.

---

## Sub-Components

### Width Field

**OBJECT ID:** `dimension-input-width`

| Property | Value |
|----------|-------|
| Element | `<input>` |
| Type | `text` |
| inputmode | `numeric` |
| Pattern | `[0-9]*` |
| Max length | 3 |
| Placeholder | "205" |
| daisyUI | `input input-ghost text-xl font-bold` |
| Behavior | onInput → filter suggestion list to matching widths. On exact match → auto-focus profile field. |

### Profile Field

**OBJECT ID:** `dimension-input-profile`

| Property | Value |
|----------|-------|
| Element | `<input>` |
| Type | `text` |
| inputmode | `numeric` |
| Pattern | `[0-9]*` |
| Max length | 2 |
| Placeholder | "55" |
| daisyUI | `input input-ghost text-xl font-bold` |
| Behavior | onInput → filter suggestion list to profiles available for selected width. On exact match → auto-focus rim field. |
| Dependency | Only enabled after width is selected |

### Rim Field

**OBJECT ID:** `dimension-input-rim`

| Property | Value |
|----------|-------|
| Element | `<input>` |
| Type | `text` |
| inputmode | `numeric` |
| Pattern | `[0-9]*` |
| Max length | 2 |
| Placeholder | "16" |
| daisyUI | `input input-ghost text-xl font-bold` |
| Behavior | onInput → filter suggestion list to rims available for width+profile. On exact match → close component, trigger product search. |
| Dependency | Only enabled after profile is selected |
| Letter prefix | "R" pre-filled and displayed before this field. Letter Row shown above suggestion list for alternatives (ZR, C). |

### Separator Labels

| Element | Content | When Visible |
|---------|---------|-------------|
| Between width and profile | `/` | Always (dimmed when profile empty) |
| Before rim | Letter prefix (R, ZR, C) | Always (dimmed when rim empty) |

### Suggestion List

**OBJECT ID:** `dimension-input-suggestions`

| Property | Value |
|----------|-------|
| Element | Scrollable list |
| daisyUI | `menu menu-lg bg-base-100 shadow-lg rounded-box` |
| Max height | Fill space between field and keyboard |
| Items | Available values from product database for current step |
| Behavior | Tap item → fill field, auto-advance. Scroll for more. Active item highlighted. |
| Filter | Narrows as user types. Shows all if field is empty. |
| Data source | Product database — only values that have products in stock |

### Letter Row (Rim field only)

**OBJECT ID:** `dimension-input-letters`

| Property | Value |
|----------|-------|
| Element | Horizontal button row |
| daisyUI | `join` with `btn btn-sm` items |
| Content | `R` (default/selected), `ZR`, `C` |
| Behavior | Tap → sets the rim letter prefix. R is pre-selected. |
| Position | Between suggestion list and OS keyboard |
| Visibility | Only shown when rim field is active |

Translation keys for letters:

| Key | NO | EN |
|-----|----|----|
| `dimension.letter.r` | "R" | "R" |
| `dimension.letter.zr` | "ZR" | "ZR" |
| `dimension.letter.c` | "C (varebil)" | "C (commercial)" |

---

## Container

**OBJECT ID:** `dimension-input-container`

| Property | Value |
|----------|-------|
| Element | `<div>` wrapping all three fields + separators |
| daisyUI | `input input-bordered input-lg flex items-center gap-0` |
| Layout | Horizontal, fields flush with separators between |
| Behavior | on:paste → `handlePaste()` — intercepts paste on any field, parses full dimension string, distributes to all three fields |

---

## Paste Handler

Intercepts paste events on the container. Parses common formats:

| Input Format | Parsed As |
|-------------|-----------|
| `205/55R16` | width=205, profile=55, letter=R, rim=16 |
| `205/55 R16` | width=205, profile=55, letter=R, rim=16 |
| `205 55 16` | width=205, profile=55, letter=R (default), rim=16 |
| `205/55ZR16` | width=205, profile=55, letter=ZR, rim=16 |
| `205/55R16 91V` | width=205, profile=55, letter=R, rim=16 (load/speed ignored) |

After paste: all fields filled → component closes → product search triggered.

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Mobile (< 768px)** | Full-screen takeover when active. Field animates to top. Suggestion list fills middle. OS keyboard at bottom. |
| **Tablet (768px-1024px)** | Same full-screen behavior. Wider suggestion list. |
| **Desktop (>= 1024px)** | Dropdown suggestion list below the field (no full-screen takeover). No OS keyboard — standard text input. |

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Label | `aria-label` on container: "Tire dimension input" |
| Field labels | `aria-label` on each field: "Tire width", "Tire profile", "Rim diameter" |
| Suggestion list | `role="listbox"`, items have `role="option"` |
| Active item | `aria-selected="true"` on highlighted suggestion |
| Keyboard nav | Arrow keys navigate suggestions, Enter selects |
| Screen reader | Announces field transitions: "Width entered. Now enter profile." |

---

## Technical Notes

- Data source: product database API returns available dimensions (only in-stock)
- On width change: re-fetch profiles. On profile change: re-fetch rims.
- Debounce input: 100ms before filtering suggestion list
- Animation: CSS transform for slide-up, no layout thrash
- The three fields share one `<form>` — Enter on last field submits
- Component dispatches `dimension-complete` event with `{ width, profile, letter, rim }` when all three are filled

---

## Usage in Page Specs

Referenced as:

```markdown
| Component | [Dimension Input](../../../D-Design-System/molecules/dimension-input.md) |
```

Used in:
- [01.1-Dimension Input](../../C-UX-Scenarios/01-harriets-tire-purchase/01.1-dimension-input/01.1-dimension-input.md) — primary usage
- Future: SEO car model pages, any entry point that needs dimension input

---

_Created using Whiteport Design Studio (WDS) methodology_
