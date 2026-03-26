# Vision Capture

**Step:** 02 - Vision
**Completed:** 2026-03-26
**Session:** 1

---

## Vision Statement

- The easiest tire buying experience in Norway — guided, mobile-first, anyone can do it
- From "I need tires" to "they're fitted on my car" in minutes
- A Typeform-style step-by-step flow that makes tires feel as simple as booking a haircut
- AI agents run the back-office — the owner never touches a CMS
- Built on Shopify for trust and reliability, with a fully custom guided storefront
- Platform-agnostic architecture — clean cut at payment step means the checkout system (Shopify, WooCommerce, Hydra, Klarna) can be swapped without changing the customer experience
- A working demo so good the client can't say no

---

## Key Signals from Conversation

**What matters most:**
- Seamless guided experience for tire-ignorant users (Harriet)
- Mobile-first — every step is thumb-friendly
- The demo is the immediate deliverable — must convince a skeptical organization
- Platform decision (Shopify vs others) can be deferred — the custom Astro frontend is the constant

**Architecture decisions:**
- Astro frontend (custom guided flow) — no React SPA needed
- Clean hand-off to payment at the end of the guided flow
- E-commerce platform sits behind a "Pay now" button — swappable
- Claude Cowork replaces CMS for back-office operations
- Astro islands for interactive components (stepper) if needed

**Emotional drivers:**
- Moohsen has been waiting 7 years — the demo must feel like "this is finally real"
- His organization is skeptical of new things — familiar checkout (Shopify) builds trust
- Mårten wants modern, clean, AI-native — no WordPress nostalgia
