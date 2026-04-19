# Open Glass System Spec

> System-level product spec for Open Glass in Sharif admin.

**Date:** 2026-04-12  
**Author:** Codex  
**Related:** [Product Brief](01-product-brief.md), [Platform Requirements](04-platform-requirements.md), [Open Glass Scenario](../C-UX-Scenarios/03-admin-dashboard/03.2-open-glass/03.2-open-glass.md)

---

## Purpose

Open Glass is an AI-driven business controller surface inside Sharif admin.

Its purpose is not primarily to help the user search one list. Its purpose is to:

- gather what is new across important channels
- interpret that new data like an experienced business controller
- present the result as a focused operational briefing
- help the operator move from insight to action

The channels include:

- orders
- customers
- products
- inventory
- pricing
- other important operational signals when available

Open Glass should feel like a live business presentation generated for the current operator and current context.

---

## Core Product Idea

Open Glass should present what the user needs to know right now.

The agent should:

1. detect what is new or changed
2. compare it against useful context
3. decide what matters
4. compose a page that explains it clearly
5. offer actions where relevant

The output should look like a strong internal business review, not like a chatbot transcript.

---

## What Open Glass Is Not

Open Glass is not:

- a generic chat sidebar
- a static dashboard with placeholders
- only an order filtering tool
- free-form UI generation without control

Order search, layered filtering, and batch actions are supporting capabilities inside Open Glass, not the whole product.

---

## Primary Interaction Model

Open Glass consumes fresh business data and returns a composed decision surface.

The user may ask for:

- "show me what is new"
- "give me a morning briefing"
- "show me insights from last week"
- "what changed since yesterday"
- "compare this week to the same week last year"
- other open analytical requests expressed in natural language

The system should:

- identify the relevant time window
- gather the relevant signals
- compare against useful baselines
- surface the most important findings
- choose the best presentation for the current screen size

---

## Published Briefings

Open Glass should not only generate a briefing in memory.

It should publish a structured Open Glass briefing into Agent Space so the dashboard can render it directly.

This published briefing is the product output.

That means:

- the agent gathers and interprets fresh business data
- the agent composes a controller-style surface
- the surface payload is written to Agent Space
- Sharif dashboard reads the published payload and renders it

The stored briefing should represent what is important and urgent in a volume of data a human operator would not realistically scan or prioritize manually.

At minimum, a published briefing should include:

- briefing id
- generated timestamp
- freshness timestamp
- requested or inferred time scope
- comparison scope
- screen or layout target
- ranked findings
- ordered modules
- suggested actions
- warnings, caveats, or missing channels

Open Glass may regenerate a briefing on demand, but the dashboard should be able to show the latest published result without recomputing the reasoning path in the UI layer.

---

## Presentation Model

The agent should not be limited to plain text.

It may compose a surface using:

- charts
- ranked lists
- fact cards
- short text blocks
- alerts
- recommendations
- action buttons

The page should be assembled according to the existing design system.

Open Glass should answer by generating a full-surface page that takes over the available area.

It should not default to a small embedded widget, narrow summary card, or chat-style reply when the user has asked for a business view.

The chat window may still be used as a secondary commentary channel.

That commentary can be used for:

- short explanations
- follow-up observations
- clarification of why a finding matters
- suggestions for what to inspect next

But the primary answer should remain the composed surface, not the chat thread.

The agent should choose both:

- what to show
- how to show it

But it must do so through controlled UI blocks, not arbitrary raw markup.

---

## Responsive Composition

Open Glass must take the current screen surface seriously.

The composed page should adapt to:

- desktop with wide area
- tablet or medium width
- narrow side panel or smaller space

This means the agent should choose a different composition strategy depending on available width.

Examples:

- wide screen: multiple charts, comparative cards, short summaries, and action rail
- medium screen: fewer modules, tighter hierarchy, more list-driven presentation
- narrow screen: strongest signal first, then compact cards and short explanation

The resulting surface should feel intentionally composed and visually complete at every size.

The content priority must survive layout changes.

---

## Business Controller Behavior

Open Glass should think like an experienced business controller.

That means it should:

- prioritize what changed
- compare current performance to meaningful baselines
- highlight unusual patterns
- separate signal from noise
- explain why something matters
- suggest the next useful action

Its job is specifically to identify what is both:

- important
- urgent

from a large operational data volume that would overwhelm normal manual review.

It should not dump all fresh data equally.

Examples of useful comparisons:

- this week vs last week
- this week vs same week last year
- current stock risk vs usual pace
- order mix change by location, product family, or customer type

---

## Data Inputs

Open Glass should be designed to read from multiple business channels.

Minimum intended channels:

- orders
- customers
- products
- inventory
- pricing

Optional later channels:

- marketing campaigns
- returns
- claims
- support or operational notes
- external business systems

The system should work even if some channels are missing, but it must state that clearly instead of pretending completeness.

---

## Time-Based Insight Requests

When a user asks for a time-based insight view, Open Glass should treat this as an analytical request, not a list search.

Examples:

- "show me insights from last week"
- "what happened yesterday"
- "compare this month to the same month last year"

Expected behavior:

- resolve the requested period
- gather the relevant data
- choose one or more useful comparison periods
- summarize the most important movements
- present them as a compact business page

The result should be a narrative plus evidence, not a raw export.

If the user asks a broader or less structured question, Open Glass should still respond with a composed surface rather than collapsing back into plain chat unless the request truly cannot be visualized.

---

## Commentary Channel

Open Glass should support a split response model:

- the dashboard surface carries the main visual briefing
- the chat thread carries lightweight commentary about that briefing

This allows the agent to:

- explain what it chose to highlight
- react to follow-up questions without rebuilding the whole surface every time
- leave short comments while a larger view is visible

The chat channel should stay lightweight and contextual.

It should not replace the main Open Glass surface when the request is fundamentally visual or analytical.

---

## Actionability

Open Glass should help the user act, not only observe.

Where appropriate, the surface may include:

- open orders to review
- products to reprice
- inventory rows to approve
- new products to create from imported data
- customer or order follow-up candidates

Action buttons should be grounded in real supported capabilities.

If an action is not implemented, the system should not fake it.

---

## Supporting Capabilities

Open Glass may use several lower-level capabilities behind the scenes.

These include:

- native list filtering
- scripted selection
- batch actions
- order mutation
- file analysis
- import review

These are not the purpose of Open Glass.
They are tools Open Glass can use in service of a broader controller-style surface.

---

## File-Driven Workflows

Open Glass should also support a file-driven business workflow.

Example:

- the user uploads a supplier or product file
- the system analyses it
- the system identifies what is new, changed, unmatched, risky, or incomplete
- the system presents a review surface
- the system offers actions such as create products, update stock, or set prices

This is closer to an import review and operational planning surface than a raw import form.

---

## Agent Responsibility

The agent is responsible for:

- deciding what the operator needs to know
- finding the most relevant new signals
- comparing against useful context
- composing the most useful current surface
- staying inside the design system
- using real supported actions where available

The agent is not responsible for:

- inventing business facts
- presenting fake dashboards
- turning every question into free-form chat
- generating uncontrolled UI outside the product system

---

## Agent Space Direction

Long term, Open Glass should be orchestrated from Agent Space.

Agent Space should own:

- reasoning and prioritization
- cross-channel context
- presentation planning
- insight selection
- supporting skill logic
- published Open Glass briefing payloads

Sharif / Hydra should own:

- live operational data
- dashboard rendering
- list rendering
- write endpoints
- approved action execution

The intended flow is:

1. Sharif provides channel data and adapters
2. Agent Space identifies what matters
3. Agent Space publishes a structured Open Glass surface
4. Sharif dashboard renders that published surface
5. Sharif executes supported follow-up actions locally when the user approves them

This makes Open Glass portable across customers and reduces local product-specific logic.

---

## MVP Definition

Open Glass MVP should prove one core thing:

The agent can turn new operational data into a useful controller-style page inside Sharif admin.

For MVP, this means:

- Open Glass can summarize what is new
- Open Glass can produce a time-based briefing such as last week
- Open Glass can compare against at least one useful baseline
- Open Glass can render a composed surface using supported UI blocks
- Open Glass can connect to real actions where those actions already exist
- orders and inventory/file workflows are enough to prove the concept

---

## Success Criteria

Open Glass is working when:

1. The operator can ask for what is new and get a coherent business briefing.
2. The surface prioritizes the important changes rather than listing everything.
3. The system uses charts, cards, lists, and short text appropriately for the current screen width.
4. Comparative context is included when it adds value.
5. The output feels like a competent business controller review rather than a chatbot answer.
6. The user can move from insight to action through real supported controls.
7. Search, selection, mutation, and batch operations appear as support mechanisms, not as the whole product.
