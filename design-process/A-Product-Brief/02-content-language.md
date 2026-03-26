# Content & Language: Sharif.no

> The brand speaks like the father who started it — honest, warm, unfussy.

**Date:** 2026-03-26
**Author:** Saga (WDS Phase 1)
**Related:** [Product Brief](01-product-brief.md)

---

## Brand Personality

If Sharif were a person, he'd be the hard-working father who started the business in the 1960s:

1. **Hard-working** — rolls up his sleeves, no shortcuts. You see the effort in the quality.
2. **Quick to smile** — warm and approachable, never intimidating. You feel welcome even if you know nothing about tires.
3. **Honest** — gives straight advice, even if it means selling you the cheaper tire. Long-term customer beats short-term profit.
4. **Playful** — has a sense of humor, doesn't take himself too seriously. Tires are serious business but buying them doesn't have to be.
5. **Long-term thinker** — sees every customer as a relationship, not a transaction. Wants you back next season.

**How Harriet should feel:** Like she just got help from a friend's dad who happens to know everything about tires.

---

## Tone of Voice

**For UI microcopy and system messages.**

1. **Straight-talking** — no jargon, say what it is, what it costs
2. **Unfussy** — we don't make a fuss about tires. They just work, at reasonable prices. No drama.
3. **Warm but brief** — human when it matters, silent when it doesn't

### Examples

| Element | Not this | This |
|---------|----------|------|
| Dimension input | "Enter your tire specifications" | "What size are your tires?" |
| Help text | "The tire dimension can be found on the sidewall of your current tire" | "Look at the side of your tire — 205/55R16" |
| Empty search | "No products match your criteria" | "We don't have that size right now." |
| Add to order | "Add to cart" | "I'll take these" |
| After payment | "Your order has been confirmed" | "Done! Now pick a time to get them mounted." |
| Error | "Payment failed. Please try again." | "Payment didn't go through. Try again?" |
| Low stock | "Limited availability" | "Only 4 left" |
| Out of stock | "This product is currently unavailable" | "Out of stock. Check back soon." |

### Do
- Use short sentences
- Use everyday Norwegian (not business Norwegian)
- Let the animations and flow communicate — copy stays minimal
- Be honest about stock, prices, and delivery

### Don't
- Use tire jargon without explanation
- Upsell or create false urgency
- Use exclamation marks excessively
- Sound corporate or robotic

---

## Language Strategy

| Language | Priority | Coverage |
|----------|----------|----------|
| Norwegian (bokmal) | Primary | Full — all content, source language |
| English | Secondary | Full translation |

### Translation Approach

AI-generated (content agent) with human review. Same tone in both languages — straight-talking and unfussy regardless of language.

### Localization

- Currency: NOK (Norwegian kroner)
- Date format: Norwegian (DD.MM.YYYY)
- Phone format: Norwegian (+47)
- Address format: Norwegian
- English version keeps Norwegian formatting — it's a Norwegian business

---

## Content Structure

### Core Pages

| Page | Purpose | Priority |
|------|---------|----------|
| **The guided flow** | The product — the buying experience | V1 core |
| **About Sharif** | Father's story, 60+ years, racing heritage | V1 |
| **How it works** | Simple explainer of the process | V1 |
| **Tire guide** | How to find your dimension, what the numbers mean (for Harriet) | V1 |
| **Contact** | Shops, hours, phone, maps | V1 |
| **Legal** | Terms, privacy, returns (Klarna handles some) | V1 |

### SEO Pages (AI content agent generates at scale)

| Page type | Example | Volume | Strategy |
|-----------|---------|--------|----------|
| **Dimension landing pages** | "/dekk/205-55-r16/" | ~200+ from catalog | Pre-fills dimension, drops user into flow |
| **Car model pages** | "/dekk/tesla-model-3/" | Top 50-100 models in Norway | Maps model to dimension, SEO landing page |
| **Seasonal content** | "sommerdekk 2026" | Per season | Timed content, ramp 6-8 weeks before peak |
| **City + service pages** | "dekkskift Drammen" | Per location | Local SEO for each shop/partner |
| **EV tire content** | "dekk til elbil" | 10-20 pages | Massive gap — 80% of new Norwegian cars are EVs |
| **Blog/tips** | Tire test results, maintenance | Ongoing | Authority building |

### Car Model Pages — The Hidden SEO Play

The site search stays simple (dimension only). Google indexes car model pages that capture search traffic and feed users into the guided flow:

- User googles "dekk til Tesla Model 3"
- Lands on `/dekk/tesla-model-3/`
- Page has relevant content about tires for that car (EV considerations, common sizes, tips)
- **Does NOT assume the dimension** — offers the dimension input field
- User enters their actual dimension and drops into the flow

No car registration API needed. No risk of wrong size assumptions. The page captures SEO traffic, gives confidence ("they know about my car"), and hands off to the guided flow. Content agent generates and maintains these pages.

---

## SEO Keyword Strategy

### Priority Keywords

| Priority | Category | Examples | Intent |
|----------|----------|---------|--------|
| P0 | Dimension + season | "205/55R16 vinterdekk" | Purchase |
| P0 | EV-specific | "dekk til elbil", "Tesla dekk" | Purchase / research |
| P1 | Car model | "dekk til VW Golf", "dekk til Toyota RAV4" | Purchase |
| P1 | Price intent | "billige vinterdekk", "dekk tilbud" | Purchase |
| P2 | Guides | "nar bytte vinterdekk", "dekktest 2026" | Research |
| P2 | All-season | "helarsdekk test", "helarsdekk Norge" | Research |
| P3 | Local service | "dekkskift Drammen", "dekkskift Fjellhamar" | Service |

### Seasonal Timing

| Season | Search peak | Content ramp-up |
|--------|------------|-----------------|
| Winter tires (vinterdekk) | October | Start August |
| Summer tires (sommerdekk) | March-April | Start February |

### Competitive Gaps to Exploit

1. **EV tire content** — nobody owns this in Norway despite 80%+ EV new car sales
2. **Car model pages** — "dekk til [bilmodell]" is underserved by all competitors
3. **Native Norwegian content** — competitors use translated content that reads badly
4. **Price transparency** — Sharif can own "billige dekk" with honest pricing
5. **Rich dimension pages** — most competitors have thin category pages per dimension

### Structured Data (Schema.org)

| Page type | Schema | Purpose |
|-----------|--------|---------|
| Product pages | Product, Offer | Rich snippets with price, availability |
| Car model pages | Product, Vehicle | Tire-vehicle matching |
| Shop pages | LocalBusiness | Google Maps, local search |
| FAQ content | FAQPage | Featured snippets |
| Blog/guides | Article | Authority signals |

---

## Content Generation Workflow

The AI content agent generates content at scale:

1. **Product descriptions** — tire-ignorant-friendly language, from supplier data
2. **Dimension pages** — auto-generated from catalog, enriched with compatible cars and recommendations
3. **Car model pages** — from car model → dimension mapping database
4. **Seasonal pages** — templated, updated per season
5. **Blog content** — tire tests, tips, seasonal guides

All content in both Norwegian and English, following the tone of voice guidelines.

---

_Created using Whiteport Design Studio (WDS) methodology_
