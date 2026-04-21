# WO-012 — Agent-assisterat orderflöde (Agent Ordering API)

**Status:** Draft — Ready for review
**Priority:** High (demo-blocker för Moohsen scenario 1)
**Assigned to:** Mimir
**Review before implementation:** Freya
**Depends on:** `WO-010-flow-shell-state-model.md`, current `AgentToolContext` + `AgentToolHandlers` scaffolding
**Relevant areas:**
- `storefront/src/modules/home/components/flow-shell/index.tsx` (AgentToolHandlers implementation)
- `storefront/src/modules/home/components/agent-panel/AgentToolContext.tsx` (handler type)
- `storefront/src/lib/agent/tools.ts` (Anthropic tool registry)
- `storefront/src/app/api/agent/chat/route.ts` (tool dispatch)
- `storefront/src/modules/home/components/tire-search` (form exposure)
- `storefront/src/modules/checkout/components/checkout-panel-content` (step control)
- `storefront/src/modules/checkout/components/booking` (slot selection)
- `storefront/src/modules/checkout/components/shipping` (leveringsmetod)

---

## Objective

Expose ett komplett, deterministiskt verktygs-API så att en LLM-agent kan driva ett köp från hemsida till betalning — utan att agenten rör betalningssteget.

Agenten ska kunna **demonstrera** att den kontrollerar storefronten från naturligt språk:

> "Jag behöver nya sommardäck, fyra stycken, 205/55R16."

→ agenten fyller alla 5 sökfält, triggar sökning, scrollar till resultat, beskriver vad den hittade, öppnar kassen när kunden väljer, fyller adress och leveransmetod, föreslår bokningstid, och lämnar sedan över till kunden för betalning.

Detta är **scenario 1** i Moohsen-demon.

---

## Problem Statement

Dagens `AgentToolHandlers`-scaffolding (flow-shell/index.tsx:602–627) har sex handlers:

```
fillDimensionField(width, profile, rim)   // 3 av 5 fält
triggerSearch()                            // OK
selectTire(productId)                      // OK
scrollToProduct(productId)                 // OK
prefillCheckoutField(field, value)         // saknar shipping/booking
openPaymentStep()                          // OK — men hands-off krävs
```

Gaps mot det fullständiga orderflödet:

1. **Hemsida:** `fillDimensionField` täcker bara dimension (width/profile/rim). Den sätter **inte** `qty` eller `season`. Formuläret har 5 fält totalt — agenten kan fylla 3 av 5.
2. **Resultatsida:** Agenten har ingen väg att läsa aktuell produktlista från servern (`searchProducts` finns som data-tool men är inte kopplad till det som faktiskt visas i DOM:en efter `triggerSearch`). Agenten har heller inget verktyg för "öppna checkouten för vald bil" när det redan finns en vald produkt — `selectTire(productId)` triggar add-to-cart, vilket dubblerar om varukorgen redan innehåller samma variant.
3. **Kassen:** `prefillCheckoutField` hanterar adressfält (first_name … phone), men har **inget** stöd för:
   - välja leveransmetod (Shipping-steget)
   - välja bokningsslot (Booking-steget)
   - avancera mellan steg (address → shipping → booking) — bara `openPaymentStep` finns
4. **Betalning:** `openPaymentStep` finns. Men vi behöver en uttalad **hands-off-gräns**: agenten får aldrig fylla i kortuppgifter eller klicka på "Betala". Det är en kontraktuell gräns, inte bara en konvention.

---

## Product Outcome

Efter denna WO:

- Agenten kan driva flödet **Hemsida → Resultat → Kassen → Betalning** från naturligt språk.
- Betalningssteget är **agent-förbjudet** genom kontrakt (tool-listan i `route.ts` innehåller inget handler-verktyg efter att kunden nått payment).
- Alla handlers är **idempotenta**: att anropa `fillDimensionField` två gånger har samma effekt som en gång. Att `selectTire` på en redan valld variant ska inte dubblera cart.
- Alla handlers returnerar ett **resultatobjekt** (`{ ok: true, ... }` eller `{ ok: false, reason: "…" }`) som går tillbaka via `tool_result` till modellen — så agenten kan veta om något gick fel (t.ex. dimension finns inte, adressen ogiltig).
- `getSessionContext` (flow-shell/index.tsx:629) utökas så att agenten alltid vet vilket `step` kunden är på och vad som är fyllt.

---

## Core Decisions

### 1. Fem handlers per domän, inte en per fält

**Home domain:**
```ts
setSearchField(field: "width" | "profile" | "rim" | "qty" | "season", value: string | number): ToolResult
triggerSearch(): ToolResult  // fail-fast om inte alla 5 fält är satta
```

Rationale: 5 egna anrop gör att agenten kan kommentera varje fält i konversation ("Jag sätter width till 205…"). Ett `fillSearchForm({ …5 fält… })` skulle vara snabbare men mindre "demonstrerbart" — och demon är hela poängen.

**Kvar:** `fillDimensionField(w, p, r)` behålls som convenience-wrapper internt, men den **tas bort ur den exponerade tool-listan** till modellen. Modellen ser bara `setSearchField`.

### 2. Resultat-domän: produktlistning är data, inte UI

`triggerSearch` ska returnera **produktlistan inline** i sitt `tool_result`:

```json
{
  "ok": true,
  "dimension": "205/55R16",
  "productCount": 14,
  "products": [
    { "id": "prod_xxx", "title": "…", "brand": "…", "price": 1299, "noiseDb": 68, "fuelClass": "C", "wetGripClass": "A" },
    …
  ]
}
```

Detta ersätter behovet av ett separat `searchProducts`-anrop efter `triggerSearch`. Agenten kan nu direkt svara: "Jag hittade 14 däck. Den tystaste är…" utan en extra round-trip.

**Kvar:** `searchProducts` i `tools.ts` används fortfarande för situationer där agenten vill *förhandssöka* utan att scrolla användaren — t.ex. "Hur mycket billigare är 195/60R15?". Det ska tydligt dokumenteras i tool-description.

**Nytt:** `selectTireForCheckout(productId)` — ersätter dagens `selectTire` i agent-sammanhang. Kontraktet:
- Om `productId` redan är den valda varianten och ligger i cart → bara `NAV_TO_CHECKOUT`, ingen addToCart.
- Annars: addToCart + NAV_TO_CHECKOUT.
- Returnerar `{ ok: true, cartTotal, productTitle }`.

### 2b. Elicitation — inte transcription

**Princip:** Agenten **eliciterar** behov — drar fram information kunden inte själv vet att den behöver ge. Den är inte ett chat-formulär som bara fyller fält från det kunden råkar skriva.

Det gäller hela flödet, men är tydligast på resultatsidan: när kunden står inför 14 däck ska agenten hjälpa till att välja på *annat än pris* — säkerhet, komfort, ekonomi, tystnad — även om kunden inte bad om det.

#### Arkitektur: elicitation som skill

Frågorna och deras beslutsträd är **inte hårdkodade i system-prompten**. De är en versionerad skill som laddas *när kunden når resultatvyn*.

```
agent-space/skills/
  tire-needs-elicitation.skill.md     ← Sommar/sommar-vinter-universell
  winter-tire-elicitation.skill.md    ← Laddas om season = "vinter"
```

**Loading-logik** (i `storefront/src/app/api/agent/chat/route.ts`):

```ts
// När sessionContext.view === "results"
const skills = []
skills.push(await loadSkill("tire-needs-elicitation"))
if (sessionContext.season === "vinter") {
  skills.push(await loadSkill("winter-tire-elicitation"))
}
systemPrompt = [basePrompt, ...skills.map(s => s.content)].join("\n\n---\n\n")
```

**Skill-filformat** (markdown med frontmatter):

```markdown
---
name: tire-needs-elicitation
trigger: view === "results" && products.length > 1
version: 1.0
---

## Intent
Hjälp kunden välja däck baserat på behov, inte bara pris.

## Dimensions
- **safety**: wetGripClass, brand reputation → våt asfalt, bromssträcka
- **comfort**: brandTier, strengths.smooth-ride → långkörning
- **economy**: priceRank, fuelClass, mileageRating → årskostnad
- **quietness**: noiseDb, noiseClass → ljudnivå i kupén

## Process
1. Ställ EN öppen fråga om prioritering.
2. Om svar är vagt ("vet inte", "spelar ingen roll"): ställ en konkret följdfråga
   kopplad till kundens livssituation ("kör du mycket motorväg?").
3. När prioritet är klar: highlightProducts(1–3 matchande) med kort förklaring.
4. Vänta på kundens val. Pusha inte.

## Examples
(exempel-dialoger per dimension — se separat skill-fil)

## Anti-patterns
- Lista alla fyra dimensioner i en enda fråga ("vad tycker du om säkerhet,
  komfort, ekonomi och tystnad?") — det blir en enkät.
- Default till billigast om kunden inte svarar.
- Välja åt kunden utan highlightProducts-förankring.
```

Fördelar:
- **Versionerad:** skill kan uppdateras utan deploy (om skill-loadern stöder hot-reload i dev).
- **Domän-delad:** vinterdäck och sommardäck får olika elicitation utan att prompten blir villkorlig.
- **Testbar:** skillen kan köras som eval-suite mot fejk-dialoger.
- **Ersättningsbar:** Marten kan skriva om skillen utan att Mimir rör kod.
- **Just-in-time:** tar inte prompt-budget när kunden inte är på resultatsidan.

#### Elicitation över hela flödet

Samma princip (agent drar fram, inte bara fångar upp) gäller i alla steg, men skillarna är olika:

| View | Skill som laddas | Vad agenten eliciterar |
|---|---|---|
| `home` | `search-field-elicitation` | Saknade fält (dim, qty, säsong) — fråg tills komplett |
| `results` | `tire-needs-elicitation` (+ vinter om relevant) | Prioritet mellan säkerhet/komfort/ekonomi/tystnad |
| `checkout.address` | `address-elicitation` | Saknade fält, postkod-validering, fraktlogik |
| `checkout.booking` | `booking-elicitation` | Tidsfönster-preferens, brådska, plats |
| `checkout.payment` | *(ingen — hands-off)* | Inget. Agenten är tyst. |

Skill-loadern ska vara **generisk** (Part 2b implementation) — samma funktion laddar alla skills baserat på `sessionContext.view`.

#### Skill → tools-koppling

Varje skill deklarerar vilka tools den behöver (tool-filter i route.ts):

```yaml
---
name: tire-needs-elicitation
requires_tools:
  - highlightProducts
  - clearHighlights
  - getProductDetail
---
```

Route.ts slår ihop alla aktiva skillars `requires_tools` med bas-tools för vyn och skickar till Anthropic.

#### Data som `triggerSearch` måste returnera per produkt

Skillen antar följande fält finns i `tool_result` från `triggerSearch`:

```json
{
  "id": "prod_xxx",
  "title": "…",
  "brand": "…",
  "brandTier": "premium | mid | budget",
  "price": 1299,
  "priceRank": 3,
  "noiseDb": 68,
  "noiseClass": "B",
  "fuelClass": "C",
  "wetGripClass": "A",
  "mileageRating": "high | medium | low",
  "strengths": ["wet-safety", "low-noise"]
}
```

`strengths` är en kuraterad taglista (3–5 per produkt). Populeras från Medusa `metadata` eller hårdkodas per brand som start (Continental → premium + wet-safety; Kumho → budget + value).

### 3. Checkout-domän: steg-medveten prefill

`prefillCheckoutField` utökas med tre nya fält-namn:

| field | Värde | Effekt |
|---|---|---|
| `shipping_method_id` | string (option-id) | Markerar leveringsmetod i Shipping-komponenten |
| `booking_slot_id` | string (slot-id) | Markerar bokningstid i Booking-komponenten |
| `booking_note` | string | Fyller fritextfält (kommentar till verkstad) |

Plus två nya handlers:

```ts
advanceCheckoutStep(): ToolResult  // delivery → address → payment → booking → confirmation
getCheckoutState(): ToolResult     // returnerar { step, filledFields, availableShippingMethods, availableBookingSlots }
```

`advanceCheckoutStep` är viktigare än `openPaymentStep`: det låter agenten gå **ett** steg framåt. `openPaymentStep` behålls som skip-to-payment för admin-flödet men **tas bort ur demons tool-lista**.

### 4. Betalning: hands-off genom tool-filter

I `storefront/src/app/api/agent/chat/route.ts` — filtrera vilka tools modellen ser baserat på `sessionContext.step`:

- `step === "payment"` → tool-listan innehåller **endast** `getCheckoutState`, `lookupOrder`, `escalateToAdmin`. Inga write-tools.
- `step === "confirmation"` → samma som payment, plus att agenten får system-prompt "Kunden har slutfört betalningen. Gratulera och sammanfatta ordern."
- Alla andra steg → full tool-lista.

Detta är **kontraktsnivån** — inte en instruktion i systemprompten, utan en faktisk begränsning i vilka tools LLM:en ens ser.

### 5. ToolResult-kontrakt

Alla handlers returnerar:

```ts
type ToolResult =
  | { ok: true; [key: string]: unknown }
  | { ok: false; reason: string; recoverable?: boolean }
```

Idag returnerar handlers `void`. Resultatet skickas tillbaka till modellen via `tool_result` i route.ts. Det betyder att **AgentToolHandlers-typen måste ändras** från `(…args) => void` till `(…args) => Promise<ToolResult>` eller `(…args) => ToolResult`.

### 6. Scrollning är en effekt, inte ett verktyg

Tool-listan ska inte innehålla `scrollToProduct` eller `scrollToResults`. Scrollning sker som sideeffekt av `triggerSearch` (scrolla till results) och `selectTireForCheckout` (scrolla till checkout). Det följer WO-010-principen: *"scroll behavior is an effect of allowed state transitions, not a navigation source on its own."*

**Undantag:** `scrollToProduct(productId)` finns kvar i UI-helpers men är inte exponerad som LLM-tool. Den kan användas internt om en Open Glass-highlight behövs.

---

## Tool Surface — Final Registry

Vad modellen ska se i `tools.ts`:

### Always available
```
setSearchField(field, value)           // home only
triggerSearch()                         // home only, validates all 5 fields
selectTireForCheckout(productId)        // results only
getProductDetail(productId)             // any step
getCheckoutState()                      // checkout + payment
```

### Available when step !== payment && step !== confirmation
```
prefillCheckoutField(field, value)      // checkout steps
advanceCheckoutStep()                    // checkout steps
```

### Always-on read-only
```
searchProducts(dimension, filters)      // no UI effect — silent lookup
lookupOrder(email, otcToken)            // for returning customers
escalateToAdmin(email, message)         // last resort
```

### Navigation (alla vyer)
```
navigateBack()                          // "gå tillbaka"-kommando i chat
```

### Removed from demo agent
```
fillDimensionField      // superseded by setSearchField
selectTire              // superseded by selectTireForCheckout
scrollToProduct         // effect, not tool
openPaymentStep         // superseded by advanceCheckoutStep + hands-off gate
sendOneTimeCode         // scenario 2 (product mgmt) only
verifyOneTimeCode       // scenario 2 only
```

---

## Implementation Plan

### Part 1 — Home domain (setSearchField + triggerSearch)

1. Expose `qty` and `season` setters in `TireSearch` via `onMount`-style ref (parallel to `setDimensionRef`).
2. New `setQtyRef`, `setSeasonRef` in `flow-shell/index.tsx`.
3. `setSearchField` handler dispatches to correct ref based on `field`-namn.
4. `triggerSearch` validerar `pendingParams.current` — om incomplete, returnera `{ ok: false, reason: "Missing fields: qty, season" }`.
5. Efter lyckad search: returnera produktlistan inline.

**Acceptance:**
- Tala: "Jag behöver fyra sommardäck 205/55R16" → agenten anropar 5× `setSearchField` + `triggerSearch`.
- Agent-panelen visar animerad pulse på varje fält (befintlig amber-pulse för `fillDimensionField` ska återanvändas för alla 5 fält).
- `tool_result` från `triggerSearch` innehåller produktlistan.

### Part 2 — Results domain (selectTireForCheckout)

1. Ny handler som wrapper runt `handleSelectTire` med idempotency-check.
2. Om `selectedTireRef.current?.product.id === productId` + cart redan har variant → skip addToCart, kör bara `NAV_TO_CHECKOUT`.
3. Returnera `{ ok: true, cartTotal, productTitle }`.

**Acceptance:**
- Anropa två gånger i följd → bara **en** line item i cart.
- `tool_result` ger agenten produktens titel för bekräftelse i chat.

### Part 3 — Checkout domain (prefill + advance)

1. Utöka `prefillCheckoutField` att matcha på `shipping_method_id`, `booking_slot_id`, `booking_note`.
2. Shipping-komponenten får en ref som tar emot option-id och dispatchar same action som user-click.
3. Booking-komponenten får motsvarande ref för slot-id.
4. Ny `advanceCheckoutStep`-handler som anropar samma kod som "Continue"-knappen i aktuellt steg.
5. Ny `getCheckoutState`-handler som läser `CheckoutPanelContent`-state via ref och returnerar `{ step, filledFields, availableShippingMethods: [...], availableBookingSlots: [...] }`.

**Acceptance:**
- Agent kan anropa `advanceCheckoutStep` från delivery → address, fylla adress, advance → payment.
- Vid `step === "shipping"`, `getCheckoutState` returnerar aktuella leveringsmetoder från `listCartShippingMethods`.

### Part 4 — Hands-off gate (route.ts)

1. I `storefront/src/app/api/agent/chat/route.ts`: läs `sessionContext.step` från request.
2. Filtrera `storefrontAgentTools` enligt reglerna i Core Decision 5.
3. Lägg till system-prompt-injektion:
   - `step === "payment"`: "Kunden har nu kommit till betalningssteget. Du får inte fylla i kortuppgifter eller klicka 'Betala' — det gör kunden själv. Vänta tills de är klara."
   - `step === "confirmation"`: "Ordern är genomförd. Gratulera kunden och sammanfatta vad som händer nu."

**Acceptance:**
- Manuellt test: vid payment-step, skicka prompt "fyll i betalningen". Agentens response innehåller **inga** tool_uses för write-handlers — bara text som refererar till kundens eget ansvar.

### Part 4b — State hooks, status breadcrumbs & customer-initiated events

Agenten måste veta när något händer utan att agenten själv orsakade det — kund scrollar, klickar på en däck-kort manuellt, fyller ett fält själv, trycker bakåt. Annars driver agenten ett förlegat state-förutsätt.

#### Event-modell

Ett **state event** är en tidsstämplad strukturerad post:

```ts
type StateEvent = {
  id: string                    // uuid
  at: string                    // ISO
  type: StateEventType
  origin: "agent" | "user" | "system"
  label: { no: string; en: string; sv: string }  // visas i chat som grå status
  details?: Record<string, unknown>
}

type StateEventType =
  | "view_changed"              // home → results → checkout
  | "search_submitted"          // dimension triggerSearch fired
  | "product_selected"          // card klickad (agent eller user)
  | "cart_updated"              // addToCart / remove line
  | "checkout_step_entered"     // delivery → address → booking → payment
  | "field_filled"              // form-fält fylldes (agent eller user)
  | "nav_back"                  // bakåt-navigering
  | "skill_loaded"              // agent laddade en skill (per trigger-match)
  | "skill_unloaded"            // agent släppte skill (trigger slutade matcha)
```

#### Två konsumenter av events

**1. Chat-UI — grå status-rader**

Events renderas som centrerade, grå, italic 12px-rader mellan message-bubblor. Icke-interaktiva.

```
[user]   "Jag behöver däck till Volvo V70"
─── Visar sökformuläret ───
[agent]  "Vilken dimension?"
─── Sökte på 205/55R16 — 14 träffar ───
─── Visar produktlistan ───
─── Laddade däckval-rådgivning ───
[agent]  "Innan vi går på pris — vad är viktigast..."
```

Label-texter är lokaliserade (`event.label[lang]`). Styling: `text-xs text-ui-fg-muted italic text-center my-1`.

**2. Agent-kontext — includes i nästa turn**

Vid nästa assistant-request inkluderas events som hänt sedan senaste assistant-svar:

```json
{
  "messages": [...],
  "sessionContext": {...},
  "recentEvents": [
    { "type": "product_selected", "origin": "user", "details": {"productId":"prod_x"}, "label":{"no":"Kunde valde Continental PremiumContact 6"} },
    { "type": "checkout_step_entered", "origin": "user", "details": {"step":"address"} }
  ]
}
```

Route.ts injicerar dessa som en system-message precis före modellanropet:

> "Sedan ditt senaste svar: Kunden valde själv Continental PremiumContact 6 och öppnade adresssteget."

Agenten reagerar naturligt: "Bra val — jag ser du är i adresssteget. Vill du fylla i själv eller ska jag hjälpa till?"

#### Hook-dispatch i FlowShell

Ny helper i `flow-shell/index.tsx`:

```ts
const emitStateEvent = useCallback((type: StateEventType, origin: "agent"|"user"|"system", details?: any) => {
  const event: StateEvent = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    type,
    origin,
    label: buildLabel(type, details, lang),  // lokaliserings-tabell
    details,
  }
  eventBufferRef.current.push(event)          // ring-buffer (last 20)
  agentPanelRef.current?.pushStatusEvent(event)  // chat UI får eventet direkt
}, [lang])
```

Hook-punkter att ringa `emitStateEvent` från:

| Hook-punkt | Event | Origin |
|---|---|---|
| `view`-ändring (useEffect) | `view_changed` | `user` om scroll-sync, `agent` om via tool |
| `handleSelectTire` via card-klick | `product_selected` | `user` |
| `handleSelectTire` via agent-tool | `product_selected` | `agent` |
| TireSearch field onChange (debounced 500ms) | `field_filled` | `user` |
| `prefillCheckoutField` tool | `field_filled` | `agent` |
| `handleBack` / `goBack` | `nav_back` | origin beror på caller |
| `CheckoutPanelContent` step-change | `checkout_step_entered` | samma regel |
| Skill-loader aktiverar | `skill_loaded` | `system` |

#### `navigateBack` — kund-kommando i chat

Ny tool, tillgänglig i alla vyer:

```ts
navigateBack(): ToolResult
```

Agentens system-prompt får regel: när kunden skriver "gå tillbaka", "tillbaka", "back", "ångra" — kör `navigateBack()`. Kör inte om `canNavigateBack(appState) === false` (payment/complete-steg).

Internt: dispatchar samma kod som header-backknappen (`handleBack`). Ett `nav_back`-event emitteras automatiskt — agenten ser det i nästa turn.

#### ToolResult för `navigateBack`

```json
{ "ok": true, "from": "checkout.address", "to": "checkout.delivery" }
```

Eller:

```json
{ "ok": false, "reason": "Cannot navigate back from payment step" }
```

#### Sammanfattning av push-kanalen

- Kund klickar något → state ändras → `emitStateEvent` → grå rad i chat + event i buffer
- Kund skriver → request innehåller buffer → agent ser kontexten → reagerar
- Agent kör tool → state ändras → `emitStateEvent(origin: "agent")` → grå rad ("Agent fyllde förnamn") → event i buffer (agenten filtrerar bort sina egna i context så de inte blir cirkulära)

Agenten är aldrig ur synk. Kund och agent kan både driva flödet; chat-loggen visar båda. Detta är inte logging — det är agentens sensoriska kanal.

---

### Part 5 — Direct tool invocation from IDE (headless mode)

**Motivering (från Marten):**
> "Det ska vara möjligt för mig och dig att styra sidan från IDEn via apiet direkt. Så vi kan testköra utan att behöva ha en agent rullande på sidan."

Vi vill kunna curla från IDE:n och se sidan reagera i browsern — utan LLM i loopen. Samma tool-handlers, annan ingångspunkt.

#### Arkitektur

```
IDE (curl/fetch) ──POST──> /api/agent/command ──SSE──> Browser (FlowShell) ──> AgentToolHandlers
                              [sessionId]                   [sessionId]
```

1. Varje browser-session genererar ett `sessionId` (UUID) vid mount av `FlowShell`. Visas i header-devtools (eller som `?sid=xxx` i URL i dev-läge).
2. Browsern öppnar en SSE-anslutning till `GET /api/agent/stream?sessionId=xxx`.
3. IDE:n curlar `POST /api/agent/command` med body:
   ```json
   { "sessionId": "xxx", "tool": "setSearchField", "args": { "field": "width", "value": 205 } }
   ```
4. Servern forwardar kommandot över SSE-kanalen till rätt browser.
5. FlowShell kör handlern, skickar tillbaka `ToolResult` via `POST /api/agent/command/result`.
6. IDE:n får resultatet tillbaka via samma HTTP-response (server håller request öppen tills browsern svarat, eller via 202 + polling).

#### Endpoint-spec

**`POST /api/agent/command`** — invoke tool
```
body:    { sessionId: string, tool: string, args: Record<string,unknown> }
returns: ToolResult (blocks tills browsern svarat, max 10s timeout)
```

**`GET /api/agent/stream?sessionId=xxx`** — browser-subscribed SSE
```
events:  { type: "tool-invoke", commandId, tool, args }
```

**`POST /api/agent/command/result`** — browser returnerar resultat
```
body:    { commandId: string, result: ToolResult }
```

**`GET /api/agent/sessions`** — lista aktiva sessioner (dev only)
```
returns: [{ sessionId, connectedAt, lastSeen, currentStep }]
```

#### Devtool: `scripts/drive.mjs`

Lägg till en tunn CLI-wrapper så vi kan skriva:

```bash
node scripts/drive.mjs setSearchField width 205
node scripts/drive.mjs setSearchField profile 55
node scripts/drive.mjs setSearchField rim 16
node scripts/drive.mjs setSearchField qty 4
node scripts/drive.mjs setSearchField season sommer
node scripts/drive.mjs triggerSearch
node scripts/drive.mjs selectTireForCheckout prod_abc
```

Skriptet läser `sessionId` från `.drive-session` (skrivs av browsern när den ansluter, eller sätts manuellt första gången). Det gör att både Marten och Claude från IDE:n kan köra kommandon mot en levande browser-tab utan att öppna agent-panelen.

#### Säkerhet

- `/api/agent/*` är **dev-only**. I produktion ska de returnera 404 om `NODE_ENV !== "development"` och `ENABLE_HEADLESS_AGENT !== "true"`.
- `sessionId` fungerar som en bearer — ingen som inte har den ska kunna styra sessionen. Generera kryptografiskt slumpmässigt.
- Ingen av dessa endpoints får lagra PII eller kort-data.

#### Acceptance

- Öppna localhost:3001, copiera `sessionId` från devtools.
- I separat terminal: kör `node scripts/drive.mjs setSearchField width 205` → browser-fältet pulsar amber, värdet 205 fylls.
- Kör `node scripts/drive.mjs triggerSearch` → scrolla till resultat, produktlista laddas.
- Hela flödet (hemsida → kassen → adress → booking) går att driva från IDE utan att agent-panelen ens öppnas.
- Samma kod-path som LLM-agenten använder. Inga parallella implementationer.

#### Bonus: shared command log

När ett kommando körs (från LLM eller IDE) logga till `.drive-log.jsonl` med timestamp, tool, args, result. Det gör det trivialt att replay-testa ett orderflöde vi kört en gång.

---

### Part 6 — Session context expansion

Utöka `SessionContext` i `flow-shell/types.ts`:

```ts
type SessionContext = {
  view: "home" | "results" | "checkout"
  dimension: string | null
  scene: FlowShellScene
  visibleProductIds: string[]
  cartItems: { productId: string; qty: number }[]
  step: string | null          // befintlig
  filledFields?: string[]      // NY — e.g. ["first_name", "address"]
  checkoutReady?: boolean      // NY — all required prefilled?
}
```

---

## Out of Scope

- Scenario 2 (product management agent) — den har egen tool-surface (admin-side) och hanteras i separat WO.
- Flerspråkig tool-description — svenska beskrivningar duger till demo.
- Rate limiting av agent-tool-anrop — inte nödvändigt för demo.
- Analytics-events för agent-drivet flöde — nice-to-have, görs efter demon.

---

## Test Plan

**Golden path — agent-driven köp:**

1. Öppna localhost:3001, öppna agent-panel.
2. Prompt: "Jag behöver fyra nya sommardäck, 205/55R16."
3. Verifiera: 5 fält fylls med synlig pulse, search körs, scrolla till resultat.
4. Prompt: "Vilka är de tystaste?"
5. Verifiera: agenten listar från `tool_result`, inte ett nytt search-anrop.
6. Prompt: "Ta den billigaste."
7. Verifiera: checkout öppnas med rätt variant i cart, bara **en** line item.
8. Prompt: "Adressen är Storgatan 1, 0123 Oslo. Namn Marten Angner, mårten@test.no."
9. Verifiera: adressfält fylls med pulse-animation.
10. Prompt: "Boka tidigaste montering nästa tisdag."
11. Verifiera: booking-slot markeras, checkout avancerar till payment.
12. **Vid payment:** prompt "kan du fylla i betalningen?" → agenten **vägrar** och refererar till kunden.
13. Kund fyller betalning manuellt, confirmation visas.
14. Prompt: "Vad händer nu?" → agenten svarar från confirmation-kontext.

**Edge cases:**
- Incomplete search: "Jag vill ha 205-däck" (bara width satt) → `triggerSearch` returnerar `{ ok: false, reason: "Missing fields: profile, rim, qty, season" }`, agent ber om komplettering.
- Dubbelselektion: anropa `selectTireForCheckout(same-id)` två gånger → inget dubblat i cart.
- Okänd dimension: `setSearchField("width", "999")` → `triggerSearch` hittar 0 produkter, `tool_result` säger `{ ok: true, productCount: 0 }`, agent föreslår alternativ.

---

## Open Questions (för Freya-review)

1. **Ska `selectTireForCheckout` ta `qty` som parameter, eller läsa från `searchMeta.qty`?** Idag hardcodar `handleSelectTire` till `searchMeta.qty`. Om agenten får justera qty i checkout måste vi exponera det också.

2. **Bokningsslots — hur hittar agenten dem?** Booking-komponenten har sin egen data-fetch. Ska `getCheckoutState` returnera dem, eller behövs en separat `listBookingSlots`-data-tool?

3. **Ska `prefillCheckoutField` stödja email/phone-validering?** Idag är det bara sätt-värde. En misslyckad validering (ogiltig email) går obemärkt förbi agenten.

4. **Amber-pulse på checkout-fält** — finns det idag eller är det bara på home? Koden pekar på `fillDimensionField`-pulse; om checkout-fält inte pulsar måste vi lägga till det för att demon ska kännas koherent.

---

## Freya's notes

- Håll antalet tools lågt. LLM:er är sämre på stora tool-menys — 8 är en bra gräns, 15 börjar degradera.
- `ToolResult`-returnvärden är **inte bara debug** — de är hur agenten "ser" världen. En handler som bara returnerar `{ ok: true }` stjäl ett tillfälle att informera modellen.
- Hands-off-gaten i route.ts är viktigare än system-prompten. En prompt kan ignoreras; en saknad tool finns inte att anropa.
