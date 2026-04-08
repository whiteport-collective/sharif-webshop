# Brownfield Gap Map — Sharif Webshop

**Created:** 2026-04-07  
**Author:** Freya (WDS brownfield scan)  
**Method:** design-process/ vs storefront/src + backend/src

---

## How to read this

| Status | Meaning |
|--------|---------|
| ✅ Built | Exists in code, matches spec intent |
| 🟡 Partial | Exists but missing specced features |
| ❌ Not built | Specced, no code found |
| 📋 Has WO | A Work Order already written — Mimir picks up |

---

## Scenario 01 — Main Order Flow (Harriet)

| View | Specced | Code location | Status | Notes |
|------|---------|---------------|--------|-------|
| 01.1 Dimension Input | ✓ | `storefront/src/modules/home/components/tire-search/` | ✅ Built | Dimension field exists |
| 01.2 Product Cards (carousel) | ✓ | `storefront/src/modules/products/components/tire-card/` + `tire-carousel/` | ✅ Built | Card + carousel both present |
| 01.3 Product Detail | ✓ | `storefront/src/modules/products/components/product-detail-panel/` | ✅ Built | EU label display rendered inline in panel |
| 01.3 AI story (agent copy in product panel) | ✓ agent-support | None | ❌ Not built | 📋 WO-003 Part 8 |
| 01.4 Delivery & Mounting | ✓ | `storefront/src/modules/checkout/components/checkout-panel/` + `checkout-panel-content/` | ✅ Built | Full FlowShell panel |
| 01.5 Payment | ✓ | `storefront/src/modules/checkout/components/payment/` | ✅ Built | Stripe embedded |
| 01.6 Book Mounting | ✓ | `storefront/src/modules/checkout/components/booking/` | ✅ Built | Booking calendar component present |
| 01.7 Order Confirmation | ✓ | `storefront/src/app/[countryCode]/(main)/order/[id]/confirmed/` | ✅ Built | |

**Scenario 01 storefront UI: 7/7 views built. Only missing: agent integration (WO-003).**

---

## Scenario 02 — Customer Chat Agent (Ole / Harriet)

| Feature | Specced | Code location | Status | Notes |
|---------|---------|---------------|--------|-------|
| `/api/agent/chat` streaming route | ✓ | None | ❌ Not built | 📋 WO-003 Part 1 |
| System prompt builder | ✓ | None | ❌ Not built | 📋 WO-003 Part 2 |
| Tool schemas (UI + data tools) | ✓ | None | ❌ Not built | 📋 WO-003 Part 3 |
| Layer 2 data tools | ✓ | None | ❌ Not built | 📋 WO-003 Part 4 |
| `/api/agent/escalate` route | ✓ | None | ❌ Not built | 📋 WO-003 Part 5 |
| `AgentToolContext` | ✓ | None | ❌ Not built | 📋 WO-003 Part 6 |
| `useStreamingChat` hook | ✓ | None | ❌ Not built | 📋 WO-003 Part 7 |
| Agent panel UI | ✓ | None | ❌ Not built | 📋 WO-003 Part 8 |
| FlowShell integration | ✓ | `flow-shell/index.tsx` exists, no agent wiring | 🟡 Partial | 📋 WO-003 Part 9 |

**Customer agent: 0/9 features built. FlowShell is the shell; agent wiring missing entirely.**

---

## Scenario 03 — Admin Dashboard (Moohsen)

Entry point: `localhost:9000/app` — Medusa admin UI with Sharif extensions.

| View | Specced | Code location | Status | Notes |
|------|---------|---------------|--------|-------|
| 03.1 Login | ✓ wireframe approved | Medusa default login | 🟡 Partial | Open question: custom Sharif login or keep Medusa default? |
| 03.2 Open Glass Dashboard | ✓ wireframe approved | None | ❌ Not built | 📋 WO-004 |
| 03.3 Orders | ✓ wireframe approved | Medusa default orders list | 🟡 Partial | Sharif filters (mounting location, distance) + agent context missing; 📋 WO-004 |
| 03.3b Order Detail | ✓ spec | Medusa default order detail | 🟡 Partial | Custom fields (mounting, booking ref) not surfaced; 📋 WO-004 |
| 03.4 Products & Inventory | ✓ wireframe approved | Medusa default products | 🟡 Partial | Low-stock highlight + threshold-based alerts missing; 📋 WO-004 |
| 03.5 Customers | ✓ wireframe approved | Medusa default customers | 🟡 Partial | Standard Medusa only, no Sharif-specific extensions; 📋 WO-004 |
| 03.6 Agent Sidebar | ✓ wireframe approved | None | ❌ Not built | 📋 WO-002 Part 3 |
| 03.7 Settings | ✓ wireframe approved | None | ❌ Not built | 📋 WO-002 Part 2 |

---

## Backend — Admin Agent Infrastructure

| Feature | Specced | Code location | Status | Notes |
|---------|---------|---------------|--------|-------|
| `sharif_settings` Medusa module + migration | ✓ | None | ❌ Not built | 📋 WO-002 Part 1 |
| `sharif_escalations` Medusa module + migration | ✓ | None | ❌ Not built | 📋 WO-002 Part 3.2 |
| `GET/POST /admin/sharif-settings` | ✓ | None | ❌ Not built | 📋 WO-002 Part 1.2 |
| `GET /admin/sharif-escalations` | ✓ | None | ❌ Not built | 📋 WO-002 Part 3.2 |
| `POST /admin/agent/chat` streaming | ✓ | None | ❌ Not built | 📋 WO-002 Part 3.1 |
| Admin agent tools (`tools.ts`) | ✓ | None | ❌ Not built | 📋 WO-002 Part 3.1 |

**Backend baseline: standard Medusa only. Custom APIs: 0 built.**

---

## Design System

| Component | Specced | Code location | Status |
|-----------|---------|---------------|--------|
| `eu-label-display` | ✓ | Inline in `product-detail-panel/index.tsx` — `EuRow` component | 🟡 Not extracted as standalone |
| `product-card` / tire card | ✓ | `tire-card/index.tsx` | ✅ Built |
| `dimension-input` | ✓ | `tire-search/index.tsx` | ✅ Built |
| `booking-calendar` | ✓ | `checkout/components/booking/` | ✅ Built |
| `order-summary` | ✓ | `modules/order/components/order-summary/` | ✅ Built |
| `global-header` | ✓ | `modules/layout/templates/nav/` | ✅ Built |
| `stock-badge` | ✓ | Not found | ❌ Not built |
| `cta-button` | ✓ | Not found as standalone — inline uses only | 🟡 Not extracted |
| `trust-bar` | ✓ | Not found | ❌ Not built |
| `quantity-toggle` | ✓ | Not found as standalone | 🟡 Not extracted |
| `shop-card` | ✓ | Not found | ❌ Not built |
| `buy-button` | ✓ | Not found as standalone | 🟡 Not extracted |

---

## Work Order Coverage

| WO | Scope | Status |
|----|-------|--------|
| WO-002 | Admin agent infra (settings table, escalations table, settings page, agent sidebar, admin chat API) | Ready — Mimir |
| WO-003 | Customer chat agent (full storefront agent panel + FlowShell integration) | Ready after WO-002 — Mimir |
| **WO-004** | **Admin custom views (Open Glass dashboard, extended orders/products/customers pages as Medusa admin extensions)** | **→ Needs to be written** |

---

## Priority Order

1. **WO-002** — blocks WO-003 (sharif_settings must exist before storefront agent boots)
2. **WO-003** — customer-facing agent, core demo flow
3. **WO-004** — admin custom views, second half of demo
4. Design system extraction — low priority; inline implementations work for demo

---

_Freya · brownfield scan · 2026-04-07_
