# Global Header

**COMPONENT ID:** `org-global-header`
**Atomic Level:** Organism (logo atom + language toggle molecule + support button atom + cart indicator molecule + hamburger menu atom)
**Framework:** Svelte (custom component)
**Base Styling:** daisyUI `navbar` + `swap` + `indicator` + `drawer` + Tailwind utilities

---

## Purpose

The persistent navigation bar displayed across all views on Sharif.no. Provides brand identity (Sharif logo), language switching (Norwegian/English), quick access to phone support, shopping cart with item count badge, and a hamburger menu for secondary navigation. Fixed to the top of the viewport on all screen sizes.

---

## Anatomy

```
┌──────────────────────────────────────────────────────────┐
│  [Logo]       [NO|EN]   [Support]   [Cart 🔴]   [☰]    │  navbar
└──────────────────────────────────────────────────────────┘
                                                     │
                                                     ▼
                                        ┌──────────────────┐
                                        │  Menu item 1     │
                                        │  Menu item 2     │  drawer
                                        │  Menu item 3     │  (slide-in)
                                        │  ...             │
                                        └──────────────────┘
```

---

## States

### Default

The header sits fixed at the top of the viewport. All interactive elements are in their resting state.

```
┌──────────────────────────────────────────────────────────┐
│  SHARIF        🇳🇴       📞💬       🛒(2)        ☰      │
└──────────────────────────────────────────────────────────┘
```

- daisyUI: `navbar bg-base-100 shadow-sm fixed top-0 z-50`
- Logo: Sharif wordmark in brand-primary (red)
- All elements vertically centered

### Menu Open

Hamburger activates the drawer overlay. Menu slides in from the right. Background dims.

| Property | Value |
|----------|-------|
| Animation | Slide in from right, 200ms ease-out |
| Background | Dimmed overlay (brand-black, 50% opacity) |
| Close | Tap overlay, tap X, or swipe right |

### Cart Empty

Cart icon visible but no badge indicator shown.

### Cart With Items

Badge shows item count on the cart icon.

---

## Sub-Components

### Logo

**OBJECT ID:** `org-header-logo`

| Property | Value |
|----------|-------|
| Element | `<a>` wrapping `<img>` or `<svg>` |
| Content | Sharif wordmark |
| Color | `text-primary` (brand red) |
| daisyUI | Part of `navbar-start` |
| Behavior | Tap → navigate to home / landing page |
| Size | Height 32px mobile, 40px desktop |

### Language Toggle

**OBJECT ID:** `org-header-lang`

| Property | Value |
|----------|-------|
| Element | `<label>` wrapping daisyUI `swap` |
| daisyUI | `swap swap-rotate` |
| States | `swap-on`: EN flag (🇬🇧), `swap-off`: NO flag (🇳🇴) |
| Behavior | Tap → toggles site language between Norwegian and English. Persists to `localStorage`. |
| Default | Norwegian (NO) |

Translation keys:

| Key | NO | EN |
|-----|----|----|
| `header.lang.no` | "Norsk" | "Norwegian" |
| `header.lang.en` | "English" | "Engelsk" |
| `header.lang.toggle_label` | "Bytt språk" | "Switch language" |

### Support Button

**OBJECT ID:** `org-header-support`

| Property | Value |
|----------|-------|
| Element | `<button>` |
| daisyUI | `btn btn-ghost btn-circle` |
| Icons | Phone + speech bubble (combined icon) |
| Behavior | Tap → opens support contact options (phone number, chat) |

Translation keys:

| Key | NO | EN |
|-----|----|----|
| `header.support.label` | "Kundeservice" | "Support" |
| `header.support.phone` | "Ring oss" | "Call us" |

### Cart Indicator

**OBJECT ID:** `org-header-cart`

| Property | Value |
|----------|-------|
| Element | `<a>` or `<button>` wrapping icon |
| daisyUI | `btn btn-ghost btn-circle indicator` |
| Badge | `indicator-item badge badge-primary badge-sm` |
| Badge content | Item count (number). Hidden when 0. |
| Icon | Shopping cart icon |
| Behavior | Tap → navigate to cart / order summary view |

Translation keys:

| Key | NO | EN |
|-----|----|----|
| `header.cart.label` | "Handlekurv" | "Cart" |
| `header.cart.badge_label` | "{count} varer" | "{count} items" |

### Hamburger Menu

**OBJECT ID:** `org-header-menu`

| Property | Value |
|----------|-------|
| Element | `<label>` for drawer toggle |
| daisyUI | `btn btn-ghost btn-circle` |
| Icon | Hamburger (three lines) |
| Behavior | Tap → opens drawer from right side |

### Drawer (Mobile Menu)

**OBJECT ID:** `org-header-drawer`

| Property | Value |
|----------|-------|
| Element | daisyUI `drawer drawer-end` |
| daisyUI | `drawer-side` with `menu` inside |
| Width | 80vw mobile, 320px tablet+ |
| Content | Navigation links, language toggle (duplicate), support info |
| Behavior | Swipe right or tap overlay to close |

Translation keys for menu items:

| Key | NO | EN |
|-----|----|----|
| `header.menu.home` | "Hjem" | "Home" |
| `header.menu.about` | "Om oss" | "About us" |
| `header.menu.faq` | "Vanlige spørsmål" | "FAQ" |
| `header.menu.contact` | "Kontakt" | "Contact" |
| `header.menu.close` | "Lukk meny" | "Close menu" |

---

## Container

**OBJECT ID:** `org-header-container`

| Property | Value |
|----------|-------|
| Element | `<header>` wrapping `navbar` |
| daisyUI | `navbar bg-base-100 shadow-sm` |
| Position | `fixed top-0 left-0 right-0 z-50` |
| Height | 64px (4rem) |
| Layout | `navbar-start` (logo), `navbar-end` (lang + support + cart + menu) |
| Spacing | Page content gets `pt-16` to account for fixed header |

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| **Mobile (< 768px)** | All elements visible. Compact spacing. Hamburger menu is primary navigation. Logo scales to 32px height. |
| **Tablet (768px-1024px)** | Same layout, slightly more spacing between elements. Drawer width 320px. |
| **Desktop (>= 1024px)** | Hamburger may expand to inline navigation links. Drawer still available as fallback. Logo 40px height. |

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Landmark | `<header>` element with `role="banner"` |
| Navigation | `<nav>` inside header with `aria-label="Main navigation"` |
| Logo link | `aria-label="Sharif — go to home page"` |
| Language toggle | `aria-label` from `header.lang.toggle_label` |
| Cart badge | `aria-label` from `header.cart.badge_label` with count |
| Menu button | `aria-expanded` reflects drawer state, `aria-controls` references drawer ID |
| Drawer | `role="dialog"`, `aria-modal="true"` when open |
| Focus trap | When drawer is open, focus is trapped within drawer |
| Keyboard nav | Tab cycles through header items. Escape closes drawer. |

---

## Technical Notes

- Header is rendered in the root layout — present on all pages
- Cart badge count is reactive, bound to cart store
- Language toggle updates a global `locale` store and triggers re-render of all translated strings
- Drawer shell can use daisyUI's checkbox-based toggle pattern, but JS enhancement is required for focus trap and Escape-to-close behavior
- Z-index 50 ensures header stays above all page content and modals use z-60+
- Shadow increases on scroll (`shadow-md`) for visual depth — triggered via Intersection Observer

---

## Usage in Page Specs

Referenced as:

```markdown
| Component | [Global Header](../../../D-Design-System/organisms/global-header.md) |
```

Used in:
- All views — persistent across the entire application
- Referenced in every page spec under "Fixed Elements"

---

_Created using Whiteport Design Studio (WDS) methodology_
