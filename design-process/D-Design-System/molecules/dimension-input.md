# Dimension Input

**COMPONENT ID:** `mol-dimension-input`
**Atomic Level:** Molecule (3 constrained segment atoms + paste handler)
**Framework:** React / Next.js (client component)
**Base Styling:** Tailwind CSS, Medusa UI tokens

---

## Purpose

The hero interaction of Sharif.no. Three connected segments that guide the user through selecting a tire dimension (width / profile / rim) from values that exist in the product database. **Error-free by design** — the user can only reach combinations that have products in stock. No empty results page is possible.

---

## The No-Error Guarantee

The component receives `availableDimensions: string[]` from the server (e.g. `["185/65R14", "205/55R16", "265/60R18"]`). It derives the cascading valid values:

1. **Width options** — all unique widths from `availableDimensions`
2. **Profile options** — profiles where `width/profile*` exists in `availableDimensions`
3. **Rim options** — rims where `width/profileR*` exists in `availableDimensions`

Every combination a user can reach has products. The "Finn dekk" button only activates when all three are filled. It is impossible to submit a dimension with zero results.

---

## Anatomy

```
┌──────────────────────────────────────┐
│  [ 205 ] / [ 55 ] / R[ 16 ]         │  Segment row (looks like one field)
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  185        ← other valid widths     │
│  195                                 │  Dropdown / scroll picker
│▶ 205  ←  selected                   │  (opens on tap/click)
│  215                                 │
│  225                                 │
└──────────────────────────────────────┘
```

The container looks and feels like one input field. The `/` and `R` separators are decorative — they are not interactive.

---

## States

### Empty (default)

All three segments show placeholder values. "Finn dekk" button is disabled.

```
┌──────────────────────────────────────┐
│  Bredde / Profil / Felg              │  Placeholder text (muted)
└──────────────────────────────────────┘
```

### Width Active

Width segment is highlighted. Dropdown/picker shows all available widths.

```
┌──────────────────────────────────────┐
│ [205▼] / ··· / ···                  │  Width focused
└──────────────────────────────────────┘
  ↓ Dropdown
  185 / 195 / 205 / 215 / 225 / 235 …
```

### Profile Active

Width is filled. Profile segment highlighted. Dropdown shows only profiles compatible with selected width.

```
┌──────────────────────────────────────┐
│  205 / [55▼] / ···                  │  Profile focused
└──────────────────────────────────────┘
  ↓ Dropdown (filtered to width=205)
  45 / 50 / 55 / 60 / 65
```

### Rim Active

Width and profile are filled. Rim segment highlighted. Dropdown shows only rims compatible with width+profile.

```
┌──────────────────────────────────────┐
│  205 / 55 / R[16▼]                  │  Rim focused
└──────────────────────────────────────┘
  ↓ Dropdown (filtered to width=205 + profile=55)
  15 / 16 / 17
```

### Complete

All three filled. "Finn dekk" button activates.

```
┌──────────────────────────────────────┐
│  205 / 55 / R16                ✓    │
└──────────────────────────────────────┘

  [========= Finn dekk =========]  ← enabled
```

---

## Sub-Components

### Segment Container

**OBJECT ID:** `mol-dimension-input-container`

| Property | Value |
|----------|-------|
| Element | `<div>` with flex row layout |
| Visual | Single rounded box with border — looks like one `<input>` |
| Styling | `flex items-center gap-0 border rounded-lg px-4 py-3` |
| Behavior | `onPaste` on container → `handlePaste()` |

### Width Segment

**OBJECT ID:** `mol-dimension-input-width`

| Property | Value |
|----------|-------|
| Element | `<input type="text" inputMode="numeric">` |
| Suggestions | All unique widths from `availableDimensions` |
| Placeholder | "205" |
| onChange | Filter suggestion list to widths starting with typed value. Reset profile and rim. |
| Auto-advance | When exactly one suggestion remains AND it equals the typed value → select it, focus profile |

### Separator (/ and R)

| Element | Content | Visibility |
|---------|---------|------------|
| `/` | Static text | Always visible (muted until width is filled) |
| `R` | Static text | **Only shown when rim has a value** — hidden when rim is empty |

**Letter-prefix handling in rim input:** The rim field accepts any leading letter combination the user might type from their tire sidewall:

| User types | Stored / used as |
|------------|-----------------|
| `16` | `16` |
| `R16` | `16` |
| `ZR16` | `16` |
| `C16` | `16` |
| `CL16` | `16` |
| `L16` | `16` |

All leading letters are stripped before filtering suggestions, auto-advance, and building the search URL. The static `R` separator to the left of the rim field hides whenever the user has typed any leading letter themselves, to avoid displaying `RR16` or `ZRR16`. The user never needs to type any letter — but they can, and it works.

### Profile Segment

**OBJECT ID:** `mol-dimension-input-profile`

| Property | Value |
|----------|-------|
| Element | `<input type="text" inputMode="numeric">` |
| Suggestions | Profiles where `{width}/profile*` exists in dimensions |
| Placeholder | "55" |
| Disabled | Until width is selected |
| onChange | Filter suggestion list to profiles starting with typed value. Reset rim. |
| Auto-advance | When exactly one suggestion remains AND it equals the typed value → select it, focus rim |

### Rim Segment

**OBJECT ID:** `mol-dimension-input-rim`

| Property | Value |
|----------|-------|
| Element | `<input type="text" inputMode="numeric">` |
| Suggestions | Rims where `{width}/{profile}R*` exists in dimensions |
| Placeholder | "16" |
| Disabled | Until profile is selected |
| onChange | Filter suggestion list to rims starting with typed value. |
| Auto-advance | When exactly one suggestion remains AND it equals the typed value → select it, enable submit |

### Auto-Advance Rule

Fires on every keystroke in any segment. Condition: `matches.length === 1 && matches[0] === typedValue`. Effect: programmatically selects the value, moves focus to the next segment (or enables submit on rim). This means a user who types "205" digit by digit will land on the profile field as soon as "205" is unambiguous — without pressing Tab or clicking.

### Valid-Value Requirement

A segment's value is only considered **set** when it matches an entry in the suggestions list for that segment. Typing a value that is not in the list keeps the segment in an invalid state — the submit button does not activate.

| Scenario | Result |
|----------|--------|
| User types `205`, suggestions include `205` | Width is set ✓ |
| User types `206`, no suggestion matches | Width is invalid — button stays disabled |
| User types `ZR16`, stripped to `16`, suggestions include `16` | Rim is set ✓ |
| User types `ZR25`, stripped to `25`, no suggestion matches | Rim is invalid — button stays disabled |

**Letter prefixes** (R, ZR, C, CL, L, etc.) are stripped before validation. The physical rim number is what is matched. This is correct because ZR/C/LT designations describe the tire's construction or load rating, not the rim diameter — the same physical rim size fits a `205/55R16` and a `205/55ZR16`.

**The button activates only when all three stripped values exist in the available options for their segment.**

### Cascade-Clear Rule

When the user edits a segment that already has a value (by backspacing, clearing, or changing it), all downstream segments are cleared immediately.

| Segment edited | Segments cleared |
|----------------|-----------------|
| Width | Profile + Rim |
| Profile | Rim |
| Rim | — |

**Rationale:** Profile options are filtered by width. Rim options are filtered by width + profile. If width changes, the previously selected profile may no longer be valid — clearing prevents impossible combinations from reaching the search.

**UX:** The user sees the dependent fields go blank as soon as they modify the upstream field. They must re-select from the freshly filtered list.

---

## Paste Handler

Bonus enhancement. If the user pastes a dimension string anywhere on the component, it is parsed and distributed to all three segments.

| Input Format | Parsed As |
|-------------|-----------|
| `205/55R16` | width=205, profile=55, rim=16 |
| `205/55 R16` | width=205, profile=55, rim=16 |
| `205 55 16` | width=205, profile=55, rim=16 |
| `205/55R16 91V` | width=205, profile=55, rim=16 (load/speed ignored) |

After a successful paste: if the resulting combination exists in `availableDimensions`, all three fields fill and the submit button activates. If the pasted combination does not exist, no change (the user sees the empty form and must select manually).

---

## Cascading Filter Logic

```typescript
// Derived from availableDimensions: string[] (format: "205/55R16")
const widths = [...new Set(availableDimensions.map(d => d.split('/')[0]))]
  .sort((a, b) => Number(a) - Number(b))

const profilesFor = (width: string) =>
  [...new Set(
    availableDimensions
      .filter(d => d.startsWith(width + '/'))
      .map(d => d.split('/')[1].replace(/R\d+/, ''))
  )].sort((a, b) => Number(a) - Number(b))

const rimsFor = (width: string, profile: string) =>
  [...new Set(
    availableDimensions
      .filter(d => d.startsWith(`${width}/${profile}R`))
      .map(d => d.split('R')[1])
  )].sort((a, b) => Number(a) - Number(b))
```

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Mobile (< 768px)** | Native OS `<select>` pickers — scroll wheel on iOS, list on Android. Touch-native, no custom JS needed. |
| **Desktop (>= 1024px)** | Styled `<select>` dropdowns inline. No overlay needed. |

---

## Props Interface

```typescript
type DimensionInputProps = {
  availableDimensions: string[]  // e.g. ["205/55R16", "265/60R18", ...]
  onSearch: (width: string, profile: string, rim: string) => void
}
```

`availableDimensions` is fetched server-side on the homepage (or any entry point) and passed as a prop to this client component. It is static per page load — no client-side API calls needed.

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Label | Visible label or `aria-label` for each `<select>`: "Tire width", "Tire profile", "Rim diameter" |
| Keyboard nav | Tab moves between segments; native `<select>` keyboard works as-is |
| Screen reader | Each `<select>` announces its options naturally |
| Disabled state | `disabled` attribute on profile and rim until their dependency is met |

---

## Usage

```tsx
// In Next.js server component (e.g. app/[countryCode]/(main)/page.tsx)
const { response } = await listProducts({ countryCode, queryParams: { limit: 500 } })

const dimensions = response.products
  .filter(p => p.metadata?.width && p.metadata?.profile && p.metadata?.rim)
  .map(p => `${p.metadata.width}/${p.metadata.profile}R${p.metadata.rim}`)
  .filter((v, i, arr) => arr.indexOf(v) === i)
  .sort()

// Passed to client component
<DimensionInput availableDimensions={dimensions} />
```

---

## Referenced In

- [01.1-Dimension Input](../../C-UX-Scenarios/01-harriets-tire-purchase/01.1-dimension-input/01.1-dimension-input.md) — primary usage on homepage

---

_Updated: 2026-04-02 — Technology updated from Svelte/Astro to React/Next.js. Design updated from free-text input to constrained cascading selector (no-error guarantee)._
