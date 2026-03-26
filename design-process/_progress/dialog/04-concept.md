# Product Concept

**Step:** 07a - Product Concept
**Completed:** 2026-03-26
**Session:** 1

---

## Core Structural Idea

One continuous, animated dialog — not a store. The experience has spatial depth (parallax, transitions, animation) that guides the customer forward and lets them move back naturally. No page reloads, no traditional e-commerce patterns. The product is the interaction itself.

## Implementation Principle

The entire order journey lives on a single surface that transforms as the customer progresses. Each step (dimension → products → selection → shop → payment → booking) is a spatial transition — parallax layers, smooth animations, depth. Moving forward and backward feels like navigating physical space, not clicking links.

- No page reloads — one interactive document
- Parallax depth as you move through the flow
- Subtle, supportive animations — not decorative, meaningful
- Filters appear as overlays, not new pages
- Back/forward = spatial movement, not browser navigation

## Rationale

Tires are not t-shirts. Traditional e-commerce patterns (browse → add to cart → checkout) don't work for a product where the customer needs guidance through a technical selection process. The existing tire sites all use store patterns and they all feel clunky. By treating it as a continuous dialog with spatial depth, the experience becomes intuitive even for someone who has never thought about tires.

## Concrete Example

Harriet enters her tire dimension. The input slides up. Products reveal beneath with a parallax shift — she's looking "deeper" into the available options. She taps the cheapest one. The view smoothly transitions to show details, EU labels explained in plain language. She picks 4. The view shifts again — which shop? She taps Fjellhamar. The "Pay" surface rises from below. After payment, the booking layer slides in. At no point did she see a loading screen or a new page.

## Features That Stem From This Concept

- Single-page application architecture (Astro + interactive island)
- Parallax/depth-based transitions between steps
- Animation system that communicates spatial position
- Overlay-based filters (not page navigation)
- No traditional cart — the flow IS the cart
- Mobile-optimized gesture navigation (swipe?)
- Clean payment hand-off at the bottom of the experience

---

## Key Signal

"Using online store patterns is not optimal for this kind of product" — the founding rejection that drives the entire concept. This is not a store. It's a guided conversation with depth.

## Reflection

- Synthesis confirmed on first attempt ("Bingo")
- No corrections needed
