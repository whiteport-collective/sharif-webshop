# 02: Man Purchasing Flow — Agent-Assisted Ordering & Order Support

**Project:** Sharif Webshop
**Created:** 2026-04-06
**Method:** Whiteport Design Studio (WDS)
**Status:** Scenario draft — awaiting confirmation on open questions before wireframes

---

**Technical architecture:** [02-agent-architecture.md](./02-agent-architecture.md) — LLM integration, tool use, multi-agent flow, browser bridge, implementation file list.

---

## Transaction (Q1)

**What this scenario covers:**
Two paths served by the same agent panel:

**Path A — Assisted Purchase:** A customer activates the agent from any screen. The agent reads the session context, asks qualifying questions, fills form fields on behalf of the user (with visible highlight animation), and guides them through the full ordering flow. The agent hands over at payment.

**Path B — Order Support:** A returning customer wants to check or follow up on an existing order. They type their email. The agent sends a one-time code to that address. The customer enters the code in the chat. The agent authenticates, retrieves the order, and presents it inline — then handles whatever they need (status, delivery info, booking change, complaint).

No login. No account. The agent is the access layer.

---

## Business Goal (Q2)

**Goal:** Capture abandoned orders and eliminate support phone calls in a single feature.

**Objective — Path A:** Increase conversion by removing the knowledge gap. A customer who gets a confident recommendation and has forms pre-filled completes the order at significantly higher rates.

**Objective — Path B:** Replace "where is my order?" phone calls entirely. Every post-purchase question answered in chat, no staff needed for routine lookups.

---

## User & Situation (Q3)

**Path A persona:** A customer on the home screen who doesn't know their tire size, or on the results screen who doesn't know which tire to pick.

**Path B persona:** A customer who placed an order a few days ago and wants to know if their mounting is confirmed, or wants to change the time slot.

Both paths use the same agent entry point.

---

## Driving Forces (Q4)

**Path A hope:** Tell someone what I need in plain language and have it handled.
**Path A worry:** The agent is generic and wastes my time.

**Path B hope:** Find out what's happening with my order without calling or waiting on hold.
**Path B worry:** I'll have to create an account or dig up an order confirmation email.

---

## Device & Starting Point (Q5 + Q6)

**Device:** Mobile (iPhone, portrait)
**Entry:** Chat icon in the persistent header. Available on all views.
**Panel:** Full-width overlay — the main flow pauses and is visible as a blurred layer behind it.

---

## Best Outcome (Q7)

**Path A — Opening example:**
> *Bruker:* Hvor kan jeg kjøpe nye vinterdekk?
> *Agent:* Gjennom Sharif kan jeg hjelpe deg med hele kjøpet — jeg trenger bare dimensjonene dine. Vet du hvordan du finner dem?

**Path A — Full flow:** Customer types "2055516", agent fills all dimension fields with highlight animation, confirms, scrolls to results, recommends a tire, customer taps it, agent opens checkout, prefills address, customer pays. Done in under 3 minutes.

**Path B:** Customer types "jeg vil sjekke bestillingen min", agent asks for email, sends a code, customer enters it, agent shows order summary inline with mounting time and workshop address. Customer asks to change time — agent presents available slots inline. Customer picks one. Done. No phone call.

---

## Paths

### Path A — Assisted Purchase (new customers)

| Step | View | Summary |
|------|------|---------|
| 1 | 02.1 Agent Entry & Greeting | Panel opens, agent reads session context, greets with a relevant opener |
| 2 | 02.2 Dimension Fill | Customer types dimension (e.g. "2055516"), agent parses and fills each form field with amber highlight animation, confirms, triggers scroll to results |
| 3 | 02.3 Qualification & Recommendation | Agent asks up to 3 questions (priorities beyond price, driving type, silence preference), surfaces upgrade where relevant, recommends one tire with reasoning, shows inline product card |
| 4 | 02.4 Agent-Assisted Selection | Customer taps inline card or confirms in text, agent calls handleSelectTire, checkout opens, agent announces the transition |
| 5 | 02.5 Guided Checkout | Agent offers to prefill each checkout step, fields fill with highlight animation, customer accepts, agent triggers step navigation |
| 6 | 02.6 Handover to Payment | Agent hands over explicitly, panel minimizes, customer pays independently |

### Path B — Order Support (returning customers)

| Step | View | Summary |
|------|------|---------|
| 1 | 02.1 Agent Entry & Greeting | Same entry point — agent detects "order support" intent from first message |
| 2 | 02.7 Email Verification | Agent asks for email address, sends one-time code, customer enters code in chat |
| 3 | 02.8 Order Summary | Agent retrieves and displays order inline: products, status, delivery method, mounting date/time if booked |
| 4 | 02.9 Order Support Actions | Customer asks a question or requests a change — agent handles: reschedule mounting, explain status, confirm address, escalate to human if needed |

---

## All Views

| # | View | Path | Purpose |
|---|------|------|---------|
| 02.1 | Agent Entry & Greeting | A + B | Panel opens, context-aware greeting |
| 02.2 | Dimension Fill | A | Agent fills form fields, highlight animation, confirms |
| 02.3 | Qualification & Recommendation | A | 2 questions, inline product card |
| 02.4 | Agent-Assisted Selection | A | Card tap or text → agent selects tire, checkout opens |
| 02.5 | Guided Checkout | A | Agent prefills each step, customer accepts |
| 02.6 | Handover to Payment | A | Agent steps back, customer pays |
| 02.7 | Email Verification | B | Email input → one-time code → code entry in chat |
| 02.8 | Order Summary | B | Inline order card with status, items, delivery, booking |
| 02.9 | Order Support Actions | B | Reschedule, status inquiry, escalation |

---

## Agent Capabilities

The agent has read and **supervised write** access to the purchasing session, and read + limited action access to orders.

| Capability | Path | Allowed | Notes |
|-----------|------|---------|-------|
| Read current view | A | ✓ | |
| Read cart contents | A | ✓ | |
| Read visible products | A | ✓ | |
| Read current search dimension | A | ✓ | |
| Guide user to find tire dimensions | A | ✓ | Door frame sticker, tire sidewall, owner's manual |
| Parse dimension string from chat | A | ✓ | Handles "2055516", "205/55R16", "205 55 16" |
| Fill dimension form fields | A | ✓ | Highlight animation, sequential |
| Trigger search | A | ✓ | After user confirms prefill |
| Select a tire | A | ✓ | Via card tap or text confirmation |
| Open product detail | A | ✓ | |
| Prefill checkout fields | A | ✓ | Highlight animation, user confirms before advancing |
| Trigger step navigation | A | ✓ | After confirmation |
| Select delivery method | A | ✗ | User taps — too consequential |
| Enter payment details | A | ✗ | Hard boundary |
| Accept terms / submit order | A | ✗ | Hard boundary |
| Send one-time code to email | B | ✓ | Via Medusa/backend |
| Verify code and authenticate | B | ✓ | Token-based, session-scoped |
| Read order details | B | ✓ | After authentication |
| Present order inline in chat | B | ✓ | |
| Reschedule mounting appointment | B | ✓ | Shows available slots inline, user picks |
| Cancel order | B | ✗ | Escalated to human |
| Issue refund | B | ✗ | Escalated to human |

---

## Agent Field-Fill Interaction Pattern (Path A)

Applies wherever the agent fills a form field:

1. Agent announces intent: *"Jeg fyller inn dimensjonene dine"*
2. Each field filled sequentially — never all at once
3. On fill: field border pulses amber (`ring-amber-400 animate-pulse`) for ~800ms
4. Settles to ambient highlight (`bg-amber-50 ring-amber-200`) — "agent-filled, awaiting acceptance"
5. On user tap, edit, or flow advance: highlight fades over 600ms
6. After all fields filled: agent confirms in chat, offers to proceed
7. User confirms ("ja" / "ok" / "ser bra ut") or taps **Bekreft og fortsett** button in chat
8. Agent triggers next step

---

## Email Verification Pattern (Path B)

1. Agent detects order support intent: *"Vil du sjekke en bestilling? Skriv inn e-postadressen din."*
2. Customer types email in chat
3. Agent: *"Jeg sender deg en kode nå."* → backend sends 6-digit code to that address
4. Agent: *"Skriv inn koden du fikk på e-post."*
5. Customer enters code in chat
6. Agent verifies, retrieves order(s), renders inline order card
7. Code expires after 10 minutes. One resend allowed.
8. On failure (3 wrong attempts): *"Jeg kan ikke verifisere det akkurat nå. Ring oss på +47 934 85 790."*

---

## Agent Persona

**Name:** Not yet decided — "Sharif support" as working title
**Avatar:** TBD — tire icon or Sharif logo mark
**Language:** Norwegian (nb-NO) by default, switches if user writes in another language
**Tone:** Friendly, direct, knowledgeable — like a helpful colleague at a tire shop
**Knowledge base (Phase 1):** Product catalog, EU labels, seasonal guidance, delivery options, workshop locations/hours, order status meanings
**Knowledge base (Phase 2):** 10 years of sales data → recommendations by car type, region, season

**Scope constraint:** The agent only answers questions about tires, wheels, road safety, and the Sharif ordering/support flow. It does not answer general questions, give recipes, discuss news, write code, or engage with anything outside its domain. Off-topic requests are deflected politely and briefly, then redirected.

**Deflection pattern:**
> *Bruker:* Kan du gi meg en pannekakeoppskrift?
> *Agent:* Det er utenfor det jeg kan hjelpe med — jeg er spesialist på dekk og veigrep! Er det noe dekkrelatert jeg kan hjelpe deg med?

The deflection is one sentence. The agent does not apologize at length or explain what it is — it redirects immediately.

---

## Open Questions

1. **Agent name/avatar:** "Sharif support" + tire icon, or give it a name?
2. **Inline product card:** Tap to select directly, or opens detail overlay first?
3. **Chat persistence:** Survives panel minimize (session), or resets on close?
4. **Entry trigger:** Always-visible icon, or subtle prompt after 30s idle on results?
5. **Delivery method:** Agent highlights recommended option visually, or mentions in text only?
6. **OTC backend:** One-time code via Medusa transactional email, or separate email service (Resend, Postmark)?
7. **Order lookup scope:** Show all orders for that email, or most recent only?
8. **Escalation:** "Ring oss" fallback, or also offer to send an email to support?

---

## Out of Scope

- Admin open glass panel → Scenario 06
- Agent placing the order
- Cross-session memory
- Sales data training → Phase 2
- Account creation or password reset

---

_Awaiting answers to open questions above, then wireframes and full spec per view._
