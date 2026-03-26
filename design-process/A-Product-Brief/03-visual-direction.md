# Visual Direction: Sharif.no

> Raw. Masculine. Blocky. A retro racing tribute to the father who started it all.

**Date:** 2026-03-26
**Author:** Saga (WDS Phase 1)
**Related:** [Product Brief](01-product-brief.md)

---

## Brand DNA

Sharif's visual identity comes from two sources:

1. **The existing brand** — bold red SHARIF logo, raw masculine aesthetic, blocky typography, black and white imagery. Simplistic and direct.
2. **The founder's legacy** — retro racing theme as a tribute to the father who started the company in the 1960s. Vintage pit stop energy, modernized for digital.

This is not a polished corporate brand. It's authentic, physical, working-class. Like a well-maintained garage, not a showroom.

---

## Colors

| Color | Role | Usage |
|-------|------|-------|
| **Red** | Brand primary | Logo, CTAs, price highlights, key actions |
| **Black** | Foundation | Text, backgrounds, contrast |
| **White** | Space | Background, text on dark, breathing room |
| **Gray** | Support | Secondary text, borders, subtle UI elements |

High contrast. No pastels, no gradients. The palette should feel like a vintage racing poster — bold, limited, confident.

---

## Typography Direction

- **Blocky, bold, masculine** — echoing the existing SHARIF logo character
- **High contrast** between headings and body text
- Sans-serif throughout — clean and functional
- Headings: heavy weight, possibly condensed
- Body: readable, straightforward, no decoration

Specific font selection happens in Phase 4 (UX Design) with Freya.

---

## Imagery Direction

- **Black and white photography** as the primary visual language
- **Raw, authentic** — real tires, real shops, real work. Not polished stock photos.
- **Red as accent** — the only color that breaks through the B&W (selective color technique)
- **Retro racing references** — vintage pit stop textures, racing stripe patterns, classic car details
- Product images: clean tire shots on white/neutral background (from supplier data or photographed)

---

## Interaction & Motion

The product concept drives the visual motion:

- **Parallax depth** — layers move at different speeds as user scrolls through the flow
- **Smooth transitions** — each step flows into the next, no hard cuts
- **Meaningful animation** — motion communicates position and progress, not decoration
- **Subtle depth cues** — shadows, scale changes, blur on background layers
- **Spatial navigation** — forward/back feels like moving through physical space

### Animation Principles
- Every animation has a purpose (guide, confirm, orient)
- Speed: smooth and confident, not bouncy or playful
- Easing: ease-out for entering elements, ease-in for exiting
- No animation for animation's sake

---

## Inspiration Analysis: Bythjul.com

Reference screenshots in `D-Design-System/01-Visual-Design/instpiration/`

### What to take from Bythjul

| Element | What works | Sharif adaptation |
|---------|-----------|-------------------|
| **Dimension search** | Three clear dropdowns (width, profile, rim) | Same inputs, embedded in the flow — not a traditional form |
| **Tire illustration** | Shows where to find the numbers | Keep — essential for Harriet |
| **Product list** | Clear pricing per tire, product image, basic specs | Products appear below dimension in the flow — parallax transition |
| **EU labels** | Visual rating scales (fuel, grip, noise) | Visual sliders + AI-generated story per tire — Harriet gets the story, Ole gets the data |
| **Quantity selector** | "4 st" prominently shown | Simple 2/4 toggle in the flow |
| **Checkout steps** | 1. Cart → 2. Delivery → 3. Payment | The flow IS the cart. Only payment is a hand-off. |
| **Private/Business toggle** | Clean switch at checkout | Handled by Klarna/Qliro natively |

### What to leave behind

| Element | Why not |
|---------|---------|
| Traditional store layout | Nav bar, categories, cart icon, footer — replaced by the continuous flow |
| Registration number search | Not in scope — dimension only |
| Multiple search methods | One path forward, not many |
| Tabbed product info | Tabs hide information — integrate into the flow or collapse/expand |
| Dense data tables | Replace with visual sliders and plain language |
| Recently viewed products | Not relevant in a linear flow |
| Brand grid / category tiles | Not needed — filtered list is enough |
| Blue/orange color scheme | Sharif has its own identity |

### Payment Providers Observed
- Bythjul uses **Qliro** (private) and **SVEA** (business) — not Klarna
- Added to open questions for Moohsen

---

## Visual Concept Summary

**Bythjul's functional logic + Sharif's visual DNA + the continuous parallax flow.**

Same information journey (dimension → products → details → pay), completely different experience. Bythjul is pages and clicks. Sharif is one flowing surface with spatial depth, dressed in red/black/white retro racing heritage.

---

## EU Label Presentation

The supplier data includes full EU labelling (Rolling Resistance, Wet Grip, Noise). Two presentation layers:

**For Harriet (default):** Visual sliders + AI-generated plain language story
> "Good grip in the rain, average on fuel, quiet ride. A solid everyday tire."

**For Ole (expand for details):** Technical EU label with rating scales (A-E) + dB values

The content agent generates unique product stories for each SKU from the raw data — genuine product storytelling at scale.

---

_Created using Whiteport Design Studio (WDS) methodology_
