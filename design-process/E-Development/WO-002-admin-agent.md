# WO-002 — Admin Agent: Settings + Sidebar

**Status:** Ready  
**Priority:** High  
**Assigned to:** Codex  
**Blocks:** WO-003 (customer chat reads config from this)  
**Spec refs:**
- `design-process/C-UX-Scenarios/03-admin-dashboard/03.6-agent-sidebar/03.6-agent-sidebar.md`
- `design-process/C-UX-Scenarios/02-man-purchasing-flow/02-agent-architecture.md`

---

## Objective

Build the admin agent infrastructure: a `sharif_settings` table in Medusa DB, an admin settings page to configure the agent, and the agent sidebar that Moohsen uses while working in the admin dashboard.

This WO must be complete before WO-003 (customer chat) begins — the storefront agent reads its config from `sharif_settings`.

---

## Part 1 — Agent Settings (Medusa backend)

### 1.1 Database migration

Create a Medusa v2 custom module `sharif-settings` with a single table:

```sql
CREATE TABLE IF NOT EXISTS sharif_settings (
  id                     text PRIMARY KEY DEFAULT 'default',
  agent_enabled          boolean DEFAULT true,
  language               text DEFAULT 'nb',
  system_prompt_overlay  text,
  escalation_email       text,
  updated_at             timestamptz DEFAULT now()
);

INSERT INTO sharif_settings (id) VALUES ('default') ON CONFLICT DO NOTHING;
```

Files:
- `backend/src/modules/sharif-settings/index.ts`
- `backend/src/modules/sharif-settings/migration.ts`

### 1.2 Admin REST endpoints

```
GET  /admin/sharif-settings      → returns the default row
POST /admin/sharif-settings      → upserts the default row
```

Authenticated via Medusa admin JWT. File: `backend/src/api/admin/sharif-settings/route.ts`

---

## Part 2 — Admin Settings UI

File: `backend/src/admin/routes/sharif-settings/page.tsx`

A Medusa admin extension page registered as "Agent-innstillinger" in the sidebar.

| Field | Type | Description |
|-------|------|-------------|
| Agent enabled | Toggle | Turns customer-facing agent on/off |
| Language | Select: nb / sv / en | Default response language |
| System prompt overlay | Textarea | Extra instructions appended to base prompt |
| Escalation email | Text input | Where unanswered customer questions are forwarded |

Saves via POST `/admin/sharif-settings`. Show success toast on save.

---

## Part 3 — Admin Agent Sidebar

The agent sidebar is a persistent panel on the right side of every admin page. It is not a separate route — it is a layout-level component.

### 3.1 Backend: Admin chat API route

File: `backend/src/api/admin/agent/chat/route.ts`

Streaming POST endpoint — same pattern as the storefront chat (WO-003) but with admin-specific tools.

**Request body:**
```ts
{
  messages: { role: "user" | "assistant", content: string }[]
  sessionContext: {
    view: "dashboard" | "orders" | "products" | "customers" | "settings"
  }
}
```

**Response:** `text/event-stream`

**Claude model:** `claude-sonnet-4-6`

**System prompt:**
```
Du er Sharif-adminassistenten. Du hjelper Moohsen med å administrere nettbutikken.
Du har tilgang til ordre, produkter, lagerstatus og kundeinformasjon via verktøy.
Svar alltid på norsk med mindre brukeren skriver et annet språk.
Tone: Effektiv og presis — som en god operasjonsassistent.

Nåværende visning: {view}
```

**Available tools:**

| Tool | Parameters | Medusa call |
|------|-----------|-------------|
| `listOrders` | `filters?: { status, date_from, date_to, search }` | `GET /admin/orders` |
| `getOrder` | `orderId: string` | `GET /admin/orders/{id}` |
| `listProducts` | `filters?: { q, status }` | `GET /admin/products` |
| `getProduct` | `productId: string` | `GET /admin/products/{id}` |
| `listInventory` | — | `GET /admin/inventory-items` |
| `listCustomers` | `filters?: { q }` | `GET /admin/customers` |
| `getCustomer` | `customerId: string` | `GET /admin/customers/{id}` |
| `getOrdersSummary` | `{ date_from, date_to }` | Aggregates from listOrders |
| `getEscalatedMessages` | — | `GET /admin/sharif-escalations` |
| `respondToEscalation` | `{ id, reply }` | `POST /admin/sharif-escalations/{id}/reply` |
| `calculateDistance` | `{ address, from }` | Simple geocoding or postal-code lookup |

File: `backend/src/lib/admin-agent/tools.ts`

### 3.2 Escalations table

```sql
CREATE TABLE IF NOT EXISTS sharif_escalations (
  id          text PRIMARY KEY,
  customer_email  text,
  customer_name   text,
  message     text,
  suggested_reply text,
  reply       text,
  status      text DEFAULT 'pending',  -- pending | replied
  created_at  timestamptz DEFAULT now(),
  replied_at  timestamptz
);
```

File: `backend/src/modules/sharif-escalations/migration.ts`

Endpoints:
```
GET  /admin/sharif-escalations           → pending escalations
POST /admin/sharif-escalations/{id}/reply → mark replied, store reply, send email
```

### 3.3 Admin sidebar UI

This is a Medusa admin extension — a layout-level widget injected via the admin plugin system.

File: `backend/src/admin/widgets/agent-sidebar/index.tsx`

**Layout:**
- Fixed panel, right side, width 360px, full height
- Toggle button: floating bottom-right when closed
- Header: "Agent" + close button
- Context chip: shows current view name (e.g. "Ordre-visning")
- Chat area: user bubbles (right) + agent bubbles (left) + context separator lines
- Input area: upload (+) button + text field + send button
- On first open after login: shows morning briefing (agent fetches via `getOrdersSummary` + `getEscalatedMessages`)

**Context injection on navigation:**
When the user switches views, append a separator line to chat history (not a message bubble):
```
— Byttet til Ordre-visning —
```
And inject `sessionContext.view` into the next API call.

**Escalation cards:**
When `getEscalatedMessages` returns results, render each as a card:
- Customer name + email
- Their message
- Suggested reply (editable textarea)
- "Send svar" button → calls `respondToEscalation`

**Persistence:** Chat history in `localStorage` per session. Clear on logout.

---

## Environment variables required

```
ANTHROPIC_API_KEY=sk-...
ESCALATION_FROM_EMAIL=noreply@sharif.no
```

---

## Files to create

| File | Purpose |
|------|---------|
| `backend/src/modules/sharif-settings/index.ts` | Medusa module definition |
| `backend/src/modules/sharif-settings/migration.ts` | DB migration |
| `backend/src/modules/sharif-escalations/migration.ts` | DB migration |
| `backend/src/api/admin/sharif-settings/route.ts` | Settings CRUD |
| `backend/src/api/admin/agent/chat/route.ts` | Streaming admin chat |
| `backend/src/api/admin/sharif-escalations/route.ts` | Escalations list + reply |
| `backend/src/lib/admin-agent/tools.ts` | Tool schemas + server actions |
| `backend/src/admin/routes/sharif-settings/page.tsx` | Settings UI page |
| `backend/src/admin/widgets/agent-sidebar/index.tsx` | Agent sidebar widget |

---

## Definition of done

- [ ] `sharif_settings` and `sharif_escalations` tables exist with seed data
- [ ] Settings page loads in Medusa admin, saves config, shows toast
- [ ] `POST /admin/agent/chat` returns streamed Claude response
- [ ] Agent sidebar renders in admin layout, can be toggled open/closed
- [ ] Context chip updates when navigating between views
- [ ] Morning briefing appears on first open after login
- [ ] Escalation cards render with editable reply + send button
- [ ] `respondToEscalation` sends email and marks row as replied
- [ ] TypeScript — no `any`, no `ts-ignore`
- [ ] No console errors in browser
