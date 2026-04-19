# WO-011 - Scroll-Back Chip Navigation

**Status:** Ready  
**Priority:** Medium  
**Assigned to:** Codex  
**Branch:** freya/fix-back-to-results (implement here, or new branch from it)

---

## Problem

The current back navigation triggers automatically when the user scrolls up past a threshold. This is fragile — momentum scroll can fire it unintentionally. The backLocked ref (600ms) mitigates it but the gesture remains invisible and surprising.

## Proposed UX

1. **User scrolls up** → a "Tilbake" chip animates down from the top of the screen
2. **User clicks the chip** → navigate back (scroll to previous section, update state)
3. **User continues scrolling up past threshold** → chip stays visible, normal scroll-through happens — back navigation fires as before when threshold is crossed
4. **User scrolls back down** → chip hides

The chip is a hint/reinforcement layer, not a blocker. The existing scroll gesture still works if the user scrolls all the way through.

## Design Spec

**Chip appearance:**
- Fixed position, top center of screen
- Slides down from above (translate-y animation, ~200ms ease-out)
- Dark pill shape: `bg-gray-900 text-white` — matches existing back button style
- Contains: `← Tilbake` (arrow + label)
- Disappears when scrolling down (slides back up, ~150ms)

**Show condition:** `canNavigateBack(appState) && scrollingUp && !atTop`
- `scrollingUp`: last scroll delta was negative (upward)
- `atTop`: scrollTop of surface is near 0 (within 20px)

**Hide conditions:**
- User scrolls downward
- Back navigation fires (section changes)
- `canNavigateBack` returns false

## Implementation Notes

- Add `scrollDirection` state derived from scroll events on `surfaceRef`
- Track `lastScrollTop` ref to compute direction
- Chip is rendered in FlowShell `index.tsx`, positioned relative to the `surfaceRef` container or fixed to viewport
- The existing scroll-up back gesture in `handleScroll` remains — chip is additive, not a replacement
- Use `framer-motion` if available, otherwise CSS transition classes

## Files to Touch

- `storefront/src/modules/home/components/flow-shell/index.tsx` — add scroll direction tracking, chip render
- New component: `storefront/src/modules/home/components/flow-shell/scroll-back-chip.tsx`

## Acceptance Criteria

- [ ] Chip appears when scrolling up in results or checkout section (where back is possible)
- [ ] Chip does not appear on home/landing section
- [ ] Chip does not appear after checkout is complete
- [ ] Click chip → navigates back correctly
- [ ] Continuing to scroll up → normal back gesture still fires at threshold
- [ ] Scrolling down → chip hides cleanly
- [ ] No visual regression on existing header/results/checkout layout
