# Key Decisions Log

**Project:** Sharif Webshop
**Last Updated:** 2026-03-26

---

## Decision 1: V1 Fulfillment — Pickup Only
**Date:** 2026-03-26
**Decision:** V1 is pickup/fitting at Moohsen's own shops only. No shipping.
**Rationale:** Shipping 4 tires is very expensive. Keeps margins intact. Geo-targeted ads solve the "only two shops" problem. Shipping and partner network are V2.

## Decision 2: Back-office — Claude Cowork, Not CMS
**Date:** 2026-03-26
**Decision:** No traditional admin panel. Moohsen manages inventory, pricing, and content via Claude Cowork conversations.
**Rationale:** Moohsen is a talker, not a tech guy. He uploads Excel files and chats. The agent parses, updates, and recommends pricing. Massive scope reduction — no admin UI to build.

## Decision 3: Harriet's Flow Is Sacred
**Date:** 2026-03-26
**Decision:** Primary persona (Harriet) defines the UX. Nothing gets added that complicates her experience. Ole's features (brand filter) only appear if invisible to Harriet until needed.
**Rationale:** The entire competitive advantage is simplicity. If the flow gets complex, we lose the one thing that differentiates Sharif from existing tire sites.

## Decision 4: Platform-Agnostic Architecture
**Date:** 2026-03-26
**Decision:** Custom Astro frontend with a clean cut at the payment step. E-commerce platform (Shopify, WooCommerce, Hydra) sits behind a "Pay" button and can be swapped.
**Rationale:** Allows deferring the platform decision. The guided flow is the product — the checkout is plumbing. Shopify is the current frontrunner (trust for skeptical organization) but not locked in.

## Decision 5: Astro Over React
**Date:** 2026-03-26
**Decision:** Astro for the frontend, not React/Next.js.
**Rationale:** The guided flow is a multi-step form with product data — Astro's sweet spot. Ships zero JS by default, great SEO for tire dimension pages. Interactive stepper can be an Astro island. React adds complexity without benefit for this use case.

## Decision 6: Book Fitting After Payment
**Date:** 2026-03-26
**Decision:** Tire fitting booking happens AFTER Klarna payment, not before.
**Rationale:** Booking before payment risks cart abandonment if preferred time isn't available. After payment, the customer is committed and will find a time. Booking becomes a rewarding bonus step ("Takk for bestillingen! Finn din tid!"), not a hurdle. Availability indicators shown during flow to build confidence without commitment.

## Decision 7: Business Model — B2C + Light B2B via Klarna
**Date:** 2026-03-26
**Decision:** B2C with light B2B support. No separate B2B portal or features. Klarna handles company purchases natively (org number, company invoice). Private persons and SMEs with company cars/vans. No heavy vehicles or trucks — consumer and SME only.
**Rationale:** Keeps the site simple. Klarna Business handles the company checkout complexity. No procurement flows needed.

## Decision 8: Google Calendar for Booking POC
**Date:** 2026-03-26
**Decision:** Use Google Calendar integration for the POC time booking system. Each shop gets a calendar, site shows available slots.
**Rationale:** Pragmatic — avoids building a custom booking system for the demo. Can be replaced with a proper system later. Shipping is technically easier but fitting service is the differentiator.

## Decision 9: Partner Workshops in V1
**Date:** 2026-03-26
**Decision:** V1 includes partner workshops, not just own shops. Updated from earlier "own shops only" decision.
**Rationale:** Extends reach from day one. Workshop partnerships are operational (service partners), not a separate revenue stream. Still B2C from the customer's perspective.

## Decision 10: Competitive Landscape & Unfair Advantage
**Date:** 2026-03-26
**Decision:** The real competition is inertia — people default to their local tire shop and pay whatever it costs. Cross-border Swedish online stores (Bythjul etc.) are the main online competitor (cheap shipping from Sweden). Norwegian chains (Dekkmann, Vianor) compete on convenience/trust but not price.
**Unfair advantage:** The only player combining nationally recognized brand (60+ years) + rock-bottom prices (China import) + local mounting + simplest digital experience. No single competitor matches all four.
**Reality check:** Dekkmann could build a nice app but can't match prices. Bythjul has cheap prices but can't mount tires. Local shops mount but can't match experience or price.

## Decision 11: Geo-Targeted Marketing Only (V1)
**Date:** 2026-03-26
**Decision:** Advertise only in the Fjellhamar/Drammen area for V1.
**Rationale:** Only two shops for pickup/fitting. No need to explain limited coverage on the site — people nearby see the ads, the shops are close. Widen radius when partner network comes in V2.
