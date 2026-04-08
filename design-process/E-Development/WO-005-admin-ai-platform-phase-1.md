# WO-005 — Admin AI Platform Phase 1: Dashboard + Orders + Products + Inventory + Customers

**Status:** Draft — Awaiting approval  
**Priority:** Critical  
**Assigned to:** Codex  
**Supersedes:** WO-002 and WO-004 as the implementation baseline for admin AI  
**Depends on:** Existing Sharif Medusa admin extension setup  
**Spec refs:**
- `design-process/C-UX-Scenarios/03-admin-dashboard/03-admin-dashboard.md`
- `design-process/C-UX-Scenarios/03-admin-dashboard/03.2-open-glass/03.2-open-glass.md`
- `design-process/C-UX-Scenarios/03-admin-dashboard/03.3-orders/03.3-orders.md`
- `design-process/C-UX-Scenarios/03-admin-dashboard/03.4-products/03.4-products.md`
- `design-process/C-UX-Scenarios/03-admin-dashboard/03.5-customers/03.5-customers.md`
- `design-process/C-UX-Scenarios/03-admin-dashboard/03.6-agent-sidebar/03.6-agent-sidebar.md`
- `design-process/C-UX-Scenarios/03-admin-dashboard/03.7-settings/03.7-settings.md`

---

## Objective

Build the first production-ready version of Sharif's admin AI platform.

Phase 1 is not centered on customer support chat. It is centered on **operational leverage** for Moohsen:

1. **Dashboard** — Open Glass as a new admin category
2. **Orders** — prompt-driven order search and advanced filtering
3. **Products** — prompt-driven product search and analysis
4. **Inventory** — supplier file upload, stock intake, replenishment support
5. **Customers** — prompt-driven customer discovery and segmentation
6. **Settings** — secure configuration for the AI system

This WO establishes the real production foundation for AI-assisted admin work.

---

## What Phase 1 Is Optimizing For

The first valuable AI capability for Sharif admin is not escalation handling.

The first valuable AI capability is:

**ingest -> interpret -> propose -> approve -> write**

Concrete outcomes:

- faster supplier file handling
- faster product and stock updates
- better inventory decisions
- natural language retrieval across orders, products, inventory, and customers
- Open Glass overview as the admin landing experience

Customer chat and escalation handling are explicitly deferred to a later phase.

---

## Admin Information Architecture

Phase 1 admin categories:

| Category | Purpose |
|------|---------|
| `Dashboard` | Open Glass overview |
| `Orders` | Prompt-driven order search and filtering |
| `Products` | Prompt-driven product search and assortment analysis |
| `Inventory` | Delivery intake, file parsing, stock updates, reorder suggestions |
| `Customers` | Prompt-driven customer search and list building |
| `Settings` | AI configuration and operational defaults |

Out of scope for now:

- `Promotions`
- `Price lists` as dedicated sections
- customer support chat
- support escalation queue

Pricing support may appear inside Products and Inventory workflows, but dedicated promotions / price list modules are deferred.

---

## Delivery Sequence

Implementation order for this WO:

1. **Settings foundation**
2. **Global admin agent sidebar**
3. **Dashboard / Open Glass**
4. **Orders prompt-search**
5. **Products prompt-search**
6. **Inventory workflows**
7. **Customers prompt-search**
8. **Hardening, approvals, and validation**

This order is intentional. The platform must have settings and the persistent agent surface before view-specific AI workflows are built.

---

## Part 1 — Settings Foundation

### 1.1 Settings model

Upgrade the `sharif_settings` module to support the admin AI platform.

Required fields:

| Field | Purpose |
|------|---------|
| `agent_enabled` | Global on/off for admin AI |
| `anthropic_api_key_encrypted` | API key, encrypted at rest |
| `agent_instructions_overlay` | Runtime prompt overlay |
| `low_stock_threshold` | Operational stock warning threshold |
| `mounting_locations` | Store mounting locations |
| `store_name` | Used in prompts and UI |
| `admin_name` | Used in briefing / personalization |
| `default_language` | Admin default language |

### 1.2 Security requirement

Anthropic keys must be treated as production secrets.

Minimum requirement:

- encrypted at rest in backend storage
- never returned to browser in full
- only expose derived status: configured / not configured

Preferred:

- "Test connection" endpoint
- settings audit metadata

### 1.3 Settings UI

Build the admin settings page according to the approved UX intent.

Sections:

#### Agent
- Anthropic API key
- key status
- test connection
- agent instructions overlay
- base instructions viewer
- model display

#### Store defaults
- low stock threshold
- mounting locations
- store name
- admin display name
- default language

### 1.4 Files expected

| File | Purpose |
|------|---------|
| `backend/src/modules/sharif-settings/*` | Extended module and migration |
| `backend/src/api/admin/sharif-settings/route.ts` | Settings CRUD |
| `backend/src/api/admin/sharif-settings/test/route.ts` | Test connection |
| `backend/src/admin/routes/sharif-settings/page.tsx` | Settings UI |

---

## Part 2 — Global Admin Agent Sidebar

### 2.1 Purpose

The right sidebar is the persistent AI workspace across admin views.

It is not just a chat window. It is the control surface for:

- natural language search
- temporary "open glass" / disposable interfaces
- file interpretation workflows
- preview + approval flows
- operational recommendations

### 2.2 Requirements

- persistent right-side panel across admin views
- remembered open/closed state per session
- current-view context badge
- context switch markers in conversation
- streaming responses
- structured UI blocks for task flows, not only plain text
- preview / confirm pattern for any write action

### 2.3 Backend chat route

Extend `POST /admin/agent/chat` so it becomes the central admin AI endpoint.

Requirements:

- read Anthropic credentials from Sharif settings
- use prompt overlay from settings
- inject current admin view context
- support tool loop robustly
- fail clearly if no key is configured

### 2.4 Tooling principle

Phase 1 tools are primarily read-oriented, plus approved inventory writes.

All future write tools must be designed for:

- dry-run
- preview
- explicit approval
- audit logging

### 2.5 Files expected

| File | Purpose |
|------|---------|
| `backend/src/api/admin/agent/chat/route.ts` | Streaming admin AI endpoint |
| `backend/src/lib/admin-agent/tools.ts` | Tool schemas and execution |
| `backend/src/admin/widgets/agent-sidebar/index.tsx` | Persistent sidebar shell or layout integration |

---

## Part 3 — Dashboard: Open Glass

### 3.1 Placement

Open Glass is a new top-level admin category: `Dashboard`.

It is not part of the sidebar. It is the primary dashboard view.

### 3.2 Goal

Give Moohsen immediate situational awareness with no noise.

### 3.3 Required zones

- KPI row
- new orders
- stock alerts
- patterns / AI insights
- sales over time

### 3.4 Architecture rule

Open Glass must be built on a **real read model**, not on chat output alone.

That means:

- deterministic sections from Medusa + Sharif modules
- AI-generated insight cards only after structured data has been assembled
- graceful degradation when AI is unavailable

### 3.5 Files expected

| File | Purpose |
|------|---------|
| `backend/src/admin/routes/dashboard/page.tsx` | Open Glass page |
| `backend/src/admin/routes/dashboard/components/*` | KPI, orders, stock, patterns, chart |
| `backend/src/api/admin/custom/*` | Optional read-model helpers |

---

## Part 4 — Orders: Prompt-Driven Search

### 4.1 Goal

Under `Orders`, Moohsen should be able to search and filter using prompts instead of only manual filter controls.

Examples:

- "Show all orders over 5000 kr from the last 30 days"
- "Find all home delivery orders from Østfold"
- "List winter tire orders from repeat customers"

### 4.2 Requirements

- natural language -> structured filter translation
- temporary result views inside the page
- clear visual indication of active AI-generated filters
- easy reset back to standard orders list

### 4.3 Tool expectations

| Tool | Purpose |
|------|---------|
| `listOrders` | filtered order lists |
| `getOrder` | drill into a single order |
| `getOrdersSummary` | quick aggregate views |

---

## Part 5 — Products: Prompt-Driven Search and Analysis

### 5.1 Goal

Under `Products`, Moohsen should be able to find and reason about products in natural language.

Examples:

- "Show all 205/55R16 winter tires with low stock"
- "Which summer tires have weak margins?"
- "Find products we stock in Drammen but rarely sell"

### 5.2 Requirements

- natural language -> product filter translation
- AI-assisted assortment exploration
- support for future pricing discussions, but not dedicated Promotions / Price Lists sections yet

### 5.3 Tool expectations

| Tool | Purpose |
|------|---------|
| `listProducts` | product filtering |
| `getProduct` | product detail |
| `listInventory` | stock context |
| `getLowStockProducts` | operational surfacing |

---

## Part 6 — Inventory: Deliveries, File Upload, and Reorder Support

### 6.1 Goal

Under `Inventory`, Moohsen should be able to register new deliveries and use AI to interpret supplier files.

This is the most important operational workflow in Phase 1.

### 6.2 Core workflow

1. Upload supplier file
2. Agent parses rows
3. System matches rows to existing products / variants where possible
4. System identifies:
   - stock updates
   - possible new products
   - unclear rows needing human review
5. Agent proposes write actions
6. Admin approves
7. System writes changes
8. Result log is shown

### 6.3 File types to support in Phase 1

At minimum:

- CSV
- Excel (`.xlsx`)

### 6.4 Inventory capabilities

- intake of deliveries
- stock update preview
- product/variant matching
- candidate creation for new products
- reorder recommendations
- "what should I order?" suggestions based on stock + demand

### 6.5 Architecture requirement

Inventory write actions must use:

- preview
- approval
- audit log

No direct blind writes from chat.

### 6.6 Files expected

| File | Purpose |
|------|---------|
| `backend/src/api/admin/inventory/import/*` | upload / parse / preview endpoints |
| `backend/src/lib/admin-agent/inventory-tools.ts` | parsing and proposal logic |
| `backend/src/admin/routes/inventory/*` | inventory page and task UI |

---

## Part 7 — Customers: Prompt-Driven Discovery

### 7.1 Goal

Under `Customers`, Moohsen should be able to list and discover customers according to business criteria.

Examples:

- "Customers who bought winter tires two years in a row but not this year"
- "Customers from Drammen with more than 3 orders"
- "High-value customers who booked mounting"

### 7.2 Requirements

- natural language -> customer filters and derived lists
- saved or disposable views
- result lists that can be inspected in the existing customer UI

### 7.3 Tool expectations

| Tool | Purpose |
|------|---------|
| `listCustomers` | customer filtering |
| `getCustomer` | profile + history |
| `listOrders` | customer-order joins when needed |

---

## Phase 1 Tool Set

Required Phase 1 tools:

| Tool | Purpose |
|------|---------|
| `getOrdersSummary` | Dashboard + order overview |
| `listOrders` | Orders querying |
| `getOrder` | Order detail |
| `listProducts` | Product querying |
| `getProduct` | Product detail |
| `listInventory` | Inventory visibility |
| `getLowStockProducts` | Stock alerts |
| `listCustomers` | Customer querying |
| `getCustomer` | Customer detail |
| `parseInventoryFile` | Supplier file interpretation |
| `previewInventoryImport` | Proposed updates before approval |
| `applyInventoryImport` | Approved stock write |
| `recommendReorder` | Suggest what to order next |

Write tools must require approval. No autonomous writes in Phase 1.

---

## Explicitly Deferred

The following are deferred from this WO:

- customer support chat
- customer escalation queue
- escalation reply workflows
- promotions as a dedicated admin module
- price lists as a dedicated admin module
- autonomous operational actions
- decision-learning loops

These can become future WOs after the operational admin AI base is working.

---

## Architecture Rules

### Rule 1 — No prototype shortcuts

No hardcoded environment IDs, hidden demo assumptions, or final-code mock flows.

### Rule 2 — AI is not the source of truth

Operational state comes from Medusa and Sharif modules. AI interprets and assists.

### Rule 3 — Preview before write

Any inventory or future admin mutation must show a preview and require approval.

### Rule 4 — Prompt-generated views are disposable

Orders, Products, Inventory, and Customers should support temporary AI-generated views without replacing the standard admin structure.

### Rule 5 — Graceful failure

If AI is unavailable:

- settings still load
- dashboard deterministic blocks still load
- admin pages still function
- AI features clearly show unavailable state

---

## Definition of Done

- [ ] Settings page matches the approved Phase 1 configuration scope
- [ ] Anthropic API key is stored securely and never exposed in cleartext to browser
- [ ] Admin sidebar is persistent across Dashboard / Orders / Products / Inventory / Customers / Settings
- [ ] Sidebar supports streaming chat and structured task UIs
- [ ] Dashboard exists as a new admin category and shows Open Glass blocks from live data
- [ ] Orders supports prompt-driven search and temporary AI-generated filtered views
- [ ] Products supports prompt-driven search and analysis
- [ ] Inventory supports CSV/XLSX upload, parsing, preview, approval, and stock update
- [ ] Inventory can propose reorder suggestions from stock and demand signals
- [ ] Customers supports prompt-driven search and filtered list generation
- [ ] All write actions in Phase 1 require explicit approval
- [ ] No customer-chat/escalation logic is treated as a dependency for Phase 1 value
- [ ] TypeScript passes for changed files
- [ ] No console errors in affected admin views

---

## Approval Questions Before Build

1. **Secrets policy**
   Are we treating Anthropic keys as encrypted production secrets?  
   Default assumption: **Yes**.

2. **Inventory file support**
   Should Phase 1 support both CSV and Excel from day one?  
   Default assumption: **Yes**.

3. **Write scope**
   Is the only approved Phase 1 write action inventory-related create/update after preview?  
   Default assumption: **Yes**.

4. **Pricing scope**
   Should pricing discussion stay embedded inside Products / Inventory for now, without a dedicated Price Lists area?  
   Default assumption: **Yes**.

---

## Notes

- This WO is the operational AI baseline for Sharif admin.
- Support chat is not the driver for Phase 1 value.
- No implementation should begin until this WO is explicitly approved.

---

_Codex · WO-005 · 2026-04-07_
