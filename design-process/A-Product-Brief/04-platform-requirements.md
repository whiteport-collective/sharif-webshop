# Platform Requirements: Sharif.no

> Technical boundaries and platform decisions.

**Date:** 2026-03-26
**Author:** Saga (WDS Phase 1)
**Related:** [Product Brief](01-product-brief.md)

---

## Technology Stack

### Core Platform

**Framework:** Astro (static shell + interactive islands)
**Approach:** Hybrid static/dynamic — static pages for SEO content, one interactive island for the guided buying flow

### Key Technologies

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Astro | Fast static pages, islands for interactivity, native i18n, great SEO |
| **Interactive flow** | Astro island (React or Svelte TBD) | The continuous parallax buying experience — SPA-like behavior within a static shell |
| **Styling** | TBD (Tailwind likely) | Utility-first, fast iteration |
| **E-commerce** | Shopify (frontrunner) / WooCommerce / Hydra | Clean cut at payment — swappable. Decision deferred. |
| **Payment** | Klarna or Qliro (TBD) | Handles private + company purchases natively |
| **Booking** | Google Calendar API (POC) | Pragmatic — replaceable with a proper system later |
| **Back-office** | Claude Cowork + agent tools | Conversational AI replaces admin UI |
| **Database** | TBD | Product catalog, inventory, stock levels, pricing |
| **Hosting** | TBD | |

### Architecture

```
Static Astro shell (SEO, content, layout)
  +-- Interactive flow island (live API, parallax experience)
  |     +-- Product database (real-time stock/prices)
  |     +-- Payment provider (Klarna/Qliro)
  |     +-- Google Calendar API (booking)
  +-- Static product pages + live stock widgets
  +-- AI agent API (ChatGPT, Claude, any bot)
```

---

## Platform & Device Strategy

**Primary platform:** Responsive web application
**Device priority:** Mobile-first

| Device | Priority | Notes |
|--------|----------|-------|
| Mobile (phone) | Primary | The parallax flow is designed for touch/scroll |
| Tablet | Secondary | Works, not specifically optimized |
| Desktop | Secondary | Supported — Ole may browse at work |

**Interaction models:**
- Touch + scroll (mobile) — the primary interaction
- Mouse + scroll (desktop)
- Keyboard accessible (accessibility requirement)

**Offline:** Not needed — buying tires is not an offline activity
**Native features:** None required for V1
**PWA:** Possible V2 — installable, but not needed for demo or V1

---

## Integrations

### V1 Required

| Integration | Purpose | Approach |
|-------------|---------|----------|
| **Payment provider** | Checkout (Klarna/Qliro) | Embedded checkout or redirect after "Pay" button |
| **Google Calendar** | Mounting time booking (POC) | API integration per shop |
| **Product database** | Stock, prices, product data | API serving storefront + AI agent channels |
| **Excel parser** | Supplier file import (Powertrac, Starco formats) | Agent tool — parses and updates product DB |

### V2 Future

| Integration | Purpose | Timeline |
|-------------|---------|----------|
| **Supplier ordering API** | On-demand from local distributors | V2 |
| **Shipping provider** | Nationwide delivery | V2 |
| **Competitor price API** | Automated price monitoring | V2 |
| **ChatGPT/Claude marketplace** | AI agent purchasing channel | V1-V2 |

---

## Contact Strategy

### V1

| Channel | Priority | Implementation |
|---------|----------|----------------|
| Phone | Primary | 45454545 — displayed on site |
| WhatsApp | Secondary | Direct link to Moohsen |
| Contact form | Tertiary | Basic form on contact page |

### V2

| Channel | Priority | Implementation |
|---------|----------|----------------|
| AI chat on site | Future | Customer support agent |

---

## Multilingual Requirements

**Languages:** Norwegian (bokmal) + English
**Implementation:** Astro i18n (native support)
**URL structure:** `/no/` and `/en/` prefixes (or `/` for Norwegian, `/en/` for English)
**Translation workflow:** AI content agent generates both languages, human review
**Tone consistency:** Same tone in both languages — straight-talking, unfussy

---

## SEO Requirements

### Technical SEO

- Static HTML pages (Astro default) — crawlable by all search engines
- Dimension landing pages (~200+) as static routes
- Car model pages (top 50-100) as static routes
- Proper meta titles/descriptions per page (content agent generates)
- Canonical URLs
- XML sitemap (auto-generated)
- robots.txt
- Open Graph / social sharing tags

### Structured Data

| Page Type | Schema Type | Key Properties |
|-----------|-------------|----------------|
| Product pages | Product, Offer | Price, availability, brand, SKU, EU labels |
| Car model pages | Product | Tire-vehicle association |
| Shop pages | LocalBusiness | Address, hours, phone, geo |
| FAQ content | FAQPage | Tire guide questions |
| Blog/guides | Article | Author, date, topic |

### Local SEO

- Google Business Profile for both shops (Fjellhamar + Drammen)
- NAP consistency (Name, Address, Phone) across all pages
- Service area defined per shop
- Photos of shops uploaded

### Performance Targets

| Metric | Target |
|--------|--------|
| Largest Contentful Paint (LCP) | < 2.5 seconds |
| First Input Delay (FID) | < 100ms |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Page Load (4G mobile) | < 3 seconds |
| Total Page Weight | < 3MB |
| Image Size | < 200KB (hero < 400KB) |
| Mobile-Friendly | Yes (Google test) |

---

## Static vs. Live Content

| Content | Rendering | Rationale |
|---------|-----------|-----------|
| Product pages (descriptions, EU labels, images) | Static (Astro) | SEO, fast loading, permanent content |
| Stock status widget | Live (client-side API call) | Must reflect current inventory |
| Price | Live or rebuild-on-change | Could change when agent updates pricing |
| The guided flow | Interactive island (SPA-like) | Real-time product data, animations, state |
| SEO content pages | Static | Blog, guides, dimension pages, car model pages |
| About, contact, legal | Static | Rarely changes |

Product pages never disappear when out of stock — they keep their SEO value. A live widget shows stock status.

---

## Security Headers

| Header | Purpose |
|--------|---------|
| Strict-Transport-Security (HSTS) | Force HTTPS |
| Content-Security-Policy (CSP) | Prevent XSS |
| X-Content-Type-Options | Prevent MIME sniffing |
| X-Frame-Options | Prevent clickjacking |
| Referrer-Policy | Control referrer info |
| Permissions-Policy | Restrict browser features |

---

## Maintenance & Ownership

| Aspect | Owner | Notes |
|--------|-------|-------|
| Product data | Moohsen via Claude Cowork | Upload Excel, agent updates store |
| Content updates | AI Content Agent | Product descriptions, SEO pages, blog |
| Technical maintenance | Marten | Astro, hosting, integrations |
| Booking management | Moohsen | Google Calendar |

---

## Development Notes

### POC / Demo Scope

The demo needs:
- Working guided flow with real Powertrac product data
- Parallax transitions between steps
- Live stock widget
- Klarna/Qliro payment integration (or sandbox)
- Google Calendar booking integration
- Claude Cowork demo (upload Excel → store updates)
- Sharif branding (red/black/white, logo)
- Mobile-responsive
- Norwegian + English

### What Can Wait

- Full SEO page generation (dimension pages, car model pages)
- Competitor price monitoring
- AI purchasing channel (ChatGPT/Claude marketplace)
- Partner workshop management
- Shipping integration

---

_Created using Whiteport Design Studio (WDS) methodology_
