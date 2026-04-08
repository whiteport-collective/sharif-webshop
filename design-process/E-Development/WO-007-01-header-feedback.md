# WO-007-01 — Header Feedback Round 1

**Parent:** WO-007 (Header Refactor)
**Date:** 2026-04-08

---

## FB-01: Desktop persistent columns for menu and chat

**Status:** In progress

**Description:** On desktop (lg+), the main menu and agent chat should be persistent side columns that make the content section narrower — not overlays. Clicking the menu/chat button expands the column; clicking again collapses it. Menu button turns red when expanded.

**Breakpoint behavior:**

| Viewport | Menu | Chat |
|----------|------|------|
| Desktop (lg+ / ≥1024px) | Persistent left column, expands/collapses | Persistent right column, expands/collapses |
| Tablet (md–lg / 768–1023px) | Temporary overlay panel | Temporary overlay panel |
| Mobile (<md / <768px) | Horizontal bar below header | Temporary overlay panel |

**Layout on desktop:**
```
┌──────────────────────────────────────────────────────┐
│                    Header (full width)                │
├────────┬─────────────────────────────┬───────────────┤
│  Menu  │       Content area          │    Chat       │
│  col   │    (FlowShell surface)      │    col        │
│ ~240px │        flex-1               │   ~360px      │
│        │                             │               │
│ toggle │                             │  toggle       │
│ expand │                             │  expand       │
└────────┴─────────────────────────────┴───────────────┘
```

**Menu button active state:** Red background when menu column is expanded (same Sharif red as "Finn dekk" button).

**What changes:**
- FlowShell body becomes a horizontal flex row (header stays above)
- Left column: menu content (currently just "Ring oss" link — will grow)
- Center: existing scroll surface with home/results/checkout sections
- Right column: AgentPanel (already built, just needs column mount point)
- On lg+, columns are in-flow (push content). Below lg, they overlay.

---

## FB-02: Full-height menu with hamburger relocation

**Status:** Done

**Description:** The menu column should run from top to bottom of the viewport, not below the header. When the menu opens, the header shifts right and the hamburger button relocates into the menu column as the close control. When the user scrolls to the product results (`activeSection` becomes `"results"`), the menu auto-closes.

**Before:** Menu column sits below the header. Hamburger stays in the header.
**After:** Menu column spans full viewport height. Header pushes right. Hamburger moves inside the menu. Auto-closes on results scroll.

---

## FB-03: Dimension chip should be left-aligned, not centered

**Status:** Done

**Description:** The dimension label (205/55R16 etc.) is currently centered in the header. It should be left-aligned (after the logo) to leave the center free for checkout step titles like "Levering", "Betaling".
