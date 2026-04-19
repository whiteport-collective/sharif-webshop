# Platform Spec — Agent System (Support Chat + Admin Interface)

**Status:** Draft  
**Author:** Idun (Whiteport setup agent)  
**Date:** 2026-04-10  
**Implementor:** Codex

---

## Vision

Sharif gets a dual-audience AI agent system:
- **Customer-facing chat** — support, returns, order status, product questions
- **Admin-facing chat** — staff tooling, escalations, manual overrides, dialog history

Skills are built incrementally over time (returns, order lookup, shipping, etc.). The system is isolated in Supabase but can be migrated to a dedicated Supabase project if Sharif scales.

---

## Infrastructure

### Supabase Project

**Same project as Whiteport Agent Space:** `acwnjsdtfwoflndvzabq` (eu-central-1)

Isolation via Postgres schema: `sharif.*`

- Whiteport (service role) → full access to all schemas
- Sharif system (anon/customer key) → `sharif.*` only via RLS

**Migration path:** If Sharif later wants their own infrastructure, all `sharif.*` tables migrate to a new Supabase project with no structural changes.

### Application Stack

Runs locally during development, deploys to HostUp VPS.

```
sharif-webshop/
├── backend/                    ← Medusa (existing)
├── storefront/                 ← Next.js (existing)
└── agent/                      ← NEW: Agent system
    ├── customer-agent/         ← Customer chat endpoint
    ├── admin-agent/            ← Admin chat endpoint
    └── shared/                 ← DB client, skill loader, types
```

### Integration Pattern

**Do NOT use Supabase Edge Functions as middleware.** VPS has its own env vars.

```
Customer/Admin frontend
        ↓  HTTP POST
  Agent server (VPS / local)
        ├── supabase-js (service role) → sharif.* tables
        ├── Anthropic SDK → Claude API
        └── Supabase Realtime → push to frontend
```

Supabase Edge Functions are reserved for external webhooks only (not agent logic).

---

## Database Schema: `sharif`

### `sharif.agent_config`

Persona and system prompts per audience. Edit in DB, no redeploy needed.

```sql
CREATE TABLE sharif.agent_config (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience    text NOT NULL CHECK (audience IN ('customer', 'admin')),
  name        text NOT NULL,           -- e.g. "Sharif Support"
  persona     text,                    -- short identity description
  system_prompt text NOT NULL,
  active      boolean DEFAULT true,
  updated_at  timestamptz DEFAULT now()
);
```

### `sharif.agent_skills`

Skills built up over time. Each skill is a named, versioned instruction block
loaded into the agent at session start.

```sql
CREATE TABLE sharif.agent_skills (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,           -- e.g. "handle-return"
  version     integer DEFAULT 1,
  description text,
  content     text NOT NULL,           -- full skill instructions (markdown)
  audience    text CHECK (audience IN ('customer', 'admin', 'both')),
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

**Planned skills (Phase 1):**
- `order-status` — look up order by email/order number
- `handle-return` — initiate return, explain policy
- `product-question` — search product catalog
- `escalate` — hand off to human, flag dialog

### `sharif.dialogs`

One row per conversation session.

```sql
CREATE TABLE sharif.dialogs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience     text NOT NULL CHECK (audience IN ('customer', 'admin')),
  user_id      text,                   -- customer email or staff id
  channel      text DEFAULT 'chat',    -- chat | api | widget
  agent_config_id uuid REFERENCES sharif.agent_config(id),
  started_at   timestamptz DEFAULT now(),
  ended_at     timestamptz,
  metadata     jsonb DEFAULT '{}'
);
```

### `sharif.dialog_turns`

Every turn in a dialog, preserved in original format.

```sql
CREATE TABLE sharif.dialog_turns (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dialog_id        uuid NOT NULL REFERENCES sharif.dialogs(id),
  role             text NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content          text,
  tool_calls       jsonb,              -- raw tool_use blocks if any
  tool_results     jsonb,              -- raw tool_result blocks if any
  agent_snapshot   jsonb,              -- active config + skill versions at this turn
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX ON sharif.dialog_turns(dialog_id);
```

### `sharif.views`

Disposable interfaces the agent creates on the fly. Short-lived, key-addressable.

Frontend polls or subscribes to its `view_key`. Agent replaces the view by
writing a new row with the same key (or a new key passed to the user).

```sql
CREATE TABLE sharif.views (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  view_key          text NOT NULL,     -- slug, passed to frontend
  view_type         text NOT NULL,     -- order_summary | return_form | admin_panel | ...
  payload           jsonb NOT NULL,    -- full view data
  created_by_dialog uuid REFERENCES sharif.dialogs(id),
  expires_at        timestamptz DEFAULT now() + interval '24 hours',
  consumed_at       timestamptz,       -- set when user acts on it
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX ON sharif.views(view_key);
CREATE INDEX ON sharif.views(expires_at) WHERE consumed_at IS NULL;
```

---

## Row Level Security

```sql
-- Customers and Sharif system only see their own dialogs
ALTER TABLE sharif.dialogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharif.dialog_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharif.views ENABLE ROW LEVEL SECURITY;

-- Service role (Whiteport) bypasses RLS — full access
-- Sharif anon key: select own dialogs by user_id claim in JWT
-- Views: accessible by view_key (no auth required — key is the secret)
```

Exact RLS policies to be defined when auth strategy is confirmed (JWT claims vs API key header).

---

## Agent Endpoints

### `POST /agent/customer`

```
Request:
  { dialog_id?: string, message: string, user_id?: string }

Response (streaming):
  text/event-stream — assistant tokens

Side effects:
  - Creates dialog row if dialog_id absent
  - Appends user + assistant turns to dialog_turns
  - May create sharif.views rows (returns view_key in response)
```

### `POST /agent/admin`

```
Request:
  { dialog_id?: string, message: string, staff_id: string }

Same streaming response.

Additional capabilities:
  - Can query all dialogs (not just own)
  - Can trigger escalation flags
  - Can read/write agent_config and agent_skills
```

---

## Disposable Views — Protocol

1. Agent decides a view is needed (e.g. "here is your order summary")
2. Agent calls internal `create_view(type, payload)` tool
3. View stored in `sharif.views` with a short `view_key` (e.g. `ord-4f2a`)
4. Agent returns view_key to frontend in response metadata
5. Frontend renders view at `GET /views/{view_key}`
6. Frontend marks view consumed: `POST /views/{view_key}/consume`

Views chain naturally: return form → confirmation → receipt are three sequential views, each created when the previous is consumed.

---

## Development Phases

### Phase 1 — Foundation (Codex, now)
- [ ] Supabase migration: create `sharif` schema + all 5 tables
- [ ] RLS scaffolding
- [ ] `agent/shared/` — supabase client, skill loader
- [ ] `agent/customer-agent/` — basic streaming endpoint
- [ ] `agent/admin-agent/` — basic streaming endpoint
- [ ] Seed: two `agent_config` rows (customer + admin), one test skill

### Phase 2 — Skills
- [ ] `order-status` skill + Medusa integration
- [ ] `handle-return` skill
- [ ] `product-question` skill

### Phase 3 — Views
- [ ] View creation + serving
- [ ] Frontend view renderer
- [ ] View chaining (return flow)

### Phase 4 — Admin interface
- [ ] Dialog history browser
- [ ] Skill editor (edit content in DB)
- [ ] Escalation dashboard

---

## Open Questions

1. **Auth strategy for customers** — email only, or account login required?
2. **Medusa API access** — does the agent call Medusa REST API, or query DB directly?
3. **Streaming transport** — SSE (simpler) or WebSocket (bidirectional)?
4. **VPS specs** — single Node process or separate customer/admin processes?

---

## Related Files

- `design-process/A-Product-Brief/` — product context
- `backend/` — Medusa backend (order data source)
- `storefront/` — Next.js frontend (where chat widget lands)
- Supabase project: `acwnjsdtfwoflndvzabq`
