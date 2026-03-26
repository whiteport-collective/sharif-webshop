# User Definition

**Step:** 07 - Target Users
**Completed:** 2026-03-26
**Session:** 1

---

## Primary User: Harriet the Hairdresser (V1)

- Independent woman, does everything herself — won't delegate to a partner
- Drives a small car from home to salon, doesn't care about the car as long as it works
- Social media native — expects digital experiences to be smooth and intuitive
- Tires are a boring chore — she'll handle it without complaining, but chooses the path of least resistance
- Buys whatever is cheapest in her dimension that works
- May buy through an AI agent (ChatGPT, Claude) as easily as through the website
- **Frustration:** Existing tire buying options are clunky, confusing, or require phone calls
- **Goal:** Get it done fast, don't waste time, don't overpay
- **Current solution:** Googles, gets overwhelmed, calls a shop, or asks her AI assistant

## Secondary User: Ole the Office Worker (V1, served not optimized)

- Drives a Tesla — specific tire needs (narrower dimensions, higher load rating, low noise, EV-optimized)
- More car-savvy, compares options, may have brand preferences
- Could accept a budget tire if specs are right for his EV, or wait for V2 premium options
- Values smart recommendations over endless browsing
- **Frustration:** Generic tire sites don't account for EV-specific needs
- **Goal:** Right tire for his Tesla — performance, noise, range, fair price
- **Design implication:** Brand filter, EU label details visible, EV-aware recommendations (data-driven from dimensions, not asked)

## Tertiary User: Magnus the Mercedes Driver (V2)

- Luxury car, wants premium brand tires (Pirelli, Continental, Michelin)
- Definitely has brand preferences — that's his entry point, not price
- Willing to pay more, willing to wait for sourcing from local suppliers
- Requires supplier integration and on-demand ordering — too many moving parts for V1
- **Frustration:** Budget sites don't carry what he wants
- **Goal:** Get his preferred brand at a competitive price with fitting
- **V2 feature:** Premium brand catalog sourced on-demand from local distributors

---

## Multi-Channel Purchasing

The website is not the only storefront. The product database needs an API that any agent can query:
- Astro storefront (Harriet browses)
- ChatGPT marketplace plugin (agent purchases)
- Claude tool (agent purchases)
- Any AI bot (API access)

All channels generate a Klarna payment link. The clean cut at payment works across all channels.

---

## Product Filtering

| Filter | Default | Harriet | Ole | Magnus (V2) |
|--------|---------|---------|-----|-------------|
| Dimension | Pre-selected from step 1 | Yes | Yes | Yes |
| Season | TBD | Maybe | Yes | Yes |
| Brand | Collapsed | Ignores | Uses | Essential |
| Price sort | Low-high (default) | Yes | Secondary | No |

Filters collapsed by default on mobile — Harriet sees sorted list immediately, Ole expands if needed.

---

## Key Signals

- "She does everything herself, even if she has a partner she does not let a man do it for her"
- "Sharif is selling cheap shit" — V1 is budget brands, premium is V2 via on-demand sourcing
- EV dimensions are identifiable from the data — no need to ask, just surface relevant info
- AI agent purchasing should be a first-class channel, not an afterthought
