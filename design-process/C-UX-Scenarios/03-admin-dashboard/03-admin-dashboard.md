# 03: Admin Dashboard — Moohsen Opens the Store

**Project:** Sharif Webshop
**Created:** 2026-04-06
**Author:** Freya (WDS Phase 3)
**Method:** Whiteport Design Studio (WDS)
**Status:** Scenario draft — wireframes in progress

---

## Scenario Navigation

| Step | View | Description | Status |
|------|------|-------------|--------|
| [03.1](./03.1-login/03.1-login.md) | Login | Moohsen logs in — agent greets him by name | Draft |
| [03.2](./03.2-open-glass/03.2-open-glass.md) | Open Glass Dashboard | Today at a glance: orders, stock alerts, unanswered questions | Draft |
| [03.3](./03.3-orders/03.3-orders.md) | Orders | Full order list with filters, search, and detail panel | Draft |
| [03.4](./03.4-products/03.4-products.md) | Products & Inventory | Product list, stock levels, low stock management | Draft |
| [03.5](./03.5-customers/03.5-customers.md) | Customers | Customer profiles, order history, contact details | Draft |
| [03.6](./03.6-agent-sidebar/03.6-agent-sidebar.md) | Agent Sidebar | Persistent AI assistant — context-aware across all views | Draft |
| [03.7](./03.7-settings/03.7-settings.md) | Settings | API key, agent instructions, store configuration | Draft |

---

## Transaction (Q1)

**What this scenario covers:**
Moohsen arrives at work, opens his laptop, and logs into the Sharif admin. In seconds he knows what happened overnight, what needs attention today, and what the agent couldn't handle without him. He takes action — approves, responds, checks — all from one screen without hunting through separate tabs or calling the warehouse.

This is the **Open Glass** experience: total visibility with zero noise.

---

## Business Goal (Q2)

**Goal:** Give Moohsen complete situational awareness in under 60 seconds every morning, and eliminate the need to check multiple systems.

**Objectives:**
- Surface every order that arrived since he last logged in
- Flag stock issues before they become customer problems
- Escalate agent-unresolved customer questions to Moohsen directly
- Make the agent an active partner — not just a search box

---

## User & Situation (Q3)

**Persona:** Moohsen — shop owner, Sharif Dekk Drammen. Arrives at work 08:00. Checks the admin before opening the shop. Not a developer. Expects clarity, speed, and no surprises.

**Situation:** This is his morning ritual. He wants to feel in control before the first customer walks in.

---

## Driving Forces (Q4)

**Hope:** Open the laptop and immediately know everything important — without clicking through five pages or building a mental model from raw tables.

**Worry:** Something slipped through. A customer sent an angry message. A product ran out and orders are still coming in. He finds out too late.

---

## Device & Starting Point (Q5 + Q6)

**Device:** Desktop / laptop (primary). Tablet acceptable.
**Entry:** `localhost:9000/app` — Medusa admin, customised with Sharif UI extension.

---

## The Agent — Role in This Scenario

The admin agent is not the same as the storefront agent (Scenario 02). Same two-layer architecture, different persona and tools.

**Persona:** Calm, data-driven, like a trusted operations assistant. Never chatty. Answers fast.

**Capabilities:**
- Greet on login with a personalised morning briefing
- Answer natural language queries about orders, products, customers
- Perform distance-based filtering (e.g. "orders from more than 100km away")
- Flag escalated customer questions from the support chat (Scenario 02 overflow)
- Switch context automatically when Moohsen changes tabs

**Agent tool set (Layer 2):**

| Tool | What it does |
|------|-------------|
| `getOrdersSummary(date)` | Count, revenue, status breakdown for a given date |
| `listOrders(filters)` | Filtered order list — status, date, location, amount |
| `getOrder(id)` | Full order detail including customer, items, shipping, booking |
| `listProducts(filters)` | Products with stock levels, filtered by stock status |
| `getLowStockProducts(threshold)` | Products below a stock threshold |
| `getCustomer(id)` | Customer profile + order history |
| `listCustomers(filters)` | Customer list with filters |
| `getEscalatedMessages()` | Support chat messages the storefront agent could not resolve |
| `calculateDistance(address, from)` | Haversine distance from a reference point (Drammen default) |
| `respondToEscalation(messageId, reply)` | Send a response back to the customer in the support chat |

**Context injection per view:**
When Moohsen switches tabs, the agent receives: `"User switched to [view] view."` — visible in the chat as a subtle separator line.

---

## Open Questions

- [ ] Should the login screen be a custom Sharif page, or use the standard Medusa login?
- [ ] Are there multiple admin users (mechanics, manager) or just Moohsen?
- [ ] Should the agent greeting be spoken (TTS) or text only?
- [ ] Where does the agent escalation queue come from — is it from the Scenario 02 support chat, or a separate channel?
- [ ] Should the agent be able to **take actions** (update stock, cancel orders) or only **read and report** in Phase 1?

---

## Wireframe Plan

Wireframes are drawn one screen at a time, approved before specs are written.

| Wireframe | Description | Approved |
|-----------|-------------|----------|
| 03.1 | Login screen with agent greeting | ⬜ |
| 03.2 | Open Glass dashboard | ⬜ |
| 03.3 | Orders list + filter panel + detail panel | ⬜ |
| 03.4 | Products & Inventory | ⬜ |
| 03.5 | Customers view | ⬜ |
| 03.6 | Agent sidebar (open state + context switch) | ⬜ |
| 03.7 | Settings — API key + agent instructions | ⬜ |

---

## Technical Architecture

Agent uses the same two-layer design as Scenario 02 ([02-agent-architecture.md](../02-man-purchasing-flow/02-agent-architecture.md)) with admin-specific tools and system prompt. API route: `POST /api/admin/agent/chat`.

Full technical spec will be written in `03-agent-architecture.md` after wireframes are approved.

---

_Created using Whiteport Design Studio (WDS) methodology_
