# WO-003 — Customer Chat: Storefront Agent

**Status:** Ready (start after WO-002 is complete)  
**Priority:** High  
**Depends on:** WO-002 (reads `sharif_settings` config)  
**Spec refs:**
- `design-process/C-UX-Scenarios/02-man-purchasing-flow/02-agent-architecture.md`
- `design-process/C-UX-Scenarios/01-main-order-flow/01.1-dimension-input/01.1-agent-support.md`
- `design-process/C-UX-Scenarios/01-main-order-flow/01.2-product-cards/01.2-agent-support.md`
- `design-process/C-UX-Scenarios/01-main-order-flow/01.3-product-detail/01.3-agent-support.md`
- `design-process/C-UX-Scenarios/01-main-order-flow/01.4-delivery-and-mounting/01.4-agent-support.md`
- `design-process/C-UX-Scenarios/01-main-order-flow/01.5-payment/01.5-agent-support.md`
- `design-process/C-UX-Scenarios/01-main-order-flow/01.6-book-mounting/01.6-agent-support.md`

---

## Objective

Build the customer-facing Sharif tire advisor in the storefront. A Claude-powered chat agent that guides customers through the full tire ordering flow — from dimension input to payment — in natural language. Reads its configuration from `sharif_settings` (built in WO-002).

---

## Architecture

Two-layer design:

```
Browser (chat panel)
  → POST /api/agent/chat (streaming)
      → Layer 1: Claude with tool use
          → UI tools: browser executes via AgentToolContext
          → Data tools: Layer 2 server actions hit Medusa
```

---

## Part 1 — API Route

File: `storefront/src/app/api/agent/chat/route.ts`

Streaming POST endpoint.

**On each request:**
1. Fetch `sharif_settings` from `GET /admin/sharif-settings` (server-to-server, `MEDUSA_BACKEND_API_KEY`)
2. If `agent_enabled === false` → return 503
3. Build system prompt via `system-prompt.ts`
4. Call Claude `claude-sonnet-4-6` with streaming + tools
5. Stream response back as `text/event-stream`

**Request body:**
```ts
{
  messages: { role: "user" | "assistant", content: string }[]
  sessionContext: {
    view: "home" | "results" | "detail" | "checkout"
    dimension: string | null
    visibleProductIds: string[]
    cartItems: { productId: string; qty: number }[]
    step: string | null
  }
}
```

**Tool call events in stream:**
```
event: tool_call
data: {"name": "fillDimensionField", "input": {"width": 205, "profile": 55, "rim": 16}}
```

---

## Part 2 — System Prompt

File: `storefront/src/lib/agent/system-prompt.ts`

Builds the system prompt from:
1. Base prompt (Norwegian)
2. `system_prompt_overlay` from `sharif_settings` (appended if set)
3. Current `sessionContext` as a JSON block

Base prompt:
```
Du er Sharif-dekkrådgiveren. Du hjelper kunder med å finne og bestille riktige dekk.
Du svarer bare på spørsmål om dekk, felger, veisikkerhet og Sharif-bestillingsflyten.
Alt annet avviser du på én setning og tilbyr å hjelpe med dekk.

Tone: Vennlig og direkte — som en kyndig kollega på et dekkverksted.
Språk: {{language}} som standard. Bytt hvis brukeren skriver et annet språk.

Nåværende økt:
{{sessionContext}}
```

---

## Part 3 — Tool Schemas

File: `storefront/src/lib/agent/tools.ts`

Export a `tools` array of Claude tool definitions.

### UI tools (browser-side via AgentToolContext)

| Tool | Parameters | Browser action |
|------|-----------|----------------|
| `fillDimensionField` | `width: number, profile: number, rim: number` | Fill 3 form fields with amber pulse animation |
| `triggerSearch` | — | Fire "Finn dekk" — parallax to results |
| `selectTire` | `productId: string` | Open checkout panel |
| `scrollToProduct` | `productId: string` | Scroll carousel to card |
| `openPaymentStep` | — | Advance checkout to payment step |
| `prefillCheckoutField` | `field: string, value: string` | Fill checkout field with highlight |

### Data tools (server-side Layer 2)

| Tool | Parameters | Medusa call |
|------|-----------|-------------|
| `searchProducts` | `dimension: string, filters?: object` | `GET /store/products?dimensions=...` |
| `getProductDetail` | `productId: string` | `GET /store/products/{id}` |
| `lookupOrder` | `email: string, otcToken: string` | `GET /store/orders?email=...` |
| `getWorkshopSlots` | `workshopId: string, dateRange: object` | Product metadata |
| `sendOneTimeCode` | `email: string` | Medusa auth flow |
| `verifyOneTimeCode` | `email: string, code: string` | Verify OTC → token |
| `escalateToAdmin` | `email: string, message: string` | POST to `/api/agent/escalate` |

---

## Part 4 — Layer 2 Data Tools

File: `storefront/src/lib/agent/data-tools.ts`

Server actions that execute the data tool calls. All hit Medusa REST via `NEXT_PUBLIC_MEDUSA_BACKEND_URL`.

`escalateToAdmin` creates a row in `sharif_escalations` (WO-002 table) and sends an email to `escalation_email` from settings.

---

## Part 5 — Escalate Route

File: `storefront/src/app/api/agent/escalate/route.ts`

POST endpoint called by `escalateToAdmin` tool:
1. Insert row into `sharif_escalations` via backend API
2. Send email to `escalation_email` with customer message
3. Return `{ ok: true }`

---

## Part 6 — AgentToolContext

File: `storefront/src/modules/home/components/agent-panel/AgentToolContext.tsx`

React context provided by `FlowShell`. Maps tool names to FlowShell actions:

```ts
{
  fillDimensionField: (width, profile, rim) => void  // → set dimension state + amber animation
  triggerSearch: () => void                           // → handleSearch()
  selectTire: (productId) => void                     // → handleSelectTire()
  scrollToProduct: (productId) => void                // → scroll carousel
  prefillCheckoutField: (field, value) => void        // → set checkout field state
  openPaymentStep: () => void                         // → set checkout step to "payment"
}
```

---

## Part 7 — Streaming Hook

File: `storefront/src/modules/home/components/agent-panel/useStreamingChat.ts`

```ts
const { messages, sendMessage, isStreaming } = useStreamingChat(sessionContext)
```

- POST to `/api/agent/chat` on `sendMessage`
- Parse SSE: `text` events → append to last assistant message
- `tool_call` events → dispatch to `AgentToolContext`
- Persist `messages` in `localStorage` (session key)

---

## Part 8 — Agent Panel UI

File: `storefront/src/modules/home/components/agent-panel/index.tsx`

**Layout:**
- Fixed panel, slides in from right, width 360px
- Header: "Sharif-rådgiver" + close (×) button
- Message list: user bubbles right (`bg-gray-100`) + agent bubbles left (white, border)
- Typing indicator: three animated dots while `isStreaming`
- Input area: upload (+) button (left) + text field + send button (right)
- Toggle: floating button bottom-right (above cart badge if both visible)

**Use the palette from SKILL.md:** `#f8f9fa` bg, `#dee2e6` borders, `#212529` text, `#212529` send button.

---

## Part 9 — FlowShell Integration

In `storefront/src/modules/home/components/flow-shell/index.tsx`:

1. Wrap JSX in `<AgentToolContextProvider>` with all handler functions wired up
2. Add `<AgentPanel sessionContext={sessionContext} />` — fixed bottom-right
3. Compute `sessionContext` from current state:
   ```ts
   const sessionContext = {
     view,                           // "home" | "results" | "detail" | "checkout"
     dimension: searchMeta?.dimension ?? null,
     visibleProductIds: products.map(p => p.id),
     cartItems: cart?.items?.map(i => ({ productId: i.variant.product_id, qty: i.quantity })) ?? [],
     step: checkoutStep ?? null,
   }
   ```

---

## Environment variables required

```
ANTHROPIC_API_KEY=sk-...
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_BACKEND_API_KEY=...
ESCALATION_FROM_EMAIL=noreply@sharif.no
```

---

## Files to create

| File | Purpose |
|------|---------|
| `storefront/src/app/api/agent/chat/route.ts` | Streaming chat API |
| `storefront/src/app/api/agent/escalate/route.ts` | Escalation endpoint |
| `storefront/src/lib/agent/tools.ts` | Tool schemas |
| `storefront/src/lib/agent/system-prompt.ts` | System prompt builder |
| `storefront/src/lib/agent/data-tools.ts` | Layer 2 server actions |
| `storefront/src/modules/home/components/agent-panel/index.tsx` | Chat UI panel |
| `storefront/src/modules/home/components/agent-panel/AgentToolContext.tsx` | Tool context |
| `storefront/src/modules/home/components/agent-panel/useStreamingChat.ts` | Streaming hook |

---

## Definition of done

- [ ] Agent panel opens/closes in storefront
- [ ] `POST /api/agent/chat` returns streamed Claude response
- [ ] Agent fills dimension fields with amber animation when given a dimension
- [ ] `triggerSearch` fires the parallax to results
- [ ] `selectTire` opens the checkout panel
- [ ] `prefillCheckoutField` fills checkout fields
- [ ] `openPaymentStep` advances to payment step
- [ ] Escalation creates DB row + sends email
- [ ] Chat history persists in `localStorage` per session
- [ ] Agent disabled when `agent_enabled = false` in settings
- [ ] TypeScript — no `any`, no `ts-ignore`
- [ ] No console errors in browser
