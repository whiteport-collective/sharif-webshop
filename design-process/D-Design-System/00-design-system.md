# Design System: Sharif Webshop

> Components, tokens, and patterns that grow from actual usage — not upfront planning.

**Created:** 2026-03-27
**Phase:** 7 — Design System (optional)
**Agent:** Freya (Designer)

---

## What Belongs Here

The Design System captures reusable patterns that emerge during UX Design (Phase 4). It is not designed upfront — it crystallizes from real page specifications.

**What goes here:**
- **Design Tokens** — Colors, spacing, typography, shadows
- **Components** — Buttons, inputs, cards, navigation elements
- **Patterns** — Layouts, form structures, content blocks
- **Visual Design** — Mood boards, design concepts, color and typography explorations
- **Assets** — Logos, icons, images, graphics

**What does NOT go here:**
- Page-specific content (that lives in `C-UX-Scenarios/`)
- Business logic or API specs (that's BMM territory)
- Aspirational components nobody uses yet

**When to skip this phase:**
- Using shadcn/ui or Material UI → the library IS your design system
- Simple sites with Tailwind → tokens in `tailwind.config` are enough

**Learn more:**
- WDS Course Module 12: Functional Components — Patterns Emerge
- WDS Course Module 13: Design System

---

## Folder Structure

```
D-Design-System/
├── 00-design-system.md          ← This file (hub + guide)
├── 01-Visual-Design/            [Early design exploration]
│   ├── mood-boards/             [Visual inspiration, style exploration]
│   ├── design-concepts/         [NanoBanana outputs, design explorations]
│   ├── color-exploration/       [Color palette experiments]
│   └── typography-tests/        [Font pairing and hierarchy tests]
├── 02-Assets/                   [Final production assets]
│   ├── logos/                   [Brand logos and variations]
│   ├── icons/                   [Icon sets]
│   ├── images/                  [Photography, illustrations]
│   └── graphics/                [Custom graphics and elements]
├── atoms/                       [Level 1: smallest building blocks]
├── molecules/                   [Level 2: groups of atoms]
├── organisms/                   [Level 3: complex components]
├── templates/                   [Level 4: page-level layouts]
├── pages/                       [Level 5: concrete page instances]
└── catalog.html                 [Visual component catalog — open in browser]
```

**01-Visual-Design/** is used early — before or during scenarios — for exploring visual direction. Mood boards, color palettes, typography tests, and AI-generated design concepts live here.

**02-Assets/** holds final, production-ready assets. Logos, icons, images, and graphics that are referenced from page specifications.

**Component folders** use [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/) (Brad Frost) — five levels that grow organically during Phase 4 as patterns emerge:

1. **atoms/** — Indivisible elements (buttons, badges, labels, icons)
2. **molecules/** — Functional groups of atoms (form fields, heading groups, CTAs)
3. **organisms/** — Complex compositions (headers, footers, cards, carousels)
4. **templates/** — Page-level layouts (page shell, section container, grid layouts)
5. **pages/** — Concrete instances with real content and data (homepage, contact page)

Each component gets its own `.md` file with a readable ID (e.g., `btn-primary-cta`, `crd-trust`, `hdr-mobile`). The folder IS the classification — no separate grouping needed.

---

## For Agents

**Workflow:** `_bmad/wds/workflows/7-design-system/workflow.md`
**Agent trigger:** `DS` (Freya)
**Router:** `_bmad/wds/workflows/7-design-system/design-system-router.md`
**Templates:** `_bmad/wds/workflows/7-design-system/templates/`
**Guide:** `_bmad/wds/data/agent-guides/freya/design-system.md`

**Before creating any component:**
1. Check if it already exists in the chosen component library
2. Look at actual usage in `C-UX-Scenarios/` page specs — extract, don't invent
3. Load the component template from the workflow templates folder

**File naming:** Number all documents with a two-digit prefix: `01-design-tokens.md`, `02-button.md`, etc. Update the sections below as each file is created.

**Harm:** Designing an abstract component library before any pages exist. Components without real usage are decoration. They waste time and create maintenance burden for patterns nobody needs.

**Help:** Extracting patterns from real page specs. When three pages use similar card layouts, that's a component. The design system documents what emerged, making future pages faster and more consistent.

---

## Spacing Scale

> **8px grid.** Raw, blocky spacing that matches the masculine, retro racing aesthetic. Mobile-first — comfortable touch targets on small screens.

Nine tokens, symmetric around `space-md` (the baseline).

`space-md` is to spacing what `text-md` is to typography — the default you reach for first. It's the gap between paragraphs, between form fields, between list items. Everything else is relative to it: `space-sm` is tighter, `space-lg` is more generous.

| Token | Value | Use |
|-------|-------|-----|
| space-3xs | 2px | Hairline gaps (icon-to-label, inline elements) |
| space-2xs | 4px | Minimal spacing (badge padding, tight lists) |
| space-xs | 8px | Tight spacing (within compact groups) |
| space-sm | 12px | Small gaps (between related elements) |
| **space-md** | **16px** | **Default element spacing (the baseline)** |
| space-lg | 24px | Comfortable spacing (card padding, form fields) |
| space-xl | 32px | Section padding |
| space-2xl | 48px | Section gaps |
| space-3xl | 64px | Page-level breathing room |

### Optical adjustments

Sometimes the math is right but the eye says it's wrong. A circular image leaves white corners, a light element on a light background looks more spaced than it is. When this happens, use token math — not raw pixels:

```
space-lg - space-3xs    → "standard spacing, pulled in by a hairline"
space-xl + space-2xs    → "section padding, nudged out slightly"
```

In page specs, always annotate why:

| Padding top | **space-lg - space-3xs** (optical: circular image adds perceived whitespace) |

**Rules:**
- Adjustments always use token math: `base ± correction`
- Always annotate the reason — future readers need to know this wasn't a mistake
- If adjusting by more than one step, the base token is probably wrong — reconsider

In CSS: `calc(var(--space-lg) - var(--space-3xs))`

---

## Type Scale

> **Bold, condensed sans-serif for headings.** Visual weight and blocky proportions reinforce the retro racing heritage. Body text stays clean and readable at mobile sizes.

Nine tokens, symmetric around `text-md` (body text).

The type scale controls **visual size** — how big text looks. This is separate from semantic level (H1, H2, p) which controls **document structure**. An H2 in a sidebar might be `text-sm`. A tagline might be a `<p>` at `text-2xl`. The semantic level is for accessibility and SEO; the type token is for visual hierarchy.

Headings can have different typefaces, weights, and styles on different pages. A landing page H1 might be a serif display font at `text-3xl` italic. An admin page H1 might be clean sans-serif at `text-lg` medium. Each page spec declares its own typographic treatment — the type scale provides the shared sizing vocabulary.

| Token | Value | Use |
|-------|-------|-----|
| text-3xs | 10px | Fine print, legal text |
| text-2xs | 11px | Metadata, timestamps |
| text-xs | 12px | Captions, helper text |
| text-sm | 14px | Labels, secondary text |
| text-md | 16px | Body text (the baseline) |
| text-lg | 18px | Emphasis, lead paragraphs |
| text-xl | 22px | Subheadings |
| text-2xl | 28px | Section titles, display text |
| text-3xl | 36px | Hero headings, page titles |

> **Tailwind CSS projects:** Tailwind's built-in `text-xs`, `text-sm`, `text-lg`, `text-xl` utilities set font-size and collide with these token names. Use `heading-*` as prefix instead: `heading-3xs` through `heading-3xl`. The scale stays identical — only the prefix changes. Body text and captions keep their own names since they don't collide.

---

## Tokens

### Colors

#### Brand

| Token | Value | Use |
|-------|-------|-----|
| brand-primary | #e03131 | Red — CTAs, logo, accents |
| brand-black | #1e1e1e | Text, dark backgrounds |
| brand-white | #ffffff | Backgrounds, text on dark |
| brand-gray | #868e96 | Secondary text, subtle UI |

#### Surfaces

| Token | Value | Use |
|-------|-------|-----|
| surface-default | #ffffff | Primary background |
| surface-muted | #f8f9fa | Alternate rows, card backgrounds |
| surface-subtle | #f1f3f5 | Inset areas, secondary panels |

#### Borders

| Token | Value | Use |
|-------|-------|-----|
| border-default | #dee2e6 | Standard borders |
| border-subtle | #e9ecef | Light dividers, soft separators |

#### Status

| Token | Value | Use |
|-------|-------|-----|
| success | #51cf66 | In stock |
| warning | #fcc419 | Low stock, EU label mid |
| info | #74c0fc | Noise level |

#### Text

| Token | Value | Use |
|-------|-------|-----|
| text-primary | #1e1e1e | Default body text |
| text-secondary | #495057 | Supporting text, descriptions |
| text-muted | #868e96 | De-emphasized text, timestamps |
| text-placeholder | #ced4da | Input placeholders |
| text-inverse | #ffffff | Text on dark/brand backgrounds |

### Borders and radius

| Token | Value | Use |
|-------|-------|-----|
| border-width-default | 1px | Standard strokes and dividers |
| border-width-strong | 2px | Selected states and stronger emphasis |
| radius-sm | 4px | Small thumbnails, compact handles |
| radius-md | 8px | Inputs, summary cards, inset panels |
| radius-lg | 12px | Primary cards, CTAs, highlighted surfaces |
| radius-xl | 16px | Large embeds or provider containers |
| radius-pill | 999px | Pills, slot chips, drag handles |

### Elevation and effects

| Token | Value | Use |
|-------|-------|-----|
| elevation-card | 0 8px 24px rgba(30, 30, 30, 0.08) | Product cards and lifted surfaces |
| elevation-overlay | 0 24px 64px rgba(30, 30, 30, 0.16) | Drawers, modals, major overlays |
| blur-sm | 4px | Background blur behind overlay scrims |
| scrim-soft | rgba(30, 30, 30, 0.4) | Dims content behind overlay without killing context |

### Sizing and layout constraints

| Token | Value | Use |
|-------|-------|-----|
| touch-target-md | 56px | Minimum tap target for primary controls |
| touch-target-lg | 80px | Minimum tap target for selectable location cards |
| thumb-size-md | 56px | Product thumbnail in compact summaries |
| drag-handle-width-sm | 40px | Drawer handle width |
| drag-handle-height-xs | 4px | Drawer handle height |
| card-min-width-sm | 260px | Mobile card width in swipe surfaces |
| content-max-sm | 500px | Narrow desktop-centered single column |
| content-max-md | 520px | Desktop drawer / focused flow width |
| content-max-lg | 600px | Tablet drawer / centered content width |
| sheet-height-tall | 90vh | Product drawer height on mobile |

### Responsive breakpoints

| Breakpoint | Value | Role |
|------------|-------|------|
| mobile | < 768px | Primary — touch-first, single column |
| tablet | 768px–1024px | Intermediate — two columns where useful |
| desktop | >= 1024px | Full layout — multi-column, wider cards |

### Language

| Code | Language | Role |
|------|----------|------|
| NO | Norwegian | Primary |
| EN | English | Secondary |

---

## Patterns

Spacing objects are first-class — they have IDs in page specs (e.g., `hem-v-space-xl`) and live here organized by value. Each spacing value accumulates the situations where it's used. The list grows from real design decisions.

### Continuous parallax surface

The Harriet flow treats `01.1` through `01.6` as one continuous shopping journey. Each step can change layout dramatically, but the user should still feel that she is moving down a single guided surface rather than jumping between unrelated pages.

### Sticky CTA bar

Used when the main decision is made in scrollable content but the commit action must stay visible. The CTA bar uses `surface-default`, `border-subtle`, `space-lg` horizontal padding, and safe-area bottom spacing.

### Selection card group

Used for shops and booking slots where one option should read as obviously selected. Selected state uses `border-width-strong`, `brand-primary`, and a muted branded background instead of introducing a second component family.

### External checkout handoff

Sharif-owned UI ends before payment provider UI begins. The Sharif spec still documents payload, return URLs, and state transitions, but does not restyle provider-owned modules.

### Confirmation-to-booking transition

Post-payment confirmation should keep momentum by confirming success, preserving order context, and presenting the booking action immediately. This pattern is optimistic, celebratory, and screenshot-friendly.

---

## Components

Page specs should link to these component anchors. Variants in page specs inherit from the closest matching foundation here unless a dedicated component file is later extracted.

### Brand Logo

Sharif wordmark used in headers and confirmation surfaces. Keeps brand continuity on owned surfaces.

### Language Toggle

Compact NO/EN switch. Must preserve current page context while swapping copy.

### Icon Button

Small touch-first icon action for support, close, and secondary utilities.

### Cart Icon with Badge

Cart shortcut with optional item count badge. Should never overpower the primary CTA on transactional steps.

### Hamburger Menu

Compact overflow navigation used only when the owned header needs broader site access.

### Text Input

Primary text-entry field for dimension entry and other direct user input.

### Dropdown Group

Container that aligns related select inputs as a single decision block.

### Select Dropdown

Standard discrete option selector. Use for constrained value sets such as tire width/profile/rim.

### Text Link

Low-weight inline or centered link used for edit, help, and defer actions.

### Primary Button

Main conversion action. Full-width on mobile purchase steps, always touch-first.

### Secondary Button

Lower-emphasis action used for filters and utility choices where the page has a stronger primary action elsewhere.

### Toggle Button Group

Mutually exclusive binary or small-set choice group. Handles shared layout and equal-width options.

### Toggle Button

Single selectable pill or tile within a toggle group or slot selector.

### Badge

Small status indicator for stock or success states. Color always comes from status tokens.

### Card

Elevated rounded content surface for product previews and grouped commercial information.

### Selectable Card

Card pattern that acts as a tap target. Selected state is expressed through border and background tokens rather than extra iconography.

### Horizontal Scroll Container

Snap-based mobile carousel that hints additional content with peeked cards.

### Bottom Sheet Drawer

Mobile-native overlay surface for focused product detail or step-specific decisions.

### Drag Handle Bar

Short pill-shaped handle signaling draggable dismissal on drawers.

### Calendar

Month-view booking surface for date selection. Highlights availability and selected state clearly at a glance.

### Slot Grid

Dense but touch-safe layout for time-slot choices below the calendar.

### Image

General image treatment for product photography, thumbnails, and simple placeholders.

### Text

Base textual component family for body copy, secondary labels, helper text, and compact summaries.

### H1 Heading

Primary page or section title. In this flow it typically uses the bold condensed display treatment.

### H2 Heading

Section heading used inside transactional flows and post-purchase confirmation.

### H3 Heading

Compact card-level heading used for product names and other tertiary structure.

### Price Display

Prominent numeric treatment for price-first commerce presentation.

### EU Label Compact

Three-column summary of fuel, grip, and noise data for skim-level comparison.

### Mini Slider

Small non-interactive meter used inside card-level EU label summaries.

### EU Label Slider

Expandable meter with explanation copy for product-detail interpretation.

### External Checkout Handoff

Sharif-owned container or redirect frame that initiates provider checkout without redefining provider UI.

### Provider Module

Provider-owned checkout section such as customer ID, payment method, or address entry.

### Data Contract

Structured payload passed from Sharif to external systems. Treated as a first-class spec object even when not rendered.

### Return URL Parameter

Named redirect value that carries order and state context back into Sharif-owned flows.

### Flex Row

Horizontal utility container for tightly coupled summary values such as price plus stock.

---

_Created using Whiteport Design Studio (WDS) methodology_
