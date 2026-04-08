# WO-004 — Admin Custom Views: Open Glass + Extended Pages

**Status:** Ready (start after WO-002 is complete — depends on sharif_settings + sharif_escalations tables)  
**Priority:** High  
**Depends on:** WO-002 (tables + admin agent sidebar must exist first)  
**Assigned to:** Codex  
**Spec refs:**
- `design-process/C-UX-Scenarios/03-admin-dashboard/03.2-open-glass/03.2-open-glass.md`
- `design-process/C-UX-Scenarios/03-admin-dashboard/03.3-orders/03.3-orders.md`
- `design-process/C-UX-Scenarios/03-admin-dashboard/03.4-products/03.4-products.md`
- `design-process/C-UX-Scenarios/03-admin-dashboard/03.5-customers/03.5-customers.md`

---

## Objective

Build Sharif-specific admin UI extensions on top of the standard Medusa admin. The standard Medusa admin (`localhost:9000/app`) already handles basic CRUD for orders, products, and customers. This WO adds:

1. **Open Glass Dashboard** — a new top-level page that replaces the Medusa default home with situational awareness view
2. **Orders page extension** — adds Sharif-specific filters and the agent context marker
3. **Products page extension** — adds low-stock surfacing and stock-level inline editing
4. **Customers page extension** — adds guest order grouping + open escalation badge

All as Medusa v2 admin extensions (custom routes / widgets).

---

## Part 1 — Open Glass Dashboard

### 1.1 Route

File: `backend/src/admin/routes/dashboard/page.tsx`

Register as "Dashboard" (overrides or sits alongside the Medusa default home in the nav).

### 1.2 Layout

Four-zone layout:

```
┌─────────────────────────────────────────────────────┐
│  KPI row: Orders today | Revenue today | Pending    │
│           mounting | Low stock count                │
├────────────┬────────────┬────────────┬──────────────┤
│ New orders │ Stock      │ Escalated  │ Patterns     │
│ (mini list)│ alerts     │ messages   │ (agent cards)│
├─────────────────────────────────────────────────────┤
│  Sales over time — line chart, period toggle        │
└─────────────────────────────────────────────────────┘
```

### 1.3 KPI cards (top row)

| Card | Source |
|------|--------|
| Orders today | `GET /admin/orders?created_at[gte]=today` — count |
| Revenue today | Same query — sum of `order.total` |
| Pending mounting | Orders with status `pending` that have a mounting shipping method |
| Low stock items | `GET /admin/inventory-items` — count variants below threshold from `sharif_settings.low_stock_threshold` (default: 4) |

### 1.4 New orders zone

Latest 5 orders since last login (or last 24h if no login timestamp). Columns:
- Order ID (`#display_id`)
- Customer name
- Tire(s) — `items[].title` concatenated
- Amount (NOK)
- Mounting location (from shipping method title)

Click row → navigate to `orders/{id}`.

### 1.5 Stock alerts zone

Variants where `stocked_quantity <= sharif_settings.low_stock_threshold`. Show:
- Product name + variant (dimension)
- Current qty — amber if ≤ threshold, red if 0
- "Gå til produkt" link → products page with that product highlighted

### 1.6 Escalated messages zone

Pull from `sharif_escalations WHERE status = 'pending'`. For each:
- Customer name + email
- Message text (truncated to 2 lines)
- Time since created
- "Åpne i agent" button → opens agent sidebar focused on that escalation

If empty: "Ingen ubesvarte spørsmål — bra jobbet."

### 1.7 Patterns zone

On page load: call `POST /admin/agent/chat` (WO-002) with a fixed prompt:
```
Analyser de siste 7 dagenes ordredata. Finn 3–5 mønstre eller avvik som Moohsen bør vite om. 
Svar med JSON: { patterns: [{ icon, headline, supportingData, suggestedAction }] }
```

Render each pattern as a card. Cache in `sessionStorage` — don't re-call on tab switch.

Card layout:
- Icon (emoji or lucide icon, based on pattern type)
- Headline (one sentence)
- Supporting data (1–2 numbers)
- "Drill in" button → opens agent sidebar with deeper breakdown query pre-sent

### 1.8 Sales chart

Line chart using a charting library already in the Medusa admin stack (check for `recharts` — it's bundled with Medusa admin).

Series: current period + up to 3 prior years same period.

Data: `GET /admin/orders` with date filters, aggregated by day client-side.

Controls:
- Period: "Denne uken" / "Denne måneden" / "Dette året"
- Comparison: toggles for "–1 år", "–2 år", "–3 år"

---

## Part 2 — Orders Page Extension

File: `backend/src/admin/widgets/orders-sharif-toolbar/index.tsx`

Inject as a `order_list_before` widget.

Adds to the standard orders list:
- **Mounting location filter** — dropdown: Alle / Drammen / Fjellhamar / Hjemlevering
- **Distance filter** — text input: "Mer enn X km fra Drammen" — triggers `calculateDistance` tool call per order (runs client-side, filters rendered list)

The mounting filter reads `order.shipping_methods[].name` for known values.

No override of the standard Medusa orders list. These are additive filters only.

---

## Part 3 — Products Page Extension

File: `backend/src/admin/widgets/products-stock-toolbar/index.tsx`

Inject as a `product_list_before` widget.

Adds:
- **Stock status filter** — "Alle / På lager / Lav beholdning / Tomt"
- **Low stock badge** on each product row showing the lowest variant stock level
- The low stock threshold comes from `sharif_settings.low_stock_threshold`

Implementation: widget fetches inventory levels for visible products, computes status, overlays badges via DOM or a sibling component. Use `GET /admin/inventory-items?sku[]=...` batched for visible rows.

---

## Part 4 — Customers Page Extension

File: `backend/src/admin/widgets/customers-sharif-toolbar/index.tsx`

Inject as a `customer_list_before` widget.

Adds:
- **Guest orders** notice: badge showing count of guest orders (orders with no customer_id) — links to orders filtered by `customer_id IS NULL`
- **Open escalations** badge on customer rows — if `sharif_escalations` has a pending row matching that customer's email, show a red dot

---

## Files to create

| File | Purpose |
|------|---------|
| `backend/src/admin/routes/dashboard/page.tsx` | Open Glass dashboard page |
| `backend/src/admin/routes/dashboard/components/KpiCards.tsx` | KPI row |
| `backend/src/admin/routes/dashboard/components/NewOrdersZone.tsx` | New orders mini list |
| `backend/src/admin/routes/dashboard/components/StockAlertsZone.tsx` | Low stock alerts |
| `backend/src/admin/routes/dashboard/components/EscalationsZone.tsx` | Escalated messages |
| `backend/src/admin/routes/dashboard/components/PatternsZone.tsx` | Agent pattern cards |
| `backend/src/admin/routes/dashboard/components/SalesChart.tsx` | Revenue line chart |
| `backend/src/admin/widgets/orders-sharif-toolbar/index.tsx` | Orders page filters |
| `backend/src/admin/widgets/products-stock-toolbar/index.tsx` | Products stock badges |
| `backend/src/admin/widgets/customers-sharif-toolbar/index.tsx` | Customers escalation badges |

---

## Open questions to resolve before build

- [ ] Does Moohsen want to replace the Medusa default home (Overview page), or add Dashboard as a second nav item?
- [ ] What is the default low stock threshold — 4 units per variant, or configurable from day one?
- [ ] Is `recharts` available in the Medusa admin bundle, or does Codex need to add a chart library?
- [ ] Should the patterns zone fail gracefully (hide zone, no error) if the agent API isn't running yet?
- [ ] Login (03.1): confirm whether to use standard Medusa login or build a custom Sharif-branded page. Default assumption: keep Medusa default for Phase 1.

---

## Definition of done

- [ ] Open Glass Dashboard loads at `localhost:9000/app/dashboard`
- [ ] KPI cards show live data from Medusa
- [ ] New orders zone shows last 5 orders with mounting location
- [ ] Stock alerts zone shows variants below threshold
- [ ] Escalated messages zone shows pending rows from `sharif_escalations`
- [ ] Patterns zone renders 3–5 agent-generated cards on page load
- [ ] Sales chart shows current period + prior years toggle
- [ ] Orders page: mounting location filter and distance filter work
- [ ] Products page: stock status filter + low-stock badges visible
- [ ] Customers page: escalation badge shows on rows with pending escalations
- [ ] All extension widgets load without breaking standard Medusa UI
- [ ] TypeScript — no `any`, no `ts-ignore`
- [ ] No console errors in browser

---

_Freya · WO-004 · 2026-04-07_
