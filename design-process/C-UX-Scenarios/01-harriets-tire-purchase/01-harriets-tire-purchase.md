# 01: Harriet's Tire Purchase

**Project:** Sharif Webshop
**Created:** 2026-03-26
**Method:** Whiteport Design Studio (WDS)

---

## Transaction (Q1)

**What this scenario covers:**
Harriet buys 4 summer tires for her small car and books a mounting time — going from "I need tires" to "sorted" in under 3 minutes on her phone.

---

## Business Goal (Q2)

**Goal:** Local market domination — crush competition on accessibility, usability, likability, and price in covered areas
**Objective:** Phone-to-online shift — majority of orders online within 3 months

---

## User & Situation (Q3)

**Persona:** Harriet the Hairdresser (Primary)
**Situation:** It's April. Harriet's colleague at the salon mentioned she needs to switch to summer tires. Harriet checks her tires during a break — they look worn. She's between clients and has 5 minutes. She grabs her phone.

---

## Driving Forces (Q4)

**Hope:** Find cheap tires and get this sorted in the time it takes to scroll Instagram.

**Worry:** Getting lost in technical tire jargon and wasting her break on something confusing.

---

## Device & Starting Point (Q5 + Q6)

**Device:** Mobile (iPhone, portrait)
**Entry:** Sees a geo-targeted Instagram ad for Sharif.no ("Sommerdekk fra 499kr — montering inkludert") during her break. Taps through.

---

## Best Outcome (Q7)

**User Success:**
4 summer tires ordered, mounting booked at Fjellhamar for Saturday, paid via Klarna — total time under 3 minutes.

**Business Success:**
Online order captured that would have been a phone call or lost to a local shop. Harriet becomes word-of-mouth in her salon.

---

## Shortest Path (Q8)

1. **Dimension Input** — Harriet sees the tire guide, finds the numbers on her tire, enters her dimension
2. **Product Cards** — She swipes through tire options sorted by price, taps the cheapest
3. **Product Detail Overlay** — Sees the price, plain-language tire story, EU label sliders. Taps "Jeg tar disse"
4. **Quantity & Shop** — Picks 4 tires, selects Fjellhamar. Sees total price. Taps "Betal na"
5. **Payment** — Klarna checkout loads. She pays with Vipps/card.
6. **Book Mounting** — "Takk! Finn din tid!" She picks Saturday 10:00 at Fjellhamar. Confirmation shown. ✓

---

## Trigger Map Connections

**Persona:** Harriet the Hairdresser (Primary)

**Driving Forces Addressed:**
- ✅ **Want:** Speed — done in under 3 minutes
- ✅ **Want:** Simplicity — no tire knowledge required
- ✅ **Want:** Fair price — cheapest options shown first
- ❌ **Fear:** Looking stupid — zero jargon, visual guides, plain language
- ❌ **Fear:** Wrong choice — dimension ensures fit, only matching tires shown
- ❌ **Fear:** Wasting time — continuous flow, no page reloads, no rabbit holes

**Business Goal:** Local market domination — online order replaces phone call

---

## Scenario Steps

| Step | Folder | Purpose | Exit Action |
|------|--------|---------|-------------|
| 01.1 | `01.1-dimension-input/` | Enter tire dimensions with visual guide | Submits dimension |
| 01.2 | `01.2-product-cards/` | Browse and select a tire | Taps a product card |
| 01.3 | `01.3-product-detail/` | Review tire details and confirm | Taps "Jeg tar disse" |
| 01.4 | `01.4-quantity-and-shop/` | Pick quantity and mounting location | Taps "Betal na" |
| 01.5 | `01.5-payment/` | Complete payment via Klarna | Payment confirmed |
| 01.6 | `01.6-book-mounting/` | Book mounting time slot | Confirms booking ✓ |

---

## Quality Self-Audit

**Completeness:** 7/7
- ✅ Core Feature — clear user purpose
- ✅ Entry Point — Instagram ad, mobile, between clients
- ✅ Mental State — Hope (speed + sorted) + Worry (jargon + wasted time)
- ✅ Success Goals — User (4 tires, booked, <3min) + Business (online order captured)
- ✅ Shortest Path — 6 linear steps, no branches
- ✅ Scenario Name — Persona in title
- ✅ Trigger Map Connections — explicit persona, forces, and goal

**Quality:** 7/7
- ✅ Persona alignment — uses Harriet with her specific psychology
- ✅ Mental state richness — visceral and specific
- ✅ Mutual success clarity — both measurable
- ✅ Sunshine path focus — zero branches
- ✅ Minimum viable steps — each step moves forward, none removable
- ✅ Entry point realism — Instagram ad during break
- ✅ Business goal connection — directly serves primary goal

**Mistakes Avoided:** 7/7
- ✅ No edge cases in path
- ✅ Persona-first naming
- ✅ Mental state present with all components
- ✅ Page descriptions include purpose
- ✅ Specific persona, not generic "user"
- ✅ Business value explicit
- ✅ No bloated descriptions

**Best Practices:** 4/4
- ✅ Persona in scenario name
- ✅ Primary persona first
- ✅ One job per scenario
- ✅ Driving forces explicitly linked

**Status: Excellent**
