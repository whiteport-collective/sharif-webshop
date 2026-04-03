# Sharif.no — Design Tokens

> Extracted from https://www.sharif.no/ on 2026-03-31

---

## Typography

| Role | Font Family | Weight | Size | Transform |
|------|------------|--------|------|-----------|
| Body | Source Sans Pro, sans-serif | 400 | 16px | none |
| Headings | Montserrat, sans-serif | 700 | 18–21px | uppercase |
| Buttons | Montserrat, sans-serif | 700 | — | uppercase |
| Line height | — | — | 24px (1.5) | — |

**Google Fonts:**
- `Montserrat:700` (headings, buttons, nav)
- `Source Sans Pro:400,600` (body, descriptions)

---

## Colors

### Primary Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Sharif Red | `#D70000` | rgb(215, 0, 0) | Primary brand, links, header accent, footer bg |
| Sharif Red Light | `#FF5858` | rgb(255, 88, 88) | Button hover, CTA secondary |
| Sharif Red Pale | `#FFE6E6` | rgb(255, 230, 230) | Link hover bg, light accent |
| Dark Red | `#F60000` | rgb(246, 0, 0) | Footer links |

### Neutral Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Near Black | `#212121` | rgb(33, 33, 33) | Headings |
| Dark Gray | `#333333` | rgb(51, 51, 51) | Body text |
| Medium Gray | `#808080` | rgb(128, 128, 128) | Muted text |
| Light Gray | `#CCCCCC` | rgb(204, 204, 204) | Borders |
| Off White | `#EBEBEB` | rgb(235, 235, 235) | Dividers, subtle bg |
| Page Background | `#F3F3F3` | rgb(243, 243, 243) | Body background |
| White | `#FCFCFC` | rgb(252, 252, 252) | Card backgrounds, footer text |

### Footer

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Footer Background | `#D70000` | rgb(215, 0, 0) | Footer main section |
| Footer Dark | `#060606` | rgb(6, 6, 6) | Footer bottom bar |

---

## Spacing & Layout

| Property | Value |
|----------|-------|
| Page width | ~1620px (full bleed brand section) |
| Content max-width | ~1200px |
| Button padding | 10px 20px |
| Button border-radius | 3px |
| Body padding | 0 |

---

## Components

### Buttons

```css
/* Primary CTA */
background: #FF5858;
color: #292929;
border-radius: 3px;
padding: 8px 16px;
font-weight: 700;
text-transform: uppercase;
font-family: Montserrat, sans-serif;

/* Secondary / Ghost */
background: #FFFFFF;
color: #333333;
border-radius: 3px;
padding: 10px 20px;
font-weight: 700;
text-transform: uppercase;
```

### Links
- Default: `#D70000` (Sharif Red)
- Footer: `#F60000` / `#FFE6E6`
- Body links: `#D70000`

### Header
- Background: `#FFFFFF`
- Logo: left-aligned
- Search + Cart: right-aligned
- Accent bar below: `#D70000` (full width)

### Footer
- Background: `#D70000`
- Text: `#FCFCFC`
- Bottom bar: `#060606`
- Payment icons: Visa, Mastercard, Klarna

---

## Assets

| Asset | File | Source |
|-------|------|-------|
| Logo (PNG, 500x120) | `sharif-logo.png` | Header/footer logo |
| Hero banner (1522x850) | `sharif-hero.jpg` | Homepage slider |
| Full page screenshot | `sharif-no-fullpage.png` | Reference |

---

## Stitch Import Format

For Google Stitch design token import, use:

```json
{
  "colors": {
    "primary": "#D70000",
    "primary-light": "#FF5858",
    "primary-pale": "#FFE6E6",
    "text": "#333333",
    "heading": "#212121",
    "muted": "#808080",
    "background": "#F3F3F3",
    "surface": "#FCFCFC",
    "border": "#CCCCCC"
  },
  "typography": {
    "heading": {
      "fontFamily": "Montserrat",
      "fontWeight": 700,
      "textTransform": "uppercase"
    },
    "body": {
      "fontFamily": "Source Sans Pro",
      "fontWeight": 400,
      "fontSize": "16px",
      "lineHeight": 1.5
    }
  },
  "spacing": {
    "buttonPadding": "10px 20px",
    "borderRadius": "3px"
  }
}
```

---

## Notes

- The existing site runs on 24nettbutikk.no (Norwegian e-commerce platform)
- Payment: Visa, Mastercard, Klarna are displayed
- Business: Sharif AS, Heisshageveien 32, 2015 Leirsund, Org: 915197582
- Phone: 45 45 45 45, Email: post@sharif.no
- Hours: Mon-Fri 09:00-17:00, Sat 10:00-15:00
