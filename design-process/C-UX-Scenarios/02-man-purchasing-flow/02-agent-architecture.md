# 02 Agent Architecture — LLM Integration & Multi-Agent Flow

**Companion to:** [02-Man Purchasing Flow](./02-man-purchasing-flow.md)
**Purpose:** Technical architecture for connecting the chat UI to a real LLM with tool use, and enabling agent-to-agent communication for the full assisted ordering flow.

---

## Overview

The chat panel is not a scripted chatbot. It is a Claude-powered agent with tool use — it reads live session state, calls tools to interact with the UI, and hands the user off to payment at the end. The user can complete a full tire order in natural language without touching a single form field except the payment card.

---

## Architecture: Two-Layer Agent Design

```
┌─────────────────────────────────────────────────────┐
│  USER (browser)                                     │
│  Chat panel → types message                         │
└────────────────────┬────────────────────────────────┘
                     │ HTTP POST /api/agent/chat (streaming)
┌────────────────────▼────────────────────────────────┐
│  LAYER 1 — Conversation Agent (Claude)              │
│  • Reads session context (view, cart, products)     │
│  • Asks qualifying questions                        │
│  • Calls tools to act on the UI                     │
│  • Calls Layer 2 tools for product search/lookup    │
└────────────────────┬────────────────────────────────┘
                     │ Tool calls → structured queries
┌────────────────────▼────────────────────────────────┐
│  LAYER 2 — Data Agent (Medusa / backend tools)      │
│  • searchProducts(dimension, filters)               │
│  • getProductDetail(productId)                      │
│  • lookupOrder(email, otcToken)                     │
│  • getWorkshopSlots(workshopId, date)               │
│  • sendOneTimeCode(email)                           │
│  • verifyOneTimeCode(email, code)                   │
└─────────────────────────────────────────────────────┘
```

Layer 1 is the conversational intelligence — it understands the user, asks the right questions, and decides what to do. Layer 2 is the data executor — it fetches real data from Medusa and returns structured results to Layer 1.

The user only sees Layer 1. Layer 2 is invisible — its results come back as tool call outputs that Layer 1 uses to compose its next response.

---

## Layer 1 — Conversation Agent

### API Route

```
POST /api/agent/chat
```

Streaming route. Accepts:
```json
{
  "messages": [...],           // full conversation history
  "sessionContext": {          // injected by client
    "view": "results",
    "dimension": "205/55R16",
    "visibleProductIds": ["prod_01", "prod_02", ...],
    "cartItems": [],
    "language": "nb"
  }
}
```

Returns: streamed `text/event-stream` with Claude's response + tool call events.

### System Prompt (summary)

```
You are the Sharif tire advisor. You only answer questions about tires, 
wheels, road safety, and the Sharif ordering flow. Deflect everything else 
in one sentence, then offer to help with tires.

You have access to the user's current session: which view they're on, 
their searched dimension, and visible products. Use this to give relevant, 
specific answers — never generic.

When you need product data, use the searchProducts or getProductDetail tools.
When the user wants to order, use selectTire to open the checkout.
When the user wants order support, use sendOneTimeCode and verifyOneTimeCode.

Language: Norwegian by default. Switch if the user writes in another language.
Tone: Friendly, direct, like a knowledgeable colleague at a tire shop.
```

### UI Tools (Layer 1 → browser)

These tools trigger UI actions in the browser via a shared React context or server-sent event. The agent calls them; the browser executes them.

| Tool | What it does in the UI |
|------|----------------------|
| `fillDimensionField(width, profile, rim)` | Fills each segment sequentially with amber pulse animation |
| `triggerSearch()` | Fires the "Finn dekk" action — triggers parallax to results |
| `selectTire(productId)` | Calls `handleSelectTire` — opens checkout panel |
| `scrollToProduct(productId)` | Scrolls carousel to a specific card |
| `openPaymentStep()` | Advances checkout to the payment step — user just pays |
| `prefillCheckoutField(field, value)` | Fills a single checkout field with highlight animation |

### Data Tools (Layer 1 → Layer 2)

| Tool | Parameters | Returns |
|------|-----------|---------|
| `searchProducts(dimension, filters)` | dimension string, priority filters | Ranked product list with EU ratings |
| `getProductDetail(productId)` | product ID | Full product data |
| `lookupOrder(email, otcToken)` | email + verified token | Order details |
| `getWorkshopSlots(workshopId, dateRange)` | workshop + dates | Available time slots |
| `sendOneTimeCode(email)` | email address | Success/failure |
| `verifyOneTimeCode(email, code)` | email + 6-digit code | Token or error |

---

## Layer 2 — Data Agent

Layer 2 is not a separate LLM — it is a set of typed server actions that hit Medusa's API (and the booking backend) and return structured data. Layer 1 calls them as tools.

In a more advanced Phase 2 setup, Layer 2 could itself be an LLM agent specialized in structured data retrieval — useful if the query logic becomes complex (e.g. "find the quietest A-rated tire under 900 kr for 205/55R16 in stock at Oslo workshops"). For Phase 1, typed server actions are sufficient.

---

## Full Assisted Order Flow

This is what happens when everything works end-to-end:

```
User: "2055516"
  → fillDimensionField(205, 55, 16)  [fields fill with amber animation]
  → Agent: "Jeg fyller inn 205/55R16. Er det riktig?"
  → User: "ja"
  → triggerSearch()  [parallax to results]

Agent: "Vil du at jeg hjelper deg velge?"
User: "ja"
  → Agent asks Q1, Q2, (Q3 if needed)
  → searchProducts("205/55R16", { priority: "noise", trips: "highway" })
  → Layer 2 returns ranked list
  → Agent: "Jeg anbefaler Michelin Primacy 4 — roligst i klassen, A veigrep."
  → [inline product card renders]

User: "den tar jeg"
  → selectTire("prod_michelin_primacy4")  [checkout panel opens]

Agent prefills address fields sequentially
  → prefillCheckoutField("first_name", "Harriet")
  → prefillCheckoutField("address", "Storgata 12")
  → etc.

Agent: "Alt er fylt inn. Nå er det bare betaling igjen."
  → openPaymentStep()  [payment form shows]

User pays with card. Done.
```

Total touchpoints for the user: type dimension, confirm recommendation, confirm address, enter card details. Everything else is handled.

---

## Browser-Side Implementation

The chat panel needs a two-way bridge to the rest of the app:

### Session context → agent
`FlowShell` injects a `sessionContext` object into the chat API call on every message:
```ts
{
  view: "results" | "home" | "checkout" | ...,
  dimension: string | null,
  visibleProductIds: string[],
  cartItems: CartItem[],
  step: string | null,   // checkout step if in checkout
}
```

### Agent tool calls → UI actions
The streaming response includes tool call events. The chat panel's event handler maps each tool name to a function exposed via a React context:

```ts
// AgentToolContext
{
  fillDimensionField: (w, p, r) => void,
  triggerSearch: () => void,
  selectTire: (id) => void,
  prefillCheckoutField: (field, value) => void,
  openPaymentStep: () => void,
}
```

`FlowShell` provides this context. The chat panel consumes it. Tool calls flow down; UI state flows up.

---

## Phase 1 vs Phase 2

| Capability | Phase 1 | Phase 2 |
|-----------|---------|---------|
| LLM | Claude Sonnet (claude-sonnet-4-6) | Same |
| Product search | Server action → Medusa REST | Same + vector similarity for fuzzy queries |
| Recommendation logic | EU label scoring in tool | ML model trained on 10yr sales data |
| Order lookup | Medusa REST + OTC auth | Same |
| Layer 2 | Typed server actions | Optionally a second LLM agent |
| Multi-language | Detected from user input | Same |
| Booking | Hardcoded slots from Medusa metadata | Real booking system integration |

---

## Files to Create (Implementation Scope)

| File | Purpose |
|------|---------|
| `src/app/api/agent/chat/route.ts` | Streaming Claude API route with tool definitions |
| `src/lib/agent/tools.ts` | Tool schemas (JSON Schema for Claude tool_use) |
| `src/lib/agent/system-prompt.ts` | System prompt builder — injects session context |
| `src/lib/agent/data-tools.ts` | Layer 2: server actions for Medusa queries |
| `src/modules/home/components/agent-panel/index.tsx` | Chat UI panel component |
| `src/modules/home/components/agent-panel/AgentToolContext.tsx` | React context for UI tool actions |
| `src/modules/home/components/agent-panel/useStreamingChat.ts` | Hook: POST to /api/agent/chat, parse SSE, dispatch tool calls |
