# Product Brief: Sharif.no

> We don't make a fuss about tires. They should just work, at reasonable prices.

**Date:** 2026-03-26
**Author:** Saga (WDS Phase 1)
**Client:** Moohsen Sharif, Sharif AS
**Contact:** moohsens@hotmail.com / +47 93485790
**Domain:** sharif.no
**Languages:** Norwegian (bokmal) + English
**Brief Type:** Complete

---

## Strategic Summary

Sharif is a nationally recognized Norwegian tire brand with 60+ years of history. They import budget tires directly from China and sell at prices the big chains can't match. Today, all sales happen by phone — the current sharif.no is a placeholder that reads "launch of new webshop is delayed."

This project replaces that placeholder with something unprecedented: a single continuous animated experience that guides anyone — even someone who has never thought about tires — from "I need tires" to "they're fitted on my car" in minutes. Not a store with pages. Not a traditional e-commerce flow. One living surface that transforms as you move through your decision, with parallax depth and meaningful animation.

Behind the scenes, AI agents run the business. Moohsen never touches a CMS — he chats with his inventory agent, uploads a supplier Excel, and the store updates itself with smart pricing recommendations. The architecture is platform-agnostic: a custom Astro frontend with a clean cut at the payment step, meaning the checkout system (Shopify, WooCommerce, or others) can be swapped without changing the customer experience.

The immediate goal is a working demo so compelling that Moohsen — who has been trying to get this built for 7 years — finally commits. The demo must create an identity shift: from "tire dealer who wants a website" to "modern digital tire business."

---

## Vision

- The easiest tire buying experience in Norway — guided, mobile-first, anyone can do it
- From "I need tires" to "they're fitted on my car" in minutes
- One continuous animated dialog — not a store with pages
- AI agents run the back-office — the owner never touches a CMS
- Platform-agnostic architecture — checkout system is swappable
- A working demo so good the client can't say no

---

## Positioning

> **For** Norwegian car owners who need tires but don't want the hassle,
> **Sharif** is the **online tire store** that lets you
> **buy tires and book mounting in minutes — at prices the big chains can't match.**
> **Unlike** Dekkmann, Vianor, and faceless online shops,
> **Sharif** combines **60+ years of tire expertise with the simplest digital buying experience in Norway** — backed by a growing network of local mounting workshops.

**Breakdown:**
- **Target:** Norwegian car owners (primarily price-conscious, tire-ignorant)
- **Need:** Buy tires without confusion, at a good price, with mounting included
- **Category:** Online tire store with local mounting
- **Key benefit:** Easiest buying experience + best prices
- **Differentiator:** Nationally recognized brand since the 60s + guided mobile-first flow + growing workshop network

---

## Target Users

### Primary: Harriet the Hairdresser (V1)

Independent woman who does everything herself. Drives a small car, doesn't care about tires — just wants them done. Social media native. Tires are a boring chore she'll handle without complaining, but she'll always choose the path of least resistance.

- **Frustration:** Existing tire buying options are clunky, confusing, or require phone calls
- **Goal:** Get it done fast, don't waste time, don't overpay
- **Behavior:** May buy through an AI agent (ChatGPT, Claude) as easily as through the site
- **Design rule:** Her flow is sacred. Nothing gets added that makes her experience harder.

### Secondary: Ole the Office Worker (V1, served not optimized)

Drives a Tesla — specific tire needs (narrower dimensions, higher load rating, low noise). More car-savvy, compares options, may have brand preferences. Could accept a budget tire if specs are right for his EV.

- **Frustration:** Generic tire sites don't account for EV-specific needs
- **Goal:** Right tire for his Tesla at a fair price
- **Design implication:** Brand filter, EU label details, EV-aware recommendations (data-driven from dimensions, not asked)

### Tertiary: Magnus the Mercedes Driver (V2)

Wants Pirelli, Continental, Michelin. Premium brands are available but need to be sourced on-demand from local suppliers — too many moving parts for V1.

- **V2 feature:** On-demand supplier ordering, premium brand catalog

---

## Product Concept

**One continuous, animated dialog — not a store.**

The experience has spatial depth (parallax, transitions, animation) that guides the customer forward and lets them move back naturally. No page reloads, no traditional e-commerce patterns. The product is the interaction itself.

Tires are not t-shirts. Traditional e-commerce patterns don't work for a product requiring guided technical selection. By treating it as a continuous dialog with depth, the experience becomes intuitive for anyone.

### The Flow

1. **What size?** — Guided dimension selector with visual help
2. **Here are your tires** — Product list, sorted by price. Filters collapsed by default.
3. **How many?** — 2 or 4
4. **Which shop?** — Own shops + partner workshops
5. **Pay** — Klarna checkout ("Betal na" button hands off to Klarna)
6. **Book mounting** — Post-payment: "Takk! Finn din tid!" (Google Calendar for POC)

Booking happens after payment — reduces cart abandonment. Once she's paid, she's committed and will find a time.

### Multi-Channel

The site isn't the only storefront. The product database has an API that any agent can query — ChatGPT, Claude, any bot. A customer's AI assistant can complete the entire purchase and provide a Klarna payment link.

---

## Business Model

**Type:** B2C + light B2B (Klarna handles company purchases natively)

**Customers:** Private car owners + SMEs with company cars/vans. No heavy vehicles or trucks.

### Inventory (two layers)

| Source | Model | Version |
|--------|-------|---------|
| Bulk import from China (Powertrac etc.) | Own stock, best margins, ~500 SKUs, 3 containers (~6,500 tires) | V1 |
| Wholesale from local distributors (Starco etc.) | On-demand order, lower margin | V2 |

### Fulfillment (two layers)

| Method | Model | Version |
|--------|-------|---------|
| Own shops + partner workshops (mounting included) | Full service | V1 |
| Shipping to customer | Expensive but expands reach nationwide | V2 |

### Growth Model

V1 proves locally (own shops in Fjellhamar + Drammen, geo-targeted ads). V2 scales nationally through workshop chain partnerships — each new partner unlocks a new ad region (15 min driving radius). Franchise-like scaling without the franchise.

### Locations

- **Fjellhamar:** Kloppaveien 16, 1472 Fjellhamar
- **Drammen:** Tordenskiolds gate 73, 3044 Drammen
- **Hours:** Mon-Fri 09:00-17:00, Sat 10:00-15:00

---

## Success Criteria

### Demo Success (immediate)

| Criteria | Measure |
|----------|---------|
| Identity shift | Moohsen sees himself as a digital tire business |
| Complete scenario | Full customer journey on mobile with real data |
| Admin believability | Upload Excel, see store update |
| Emotional response | "When can we launch?" |

### V1 Success (post-launch)

| Criteria | Measure | Timeline |
|----------|---------|----------|
| Phone-to-online shift | Majority of orders online | 3 months |
| Order completion time | Under 3 minutes | Launch |
| Admin effort | <30 min/week on store operations | 1 month |
| Zero confusion | No "how do I buy" support calls | 1 month |

### V1 = Local mounting + own stock. V2 = Shipping + supplier inventory.

---

## Competitive Landscape

The real competition is **inertia** — most Norwegians just go to their local tire shop and pay whatever it costs. They don't shop around.

| Alternative | Strength | Weakness |
|-------------|----------|----------|
| **Local tire shop** (status quo) | Convenient, no effort | Expensive, no comparison |
| **Bythjul.se + Swedish online stores** | Cheap prices, cheap cross-border shipping | No mounting service |
| **Norwegian chains** (Dekkmann, Vianor) | Trusted, local, full service | Expensive, clunky digital |
| **Call Sharif** (current) | Known brand, good prices | Phone only, can't scale |

### Unfair Advantage

The only player combining a nationally recognized brand (60+ years) + rock-bottom prices (China import) + local mounting + the simplest digital experience. No single competitor matches all four.

---

## Constraints

| Constraint | Type | Flexibility |
|------------|------|-------------|
| Your time | Primary resource | Flex — AI leverage maximizes impact per hour |
| Sharif brand identity | Fixed | Logo, name, 60-year heritage |
| Klarna | Fixed | Single payment provider |
| Mobile-first | Fixed | The parallax flow is designed for touch/scroll |
| Moohsen must be able to run it | Fixed | Claude Cowork, no technical admin |
| Real data in demo | Fixed | His products, his prices, his shops |
| Summer tire season | Soft deadline | Natural urgency, not hard deadline |
| E-commerce platform | Flexible | Shopify, WooCommerce, Hydra — deferred |
| Booking system | Flexible | Google Calendar for POC, replaceable |
| Budget | Flexible | Self-invested |

---

## Tone of Voice

**For UI microcopy and system messages.**

1. **Straight-talking** — no jargon, say what it is, what it costs
2. **Unfussy** — we don't make a fuss about tires. They just work, at reasonable prices. No drama.
3. **Warm but brief** — human when it matters, silent when it doesn't

| Element | Not this | This |
|---------|----------|------|
| Dimension input | "Enter your tire specifications" | "What size are your tires?" |
| Help text | "The tire dimension can be found on the sidewall" | "Look at the side of your tire — 205/55R16" |
| Empty search | "No products match your criteria" | "We don't have that size right now." |
| Add to order | "Add to cart" | "I'll take these" |
| After payment | "Your order has been confirmed" | "Done! Now pick a time to get them mounted." |
| Error | "Payment failed. Please try again." | "Payment didn't go through. Try again?" |

---

## AI Agent System

### Agent 1: Inventory & Pricing (V1 core)

Moohsen's daily tool via Claude Cowork. Parses supplier Excel files, updates product database, monitors competitor prices, recommends optimal pricing, tracks inventory state. No admin panel needed.

### Agent 2: Content (V1)

Generates product descriptions, SEO pages, tire guides, blog content. Writes in the tone of voice above.

### Agent 3: Customer Support (V2)

Not V1 priority. Phone (45454545) and WhatsApp handle support for now.

---

## Technology

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | Astro (static shell + interactive island) | Fast, SEO-friendly, islands for live components |
| **Product flow** | Single interactive island (SPA-like) | The continuous parallax experience lives here |
| **Product pages** | Static Astro pages + live stock widget | SEO-indexed, fast, stock status always current |
| **Back-office** | Claude Cowork + agent tools | Conversational AI replaces admin UI |
| **Payment** | Klarna Checkout | Handles private + company purchases |
| **Booking** | Google Calendar (POC) | Pragmatic, replaceable later |
| **E-commerce platform** | Deferred (Shopify frontrunner) | Clean cut at payment step — swappable |
| **Languages** | Norwegian (bokmal) + English | i18n native in Astro |
| **API** | Product database API | Serves storefront + AI agent channels |

### Architecture

```
Static Astro shell (SEO, content, layout)
  +-- Interactive flow island (live API, parallax experience)
  |     +-- Product database (real-time stock/prices)
  |     +-- Klarna (payment)
  |     +-- Google Calendar (booking)
  +-- Static product pages + live stock widgets
  +-- AI agent API (ChatGPT, Claude, any bot)
```

---

## Product Catalog

~500 SKUs from Powertrac (Chinese factory). Product data includes: size, pattern/model, brand, EU labels (rolling resistance, wet grip, noise), load/speed rating, EAN, stock quantity, retail price.

### Filtering

| Filter | Behavior |
|--------|----------|
| Dimension | Pre-selected from step 1 |
| Season | Summer / winter / all-season |
| Brand | Collapsed by default — Harriet ignores, Ole uses |
| Price | Default sort: low to high |

Filters collapsed on mobile. Harriet sees a sorted list immediately.

### Stock Display

Product pages are permanent (SEO value). A live widget shows stock status:
- In stock (buy now)
- Low stock ("only 4 left")
- Out of stock ("check back soon" — V2: "available in 3-5 days")

---

## Open Questions for Moohsen

1. **Mounting cost:** Included in tire price, or separate line item?
2. **Booking system:** Existing system, or Google Calendar for start?
3. **Competitor monitoring:** Which competitors to track for pricing?
4. **Rim sales:** Part of V1 or just tires?
5. **Seasonal strategy:** Separate summer/winter sections or season filter?
6. **Brand ambition:** V1 stock is budget brands only — how to communicate this?
7. **Free shipping claim:** Current site says "fri frakt." V1 is pickup/mounting only.
8. **V2 shipping cost:** Pass to customer, bake into price, or minimum order?
9. **EV tire handling:** Surface EV-friendly recommendations from data, or discuss with client first?
10. **Payment provider:** Klarna, Qliro, or both? Qliro spotted on Bythjul — may be preferred in Nordic tire market. Architecture supports any provider.

---

## Reference Materials

Stored in `design-process/A-Product-Brief/reference-data/`:

- `Powertrac-Summer-Tyre-Price-List.xlsx` — Primary V1 catalog (~500 SKUs)
- `Starco-Sommerdekk-PCR-2026.xlsx` — Norwegian importer price list
- `Inter-Sprint-Sommer-2022.xlsx` — Historical supplier data
- `order-xml-example.xml` — Order integration format (V2 reference)

External: Google Slides concept deck (17 slides), estimation spreadsheet, 7 years of email correspondence.

---

## Phase 1 Documents

| # | Document | Status |
|---|----------|--------|
| 01 | [Product Brief](01-product-brief.md) (this document) | Complete |
| 02 | [Content & Language](02-content-language.md) | Complete |
| 03 | [Visual Direction](03-visual-direction.md) | Complete |
| 04 | [Platform Requirements](04-platform-requirements.md) | Complete |

---

**Status:** Product Brief Complete
**Next:** Continue Phase 1 (Content & Language, Visual Direction, Platform Requirements) then Phase 2: Trigger Mapping

---

_Created using Whiteport Design Studio (WDS) methodology_
