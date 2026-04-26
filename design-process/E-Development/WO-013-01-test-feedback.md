# WO-013-01 — Test Feedback Round 1

**Status:** Open
**Reporter:** Mårten
**Date:** 2026-04-22
**Context:** Walkthrough av WO-013 follow-up testplanen per skjerm (startsida først)

---

## FB-01: Agent ignorerar manuellt ifylld width — FIXED (ef0a01f)

**Skjerm:** Startsida → chat från hemma (test 1.8)

**Observed:**
1. Användaren fyllde i `205` manuellt i width-fältet.
2. I chatten: "fyll i de sista uppgifterna 55 16"
3. Agenten svarade: *"Jeg forstår at du ønsker å søke etter dekk, men det ser ut som om jeg mangler bredden på dekket. Kan du gi meg den komplette dimensjonen, for eksempel '205/55R16'?"*
4. Trots svaret visades produkterna (6 st däck) under formuläret — dvs en sökning **exekverades** parallellt med texten som påstod att width saknas.

**Root cause-hypoteser:**
- **A. LLM-hallucination:** `sessionContext.searchForm.width = "205"` skickas med i prompten, men Gemini plockar inte upp det från JSON-dumpen och hamnar i "fråga om width"-mallen.
- **B. Inkonsistens text↔tools:** Gemini körde troligen `setSearchField(profile=55)` + `setSearchField(rim=16)` + `triggerSearch` (som förklarar att produkter visas) men genererade en text-del som motsäger tool-kallen.
- **C. Prompt explicit:** Prompten "fyll i de sista uppgifterna" var tvetydig — "sista" kan tolkas som alla fält.

**Expected:**
- Agenten ska läsa `searchForm.width` ur context innan den frågar efter värdet som redan är angivet.
- Tool-kall och text-svar ska vara konsistenta (om tools kördes, bekräfta det i text).

**Föreslagna åtgärder:**
1. **System prompt:** Lägg till en explicit regel — *"Innan du spør om et felt i søkeformen, sjekk om det allerede finnes i `context.searchForm`. Hvis brukeren ber deg fylle ut 'resten' eller 'det som mangler', bruk bare de feltene som er null der."*
2. **Context header:** Surface `searchForm` som första delen av konteksten (före JSON-dumpen), med tydligt formaterade värden (inte bara i JSON-blobben som lätt hoppas över).
3. **Loggning:** Spara request/response-paren i agent-sessionerna så vi kan se vad context faktiskt innehöll när Gemini svarade inkonsistent (kan redan finnas via Vertex gateway).

**Severity:** Medium — fungerar ändå (sökningen gick), men förvirrar användaren.
**Assigned to:** Mimir
**Files:** `storefront/src/lib/agent/system-prompt.ts`

### Resolution (2026-04-22, `ef0a01f`)

1. `system-prompt.ts` — `searchForm` surfat som egen rad i context-headern (inte bara i JSON-dumpen); lagt till explicita sökregler om att läsa searchForm först, kedja `triggerSearch` efter `setSearchField`, och bekräfta med antal efter sökning.
2. `tire-search/index.tsx` — splittat `agentPulse` i `widthPulse`/`profilePulse`/`rimPulse`; `SegmentInput` accepterar `pulse`-prop och ger amber ring på det enskilda fältet så användaren ser exakt vad agenten satte.

**Verified:** user types 205 manuellt → säger "fyll i de sista uppgifterna 55 16" → agent pulsar profile @8.5s, rim @11s, kör triggerSearch, navigerar till resultat.

---

## FB-02: Skeleton saknar varukorgskolumnen — FIXED

**Skjerm:** Kassen (payment step) — laddningsskelett

**Observed:** CheckoutSkeleton visade bara ett enda kolumnlayout (max-w-2xl, grid-cols-1) utan den högra varukorgskolumnen. Den riktiga kassan har ett 2-kolumnslayout (3fr:2fr).

**Fix:** `CheckoutSkeleton` uppdaterad till `max-w-5xl md:grid-cols-[3fr_2fr]` med en komplett varukorgs-skeleton i högerkolumnen.

**Files:** `storefront/src/modules/checkout/components/checkout-panel-content/index.tsx`

---

## FB-03: Kreditkortsformulär laddas inte vid första inläsning — FIXED

**Skjerm:** Kassen → Betaling-steg

**Observed:** Stripe CardElement visades aldrig på initial laddning — skeleton med "Enter your card details" förblev. Fungerade att klicka manuell betalning och sedan tillbaka till kreditkort, men inte direkt.

**Root cause:** `bookingSnapshot` i `Booking`-komponenten var ett inline-objekt (ny referens varje render). `useEffect([bookingSnapshot, onSnapshotChange])` eldade på varje render → `setBookingSnapshot(newObj)` → checkout-panel-content re-renderades → Booking re-renderades → nytt objekt → infinite loop → "Maximum update depth exceeded" (14 förekomster) → React avbröt renderingen innan Stripe Elements hann initieras.

**Fix:**
1. `booking/index.tsx` — `bookingSnapshot` och `slots` wrappade i `useMemo` med korrekta deps (`[workshop, slots, expandedDays, selectedDate, selectedTime]`). Stable reference → effect eldas bara när innehållet faktiskt ändras → ingen loop.
2. `cart.ts` — `+shipping_methods.shipping_option_id` tillagt i fältlistan för både `retrieveCart` och `retrieveCartFresh`, så att Shipping-komponentens `shippingMethodId` initieras korrekt vid remount och auto-select-effekten inte eldas onödigt.

**Files:**
- `storefront/src/modules/checkout/components/booking/index.tsx`
- `storefront/src/lib/data/cart.ts`

---

## FB-04: Sortering hoppar till sökformuläret — FIXED

**Skjerm:** Sökresultat → sorterings-dropdown

**Observed:** När användaren byter sorteringsordning hoppar sidan upp till sökformuläret/toppen av resultatsektionen.

**Root cause:** Varje produktkort hade `viewTransitionName: tire-${id}` satt. View Transitions API:s FLIP-animation försöker flytta varje kort till sin nya position i den sorterade listan. Kort som sorteras högre upp i listan gör att webbläsaren scrollar uppåt för att visa dem på deras nya position — därav hoppet.

**Fix:** Tog bort `viewTransitionName` från produktkorts-wrappern i `flow-shell-results.tsx`. Sort-transitionen är fortfarande aktiv via `startViewTransition` men renderas nu som en enkel helsides-crossfade utan individuell element-FLIP. Ingen scroll-förändring sker.

**Files:** `storefront/src/modules/home/components/flow-shell/flow-shell-results.tsx`

---

## FB-05: Chat startar om efter varje meddelande — FIXED

**Skjerm:** Startsida → agentpanel

**Observed:** Välkomstskärmen ("Hei, så hyggelig at du stikker innom...") visades efter varje meddelande. Agenten svarade aldrig i ett sammanhängande dialog utan hälsade om från början varje gång.

**Root cause:** `setMessages` i `useStreamingChat` var en `useCallback` med `[currentId]` i deps-arrayen. Det innebär att den fångade `currentId` i en stängning. Vid det första meddelandet (när `currentId = null`):
1. `sendMessage` anropar `setMessages(updated)` synkront → `setSessions` skapar session `newId1`, anropar `setCurrentId("newId1")` (asynkront)
2. `sendMessage` anropar direkt `setMessages([...updated, assistantMsg])` → `setMessages`-stängningen ser fortfarande `currentId = null` (React har inte re-renderat än) → skapar session `newId2`, anropar `setCurrentId("newId2")`
3. React batchar båda `setCurrentId`-anropen → `currentId = "newId2"` (sista vinner)
4. API fick `messages: [userMsg]` (bara nuvarande meddelande, ingen historik) → agenten genererade hälsning på nytt varje gång
5. Alla strömmande uppdateringar under samma callback skapade ytterligare sessioner av samma anledning

**Fix:** Lade till `const currentIdRef = useRef<string | null>(currentId)` med synkron uppdatering (`currentIdRef.current = activeId`) inuti `setSessions`-uppdateraren direkt när en ny session skapas. `setMessages` deps ändrades från `[currentId]` till `[]` — läser alltid aktuellt ID via ref. `newChat` och `switchTo` uppdaterar också reffet direkt. Resulterar i att båda synkrona `setMessages`-anrop i `sendMessage` skriver till samma session.

**Files:** `storefront/src/modules/home/components/agent-panel/useStreamingChat.ts`

---

## FB-06: Produktkort hoppar ur varukorgen efter tillägg — ÖPPEN

**Skjerm:** Sökresultat → klicka "Legg i handlekurv"

**Observed:** Produktkortet visar grönt "Gå til kassen"-CTA omedelbart efter klick, men återgår sedan till rött "Legg i handlekurv". Varierar — ibland stannar det grönt.

**Root cause (hypoteser):**
`isInCart = Boolean(cartLine) || selectedTire?.product.id === product.id`

För att gå röd måste BÅDA vara falsa:
- `cartLine` = null (cart.items saknar varianten)
- `selectedTire?.product.id !== product.id` (selectedTire null eller annan produkt)

`selectedTire` sätts synkront i `handleSelectTire` (rad 224) och rensas bara explicit via `handleRemoveTire`, `handleRemoveLine` eller `clearSearch`. Ingen `useEffect` rensar den automatiskt.

Möjliga orsaker (kräver browser-debug för att verifiera):
- **A. Race med React concurrent mode:** `startTransition` kan avbryta renders; om `setCart(currentCart)` och `setSelectedTire` landar i olika render-batchar kan `isInCart` gå false transiänt.
- **B. Next.js force-cache race:** `retrieveCart()` (cache: "force-cache") returnerar stale data efter `addToCart`/`revalidateTag` — `setCart` sätts med en cart utan item. MEN `selectedTire` borde ändå hålla grönt.
- **C. Dual AgentPanelContent:** Två `AgentPanelContent`-instanser renderas simultant (mobile + desktop). Om någon av dessa triggar agent-action som anropar `handleSelectTire` med annan produkt...

**Needs:** Browser-debugging med React DevTools — breakpoint på `syncSelectedTire` och `setCart` för att se exakt vad som nollställer state.

**Severity:** Medium — synlig visuell glitch, men cart-state är troligen korrekt (item finns fortfarande i cart).

**Files att undersöka:**
- `storefront/src/modules/home/components/flow-shell/index.tsx` (handleSelectTire, syncSelectedTire)
- `storefront/src/modules/home/components/flow-shell/flow-shell-results.tsx` (isInCart logic)

---

## FB-07: Agent hoppar förbi kunduppgifter och betalning till bokning — FIXED

**Skjerm:** Kassen → agent i checkout-flödet

**Observed:** Agenten satte leveringsmåte (Fjellhamar), frågade om kunden ville fortsätta, fick "ja" — och gick direkt till att lista bokningsslots för montering utan att stoppa vid kunduppgifter (Fornavn, Etternavn, E-post, Telefon, Bilregistreringsnummer).

**Root cause:** Agenten anropade `advanceCheckoutStep()` TVÅ gånger i samma tur (delivery → address → booking). `address-elicitation.skill.md` laddas bara när requestens snapshot redan visar `checkoutStep = "address"` — mid-turn stegbyten triggar inte om skill-loadern. System-prompten saknade explicit regel om att aldrig kalla `advanceCheckoutStep` mer än en gång per tur och om att adress-steget kräver insamling av kunduppgifter innan man kan gå vidare.

**Fix:** Lade till explicit kassesteg-regler i `system-prompt.ts`:
1. Steg-för-steg-sekvens (delivery → address → booking/payment → confirmation) med instruktioner per steg
2. Obligatorisk regel: kalla ALDRIG `advanceCheckoutStep()` mer än en gång per tur
3. Adress-steget: samla in first_name, last_name, email, phone (+ bilregistreringsnummer för verkstad) INNAN advanceCheckoutStep

**Files:** `storefront/src/lib/agent/system-prompt.ts`
