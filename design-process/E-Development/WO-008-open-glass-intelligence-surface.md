# WO-008 - Open Glass Intelligence Surface

**Status:** Draft - Ready for approval  
**Priority:** Critical  
**Assigned to:** Codex  
**Depends on:** WO-005 admin AI platform baseline, existing Open Glass panel, persisted conversation history  
**Spec refs:**
- `design-process/A-Product-Brief/05-open-glass-system-spec.md`
- `design-process/A-Product-Brief/04-platform-requirements.md`
- `design-process/C-UX-Scenarios/03-admin-dashboard/03.2-open-glass/03.2-open-glass.md`

---

## Objective

Build Open Glass as an AI-driven business controller surface inside Sharif admin.

The goal is not to make a better search panel.
The goal is to let the agent gather what is new across the business, decide what matters, and present it as a useful management-style page for the current user and current screen size.

---

## Product Outcome

After this WO, the operator should be able to ask things like:

- "show me what is new"
- "give me a morning briefing"
- "show me insights from last week"
- "compare this week to the same week last year"
- broader natural-language questions about the business, trends, risks, or opportunities

Expected behavior:

- the agent pulls relevant new data from supported business channels
- the agent compares current performance to useful baselines
- the agent chooses the strongest findings
- the agent renders a composed page using charts, lists, cards, short text, and actions
- the composed page is published as a structured briefing in Agent Space
- the chat window may carry short commentary tied to the visible briefing
- the page adapts to the available screen width
- the operator can move from insight to action

Orders search and scripted selection remain valid supporting tools, but they are no longer the primary product definition.

---

## Scope

### In scope

- Open Glass as a controller-style insight surface
- Detection and summarization of new data
- Time-based briefing requests
- Comparative context
- Responsive page composition
- Controlled rendering through design-system-backed blocks
- Connection to real actions where actions already exist
- Orders and inventory/file workflows as first supported channels

### Out of scope

- Free-form UI generation from raw model output
- Building every admin category before Open Glass can be useful
- Placeholder analytics tiles
- Turning Open Glass into a static dashboard editor

---

## Core Decisions

### 1. Open Glass is an intelligence surface

Open Glass exists to present business insight, not only to search lists.

### 1b. Open Glass should handle open-ended requests

The user should be able to ask for "pretty much anything" within the supported business context, and the agent should still try to compose a useful visual surface rather than falling back to a chat answer.

### 2. The page is composed, not hardcoded

The agent should choose what modules to show, but only from a controlled library of UI blocks.

### 2b. The composed result is published

Open Glass should publish a structured briefing payload to Agent Space so the dashboard can render the latest valid controller view directly.

### 2c. The composed result should occupy the available surface

The default Open Glass response should be a full-surface composition that takes over the available dashboard area and feels complete at the current viewport size.

### 2d. Chat remains a secondary commentary lane

The chat thread may carry short explanation and follow-up comments, but it should not replace the main Open Glass surface as the primary response format.

### 3. Screen size matters

The composed surface must change according to available space.

### 4. Selection engine is a supporting capability

List filtering, scripted selection, and batch operations are lower-level tools that Open Glass may invoke, not the whole product.

### 5. Orders and inventory are enough for the first proof

We do not need every admin category to validate the Open Glass concept.

---

## Delivery Sequence

Implementation order for this WO:

1. Define the Open Glass surface contract
2. Build a small reusable block library
3. Add responsive composition rules
4. Implement "what is new" and time-window insight assembly
5. Connect supported business channels
6. Connect supported actions
7. Keep selection engine and batch capabilities as supporting services

---

## Part 1 - Surface Contract

### Goal

Define the data contract the agent uses to describe an Open Glass page.

### Required output structure

At minimum the agent should be able to return:

- briefing id
- page title
- generated timestamp
- freshness timestamp
- time scope
- comparison scope
- layout target
- ranked findings
- ordered modules
- action slots
- warnings or caveats
- optional linked commentary items for chat display

### Module types

At minimum support:

- `summary_text`
- `fact_cards`
- `ranked_list`
- `chart`
- `alert`
- `action_group`

### Acceptance criteria

- Open Glass can describe a whole page without returning arbitrary HTML
- The frontend can render the page from a structured surface payload
- The contract is stable enough to reuse across different insight requests
- The payload can be persisted in Agent Space and reloaded by the dashboard without rerunning the reasoning path in the UI layer
- Commentary can be attached to the same briefing without forcing the main answer back into chat form

---

## Part 2 - Responsive Composition

### Goal

Let the agent choose a good layout for the current screen size.

### Required behavior

- wide layout can show multiple modules side by side
- medium layout should simplify module count and hierarchy
- narrow layout should promote the strongest signal first

### Acceptance criteria

- The same insight request can render differently on wide and narrow surfaces
- The information priority is preserved across layouts
- The result still feels like one coherent page
- The response uses the available screen area intentionally rather than rendering as a small embedded widget by default

---

## Part 3 - New Data and Time Intelligence

### Goal

Make Open Glass useful for "what is new" and period-based insight requests.

### Required behavior

The engine should:

1. resolve the target period
2. gather fresh or changed data from supported channels
3. select useful baselines
4. calculate comparisons
5. identify the strongest changes

### Example baselines

- previous day
- previous week
- same week last year
- recent average

### Acceptance criteria

- "show me what is new" produces a coherent page instead of raw records
- "show me insights from last week" includes at least one useful comparison baseline
- The resulting page highlights movement, not just totals
- The page prioritizes what is important and urgent rather than merely what changed numerically
- Broader natural-language requests still resolve to a meaningful composed surface when the supported data can answer them

---

## Part 4 - Supported Channels

### Goal

Support enough business channels to make Open Glass credible without building the entire admin.

### First channels

- orders
- inventory
- uploaded product or supplier files

### Later channels

- customers
- products
- pricing

### Acceptance criteria

- Orders can contribute operational change signals
- Inventory and file-import workflows can contribute product and stock signals
- The system clearly states when a channel is not yet available rather than implying completeness

---

## Part 5 - Supporting Capability Layer

### Goal

Keep lower-level capabilities available without letting them define the whole product.

### Supporting capabilities

- native order filtering
- scripted selection
- batch actions
- order mutation
- file analysis
- import review

### Acceptance criteria

- Open Glass can link insight modules to supported follow-up actions
- Selection engine can still be used where list work is the right next step
- The user experience remains controller-first, not tool-first

---

## Part 6 - Action Layer

### Goal

Let insight pages lead to real action where supported.

### Required behavior

- actions must be tied to real runtime capabilities
- destructive or money-moving actions still require main-window confirmation
- unsupported actions must be presented honestly

### Acceptance criteria

- Open Glass can point the user from insight to a real next step
- Action buttons only appear where the backing capability exists
- Confirmation remains outside free-form chat for sensitive operations

---

## Part 7 - Visual Quality Rules

### Goal

Keep Open Glass consistent with the design system while letting the surface feel intelligently composed.

### Rules

- use design-system-backed blocks only
- avoid flat placeholder dashboard patterns
- keep copy short and operational
- use charts only when they add meaning
- use ranked lists and fact cards when they communicate faster than prose
- prefer a visually complete full-surface composition over a narrow tool-like panel when the user is asking for an Open Glass view

### Acceptance criteria

- The page feels like part of Sharif admin
- The page does not look like a generic AI blob
- Modules are composed intentionally for the specific briefing
- The result feels like a designed presentation surface, not a chat transcript stretched into a page

---

## Part 8 - Commentary Channel

### Goal

Let the agent leave useful comments in chat while keeping the dashboard surface as the main output.

### Required behavior

- commentary is linked to the active briefing
- commentary remains short, contextual, and supportive
- follow-up questions may update commentary without always regenerating the full surface
- a major analytical change may republish the surface and refresh commentary together

### Acceptance criteria

- users can read brief explanatory comments in chat while the main Open Glass view stays visible
- commentary helps interpretation without turning the experience back into a chat-first product
- the system can distinguish between a minor comment update and a full surface regeneration

---

## Part 9 - Agent Space Direction

### Goal

Design Open Glass so that orchestration and published briefing state live in Agent Space.

### Agent Space should own long term

- insight selection
- cross-channel prioritization
- presentation planning
- comparative reasoning
- skill orchestration
- published briefing payloads
- briefing retrieval for dashboard consumption

### Sharif / Hydra should own

- local data access
- execution endpoints
- page rendering
- confirmation flows

### Required behavior

- Sharif provides business-channel data or channel adapters
- Agent Space composes the Open Glass briefing
- Agent Space stores the resulting structured payload
- Sharif dashboard renders the latest stored payload for the active context
- a new request can republish the briefing with a newer timestamp and revised modules

### Acceptance criteria

- Surface contracts are portable
- Channel adapters can remain local while reasoning moves remote
- No decision in this WO should hardcode Open Glass as a Sharif-only local feature
- Dashboard rendering works from a persisted Agent Space briefing payload, not only from in-request ephemeral response data

---

## Part 10 - Published Briefing Persistence

### Goal

Make Open Glass results durable and renderable as a dashboard experience.

### Minimum persisted briefing fields

- briefing id
- org/project/repo scope
- view or audience scope
- generated at
- freshness at
- requested time scope
- chosen comparison scope
- layout target
- ordered module payload
- ranked findings summary
- action payloads
- caveats or missing channels

### Acceptance criteria

- The latest valid Open Glass briefing can be fetched from Agent Space for dashboard display
- The dashboard can render a persisted briefing after page reload
- A regenerated briefing supersedes the old one without requiring a frontend-only in-memory session

---

## Part 11 - Non-Goals

This WO is not intended to deliver:

- full support for every admin section
- a giant static BI dashboard
- unrestricted UI generation by the model
- a tool-centric experience that hides the business overview

---

## Delivery Milestones

### Milestone A - Surface foundation

Deliver:

- structured Open Glass surface contract
- briefing persistence contract for Agent Space
- minimal module library
- responsive render path

### Milestone B - Insight assembly

Deliver:

- "what is new" page
- time-window insight page
- baseline comparison support
- publication of generated briefing payload to Agent Space

### Milestone C - Actionable controller view

Deliver:

- dashboard render path from persisted Agent Space briefing
- action buttons wired to real capabilities
- orders and inventory/file workflows feeding Open Glass
- selection engine retained as a supporting mechanism

---

## Demo Milestones

### Demo 1 - Technical walkthrough

Goal:

Prove that Open Glass is a real persisted surface, not a fake dashboard mock.

Demo contents:

- generate a briefing from a natural-language request
- publish the briefing to Agent Space
- reload the page and render the same persisted briefing again
- show commentary in the chat lane beside the surface

Acceptance:

- the same briefing survives reload through Agent Space persistence
- the page fills the available area with controlled modules
- the request changes time scope and comparison scope in a visible way

### Demo 2 - Controller usefulness

Goal:

Prove that Open Glass can answer useful business questions, not just one canned briefing.

Demo contents:

- "show me what is new"
- "show me insights from last week"
- "what changed yesterday"
- one inventory-focused question
- one order-focused question

Acceptance:

- different requests produce meaningfully different briefings
- focus shifts between overview, orders, and inventory
- the system highlights importance and urgency rather than just totals

### Demo 3 - Insight to action

Goal:

Prove that Open Glass can move from briefing to supported work.

Demo contents:

- generate a briefing
- trigger a follow-up prompt from an action button
- move into order prioritization or inventory follow-up
- confirm one real action in the main window

Acceptance:

- a briefing can lead to a real supported action
- sensitive actions still stay behind main-window confirmation
- the overall flow feels like one system rather than separate tools

---

## Final Acceptance Gate

This WO is complete when all of the following are true:

1. Open Glass can present a useful controller-style page from real fresh data.
2. The page can adapt to the current screen width.
3. The output uses charts, cards, lists, and short text through controlled blocks.
4. The page includes at least one useful comparative baseline when appropriate.
5. Orders and inventory/file workflows are enough to make the experience operationally credible.
6. Selection engine and batch capabilities remain available as support tools rather than the main product identity.
7. The latest Open Glass briefing is persisted in Agent Space and can be rendered on the dashboard after reload.
